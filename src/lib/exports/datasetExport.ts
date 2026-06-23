import { type Filter, type WithId } from "mongodb";

import {
  type AudioVersion,
  type ContentRecordDocument,
} from "@/lib/models/contentRecord";
import { getMongoDb } from "@/lib/mongodb";

export type DatasetType = "translation" | "tts";

export type DatasetApprovalStatus =
  | "translation_ready"
  | "tts_ready"
  | "audio_rejected"
  | "translation_rejected"
  | "pending_review"
  | "fully_approved";

export type DatasetExportFilters = {
  dataset_type?: DatasetType;
  grade?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  content_type?: string;
  teacher_id?: string;
  target_style?: string;
  date_from?: string;
  date_to?: string;
  approval_status?: DatasetApprovalStatus;
};

export type DatasetExportCounts = {
  translation_ready: number;
  tts_ready: number;
  audio_rejected: number;
  translation_rejected: number;
  pending_review: number;
};

export type TranslationExportRow = {
  id: string;
  source_lang: "eng_Latn";
  target_lang: string;
  source_text: string;
  target_text: string;
};

export type TtsExportRow = {
  id: string;
  tts_text: string;
  audio_file: string;
  audio_url: string;
};

type ZipEntry = {
  name: string;
  data: Uint8Array;
  modifiedAt?: Date;
};

const TEXT_ENCODER = new TextEncoder();

async function getContentCollection() {
  const db = await getMongoDb();
  return db.collection<ContentRecordDocument>("content_records");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function trimmed(value?: string) {
  return value?.trim() || undefined;
}

function textEqualsFilter(path: string, value?: string): Filter<ContentRecordDocument> {
  const cleanValue = trimmed(value);

  if (!cleanValue) {
    return {};
  }

  return { [path]: new RegExp(`^${escapeRegExp(cleanValue)}$`, "i") };
}

function dateRangeFilter(input: {
  date_from?: string;
  date_to?: string;
}): Filter<ContentRecordDocument> {
  const range: { $gte?: Date; $lte?: Date } = {};

  if (input.date_from) {
    range.$gte = new Date(`${input.date_from}T00:00:00.000Z`);
  }

  if (input.date_to) {
    range.$lte = new Date(`${input.date_to}T23:59:59.999Z`);
  }

  return Object.keys(range).length ? { "audit.updated_at": range } : {};
}

function teacherFilter(teacherId?: string): Filter<ContentRecordDocument> {
  const cleanTeacherId = trimmed(teacherId);

  if (!cleanTeacherId) {
    return {};
  }

  return {
    $or: [
      { "assignment.assigned_to": cleanTeacherId },
      { "audio.recorded_by": cleanTeacherId },
    ],
  };
}

function andFilters(
  filters: Array<Filter<ContentRecordDocument>>,
): Filter<ContentRecordDocument> {
  const usefulFilters = filters.filter((filter) => Object.keys(filter).length);

  if (usefulFilters.length === 0) {
    return {};
  }

  if (usefulFilters.length === 1) {
    return usefulFilters[0];
  }

  return { $and: usefulFilters };
}

function baseDatasetFilter(
  filters: DatasetExportFilters,
): Filter<ContentRecordDocument> {
  return andFilters([
    textEqualsFilter("curriculum.grade", filters.grade),
    textEqualsFilter("curriculum.subject", filters.subject),
    textEqualsFilter("curriculum.topic", filters.topic),
    textEqualsFilter("curriculum.subtopic", filters.subtopic),
    textEqualsFilter("curriculum.content_type", filters.content_type),
    textEqualsFilter("curriculum.target_style", filters.target_style),
    teacherFilter(filters.teacher_id),
    dateRangeFilter(filters),
  ]);
}

function translationReadyFilter(): Filter<ContentRecordDocument> {
  return {
    "review.translation_status": "approved",
    "source_content.source_text_for_model": { $exists: true, $ne: "" },
    "target_content.target_text_for_model": { $exists: true, $ne: "" },
    $or: [
      { "math.math_status": { $in: ["approved", "not_applicable"] } },
      {
        "math.has_math": true,
        "math.math_status": "pending_review",
        "review.translation_status": "approved",
      },
    ],
  };
}

function ttsReadyFilter(): Filter<ContentRecordDocument> {
  return {
    ...translationReadyFilter(),
    "review.audio_status": "approved",
    "target_content.final_igbo_tts_text": { $exists: true, $ne: "" },
    "audio.current_audio_id": { $exists: true, $ne: null },
    "audio.audio_file_url": { $exists: true, $ne: "" },
  };
}

function approvalStatusFilter(
  approvalStatus?: DatasetApprovalStatus,
): Filter<ContentRecordDocument> {
  switch (approvalStatus) {
    case "translation_ready":
      return translationReadyFilter();
    case "tts_ready":
      return ttsReadyFilter();
    case "audio_rejected":
      return {
        "review.audio_status": { $in: ["rejected", "needs_rerecording"] },
      };
    case "translation_rejected":
      return {
        "review.translation_status": { $in: ["rejected", "needs_revision"] },
      };
    case "pending_review":
      return {
        $or: [
          { "review.translation_status": "submitted" },
          { "review.audio_status": "submitted" },
          {
            "math.math_status": "pending_review",
            "review.translation_status": { $ne: "approved" },
          },
        ],
      };
    case "fully_approved":
      return {
        "review.translation_status": "approved",
        "review.audio_status": "approved",
      };
    default:
      return {};
  }
}

function exportQuery(
  filters: DatasetExportFilters,
  readiness: "translation" | "tts" | "none",
) {
  const readyFilter =
    readiness === "translation"
      ? translationReadyFilter()
      : readiness === "tts"
        ? ttsReadyFilter()
        : {};

  return andFilters([
    baseDatasetFilter(filters),
    approvalStatusFilter(filters.approval_status),
    readyFilter,
  ]);
}

function safeFilePart(value: string) {
  return value
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function currentApprovedAudioVersion(
  record: WithId<ContentRecordDocument>,
): AudioVersion | null {
  return (
    record.audio?.versions?.find(
      (version) =>
        version.audio_id === record.audio?.current_audio_id &&
        version.status === "approved",
    ) ??
    record.audio?.versions?.find((version) => version.status === "approved") ??
    null
  );
}

function audioFileName(record: WithId<ContentRecordDocument>) {
  const audioVersion = currentApprovedAudioVersion(record);
  const version = audioVersion?.version ?? record.audio?.version ?? 1;

  return `recordings/${safeFilePart(record.record_id)}-v${version}.wav`;
}

function toTranslationRow(
  record: WithId<ContentRecordDocument>,
): TranslationExportRow {
  return {
    id: record.record_id,
    source_lang: record.curriculum.language_pair.source_lang,
    target_lang: record.curriculum.language_pair.target_lang,
    source_text: record.source_content.source_text_for_model,
    target_text: record.target_content.target_text_for_model,
  };
}

function toTtsRow(record: WithId<ContentRecordDocument>): TtsExportRow {
  const audioVersion = currentApprovedAudioVersion(record);

  return {
    id: record.record_id,
    tts_text: record.target_content.final_igbo_tts_text,
    audio_file: audioFileName(record),
    audio_url: audioVersion?.file_url || record.audio?.audio_file_url || "",
  };
}

export async function getDatasetExportCounts(
  filters: DatasetExportFilters,
): Promise<DatasetExportCounts> {
  const collection = await getContentCollection();
  const baseFilter = baseDatasetFilter(filters);
  const [translationReady, ttsReady, audioRejected, translationRejected, pendingReview] =
    await Promise.all([
      collection.countDocuments(andFilters([baseFilter, translationReadyFilter()])),
      collection.countDocuments(andFilters([baseFilter, ttsReadyFilter()])),
      collection.countDocuments(
        andFilters([baseFilter, approvalStatusFilter("audio_rejected")]),
      ),
      collection.countDocuments(
        andFilters([baseFilter, approvalStatusFilter("translation_rejected")]),
      ),
      collection.countDocuments(
        andFilters([baseFilter, approvalStatusFilter("pending_review")]),
      ),
    ]);

  return {
    translation_ready: translationReady,
    tts_ready: ttsReady,
    audio_rejected: audioRejected,
    translation_rejected: translationRejected,
    pending_review: pendingReview,
  };
}

export async function getTranslationExportRows(
  filters: DatasetExportFilters,
): Promise<TranslationExportRow[]> {
  const collection = await getContentCollection();
  const records = await collection
    .find(exportQuery(filters, "translation"))
    .sort({ record_id: 1 })
    .toArray();

  return records.map(toTranslationRow);
}

export async function getTtsExportRows(
  filters: DatasetExportFilters,
): Promise<TtsExportRow[]> {
  const collection = await getContentCollection();
  const records = await collection
    .find(exportQuery(filters, "tts"))
    .sort({ record_id: 1 })
    .toArray();

  return records.map(toTtsRow).filter((row) => row.audio_url);
}

export async function getDatasetPreview(input: {
  filters: DatasetExportFilters;
  dataset_type: DatasetType;
  limit?: number;
}) {
  const collection = await getContentCollection();
  const records = await collection
    .find(
      exportQuery(
        input.filters,
        input.dataset_type === "tts" ? "tts" : "translation",
      ),
    )
    .sort({ record_id: 1 })
    .limit(input.limit ?? 10)
    .toArray();

  return input.dataset_type === "tts"
    ? records.map(toTtsRow).filter((row) => row.audio_url)
    : records.map(toTranslationRow);
}

export function parseDatasetExportFilters(
  searchParams: URLSearchParams,
): DatasetExportFilters {
  const datasetType = searchParams.get("datasetType");
  const approvalStatus = searchParams.get("approvalStatus");

  return {
    dataset_type: datasetType === "tts" ? "tts" : "translation",
    grade: trimmed(searchParams.get("grade") ?? undefined),
    subject: trimmed(searchParams.get("subject") ?? undefined),
    topic: trimmed(searchParams.get("topic") ?? undefined),
    subtopic: trimmed(searchParams.get("subtopic") ?? undefined),
    content_type: trimmed(searchParams.get("contentType") ?? undefined),
    teacher_id: trimmed(searchParams.get("teacherId") ?? undefined),
    target_style: trimmed(searchParams.get("targetStyle") ?? undefined),
    date_from: trimmed(searchParams.get("dateFrom") ?? undefined),
    date_to: trimmed(searchParams.get("dateTo") ?? undefined),
    approval_status: isDatasetApprovalStatus(approvalStatus)
      ? approvalStatus
      : undefined,
  };
}

export function isDatasetApprovalStatus(
  value: string | null,
): value is DatasetApprovalStatus {
  return [
    "translation_ready",
    "tts_ready",
    "audio_rejected",
    "translation_rejected",
    "pending_review",
    "fully_approved",
  ].includes(value ?? "");
}

function csvCell(value: string | number) {
  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function translationRowsToJsonl(rows: TranslationExportRow[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
}

export function translationRowsToCsv(rows: TranslationExportRow[]) {
  const header = ["id", "source_lang", "target_lang", "source_text", "target_text"];
  const body = rows.map((row) =>
    [
      row.id,
      row.source_lang,
      row.target_lang,
      row.source_text,
      row.target_text,
    ]
      .map(csvCell)
      .join(","),
  );

  return [header.join(","), ...body].join("\n") + "\n";
}

export function ttsRowsToJson(rows: TtsExportRow[]) {
  return `${JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      tts_text: row.tts_text,
      audio_file: row.audio_file,
    })),
    null,
    2,
  )}\n`;
}

export function ttsRowsToCsv(rows: TtsExportRow[]) {
  const header = ["audio_file", "tts_text"];
  const body = rows.map((row) => [row.audio_file, row.tts_text].map(csvCell).join(","));

  return [header.join(","), ...body].join("\n") + "\n";
}

function crc32(data: Uint8Array) {
  let crc = -1;

  for (const byte of data) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosTime, dosDate };
}

function littleEndianBytes(value: number, bytes: 2 | 4) {
  const output = new Uint8Array(bytes);
  const view = new DataView(output.buffer);

  if (bytes === 2) {
    view.setUint16(0, value, true);
  } else {
    view.setUint32(0, value, true);
  }

  return output;
}

function concatBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function zipEntryParts(entry: ZipEntry, localOffset: number) {
  const nameBytes = TEXT_ENCODER.encode(entry.name);
  const checksum = crc32(entry.data);
  const { dosTime, dosDate } = dosDateTime(entry.modifiedAt);
  const localHeader = concatBytes([
    littleEndianBytes(0x04034b50, 4),
    littleEndianBytes(20, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(dosTime, 2),
    littleEndianBytes(dosDate, 2),
    littleEndianBytes(checksum, 4),
    littleEndianBytes(entry.data.length, 4),
    littleEndianBytes(entry.data.length, 4),
    littleEndianBytes(nameBytes.length, 2),
    littleEndianBytes(0, 2),
    nameBytes,
  ]);
  const centralHeader = concatBytes([
    littleEndianBytes(0x02014b50, 4),
    littleEndianBytes(20, 2),
    littleEndianBytes(20, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(dosTime, 2),
    littleEndianBytes(dosDate, 2),
    littleEndianBytes(checksum, 4),
    littleEndianBytes(entry.data.length, 4),
    littleEndianBytes(entry.data.length, 4),
    littleEndianBytes(nameBytes.length, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 4),
    littleEndianBytes(localOffset, 4),
    nameBytes,
  ]);

  return { localHeader, centralHeader };
}

export function createZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const { localHeader, centralHeader } = zipEntryParts(entry, offset);
    localParts.push(localHeader, entry.data);
    centralParts.push(centralHeader);
    offset += localHeader.length + entry.data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const endRecord = concatBytes([
    littleEndianBytes(0x06054b50, 4),
    littleEndianBytes(0, 2),
    littleEndianBytes(0, 2),
    littleEndianBytes(entries.length, 2),
    littleEndianBytes(entries.length, 2),
    littleEndianBytes(centralDirectory.length, 4),
    littleEndianBytes(offset, 4),
    littleEndianBytes(0, 2),
  ]);

  return concatBytes([...localParts, centralDirectory, endRecord]);
}

export async function createAudioDatasetZip(filters: DatasetExportFilters) {
  const rows = await getTtsExportRows(filters);
  const entries: ZipEntry[] = [
    {
      name: "metadata.csv",
      data: TEXT_ENCODER.encode(ttsRowsToCsv(rows)),
    },
    {
      name: "metadata.json",
      data: TEXT_ENCODER.encode(ttsRowsToJson(rows)),
    },
  ];
  const failures: string[] = [];

  for (const row of rows) {
    try {
      const response = await fetch(row.audio_url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      entries.push({
        name: row.audio_file,
        data: new Uint8Array(await response.arrayBuffer()),
      });
    } catch (error) {
      failures.push(
        `${row.id},${row.audio_url},${
          error instanceof Error ? error.message : "Download failed"
        }`,
      );
    }
  }

  if (failures.length) {
    entries.push({
      name: "audio-download-errors.csv",
      data: TEXT_ENCODER.encode(`id,audio_url,error\n${failures.join("\n")}\n`),
    });
  }

  return createZip(entries);
}
