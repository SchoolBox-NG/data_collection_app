import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import {
  completeTeacherAudioSubmission,
  createTeacherAudioUploadPlan,
} from "@/lib/models/contentRecord";
import { uploadObjectToS3 } from "@/lib/storage/s3";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

type WavMetadata = {
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number;
  audio_format: number;
};

function parseWavMetadata(buffer: Buffer): WavMetadata {
  if (
    buffer.length < 44 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("Upload a valid WAV file.");
  }

  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitDepth = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;

    if (chunkDataOffset + chunkSize > buffer.length) {
      break;
    }

    if (chunkId === "fmt ") {
      audioFormat = buffer.readUInt16LE(chunkDataOffset);
      channels = buffer.readUInt16LE(chunkDataOffset + 2);
      sampleRate = buffer.readUInt32LE(chunkDataOffset + 4);
      bitDepth = buffer.readUInt16LE(chunkDataOffset + 14);
    }

    if (chunkId === "data") {
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (!audioFormat || !channels || !sampleRate || !bitDepth || !dataSize) {
    throw new Error("The WAV file is missing required audio metadata.");
  }

  if (audioFormat !== 1) {
    throw new Error("Audio must be 16-bit PCM WAV.");
  }

  return {
    duration_seconds: dataSize / (sampleRate * channels * (bitDepth / 8)),
    sample_rate: sampleRate,
    channels,
    bit_depth: bitDepth,
    audio_format: audioFormat,
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(["igbo_teacher"]);

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      throw new Error("Audio file is required.");
    }

    if (!file.name.toLowerCase().endsWith(".wav")) {
      throw new Error("Upload a .wav file.");
    }

    if (file.size <= 0) {
      throw new Error("Audio file is empty.");
    }

    if (file.size > MAX_AUDIO_BYTES) {
      throw new Error("Audio file is too large. Keep uploads under 20 MB.");
    }

    const audioBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = parseWavMetadata(audioBuffer);
    const plan = await createTeacherAudioUploadPlan({
      id,
      user: auth.user,
      confirmed_matches_text: getString(formData, "confirmed_matches_text") === "true",
      final_igbo_tts_text: getString(formData, "final_igbo_tts_text"),
      duration_seconds: metadata.duration_seconds,
      sample_rate: metadata.sample_rate,
      channels: metadata.channels,
      bit_depth: metadata.bit_depth,
    });
    const upload = await uploadObjectToS3({
      key: plan.s3_key,
      body: audioBuffer,
      contentType: "audio/wav",
    });
    const audio = await completeTeacherAudioSubmission({
      record_id: plan.record_id,
      user: auth.user,
      audio_id: plan.audio_id,
      version: plan.version,
      file_url: upload.file_url,
      s3_key: upload.s3_key,
      final_igbo_tts_text: plan.final_igbo_tts_text,
      duration_seconds: metadata.duration_seconds,
      sample_rate: metadata.sample_rate,
      channels: metadata.channels,
      bit_depth: metadata.bit_depth,
    });

    return NextResponse.json({ audio });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not submit audio.",
      },
      { status: 400 },
    );
  }
}
