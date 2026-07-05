import Link from "next/link";

import { AccessShell } from "@/components/AccessShell";
import { requireRole } from "@/lib/auth/guards";
import {
  getTeacherTaskStats,
  listTeacherTasks,
  type AudioStatus,
  type MathStatus,
  type TeacherTaskPage,
  type TeacherTaskPageDirection,
  type TeacherTaskSearchFilters,
  type TeacherTaskStats,
  type TeacherTaskStatus,
  type TeacherTaskSummary,
  type TranslationStatus,
} from "@/lib/models/contentRecord";

export const dynamic = "force-dynamic";

const taskStatusLabels: Record<TeacherTaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  translation_rejected: "Translation rejected",
  audio_rejected: "Audio rejected",
  approved: "Approved",
};

const taskStatuses = [
  "not_started",
  "in_progress",
  "translation_rejected",
  "audio_rejected",
] satisfies TeacherTaskStatus[];
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

function fieldLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
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

function parseTeacherFilters(params: {
  q?: string;
  taskStatus?: string;
  translationStatus?: string;
  audioStatus?: string;
  mathStatus?: string;
}): TeacherTaskSearchFilters {
  return {
    q: params.q?.trim() || undefined,
    task_status: parseOption(params.taskStatus, taskStatuses),
    translation_status: parseOption(params.translationStatus, translationStatuses),
    audio_status: parseOption(params.audioStatus, audioStatuses),
    math_status: parseOption(params.mathStatus, mathStatuses),
  };
}

function setFilterParams(
  params: URLSearchParams,
  filters?: TeacherTaskSearchFilters,
) {
  if (filters?.q) {
    params.set("q", filters.q);
  }

  if (filters?.task_status) {
    params.set("taskStatus", filters.task_status);
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
}

function hasTeacherFilters(filters: TeacherTaskSearchFilters) {
  return Boolean(
    filters.q ||
      filters.task_status ||
      filters.translation_status ||
      filters.audio_status ||
      filters.math_status,
  );
}

function tasksHref(input: {
  cursor?: string | null;
  direction?: TeacherTaskPageDirection;
  pageSize: number;
  filters?: TeacherTaskSearchFilters;
}) {
  const params = new URLSearchParams();
  params.set("pageSize", String(input.pageSize));
  setFilterParams(params, input.filters);

  if (input.cursor) {
    params.set("cursor", input.cursor);
    params.set("direction", input.direction ?? "next");
  }

  const query = params.toString();

  return query ? `/teacher/tasks?${query}` : "/teacher/tasks";
}

function StatusBadge({ status }: { status: TeacherTaskStatus }) {
  const styles: Record<TeacherTaskStatus, string> = {
    not_started: "border-slate-200 bg-slate-50 text-slate-700",
    in_progress: "border-blue-200 bg-blue-50 text-blue-800",
    submitted: "border-amber-200 bg-amber-50 text-amber-800",
    translation_rejected: "border-red-200 bg-red-50 text-red-800",
    audio_rejected: "border-red-200 bg-red-50 text-red-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return (
    <span
      className={`inline-flex w-max rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {taskStatusLabels[status]}
    </span>
  );
}

function TeacherProgressSummary({ stats }: { stats: TeacherTaskStats }) {
  const items = [
    {
      label: "Completed",
      value: stats.completed,
      helper: "Fully approved tasks",
      styles: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Pending review",
      value: stats.pending,
      helper: "Submitted to reviewer",
      styles: "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      label: "Needs correction",
      value: stats.rejected,
      helper: "Rejected or needs revision",
      styles: "border-red-200 bg-red-50 text-red-900",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg border p-4 shadow-sm ${item.styles}`}
        >
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal">
            {item.value.toLocaleString()}
          </p>
          <p className="mt-1 text-sm opacity-80">{item.helper}</p>
        </div>
      ))}
    </section>
  );
}

function PaginationControls({
  taskPage,
  filters,
}: {
  taskPage: TeacherTaskPage;
  filters: TeacherTaskSearchFilters;
}) {
  const pageSizes = [25, 50, 100];

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Rows per page</span>
        {pageSizes.map((pageSize) => (
          <Link
            key={pageSize}
            href={tasksHref({ pageSize, filters })}
            className={`inline-flex h-9 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition ${
              taskPage.pageSize === pageSize
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
          Showing {taskPage.tasks.length} task
          {taskPage.tasks.length === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {taskPage.previousCursor ? (
            <Link
              href={tasksHref({
                cursor: taskPage.previousCursor,
                direction: "previous",
                pageSize: taskPage.pageSize,
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
          {taskPage.nextCursor ? (
            <Link
              href={tasksHref({
                cursor: taskPage.nextCursor,
                direction: "next",
                pageSize: taskPage.pageSize,
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

function TeacherFilters({
  filters,
  pageSize,
}: {
  filters: TeacherTaskSearchFilters;
  pageSize: number;
}) {
  const active = hasTeacherFilters(filters);

  return (
    <form
      action="/teacher/tasks"
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
          label="Work status"
          name="taskStatus"
          value={filters.task_status}
          options={taskStatuses}
          allLabel="All active work"
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
          Search tasks
        </button>
        {active ? (
          <Link
            href={tasksHref({ pageSize })}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-fit"
          >
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function TaskField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function TaskCard({ task }: { task: TeacherTaskSummary }) {
  return (
    <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-lg font-semibold leading-7 text-slate-950">
            {task.record_id}
          </p>
          <div className="mt-2">
            <StatusBadge status={task.task_status} />
          </div>
        </div>
        <Link
          href={`/teacher/tasks/${task.id}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
        >
          Open
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TaskField label="Grade" value={task.grade} />
        <TaskField label="Subject" value={task.subject} />
        <TaskField label="Topic" value={task.topic} />
        <TaskField label="Subtopic" value={task.subtopic || "Not set"} />
        <TaskField label="Content type" value={fieldLabel(task.content_type)} />
        <TaskField label="Has maths" value={task.has_math ? "Yes" : "No"} />
        <TaskField label="Math status" value={fieldLabel(task.math_status)} />
        <TaskField
          label="Translation status"
          value={fieldLabel(task.translation_status)}
        />
        <TaskField label="Audio status" value={fieldLabel(task.audio_status)} />
        <TaskField label="Assigned date" value={formatDate(task.assigned_at)} />
        <TaskField label="Due date" value={formatDate(task.due_at)} />
      </div>
    </article>
  );
}

export default async function TeacherTasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    direction?: string;
    pageSize?: string;
    q?: string;
    taskStatus?: string;
    translationStatus?: string;
    audioStatus?: string;
    mathStatus?: string;
  }>;
}) {
  const user = await requireRole(["igbo_teacher"]);
  const params = await searchParams;
  const filters = parseTeacherFilters(params);
  const [taskPage, stats] = await Promise.all([
    listTeacherTasks(user, {
      cursor: params.cursor,
      direction: parseDirection(params.direction),
      pageSize: parsePageSize(params.pageSize),
      filters,
    }),
    getTeacherTaskStats(user),
  ]);
  const tasks = taskPage.tasks;
  const hasFilters = hasTeacherFilters(filters);

  return (
    <AccessShell user={user} eyebrow="Teacher" title="Teacher tasks">
      <TeacherProgressSummary stats={stats} />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-950">Assigned content</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Tasks shown here still need translation, audio, or corrections.
            Submitted and fully approved work is hidden from this queue.
          </p>
        </div>
        <TeacherFilters filters={filters} pageSize={taskPage.pageSize} />

        {tasks.length ? (
          <div className="grid gap-4 bg-slate-50 p-4 sm:p-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-sm text-slate-600 sm:px-6">
            {hasFilters
              ? "No teacher tasks match these filters."
              : "No teacher tasks need action right now."}
          </div>
        )}
        {tasks.length ? (
          <PaginationControls taskPage={taskPage} filters={filters} />
        ) : null}
      </section>
    </AccessShell>
  );
}
