"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { type GlossaryValidationIssue } from "@/lib/content/glossary";
import { type TeacherTaskDetail } from "@/lib/models/contentRecord";

type AudioMetadata = {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  audioFormat: number;
  warnings: string[];
};

type TranslationResponse = {
  final_igbo_tts_text?: string;
  glossary_issues?: GlossaryValidationIssue[];
  error?: string;
};

type FeedbackNotice = {
  kind: "success" | "error";
  title: string;
  message: string;
};

function buildFinalTtsText(input: {
  targetText: string;
  mathItems: TeacherTaskDetail["math_items"];
}) {
  let text = input.targetText;

  for (const item of input.mathItems) {
    text = text.split(item.placeholder).join(item.spoken_igbo);
  }

  return text;
}

function visiblePlaceholders(task: TeacherTaskDetail) {
  return task.math_items.filter((item) =>
    task.source_text_for_model.includes(item.placeholder),
  );
}

function flattenAudioBuffers(buffers: Float32Array[]) {
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const output = new Float32Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    output.set(buffer, offset);
    offset += buffer.length;
  }

  return output;
}

function resampleAudio(
  samples: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
) {
  if (inputSampleRate === outputSampleRate) {
    return samples;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.round(samples.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowIndex = Math.floor(sourceIndex);
    const highIndex = Math.min(lowIndex + 1, samples.length - 1);
    const weight = sourceIndex - lowIndex;
    output[index] = samples[lowIndex] * (1 - weight) + samples[highIndex] * weight;
  }

  return output;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodePcm16Wav(samples: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;

  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, pcm, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function readAscii(view: DataView, offset: number, length: number) {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }

  return value;
}

function audioWarnings(input: Omit<AudioMetadata, "warnings">) {
  const warnings: string[] = [];

  if (input.audioFormat !== 1) {
    warnings.push("Upload a normal WAV file.");
  }

  if (input.channels !== 1) {
    warnings.push("Use one audio channel.");
  }

  if (![16000, 22050].includes(input.sampleRate)) {
    warnings.push("Use 16,000 Hz or 22,050 Hz.");
  }

  if (input.bitDepth !== 16) {
    warnings.push("Use 16-bit WAV audio.");
  }

  if (input.durationSeconds <= 1) {
    warnings.push("Record for more than 1 second.");
  } else if (input.durationSeconds < 3) {
    warnings.push("A good recording is usually 3 to 15 seconds.");
  }

  if (input.durationSeconds > 60) {
    warnings.push("Keep the recording under 60 seconds.");
  } else if (input.durationSeconds > 15) {
    warnings.push("A good recording is usually 3 to 15 seconds.");
  }

  return warnings;
}

function parseWavMetadata(buffer: ArrayBuffer): AudioMetadata {
  const view = new DataView(buffer);

  if (
    view.byteLength < 44 ||
    readAscii(view, 0, 4) !== "RIFF" ||
    readAscii(view, 8, 4) !== "WAVE"
  ) {
    throw new Error("Upload a valid WAV file.");
  }

  let offset = 12;
  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitDepth = 0;
  let dataSize = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkDataOffset + chunkSize > view.byteLength) {
      break;
    }

    if (chunkId === "fmt ") {
      audioFormat = view.getUint16(chunkDataOffset, true);
      channels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitDepth = view.getUint16(chunkDataOffset + 14, true);
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

  const metadata = {
    durationSeconds: dataSize / (sampleRate * channels * (bitDepth / 8)),
    sampleRate,
    channels,
    bitDepth,
    audioFormat,
  };

  return {
    ...metadata,
    warnings: audioWarnings(metadata),
  };
}

async function readWavMetadata(file: File) {
  return parseWavMetadata(await file.arrayBuffer());
}

function formatDuration(seconds: number) {
  return `${seconds.toFixed(1)}s`;
}

function FeedbackDialog({
  notice,
  onClose,
}: {
  notice: FeedbackNotice | null;
  onClose: () => void;
}) {
  if (!notice) {
    return null;
  }

  const isSuccess = notice.kind === "success";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div
          className={`mb-4 h-1.5 rounded-full ${
            isSuccess ? "bg-emerald-600" : "bg-red-600"
          }`}
        />
        <h3
          id="feedback-dialog-title"
          className="text-lg font-semibold text-slate-950"
        >
          {notice.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{notice.message}</p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-5 h-11 w-full rounded-md px-4 text-sm font-semibold text-white transition ${
            isSuccess
              ? "bg-emerald-700 hover:bg-emerald-800"
              : "bg-red-700 hover:bg-red-800"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function TeacherTranslationClient({ task }: { task: TeacherTaskDetail }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedBuffersRef = useRef<Float32Array[]>([]);
  const recordingSampleRateRef = useRef(16000);
  const [targetText, setTargetText] = useState(task.target_text_for_model);
  const [teacherNotes, setTeacherNotes] = useState(task.teacher_notes);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);
  const [audioConfirmed, setAudioConfirmed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAudio, setSavingAudio] = useState(false);
  const [notice, setNotice] = useState<FeedbackNotice | null>(null);
  const [glossaryIssues, setGlossaryIssues] = useState<GlossaryValidationIssue[]>(
    [],
  );
  const placeholders = useMemo(() => visiblePlaceholders(task), [task]);
  const finalTtsText = useMemo(
    () => buildFinalTtsText({ targetText, mathItems: task.math_items }),
    [targetText, task.math_items],
  );

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      void audioContextRef.current?.close();
    };
  }, []);

  function clearSelectedAudio() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    audioUrlRef.current = "";
    setAudioFile(null);
    setAudioUrl("");
    setAudioName("");
    setAudioMetadata(null);
    setAudioConfirmed(false);
  }

  function clearNotice() {
    setNotice(null);
  }

  function showSuccess(message: string, title = "Done") {
    setNotice({ kind: "success", title, message });
  }

  function showError(message: string, title = "Please check this") {
    setNotice({ kind: "error", title, message });
  }

  async function replaceAudioFile(file: File, nextName: string) {
    const metadata = await readWavMetadata(file);

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    audioUrlRef.current = nextUrl;
    setAudioFile(file);
    setAudioUrl(nextUrl);
    setAudioName(nextName);
    setAudioMetadata(metadata);
    setAudioConfirmed(false);
  }

  function updateTargetText(nextText: string) {
    setTargetText(nextText);
    setAudioConfirmed(false);
  }

  function insertPlaceholder(placeholder: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      updateTargetText(targetText ? `${targetText} ${placeholder}` : placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextText = `${targetText.slice(0, start)}${placeholder}${targetText.slice(
      end,
    )}`;

    updateTargetText(nextText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + placeholder.length,
        start + placeholder.length,
      );
    });
  }

  function stopRecordingGraph() {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  }

  async function startRecording() {
    setRecordingError("");
    clearNotice();

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError("Recording is not available in this browser.");
      showError("Recording is not available in this browser.");
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      setRecordingError("Recording is not available in this browser.");
      showError("Recording is not available in this browser.");
      return;
    }

    try {
      clearSelectedAudio();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      const audioContext = new AudioContextConstructor({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      recordedBuffersRef.current = [];
      recordingSampleRateRef.current = audioContext.sampleRate;
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        recordedBuffersRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      await audioContext.resume();
      setIsRecording(true);
    } catch {
      stopRecordingGraph();
      setRecordingError("Could not start recording. Check microphone access.");
      showError("Could not start recording. Check microphone access.");
    }
  }

  async function stopRecording() {
    if (!isRecording) {
      return;
    }

    setIsRecording(false);
    const rawSamples = flattenAudioBuffers(recordedBuffersRef.current);
    const sourceSampleRate = recordingSampleRateRef.current;
    stopRecordingGraph();

    if (!rawSamples.length) {
      setRecordingError("No sound was captured.");
      showError("No sound was captured.");
      return;
    }

    const outputSampleRate = 16000;
    const samples = resampleAudio(rawSamples, sourceSampleRate, outputSampleRate);
    const wavBlob = encodePcm16Wav(samples, outputSampleRate);
    const file = new File([wavBlob], `recording-${Date.now()}.wav`, {
      type: "audio/wav",
    });

    try {
      await replaceAudioFile(file, "Browser recording");
    } catch {
      setRecordingError("Could not prepare the recording.");
      showError("Could not prepare the recording.");
    }
  }

  async function reRecord() {
    clearSelectedAudio();

    if (isRecording) {
      await stopRecording();
    }

    await startRecording();
  }

  async function handleAudioFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setRecordingError("");

    if (!file.name.toLowerCase().endsWith(".wav")) {
      setRecordingError("Upload a WAV file.");
      showError("Upload a WAV file.");
      return;
    }

    try {
      await replaceAudioFile(file, file.name);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Could not read the audio file.";
      setRecordingError(message);
      showError(message);
    }
  }

  async function saveTranslation(options?: { showSuccess?: boolean }) {
    const response = await fetch(`/api/teacher/tasks/${task.id}/translation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_text_for_model: targetText,
        teacher_notes: teacherNotes,
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | TranslationResponse
      | null;

    if (!response.ok) {
      throw new Error(data?.error ?? "Could not submit translation.");
    }

    setGlossaryIssues(data?.glossary_issues ?? []);

    if (options?.showSuccess ?? true) {
      showSuccess("Translation saved.");
    }

    return data ?? {};
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    clearNotice();
    setGlossaryIssues([]);

    try {
      await saveTranslation();
      router.refresh();
    } catch (submitError) {
      showError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit translation.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAudioSubmit() {
    clearNotice();
    setRecordingError("");

    if (!targetText.trim()) {
      showError("Write the Igbo translation before sending audio.");
      return;
    }

    if (!audioFile || !audioMetadata) {
      showError("Record or upload a WAV file first.");
      return;
    }

    if (!audioConfirmed) {
      showError("Tick the checkbox before sending.");
      return;
    }

    if (
      audioMetadata.audioFormat !== 1 ||
      audioMetadata.channels !== 1 ||
      audioMetadata.bitDepth !== 16 ||
      ![16000, 22050].includes(audioMetadata.sampleRate) ||
      audioMetadata.durationSeconds <= 1 ||
      audioMetadata.durationSeconds > 60
    ) {
      showError(
        "The audio must be WAV, one channel, 16-bit, and 16,000 Hz or 22,050 Hz.",
      );
      return;
    }

    setSavingAudio(true);

    try {
      const translation = await saveTranslation({ showSuccess: false });
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append(
        "final_igbo_tts_text",
        translation.final_igbo_tts_text ?? finalTtsText,
      );
      formData.append("confirmed_matches_text", "true");

      const response = await fetch(`/api/teacher/tasks/${task.id}/audio`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not submit audio.");
      }

      showSuccess("Audio sent for review.");
      router.refresh();
    } catch (submitError) {
      showError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit audio.",
      );
    } finally {
      setSavingAudio(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <FeedbackDialog notice={notice} onClose={clearNotice} />

      <section className="grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Igbo translation
          <textarea
            ref={textareaRef}
            value={targetText}
            onChange={(event) => updateTargetText(event.target.value)}
            rows={7}
            className="resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-base leading-7 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        {placeholders.length ? (
          <div className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-950">
              Maths buttons
            </p>
            <div className="flex flex-wrap gap-2">
              {placeholders.map((item) => (
                <button
                  key={item.placeholder}
                  type="button"
                  onClick={() => insertPlaceholder(item.placeholder)}
                  className="rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100"
                  title={item.spoken_igbo}
                >
                  {item.placeholder}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-950">
          Read aloud
        </p>
        <p className="mt-3 whitespace-pre-wrap break-words text-lg leading-8 text-emerald-950">
          {finalTtsText || "Your reading text will appear here."}
        </p>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">
            Record audio
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["WAV", "One channel", "16-bit", "16k or 22.05k Hz", "Quiet room"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
            className="h-11 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Start recording
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
            className="h-11 rounded-md bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={() => void audioRef.current?.play()}
            disabled={!audioUrl}
            className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Listen
          </button>
          <button
            type="button"
            onClick={reRecord}
            className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Record again
          </button>
        </div>

        <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100">
          Upload WAV file
          <input
            type="file"
            accept=".wav,audio/wav"
            onChange={handleAudioFile}
            className="sr-only"
          />
        </label>

        {isRecording ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
            Recording...
          </div>
        ) : null}

        {recordingError ? (
          <p className="text-sm text-red-700">{recordingError}</p>
        ) : null}

        {audioUrl ? (
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="break-words text-sm font-semibold text-slate-900">
                {audioName === "Browser recording" ? "New recording" : audioName}
              </p>
              {audioMetadata ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {formatDuration(audioMetadata.durationSeconds)} ·{" "}
                  {audioMetadata.sampleRate.toLocaleString()} Hz ·{" "}
                  {audioMetadata.channels === 1 ? "mono" : `${audioMetadata.channels} channels`} ·{" "}
                  {audioMetadata.bitDepth}-bit
                </p>
              ) : null}
            </div>
            <audio ref={audioRef} controls src={audioUrl} className="w-full" />
            {audioMetadata?.warnings.length ? (
              <div className="grid gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {audioMetadata.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {task.current_audio_url ? (
          <div className="grid gap-2 rounded-md border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">
              Audio already sent
            </p>
            <audio controls src={task.current_audio_url} className="w-full" />
          </div>
        ) : null}

        <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={audioConfirmed}
            onChange={(event) => setAudioConfirmed(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
          />
          <span>
            I read the sentence shown above.
          </span>
        </label>

        <button
          type="button"
          onClick={handleAudioSubmit}
          disabled={savingAudio}
          className="h-12 w-full rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {savingAudio ? "Sending audio..." : "Send for review"}
        </button>
      </section>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Teacher notes
        <textarea
          value={teacherNotes}
          onChange={(event) => setTeacherNotes(event.target.value)}
          rows={4}
          className="resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-base leading-7 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
        />
      </label>

      {glossaryIssues.length ? (
        <div className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {glossaryIssues.map((issue) => (
            <p key={`${issue.term_id}-${issue.message}`}>{issue.message}</p>
          ))}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="h-12 w-full rounded-md border border-emerald-700 px-5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
      >
        {saving ? "Saving..." : "Save translation only"}
      </button>
    </form>
  );
}
