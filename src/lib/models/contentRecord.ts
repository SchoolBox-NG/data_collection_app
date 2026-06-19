import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { type PublicUser } from "@/lib/models/user";
import { getMongoDb } from "@/lib/mongodb";
import {
  getFinalIgboTtsText,
  prepareContentRecord,
} from "@/lib/content/prepareContent";
import {
  type ContentImportInput,
  type ContentPreview,
  type MathItem,
} from "@/lib/content/types";
import {
  detectGlossaryTerms,
  type StoredGlossaryTermUsage,
  type GlossaryValidationIssue,
  validateGlossaryTranslation,
} from "@/lib/content/glossary";
import { type TargetStyle } from "@/lib/content/constants";

export type ContentRecordDocument = {
  record_id: string;
  curriculum: {
    grade: string;
    subject: string;
    topic: string;
    subtopic: string;
    content_type: string;
    difficulty: string;
    curriculum_source: string;
    language_pair: {
      source_lang: "eng_Latn";
      target_lang: string;
    };
    target_style: string;
  };
  source_content: {
    original_english: string;
    simplified_english: string;
    source_text_for_model: string;
  };
  math: {
    has_math: boolean;
    math_status: MathStatus;
    items: MathItem[];
  };
  math_map: ContentPreview["math_map"];
  glossary: {
    glossary_terms_used: string[];
    terms: StoredGlossaryTermUsage[];
  };
  audio?: AudioRecord;
  target_content: {
    target_text_for_model: string;
    final_igbo_tts_text: string;
    teacher_notes: string;
    version: number;
  };
  assignment: {
    assigned_to: string | null;
    assigned_by: string | null;
    assigned_at: Date | null;
    due_at: Date | null;
  };
  review: {
    translation_status: TranslationStatus;
    audio_status: AudioStatus;
    overall_status: OverallRecordStatus;
    translation_comments: string;
    audio_comments: string;
  };
  review_events?: ReviewEvent[];
  export: {
    translation_exportable: boolean;
    tts_exportable: boolean;
    translation_exported_at: Date | null;
    tts_exported_at: Date | null;
    export_batch_ids: string[];
  };
  audit: {
    created_by: string;
    created_at: Date;
    updated_at: Date;
  };
};

export type TranslationStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_revision";

export type AudioStatus =
  | "not_uploaded"
  | "uploaded"
  | "submitted"
  | "approved"
  | "rejected"
  | "needs_rerecording";

export type MathStatus =
  | "not_applicable"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_fix";

export type AudioVersion = {
  audio_id: string;
  file_url: string;
  s3_key: string;
  status: AudioStatus;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number;
  format: "wav";
  recorded_by: string;
  version: number;
  tts_text_snapshot: string;
  review_comment: string;
  created_at: Date;
};

export type AudioRecord = {
  current_audio_id: string | null;
  audio_file_url: string;
  s3_key: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number;
  format: "wav" | "";
  recorded_by: string | null;
  version: number;
  submitted_at: Date | null;
  versions: AudioVersion[];
};

export type ReviewEventType = "translation" | "audio";

export type TranslationReviewDecision =
  | "approved"
  | "rejected"
  | "needs_revision";

export type AudioReviewDecision =
  | "approved"
  | "rejected"
  | "needs_rerecording";

export type ReviewEvent = {
  type: ReviewEventType;
  decision: TranslationReviewDecision | AudioReviewDecision;
  status: TranslationStatus | AudioStatus;
  reason: string;
  comments: string;
  reviewed_by: string;
  reviewer_email: string;
  reviewed_at: Date;
};

export type OverallRecordStatus =
  | "source_draft"
  | "source_ready"
  | "assigned_to_teacher"
  | "teacher_in_progress"
  | "awaiting_review"
  | "translation_approved_audio_pending"
  | "translation_approved_audio_rejected"
  | "audio_approved_translation_rejected"
  | "fully_approved"
  | "exported_translation"
  | "exported_tts"
  | "archived";

export type TeacherTaskStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "translation_rejected"
  | "audio_rejected"
  | "approved";

export type TeacherTaskSummary = {
  id: string;
  record_id: string;
  grade: string;
  subject: string;
  topic: string;
  subtopic: string;
  content_type: string;
  has_math: boolean;
  math_status: MathStatus;
  translation_status: TranslationStatus;
  audio_status: AudioStatus;
  task_status: TeacherTaskStatus;
  assigned_at: string | null;
  due_at: string | null;
};

export type TeacherTaskDetail = TeacherTaskSummary & {
  difficulty: string;
  target_style: string;
  original_english: string;
  simplified_english: string;
  source_text_for_model: string;
  math_items: MathItem[];
  glossary_terms: StoredGlossaryTermUsage[];
  target_text_for_model: string;
  final_igbo_tts_text: string;
  teacher_notes: string;
  version: number;
  current_audio_id: string | null;
  current_audio_url: string;
  audio_version: number;
};

export type TeacherTaskPage = {
  tasks: TeacherTaskSummary[];
  nextCursor: string | null;
  previousCursor: string | null;
  pageSize: number;
};

export type TeacherTaskPageDirection = "next" | "previous";

export type StatusSearchFilters = {
  q?: string;
  math_status?: MathStatus;
  translation_status?: TranslationStatus;
  audio_status?: AudioStatus;
  overall_status?: OverallRecordStatus;
};

export type TeacherTaskSearchFilters = StatusSearchFilters & {
  task_status?: TeacherTaskStatus;
};

export type ContentRecordSummary = {
  id: string;
  record_id: string;
  grade: string;
  subject: string;
  topic: string;
  subtopic: string;
  content_type: string;
  has_math: boolean;
  math_status: MathStatus;
  translation_status: TranslationStatus;
  audio_status: AudioStatus;
  overall_status: OverallRecordStatus;
  created_at: string;
  updated_at: string;
};

export type ContentRecordPage = {
  records: ContentRecordSummary[];
  nextCursor: string | null;
  previousCursor: string | null;
  pageSize: number;
};

export type ReviewQueueGroupKey =
  | "awaiting_translation_review"
  | "awaiting_audio_review"
  | "translation_approved_audio_rejected"
  | "audio_approved_translation_rejected"
  | "fully_approved";

export type ReviewRecordSummary = {
  id: string;
  record_id: string;
  grade: string;
  subject: string;
  topic: string;
  subtopic: string;
  content_type: string;
  has_math: boolean;
  math_status: MathStatus;
  translation_status: TranslationStatus;
  audio_status: AudioStatus;
  overall_status: OverallRecordStatus;
  updated_at: string;
};

export type ReviewQueueGroup = {
  key: ReviewQueueGroupKey;
  title: string;
  description: string;
  count: number;
  records: ReviewRecordSummary[];
};

export type ReviewQueue = {
  groups: ReviewQueueGroup[];
};

export type SerializedReviewEvent = Omit<ReviewEvent, "reviewed_at"> & {
  reviewed_at: string;
};

export type SerializedAudioVersion = Omit<AudioVersion, "created_at"> & {
  created_at: string;
  is_current: boolean;
};

export type ReviewRecordDetail = ReviewRecordSummary & {
  target_style: string;
  original_english: string;
  simplified_english: string;
  source_text_for_model: string;
  math_items: MathItem[];
  target_text_for_model: string;
  final_igbo_tts_text: string;
  teacher_notes: string;
  audio_url: string;
  current_audio_id: string | null;
  audio_versions: SerializedAudioVersion[];
  translation_comments: string;
  audio_comments: string;
  review_events: SerializedReviewEvent[];
};

const DEFAULT_TEACHER_TASK_PAGE_SIZE = 25;
const MAX_TEACHER_TASK_PAGE_SIZE = 100;

let contentIndexesPromise: Promise<unknown> | undefined;

async function getContentCollection(): Promise<Collection<ContentRecordDocument>> {
  const db = await getMongoDb();
  const collection = db.collection<ContentRecordDocument>("content_records");

  contentIndexesPromise ??= Promise.all([
    collection.createIndex({ record_id: 1 }, { unique: true }),
    collection.createIndex({ "audit.created_at": -1 }),
    collection.createIndex({ "curriculum.grade": 1, "curriculum.topic": 1 }),
    collection.createIndex({ "review.overall_status": 1 }),
    collection.createIndex({ "review.translation_status": 1, _id: -1 }),
    collection.createIndex({ "review.audio_status": 1, _id: -1 }),
    collection.createIndex({ "math.math_status": 1, _id: -1 }),
    collection.createIndex({ "glossary.glossary_terms_used": 1 }),
    collection.createIndex({ "assignment.assigned_to": 1, _id: -1 }),
  ]);
  await contentIndexesPromise;

  return collection;
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 36) || "record"
  );
}

function gradeCode(value: string) {
  const number = value.match(/\d+/)?.[0];

  if (number) {
    return `p${number}`;
  }

  return slug(value).slice(0, 12);
}

function subjectCode(value: string) {
  const normalized = slug(value);

  if (normalized.includes("math")) {
    return "math";
  }

  return normalized.slice(0, 12);
}

async function createRecordId(input: ContentImportInput) {
  const collection = await getContentCollection();
  const prefix = `${subjectCode(input.subject)}-${gradeCode(input.grade)}-${slug(
    input.topic,
  )}`;
  const existingCount = await collection.countDocuments({
    record_id: new RegExp(`^${prefix}-`),
  });

  return `${prefix}-${String(existingCount + 1).padStart(6, "0")}`;
}

function serializeCreatedRecord(record: WithId<ContentRecordDocument>) {
  return {
    id: record._id.toString(),
    record_id: record.record_id,
    source_text_for_model: record.source_content.source_text_for_model,
    has_math: record.math.has_math,
    math_items: record.math.items,
    glossary_terms_used: record.glossary?.glossary_terms_used ?? [],
    glossary_terms: record.glossary?.terms ?? [],
  };
}

function dateToIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function taskStatus(record: WithId<ContentRecordDocument>): TeacherTaskStatus {
  if (
    record.review.translation_status === "approved" &&
    record.review.audio_status === "approved"
  ) {
    return "approved";
  }

  if (
    record.review.translation_status === "rejected" ||
    record.review.translation_status === "needs_revision"
  ) {
    return "translation_rejected";
  }

  if (
    record.review.audio_status === "rejected" ||
    record.review.audio_status === "needs_rerecording"
  ) {
    return "audio_rejected";
  }

  if (
    record.review.translation_status === "submitted" ||
    record.review.audio_status === "submitted"
  ) {
    return "submitted";
  }

  if (
    record.review.translation_status === "draft" ||
    Boolean(record.target_content.target_text_for_model)
  ) {
    return "in_progress";
  }

  return "not_started";
}

function serializeTeacherTaskSummary(
  record: WithId<ContentRecordDocument>,
): TeacherTaskSummary {
  return {
    id: record._id.toString(),
    record_id: record.record_id,
    grade: record.curriculum.grade,
    subject: record.curriculum.subject,
    topic: record.curriculum.topic,
    subtopic: record.curriculum.subtopic,
    content_type: record.curriculum.content_type,
    has_math: record.math.has_math,
    math_status: record.math.math_status,
    translation_status: record.review.translation_status,
    audio_status: record.review.audio_status,
    task_status: taskStatus(record),
    assigned_at: dateToIso(record.assignment.assigned_at),
    due_at: dateToIso(record.assignment.due_at),
  };
}

function serializeTeacherTaskDetail(
  record: WithId<ContentRecordDocument>,
): TeacherTaskDetail {
  return {
    ...serializeTeacherTaskSummary(record),
    difficulty: record.curriculum.difficulty,
    target_style: record.curriculum.target_style,
    original_english: record.source_content.original_english,
    simplified_english: record.source_content.simplified_english,
    source_text_for_model: record.source_content.source_text_for_model,
    math_items: record.math.items,
    glossary_terms: record.glossary?.terms ?? [],
    target_text_for_model: record.target_content.target_text_for_model,
    final_igbo_tts_text: record.target_content.final_igbo_tts_text,
    teacher_notes: record.target_content.teacher_notes,
    version: record.target_content.version,
    current_audio_id: record.audio?.current_audio_id ?? null,
    current_audio_url: record.audio?.audio_file_url ?? "",
    audio_version: record.audio?.version ?? 0,
  };
}

function serializeReviewRecordSummary(
  record: WithId<ContentRecordDocument>,
): ReviewRecordSummary {
  return {
    id: record._id.toString(),
    record_id: record.record_id,
    grade: record.curriculum.grade,
    subject: record.curriculum.subject,
    topic: record.curriculum.topic,
    subtopic: record.curriculum.subtopic,
    content_type: record.curriculum.content_type,
    has_math: record.math.has_math,
    math_status: record.math.math_status,
    translation_status: record.review.translation_status,
    audio_status: record.review.audio_status,
    overall_status: overallStatusForRecord(record),
    updated_at: record.audit.updated_at.toISOString(),
  };
}

function serializeContentRecordSummary(
  record: WithId<ContentRecordDocument>,
): ContentRecordSummary {
  return {
    id: record._id.toString(),
    record_id: record.record_id,
    grade: record.curriculum.grade,
    subject: record.curriculum.subject,
    topic: record.curriculum.topic,
    subtopic: record.curriculum.subtopic,
    content_type: record.curriculum.content_type,
    has_math: record.math.has_math,
    math_status: record.math.math_status,
    translation_status: record.review.translation_status,
    audio_status: record.review.audio_status,
    overall_status: overallStatusForRecord(record),
    created_at: record.audit.created_at.toISOString(),
    updated_at: record.audit.updated_at.toISOString(),
  };
}

function serializeReviewRecordDetail(
  record: WithId<ContentRecordDocument>,
): ReviewRecordDetail {
  return {
    ...serializeReviewRecordSummary(record),
    target_style: record.curriculum.target_style,
    original_english: record.source_content.original_english,
    simplified_english: record.source_content.simplified_english,
    source_text_for_model: record.source_content.source_text_for_model,
    math_items: record.math.items,
    target_text_for_model: record.target_content.target_text_for_model,
    final_igbo_tts_text: record.target_content.final_igbo_tts_text,
    teacher_notes: record.target_content.teacher_notes,
    audio_url: record.audio?.audio_file_url ?? "",
    current_audio_id: record.audio?.current_audio_id ?? null,
    audio_versions: (record.audio?.versions ?? [])
      .map((audioVersion) => ({
        ...audioVersion,
        created_at: audioVersion.created_at.toISOString(),
        is_current: audioVersion.audio_id === record.audio?.current_audio_id,
      }))
      .sort((first, second) => second.version - first.version),
    translation_comments: record.review.translation_comments,
    audio_comments: record.review.audio_comments,
    review_events: (record.review_events ?? []).map((event) => ({
      ...event,
      reviewed_at: event.reviewed_at.toISOString(),
    })),
  };
}

function canAccessTeacherRecord(record: ContentRecordDocument, user: PublicUser) {
  return (
    user.roles.includes("admin") ||
    record.assignment.assigned_to === user.id ||
    record.assignment.assigned_to === null
  );
}

function teacherAccessQuery(user: PublicUser) {
  if (user.roles.includes("admin")) {
    return {};
  }

  return {
    $or: [
      { "assignment.assigned_to": user.id },
      { "assignment.assigned_to": null },
    ],
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textSearchFilter(q?: string): Filter<ContentRecordDocument> {
  const trimmed = q?.trim();

  if (!trimmed) {
    return {};
  }

  const pattern = new RegExp(escapeRegExp(trimmed), "i");

  return {
    $or: [
      { record_id: pattern },
      { "curriculum.grade": pattern },
      { "curriculum.subject": pattern },
      { "curriculum.topic": pattern },
      { "curriculum.subtopic": pattern },
      { "curriculum.content_type": pattern },
      { "source_content.original_english": pattern },
      { "source_content.simplified_english": pattern },
    ],
  };
}

function statusSearchFilter(
  filters?: StatusSearchFilters,
): Filter<ContentRecordDocument> {
  const query: Filter<ContentRecordDocument> = {};

  if (filters?.math_status) {
    query["math.math_status"] = filters.math_status;
  }

  if (filters?.translation_status) {
    query["review.translation_status"] = filters.translation_status;
  }

  if (filters?.audio_status) {
    query["review.audio_status"] = filters.audio_status;
  }

  if (filters?.overall_status) {
    query["review.overall_status"] = filters.overall_status;
  }

  return query;
}

function taskStatusFilter(
  task_status?: TeacherTaskStatus,
): Filter<ContentRecordDocument> {
  if (!task_status) {
    return {};
  }

  switch (task_status) {
    case "approved":
      return {
        "review.translation_status": "approved",
        "review.audio_status": "approved",
      };
    case "translation_rejected":
      return {
        "review.translation_status": { $in: ["rejected", "needs_revision"] },
      };
    case "audio_rejected":
      return {
        "review.translation_status": {
          $nin: ["rejected", "needs_revision"],
        },
        "review.audio_status": { $in: ["rejected", "needs_rerecording"] },
      };
    case "submitted":
      return {
        "review.translation_status": {
          $nin: ["approved", "rejected", "needs_revision"],
        },
        "review.audio_status": {
          $nin: ["approved", "rejected", "needs_rerecording"],
        },
        $or: [
          { "review.translation_status": "submitted" },
          { "review.audio_status": "submitted" },
        ],
      };
    case "in_progress":
      return {
        "review.translation_status": {
          $nin: ["submitted", "approved", "rejected", "needs_revision"],
        },
        "review.audio_status": {
          $nin: ["submitted", "approved", "rejected", "needs_rerecording"],
        },
        $or: [
          { "review.translation_status": "draft" },
          { "target_content.target_text_for_model": { $ne: "" } },
        ],
      };
    case "not_started":
      return {
        "review.translation_status": "not_started",
        "review.audio_status": "not_uploaded",
        "target_content.target_text_for_model": "",
      };
  }
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

function recordLookupQuery(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }

  return { record_id: id };
}

function extractPlaceholders(text: string) {
  return text.match(/<[A-Z0-9_]+>/g) ?? [];
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function validateTargetPlaceholders(input: {
  source_text_for_model: string;
  target_text_for_model: string;
}) {
  const errors: string[] = [];
  const expected = countValues(extractPlaceholders(input.source_text_for_model));
  const actual = countValues(extractPlaceholders(input.target_text_for_model));

  for (const [placeholder, expectedCount] of expected) {
    const actualCount = actual.get(placeholder) ?? 0;

    if (actualCount !== expectedCount) {
      errors.push(
        `${placeholder} must appear ${expectedCount} time${
          expectedCount === 1 ? "" : "s"
        }.`,
      );
    }
  }

  for (const placeholder of actual.keys()) {
    if (!expected.has(placeholder)) {
      errors.push(`${placeholder} is not used in the source text.`);
    }
  }

  return errors;
}

function normalizePageSize(value?: number) {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_TEACHER_TASK_PAGE_SIZE;
  }

  return Math.min(Math.max(Math.floor(value), 1), MAX_TEACHER_TASK_PAGE_SIZE);
}

function pageCursorFilter(input: {
  cursor?: string;
  direction: TeacherTaskPageDirection;
}): Filter<ContentRecordDocument> {
  if (!input.cursor || !ObjectId.isValid(input.cursor)) {
    return {};
  }

  return {
    _id:
      input.direction === "previous"
        ? { $gt: new ObjectId(input.cursor) }
        : { $lt: new ObjectId(input.cursor) },
  };
}

function teacherTaskQuery(input: {
  user: PublicUser;
  cursor?: string;
  direction: TeacherTaskPageDirection;
  filters?: TeacherTaskSearchFilters;
}) {
  return andFilters([
    teacherAccessQuery(input.user) as Filter<ContentRecordDocument>,
    pageCursorFilter({ cursor: input.cursor, direction: input.direction }),
    textSearchFilter(input.filters?.q),
    statusSearchFilter(input.filters),
    taskStatusFilter(input.filters?.task_status),
  ]);
}

function contentRecordQuery(input: {
  cursor?: string;
  direction: TeacherTaskPageDirection;
  filters?: StatusSearchFilters;
}) {
  return andFilters([
    pageCursorFilter({ cursor: input.cursor, direction: input.direction }),
    textSearchFilter(input.filters?.q),
    statusSearchFilter(input.filters),
  ]);
}

export async function listTeacherTasks(
  user: PublicUser,
  options?: {
    cursor?: string;
    direction?: TeacherTaskPageDirection;
    pageSize?: number;
    filters?: TeacherTaskSearchFilters;
  },
): Promise<TeacherTaskPage> {
  const collection = await getContentCollection();
  const direction = options?.direction ?? "next";
  const pageSize = normalizePageSize(options?.pageSize);
  const records = await collection
    .find(
      teacherTaskQuery({
        user,
        cursor: options?.cursor,
        direction,
        filters: options?.filters,
      }),
    )
    .sort({ _id: direction === "previous" ? 1 : -1 })
    .limit(pageSize + 1)
    .toArray();
  const hasExtraRecord = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const orderedRecords =
    direction === "previous" ? pageRecords.reverse() : pageRecords;
  const firstRecord = orderedRecords[0];
  const lastRecord = orderedRecords[orderedRecords.length - 1];
  const cursorWasUsed = Boolean(options?.cursor && ObjectId.isValid(options.cursor));

  return {
    tasks: orderedRecords.map(serializeTeacherTaskSummary),
    nextCursor:
      direction === "previous"
        ? cursorWasUsed
          ? lastRecord?._id.toString() ?? null
          : null
        : hasExtraRecord
          ? lastRecord?._id.toString() ?? null
          : null,
    previousCursor:
      direction === "previous"
        ? hasExtraRecord
          ? firstRecord?._id.toString() ?? null
          : null
        : cursorWasUsed
          ? firstRecord?._id.toString() ?? null
          : null,
    pageSize,
  };
}

export async function listContentRecords(options?: {
  cursor?: string;
  direction?: TeacherTaskPageDirection;
  pageSize?: number;
  filters?: StatusSearchFilters;
}): Promise<ContentRecordPage> {
  const collection = await getContentCollection();
  const direction = options?.direction ?? "next";
  const pageSize = normalizePageSize(options?.pageSize);
  const records = await collection
    .find(
      contentRecordQuery({
        cursor: options?.cursor,
        direction,
        filters: options?.filters,
      }),
    )
    .sort({ _id: direction === "previous" ? 1 : -1 })
    .limit(pageSize + 1)
    .toArray();
  const hasExtraRecord = records.length > pageSize;
  const pageRecords = records.slice(0, pageSize);
  const orderedRecords =
    direction === "previous" ? pageRecords.reverse() : pageRecords;
  const firstRecord = orderedRecords[0];
  const lastRecord = orderedRecords[orderedRecords.length - 1];
  const cursorWasUsed = Boolean(options?.cursor && ObjectId.isValid(options.cursor));

  return {
    records: orderedRecords.map(serializeContentRecordSummary),
    nextCursor:
      direction === "previous"
        ? cursorWasUsed
          ? lastRecord?._id.toString() ?? null
          : null
        : hasExtraRecord
          ? lastRecord?._id.toString() ?? null
          : null,
    previousCursor:
      direction === "previous"
        ? hasExtraRecord
          ? firstRecord?._id.toString() ?? null
          : null
        : cursorWasUsed
          ? firstRecord?._id.toString() ?? null
          : null,
    pageSize,
  };
}

export async function getTeacherTask(input: { id: string; user: PublicUser }) {
  const collection = await getContentCollection();
  const record = await collection.findOne(recordLookupQuery(input.id));

  if (!record || !canAccessTeacherRecord(record, input.user)) {
    return null;
  }

  return serializeTeacherTaskDetail(record);
}

const reviewQueueGroups = [
  {
    key: "awaiting_translation_review",
    title: "Awaiting translation review",
    description: "Open once and review the text. Audio can be reviewed there too.",
    filter: { "review.translation_status": "submitted" },
  },
  {
    key: "awaiting_audio_review",
    title: "Awaiting audio review",
    description: "Audio is ready, and the text is not waiting for review.",
    filter: {
      "review.audio_status": "submitted",
      "review.translation_status": { $ne: "submitted" },
    },
  },
  {
    key: "translation_approved_audio_rejected",
    title: "Translation approved, audio rejected",
    description: "Only the audio needs another attempt.",
    filter: {
      "review.translation_status": "approved",
      "review.audio_status": { $in: ["rejected", "needs_rerecording"] },
    },
  },
  {
    key: "audio_approved_translation_rejected",
    title: "Audio approved, translation rejected",
    description: "The recording is good, but the Igbo text needs revision.",
    filter: {
      "review.audio_status": "approved",
      "review.translation_status": { $in: ["rejected", "needs_revision"] },
    },
  },
  {
    key: "fully_approved",
    title: "Fully approved",
    description: "Both the translation and audio are approved.",
    filter: {
      "review.translation_status": "approved",
      "review.audio_status": "approved",
    },
  },
] satisfies Array<{
  key: ReviewQueueGroupKey;
  title: string;
  description: string;
  filter: Record<string, unknown>;
}>;

export async function listReviewQueue(options?: {
  perGroupLimit?: number;
}): Promise<ReviewQueue> {
  const collection = await getContentCollection();
  const limit = Math.min(Math.max(options?.perGroupLimit ?? 10, 1), 50);
  const groups = await Promise.all(
    reviewQueueGroups.map(async (group) => {
      const [count, records] = await Promise.all([
        collection.countDocuments(group.filter),
        collection
          .find(group.filter)
          .sort({ "audit.updated_at": -1, _id: -1 })
          .limit(limit)
          .toArray(),
      ]);

      return {
        key: group.key,
        title: group.title,
        description: group.description,
        count,
        records: records.map(serializeReviewRecordSummary),
      };
    }),
  );

  return { groups };
}

export async function getReviewRecord(id: string) {
  const collection = await getContentCollection();
  const record = await collection.findOne(recordLookupQuery(id));

  return record ? serializeReviewRecordDetail(record) : null;
}

export function calculateOverallRecordStatus(input: {
  translation_status: TranslationStatus;
  audio_status: AudioStatus;
  math_status: MathStatus;
  assigned_to?: string | null;
  has_target_text?: boolean;
  has_audio?: boolean;
  source_ready?: boolean;
  translation_exported_at?: Date | string | null;
  tts_exported_at?: Date | string | null;
  archived?: boolean;
}): OverallRecordStatus {
  if (input.archived) {
    return "archived";
  }

  if (input.tts_exported_at) {
    return "exported_tts";
  }

  if (input.translation_exported_at) {
    return "exported_translation";
  }

  if (
    input.translation_status === "approved" &&
    input.audio_status === "approved"
  ) {
    return "fully_approved";
  }

  if (
    input.translation_status === "approved" &&
    (input.audio_status === "rejected" ||
      input.audio_status === "needs_rerecording")
  ) {
    return "translation_approved_audio_rejected";
  }

  if (
    input.audio_status === "approved" &&
    (input.translation_status === "rejected" ||
      input.translation_status === "needs_revision")
  ) {
    return "audio_approved_translation_rejected";
  }

  if (
    input.translation_status === "approved" &&
    input.audio_status !== "approved"
  ) {
    return "translation_approved_audio_pending";
  }

  if (
    input.translation_status === "submitted" ||
    input.audio_status === "submitted"
  ) {
    return "awaiting_review";
  }

  if (
    input.translation_status === "rejected" ||
    input.translation_status === "needs_revision" ||
    input.audio_status === "rejected" ||
    input.audio_status === "needs_rerecording"
  ) {
    return "teacher_in_progress";
  }

  if (
    input.translation_status === "draft" ||
    input.audio_status === "uploaded" ||
    input.has_target_text ||
    input.has_audio
  ) {
    return "teacher_in_progress";
  }

  const sourceNeedsWork =
    input.source_ready === false ||
    input.math_status === "rejected" ||
    input.math_status === "needs_fix";

  if (
    sourceNeedsWork &&
    input.translation_status === "not_started" &&
    input.audio_status === "not_uploaded"
  ) {
    return "source_draft";
  }

  if (input.assigned_to) {
    return "assigned_to_teacher";
  }

  return "source_ready";
}

function overallStatusForRecord(
  record: WithId<ContentRecordDocument>,
  overrides?: Partial<{
    translation_status: TranslationStatus;
    audio_status: AudioStatus;
    math_status: MathStatus;
    assigned_to: string | null;
    has_target_text: boolean;
    has_audio: boolean;
    source_ready: boolean;
  }>,
) {
  return calculateOverallRecordStatus({
    translation_status:
      overrides?.translation_status ?? record.review.translation_status,
    audio_status: overrides?.audio_status ?? record.review.audio_status,
    math_status: overrides?.math_status ?? record.math.math_status,
    assigned_to: overrides?.assigned_to ?? record.assignment.assigned_to,
    has_target_text:
      overrides?.has_target_text ??
      Boolean(record.target_content.target_text_for_model.trim()),
    has_audio: overrides?.has_audio ?? Boolean(record.audio?.current_audio_id),
    source_ready: overrides?.source_ready,
    translation_exported_at: record.export.translation_exported_at,
    tts_exported_at: record.export.tts_exported_at,
  });
}

function reviewEvent(input: {
  type: ReviewEventType;
  decision: TranslationReviewDecision | AudioReviewDecision;
  status: TranslationStatus | AudioStatus;
  reason?: string;
  comments?: string;
  reviewer: PublicUser;
  reviewed_at: Date;
}): ReviewEvent {
  return {
    type: input.type,
    decision: input.decision,
    status: input.status,
    reason: input.reason?.trim() ?? "",
    comments: input.comments?.trim() ?? "",
    reviewed_by: input.reviewer.id,
    reviewer_email: input.reviewer.email,
    reviewed_at: input.reviewed_at,
  };
}

export async function reviewTranslation(input: {
  id: string;
  user: PublicUser;
  decision: TranslationReviewDecision;
  reason?: string;
  comments?: string;
}) {
  const collection = await getContentCollection();
  const record = await collection.findOne(recordLookupQuery(input.id));

  if (!record) {
    throw new Error("Record was not found.");
  }

  if (!record.target_content.target_text_for_model.trim()) {
    throw new Error("There is no Igbo translation to review yet.");
  }

  const nextTranslationStatus: TranslationStatus = input.decision;
  const nextOverall = overallStatusForRecord(record, {
    translation_status: nextTranslationStatus,
  });
  const now = new Date();
  const event = reviewEvent({
    type: "translation",
    decision: input.decision,
    status: nextTranslationStatus,
    reason: input.reason,
    comments: input.comments,
    reviewer: input.user,
    reviewed_at: now,
  });

  await collection.updateOne(
    { _id: record._id },
    {
      $set: {
        "review.translation_status": nextTranslationStatus,
        "review.translation_comments": input.comments?.trim() ?? "",
        "review.overall_status": nextOverall,
        "export.translation_exportable": nextTranslationStatus === "approved",
        "export.tts_exportable":
          nextTranslationStatus === "approved" &&
          record.review.audio_status === "approved",
        "audit.updated_at": now,
      },
      $push: {
        review_events: event,
      },
    },
  );

  return { translation_status: nextTranslationStatus, overall_status: nextOverall };
}

export async function reviewAudio(input: {
  id: string;
  user: PublicUser;
  decision: AudioReviewDecision;
  reason?: string;
  comments?: string;
}) {
  const collection = await getContentCollection();
  const record = await collection.findOne(recordLookupQuery(input.id));

  if (!record) {
    throw new Error("Record was not found.");
  }

  if (!record.audio?.current_audio_id || !record.audio.audio_file_url) {
    throw new Error("There is no audio to review yet.");
  }

  const nextAudioStatus: AudioStatus = input.decision;
  const nextOverall = overallStatusForRecord(record, {
    audio_status: nextAudioStatus,
  });
  const now = new Date();
  const event = reviewEvent({
    type: "audio",
    decision: input.decision,
    status: nextAudioStatus,
    reason: input.reason,
    comments: input.comments,
    reviewer: input.user,
    reviewed_at: now,
  });
  const reviewComment = input.comments?.trim() || input.reason?.trim() || "";

  await collection.updateOne(
    { _id: record._id },
    {
      $set: {
        "review.audio_status": nextAudioStatus,
        "review.audio_comments": input.comments?.trim() ?? "",
        "review.overall_status": nextOverall,
        "export.tts_exportable":
          record.review.translation_status === "approved" &&
          nextAudioStatus === "approved",
        "audio.versions.$[audioVersion].status": nextAudioStatus,
        "audio.versions.$[audioVersion].review_comment": reviewComment,
        "audit.updated_at": now,
      },
      $push: {
        review_events: event,
      },
    },
    {
      arrayFilters: [{ "audioVersion.audio_id": record.audio.current_audio_id }],
    },
  );

  return { audio_status: nextAudioStatus, overall_status: nextOverall };
}

export async function submitTeacherTranslation(input: {
  id: string;
  user: PublicUser;
  target_text_for_model: string;
  teacher_notes: string;
}) {
  const collection = await getContentCollection();
  const record = await collection.findOne(recordLookupQuery(input.id));

  if (!record || !canAccessTeacherRecord(record, input.user)) {
    throw new Error("Task was not found.");
  }

  const targetText = input.target_text_for_model.trim();

  if (!targetText) {
    throw new Error("Igbo translation is required.");
  }

  const placeholderErrors = validateTargetPlaceholders({
    source_text_for_model: record.source_content.source_text_for_model,
    target_text_for_model: targetText,
  });

  if (placeholderErrors.length) {
    throw new Error(placeholderErrors.join(" "));
  }

  const glossaryUsages = detectGlossaryTerms({
    original_english: record.source_content.original_english,
    simplified_english: record.source_content.simplified_english,
    topic: record.curriculum.topic,
    subtopic: record.curriculum.subtopic,
    target_style: record.curriculum.target_style as TargetStyle,
  });
  const glossaryValidation = validateGlossaryTranslation({
    target_translation: targetText,
    usages: glossaryUsages,
    strict: false,
  });
  const glossaryErrors = glossaryValidation.issues.filter(
    (issue) => issue.severity === "error",
  );

  if (glossaryErrors.length) {
    throw new Error(glossaryErrors.map((issue) => issue.message).join(" "));
  }

  const finalTtsText = getFinalIgboTtsText({
    target_text_for_model: targetText,
    math_items: record.math.items,
  });
  const now = new Date();
  const audioBecomesStale =
    Boolean(record.audio?.current_audio_id) &&
    Boolean(record.target_content.final_igbo_tts_text) &&
    record.target_content.final_igbo_tts_text !== finalTtsText;
  const assignmentPatch =
    record.assignment.assigned_to === null && !input.user.roles.includes("admin")
      ? {
          "assignment.assigned_to": input.user.id,
          "assignment.assigned_at": now,
        }
      : {};
  const audioPatch = audioBecomesStale
    ? {
        "review.audio_status": "needs_rerecording" as AudioStatus,
      }
    : {};
  const nextAudioStatus = audioBecomesStale
    ? "needs_rerecording"
    : record.review.audio_status;
  const nextAssignedTo =
    record.assignment.assigned_to ??
    (!input.user.roles.includes("admin") ? input.user.id : null);
  const nextOverall = overallStatusForRecord(record, {
    translation_status: "submitted",
    audio_status: nextAudioStatus,
    assigned_to: nextAssignedTo,
    has_target_text: true,
  });

  await collection.updateOne(
    { _id: record._id },
    {
      $set: {
        ...assignmentPatch,
        ...audioPatch,
        "target_content.target_text_for_model": targetText,
        "target_content.final_igbo_tts_text": finalTtsText,
        "target_content.teacher_notes": input.teacher_notes.trim(),
        "review.translation_status": "submitted",
        "review.overall_status": nextOverall,
        "audit.updated_at": now,
      },
      $inc: {
        "target_content.version": 1,
      },
    },
  );

  return {
    final_igbo_tts_text: finalTtsText,
    glossary_issues: glossaryValidation.issues as GlossaryValidationIssue[],
  };
}

function assertRecommendedWavMetadata(input: {
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number;
}) {
  if (!Number.isFinite(input.duration_seconds) || input.duration_seconds <= 1) {
    throw new Error("Audio must be longer than 1 second.");
  }

  if (input.duration_seconds > 60) {
    throw new Error("Audio is too long. Keep each recording under 60 seconds.");
  }

  if (input.channels !== 1) {
    throw new Error("Audio must be mono.");
  }

  if (![16000, 22050].includes(input.sample_rate)) {
    throw new Error("Audio sample rate must be 16,000 Hz or 22,050 Hz.");
  }

  if (input.bit_depth !== 16) {
    throw new Error("Audio must be 16-bit PCM WAV.");
  }
}

function audioSafeId(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "record"
  );
}

export async function createTeacherAudioUploadPlan(input: {
  id: string;
  user: PublicUser;
  confirmed_matches_text: boolean;
  final_igbo_tts_text: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number;
}) {
  const collection = await getContentCollection();
  const record = await collection.findOne(recordLookupQuery(input.id));

  if (!record || !canAccessTeacherRecord(record, input.user)) {
    throw new Error("Task was not found.");
  }

  const finalTtsText = record.target_content.final_igbo_tts_text.trim();

  if (!record.target_content.target_text_for_model.trim() || !finalTtsText) {
    throw new Error("Submit the Igbo translation before uploading audio.");
  }

  if (!input.confirmed_matches_text) {
    throw new Error("Confirm that the audio matches the displayed TTS text.");
  }

  if (input.final_igbo_tts_text.trim() !== finalTtsText) {
    throw new Error(
      "The audio text is out of date. Save the latest translation, then submit audio again.",
    );
  }

  assertRecommendedWavMetadata({
    duration_seconds: input.duration_seconds,
    sample_rate: input.sample_rate,
    channels: input.channels,
    bit_depth: input.bit_depth,
  });

  const version = (record.audio?.versions?.length ?? 0) + 1;
  const audioId = `aud-${audioSafeId(record.record_id)}-v${version}`;

  return {
    record_id: record._id,
    audio_id: audioId,
    version,
    s3_key: `audio_dataset/${audioSafeId(record.record_id)}/${audioId}.wav`,
    final_igbo_tts_text: finalTtsText,
  };
}

export async function completeTeacherAudioSubmission(input: {
  record_id: ObjectId;
  user: PublicUser;
  audio_id: string;
  version: number;
  file_url: string;
  s3_key: string;
  final_igbo_tts_text: string;
  duration_seconds: number;
  sample_rate: number;
  channels: number;
  bit_depth: number;
}) {
  const collection = await getContentCollection();
  const record = await collection.findOne({ _id: input.record_id });

  if (!record || !canAccessTeacherRecord(record, input.user)) {
    throw new Error("Task was not found.");
  }

  const now = new Date();
  const audioVersion: AudioVersion = {
    audio_id: input.audio_id,
    file_url: input.file_url,
    s3_key: input.s3_key,
    status: "submitted",
    duration_seconds: input.duration_seconds,
    sample_rate: input.sample_rate,
    channels: input.channels,
    bit_depth: input.bit_depth,
    format: "wav",
    recorded_by: input.user.id,
    version: input.version,
    tts_text_snapshot: input.final_igbo_tts_text,
    review_comment: "",
    created_at: now,
  };
  const nextOverall = overallStatusForRecord(record, {
    audio_status: "submitted",
    has_audio: true,
  });

  await collection.updateOne(
    { _id: input.record_id },
    {
      $set: {
        "audio.current_audio_id": input.audio_id,
        "audio.audio_file_url": input.file_url,
        "audio.s3_key": input.s3_key,
        "audio.duration_seconds": input.duration_seconds,
        "audio.sample_rate": input.sample_rate,
        "audio.channels": input.channels,
        "audio.bit_depth": input.bit_depth,
        "audio.format": "wav",
        "audio.recorded_by": input.user.id,
        "audio.version": input.version,
        "audio.submitted_at": now,
        "review.audio_status": "submitted",
        "review.overall_status": nextOverall,
        "audit.updated_at": now,
      },
      $push: {
        "audio.versions": audioVersion,
      },
    },
  );

  return audioVersion;
}

export async function createContentRecord(input: {
  record: Partial<ContentImportInput>;
  mathItems?: MathItem[];
  createdBy: PublicUser;
}) {
  const collection = await getContentCollection();
  const prepared = prepareContentRecord(input.record, input.mathItems);
  const now = new Date();
  const record_id = await createRecordId(prepared.input);
  const mathStatus: MathStatus = prepared.has_math
    ? "pending_review"
    : "not_applicable";
  const overallStatus = calculateOverallRecordStatus({
    translation_status: "not_started",
    audio_status: "not_uploaded",
    math_status: mathStatus,
  });

  const document: ContentRecordDocument = {
    record_id,
    curriculum: {
      grade: prepared.input.grade,
      subject: prepared.input.subject,
      topic: prepared.input.topic,
      subtopic: prepared.input.subtopic ?? "",
      content_type: String(prepared.input.content_type),
      difficulty: String(prepared.input.difficulty ?? "medium"),
      curriculum_source: prepared.input.curriculum_source ?? "",
      language_pair: {
        source_lang: "eng_Latn",
        target_lang: prepared.input.target_language ?? "ibo_Latn",
      },
      target_style: String(prepared.input.target_style),
    },
    source_content: {
      original_english: prepared.input.original_english,
      simplified_english: prepared.input.simplified_english,
      source_text_for_model: prepared.source_text_for_model,
    },
    math: {
      has_math: prepared.has_math,
      math_status: mathStatus,
      items: prepared.math_items,
    },
    math_map: prepared.math_map,
    glossary: {
      glossary_terms_used: prepared.glossary_terms_used,
      terms: prepared.glossary_terms_for_storage,
    },
    audio: {
      current_audio_id: null,
      audio_file_url: "",
      s3_key: "",
      duration_seconds: 0,
      sample_rate: 0,
      channels: 0,
      bit_depth: 0,
      format: "",
      recorded_by: null,
      version: 0,
      submitted_at: null,
      versions: [],
    },
    target_content: {
      target_text_for_model: "",
      final_igbo_tts_text: "",
      teacher_notes: "",
      version: 0,
    },
    assignment: {
      assigned_to: null,
      assigned_by: null,
      assigned_at: null,
      due_at: null,
    },
    review: {
      translation_status: "not_started",
      audio_status: "not_uploaded",
      overall_status: overallStatus,
      translation_comments: "",
      audio_comments: "",
    },
    export: {
      translation_exportable: false,
      tts_exportable: false,
      translation_exported_at: null,
      tts_exported_at: null,
      export_batch_ids: [],
    },
    audit: {
      created_by: input.createdBy.id,
      created_at: now,
      updated_at: now,
    },
  };

  const result = await collection.insertOne(document);
  const created = await collection.findOne({ _id: new ObjectId(result.insertedId) });

  if (!created) {
    throw new Error("Content was created but could not be loaded.");
  }

  return serializeCreatedRecord(created);
}
