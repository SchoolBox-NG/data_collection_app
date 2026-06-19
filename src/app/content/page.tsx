import Link from "next/link";

import { AccessShell } from "@/components/AccessShell";
import { requireRole } from "@/lib/auth/guards";
import {
  listContentRecords,
  type AudioStatus,
  type ContentRecordPage,
  type ContentRecordSummary,
  type MathStatus,
  type OverallRecordStatus,
  type StatusSearchFilters,
  type TeacherTaskPageDirection,
  type TranslationStatus,
} from "@/lib/models/contentRecord";

export const dynamic = "force-dynamic";

const translationStatuses = [
  "not_started",
  "draft",
  "submitted",
  "approved",
  "rejected",
  "needs_revision",
] satisfies TranslationStatus[];
const audioStatuses = [
  "not_uploaded",
  "uploaded",
  "submitted",
  "approved",
  "rejected",
  "needs_rerecording",
] satisfies AudioStatus[];
const mathStatuses = [
  "not_applicable",
  "pending_review",
  "approved",
  "rejected",
  "needs_fix",
] satisfies MathStatus[];
const overallStatuses = [
  "source_draft",
  "source_ready",
  "assigned_to_teacher",
  "teacher_in_progress",
  "awaiting_review",
  "translation_approved_audio_pending",
  "translation_approved_audio_rejected",
  "audio_approved_translation_rejected",
  "fully_approved",
  "exported_translation",
  "exported_tts",
  "archived",
] satisfies OverallRecordStatus[];

function fieldLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parsePageSize(value?: string) {
  const pageSize = Number(value);

  if (!Number.isFinite(pageSize)) {
    return 25;
  }

  return Math.min(Math.max(Math.floor(pageSize), 1), 100);
}

function parseDirection(value?: string): TeacherTaskPageDirection {
  return value === "previous" ? "previous" : "next";
}

function parseOption<T extends string>(
  value: string | undefined,
  options: readonly T[],
) {
  return value && options.includes(value as T) ? (value as T) : undefined;
}

function parseContentFilters(params: {
  q?: string;
  translationStatus?: string;
  audioStatus?: string;
  mathStatus?: string;
  overallStatus?: string;
}): StatusSearchFilters {
  return {
    q: params.q?.trim() || undefined,
    translation_status: parseOption(params.translationStatus, translationStatuses),
    audio_status: parseOption(params.audioStatus, audioStatuses),
    math_status: parseOption(params.mathStatus, mathStatuses),
    overall_status: parseOption(params.overallStatus, overallStatuses),
  };
}

function setFilterParams(params: URLSearchParams, filters?: StatusSearchFilters) {
  if (filters?.q) {
    params.set("q", filters.q);
  }

  if (filters?.translation_status) {
    params.set("translationStatus", filters.translation_status);
  }

  if (filters?.audio_status) {
    params.set("audioStatus", filters.audio_status);
  }

  if (filters?.math_status) {
    params.set("mathStatus", filters.math_status);
  }

  if (filters?.overall_status) {
    params.set("overallStatus", filters.overall_status);
  }
}

function hasContentFilters(filters: StatusSearchFilters) {
  return Boolean(
    filters.q ||
      filters.translation_status ||
      filters.audio_status ||
      filters.math_status ||
      filters.overall_status,
  );
}

function contentHref(input: {
  cursor?: string | null;
  direction?: TeacherTaskPageDirection;
  pageSize: number;
  filters?: StatusSearchFilters;
}) {
  const params = new URLSearchParams();
  params.set("pageSize", String(input.pageSize));
  setFilterParams(params, input.filters);

  if (input.cursor) {
    params.set("cursor", input.cursor);
    params.set("direction", input.direction ?? "next");
  }

  const query = params.toString();

  return query ? `/content?${query}` : "/content";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: TranslationStatus | AudioStatus | MathStatus | OverallRecordStatus;
}) {
  const isApproved =
    status === "approved" ||
    status === "fully_approved" ||
    status === "exported_translation" ||
    status === "exported_tts";
  const isRejected =
    status === "rejected" ||
    status === "needs_revision" ||
    status === "needs_rerecording" ||
    status === "needs_fix" ||
    status === "translation_approved_audio_rejected" ||
    status === "audio_approved_translation_rejected";
  const styles = isApproved
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : isRejected
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {label}: {fieldLabel(status)}
    </span>
  );
}

function SelectFilter<T extends string>({
  label,
  name,
  value,
  options,
  allLabel,
}: {
  label: string;
  name: string;
  value?: T;
  options: readonly T[];
  allLabel: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {fieldLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContentFilters({
  filters,
  pageSize,
}: {
  filters: StatusSearchFilters;
  pageSize: number;
}) {
  const active = hasContentFilters(filters);

  return (
    <form
      action="/content"
      className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6"
    >
      <input type="hidden" name="pageSize" value={pageSize} />
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(150px,180px))]">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Search
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Record ID, topic, lesson text"
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <SelectFilter
          label="Overall"
          name="overallStatus"
          value={filters.overall_status}
          options={overallStatuses}
          allLabel="All"
        />
        <SelectFilter
          label="Translation"
          name="translationStatus"
          value={filters.translation_status}
          options={translationStatuses}
          allLabel="All"
        />
        <SelectFilter
          label="Audio"
          name="audioStatus"
          value={filters.audio_status}
          options={audioStatuses}
          allLabel="All"
        />
        <SelectFilter
          label="Math"
          name="mathStatus"
          value={filters.math_status}
          options={mathStatuses}
          allLabel="All"
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-fit">
          Search records
        </button>
        {active ? (
          <Link
            href={contentHref({ pageSize })}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-fit"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function PaginationControls({
  contentPage,
  filters,
}: {
  contentPage: ContentRecordPage;
  filters: StatusSearchFilters;
}) {
  const pageSizes = [25, 50, 100];

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Rows per page</span>
        {pageSizes.map((pageSize) => (
          <Link
            key={pageSize}
            href={contentHref({ pageSize, filters })}
            className={`inline-flex h-9 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition ${
              contentPage.pageSize === pageSize
                ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {pageSize}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-sm text-slate-500">
          Showing {contentPage.records.length} record
          {contentPage.records.length === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {contentPage.previousCursor ? (
            <Link
              href={contentHref({
                cursor: contentPage.previousCursor,
                direction: "previous",
                pageSize: contentPage.pageSize,
                filters,
              })}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Newer
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-300">
              Newer
            </span>
          )}
          {contentPage.nextCursor ? (
            <Link
              href={contentHref({
                cursor: contentPage.nextCursor,
                direction: "next",
                pageSize: contentPage.pageSize,
                filters,
              })}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Older
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-300">
              Older
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentRecordCard({ record }: { record: ContentRecordSummary }) {
  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <p className="break-words text-lg font-semibold leading-7 text-slate-950">
            {record.record_id}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {record.grade} · {record.subject} · {record.topic}
            {record.subtopic ? ` · ${record.subtopic}` : ""}
          </p>
        </div>
        <p className="text-sm text-slate-500">Updated {formatDate(record.updated_at)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge label="Overall" status={record.overall_status} />
        <StatusBadge label="Math" status={record.math_status} />
        <StatusBadge label="Translation" status={record.translation_status} />
        <StatusBadge label="Audio" status={record.audio_status} />
      </div>

      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <p>
          <span className="font-medium text-slate-800">Lesson type: </span>
          {fieldLabel(record.content_type)}
        </p>
        <p>
          <span className="font-medium text-slate-800">Maths: </span>
          {record.has_math ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-medium text-slate-800">Created: </span>
          {formatDate(record.created_at)}
        </p>
      </div>
    </article>
  );
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    direction?: string;
    pageSize?: string;
    q?: string;
    translationStatus?: string;
    audioStatus?: string;
    mathStatus?: string;
    overallStatus?: string;
  }>;
}) {
  const user = await requireRole(["content_admin"]);
  const params = await searchParams;
  const filters = parseContentFilters(params);
  const contentPage = await listContentRecords({
    cursor: params.cursor,
    direction: parseDirection(params.direction),
    pageSize: parsePageSize(params.pageSize),
    filters,
  });
  const hasFilters = hasContentFilters(filters);

  return (
    <AccessShell user={user} eyebrow="Content Admin" title="Content records">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Search content
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Find records by topic, text, or review status.
            </p>
          </div>
          <Link
            href="/content/import"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Import content
          </Link>
        </div>

        <ContentFilters filters={filters} pageSize={contentPage.pageSize} />

        {contentPage.records.length ? (
          <div className="grid gap-4 bg-slate-50 p-4 sm:p-6">
            {contentPage.records.map((record) => (
              <ContentRecordCard key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-sm text-slate-600 sm:px-6">
            {hasFilters
              ? "No content records match these filters."
              : "No content records have been imported yet."}
          </div>
        )}
        {contentPage.records.length ? (
          <PaginationControls contentPage={contentPage} filters={filters} />
        ) : null}
      </section>
    </AccessShell>
  );
}
