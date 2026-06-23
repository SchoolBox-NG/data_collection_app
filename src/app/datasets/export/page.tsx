import Link from "next/link";

import { AccessShell } from "@/components/AccessShell";
import { requireRole } from "@/lib/auth/guards";
import { CONTENT_TYPES, TARGET_STYLES } from "@/lib/content/constants";
import {
  getDatasetExportCounts,
  getDatasetPreview,
  parseDatasetExportFilters,
  type DatasetApprovalStatus,
  type DatasetExportCounts,
  type DatasetExportFilters,
  type DatasetType,
  type TranslationExportRow,
  type TtsExportRow,
} from "@/lib/exports/datasetExport";
import { listUsers } from "@/lib/models/user";

export const dynamic = "force-dynamic";

const approvalStatuses = [
  "translation_ready",
  "tts_ready",
  "audio_rejected",
  "translation_rejected",
  "pending_review",
  "fully_approved",
] satisfies DatasetApprovalStatus[];

function fieldLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function compactFilters(filters: DatasetExportFilters) {
  const params = new URLSearchParams();

  if (filters.dataset_type) {
    params.set("datasetType", filters.dataset_type);
  }

  if (filters.grade) {
    params.set("grade", filters.grade);
  }

  if (filters.subject) {
    params.set("subject", filters.subject);
  }

  if (filters.topic) {
    params.set("topic", filters.topic);
  }

  if (filters.subtopic) {
    params.set("subtopic", filters.subtopic);
  }

  if (filters.content_type) {
    params.set("contentType", filters.content_type);
  }

  if (filters.teacher_id) {
    params.set("teacherId", filters.teacher_id);
  }

  if (filters.target_style) {
    params.set("targetStyle", filters.target_style);
  }

  if (filters.date_from) {
    params.set("dateFrom", filters.date_from);
  }

  if (filters.date_to) {
    params.set("dateTo", filters.date_to);
  }

  if (filters.approval_status) {
    params.set("approvalStatus", filters.approval_status);
  }

  return params;
}

function exportHref(
  path: string,
  filters: DatasetExportFilters,
  extra?: Record<string, string>,
) {
  const params = compactFilters(filters);

  for (const [key, value] of Object.entries(extra ?? {})) {
    params.set(key, value);
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

function countLabel(value: number) {
  return value.toLocaleString();
}

function CountCard({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: number;
  tone?: "plain" | "good" | "warning" | "bad";
}) {
  const styles = {
    plain: "border-slate-200 bg-white text-slate-900",
    good: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    bad: "border-red-200 bg-red-50 text-red-950",
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${styles[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{countLabel(value)}</p>
    </div>
  );
}

function TextInput({
  label,
  name,
  value,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        name={name}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectInput<T extends string>({
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
  allLabel?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
      >
        {allLabel ? <option value="">{allLabel}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {fieldLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ExportFilters({
  filters,
  teachers,
}: {
  filters: DatasetExportFilters;
  teachers: Array<{ id: string; name: string; email: string }>;
}) {
  return (
    <form
      action="/datasets/export"
      className="grid gap-4 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SelectInput
          label="Dataset type"
          name="datasetType"
          value={filters.dataset_type ?? "translation"}
          options={["translation", "tts"] satisfies DatasetType[]}
        />
        <SelectInput
          label="Approval status"
          name="approvalStatus"
          value={filters.approval_status}
          options={approvalStatuses}
          allLabel="All statuses"
        />
        <SelectInput
          label="Content type"
          name="contentType"
          value={filters.content_type}
          options={CONTENT_TYPES}
          allLabel="All types"
        />
        <SelectInput
          label="Target style"
          name="targetStyle"
          value={filters.target_style}
          options={TARGET_STYLES}
          allLabel="All styles"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextInput
          label="Grade"
          name="grade"
          value={filters.grade}
          placeholder="Primary 6"
        />
        <TextInput
          label="Subject"
          name="subject"
          value={filters.subject}
          placeholder="Mathematics"
        />
        <TextInput
          label="Topic"
          name="topic"
          value={filters.topic}
          placeholder="Fractions"
        />
        <TextInput
          label="Subtopic"
          name="subtopic"
          value={filters.subtopic}
          placeholder="Multiplication of fractions"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Teacher
          <select
            name="teacherId"
            defaultValue={filters.teacher_id ?? ""}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} · {teacher.email}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          label="From date"
          name="dateFrom"
          type="date"
          value={filters.date_from}
        />
        <TextInput
          label="To date"
          name="dateTo"
          type="date"
          value={filters.date_to}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-fit">
          Apply filters
        </button>
        <Link
          href="/datasets/export"
          className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-fit"
        >
          Clear filters
        </Link>
      </div>
    </form>
  );
}

function ExportButtons({ filters }: { filters: DatasetExportFilters }) {
  const buttonClass =
    "inline-flex h-11 items-center justify-center rounded-md border border-emerald-700 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50";

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Downloads</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Downloads use the filters above.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <a
          href={exportHref("/api/datasets/export-translation", filters, {
            format: "jsonl",
          })}
          className={buttonClass}
        >
          Export Translation JSONL
        </a>
        <a
          href={exportHref("/api/datasets/export-translation", filters, {
            format: "csv",
          })}
          className={buttonClass}
        >
          Export Translation CSV
        </a>
        <a
          href={exportHref("/api/datasets/export-tts", filters, {
            format: "csv",
          })}
          className={buttonClass}
        >
          Export TTS metadata.csv
        </a>
        <a
          href={exportHref("/api/datasets/export-tts", filters, {
            format: "json",
          })}
          className={buttonClass}
        >
          Export TTS JSON
        </a>
        <a
          href={exportHref("/api/datasets/export-audio-zip", filters)}
          className={buttonClass}
        >
          Export audio ZIP
        </a>
      </div>
    </section>
  );
}

function CountsGrid({ counts }: { counts: DatasetExportCounts }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <CountCard
        label="Translation-ready records"
        value={counts.translation_ready}
        tone="good"
      />
      <CountCard label="TTS-ready records" value={counts.tts_ready} tone="good" />
      <CountCard
        label="Audio rejected records"
        value={counts.audio_rejected}
        tone="bad"
      />
      <CountCard
        label="Translation rejected records"
        value={counts.translation_rejected}
        tone="bad"
      />
      <CountCard
        label="Pending review"
        value={counts.pending_review}
        tone="warning"
      />
    </section>
  );
}

function PreviewRows({
  datasetType,
  rows,
}: {
  datasetType: DatasetType;
  rows: Array<TranslationExportRow | TtsExportRow>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold text-slate-950">Export preview</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Showing up to 10 records that match the selected dataset type.
        </p>
      </div>
      {rows.length ? (
        <div className="grid gap-3 bg-slate-50 p-4 sm:p-5">
          {rows.map((row) => (
            <article
              key={row.id}
              className="grid gap-2 rounded-md border border-slate-200 bg-white p-3"
            >
              <p className="break-words text-sm font-semibold text-slate-950">
                {row.id}
              </p>
              {datasetType === "tts" && "tts_text" in row ? (
                <>
                  <p className="break-words text-sm leading-6 text-slate-700">
                    {row.tts_text}
                  </p>
                  <p className="break-words font-mono text-xs text-slate-500">
                    {row.audio_file}
                  </p>
                </>
              ) : "source_text" in row ? (
                <div className="grid gap-2 text-sm leading-6 text-slate-700">
                  <p>
                    <span className="font-medium text-slate-900">Source: </span>
                    {row.source_text}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Target: </span>
                    {row.target_text}
                  </p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-sm text-slate-600 sm:px-5">
          No records are ready for this export.
        </div>
      )}
    </section>
  );
}

function searchParamsToUrlSearchParams(
  params: Record<string, string | undefined>,
) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      nextParams.set(key, value);
    }
  }

  return nextParams;
}

export default async function DatasetExportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole(["dataset_admin"]);
  const params = await searchParams;
  const filters = parseDatasetExportFilters(
    searchParamsToUrlSearchParams(params),
  );
  const datasetType = filters.dataset_type ?? "translation";
  const [counts, previewRows, users] = await Promise.all([
    getDatasetExportCounts(filters),
    getDatasetPreview({ filters, dataset_type: datasetType }),
    listUsers(),
  ]);
  const teachers = users
    .filter((nextUser) => nextUser.roles.includes("igbo_teacher"))
    .map((nextUser) => ({
      id: nextUser.id,
      name: nextUser.name,
      email: nextUser.email,
    }));

  return (
    <AccessShell user={user} eyebrow="Dataset Admin" title="Dataset export">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Choose records
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Translation export does not require approved audio. TTS export only
            includes approved text with approved audio.
          </p>
        </div>
        <ExportFilters filters={filters} teachers={teachers} />
      </section>

      <CountsGrid counts={counts} />
      <ExportButtons filters={filters} />
      <PreviewRows datasetType={datasetType} rows={previewRows} />
    </AccessShell>
  );
}
