import Link from "next/link";

import { AccessShell } from "@/components/AccessShell";
import { requireRole } from "@/lib/auth/guards";
import {
  listReviewQueue,
  type AudioStatus,
  type MathStatus,
  type ReviewQueueGroup,
  type ReviewRecordSummary,
  type TranslationStatus,
} from "@/lib/models/contentRecord";

export const dynamic = "force-dynamic";

function fieldLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: TranslationStatus | AudioStatus | MathStatus;
}) {
  const isApproved = status === "approved";
  const isRejected =
    status === "rejected" ||
    status === "needs_revision" ||
    status === "needs_rerecording" ||
    status === "needs_fix";
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

function ReviewRecordCard({ record }: { record: ReviewRecordSummary }) {
  const bothReady =
    record.translation_status === "submitted" && record.audio_status === "submitted";

  return (
    <article className="grid gap-3 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-base font-semibold leading-6 text-slate-950">
            {record.record_id}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {record.grade} · {record.topic}
            {record.subtopic ? ` · ${record.subtopic}` : ""}
          </p>
          {bothReady ? (
            <p className="mt-1 text-sm font-medium text-emerald-700">
              Text and audio are both ready.
            </p>
          ) : null}
        </div>
        <Link
          href={`/review/${record.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
        >
          Review
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusBadge label="Math" status={record.math_status} />
        <StatusBadge label="Translation" status={record.translation_status} />
        <StatusBadge label="Audio" status={record.audio_status} />
      </div>

      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p>
          <span className="font-medium text-slate-800">Lesson type: </span>
          {fieldLabel(record.content_type)}
        </p>
        <p>
          <span className="font-medium text-slate-800">Updated: </span>
          {formatDate(record.updated_at)}
        </p>
      </div>
    </article>
  );
}

function ReviewGroup({ group }: { group: ReviewQueueGroup }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{group.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {group.description}
          </p>
        </div>
        <span className="inline-flex w-max rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
          {group.count}
        </span>
      </div>

      {group.records.length ? (
        <div className="grid gap-3 bg-slate-50 p-4 sm:p-5">
          {group.records.map((record) => (
            <ReviewRecordCard key={`${group.key}-${record.id}`} record={record} />
          ))}
          {group.count > group.records.length ? (
            <p className="text-sm text-slate-500">
              Showing latest {group.records.length} of {group.count}.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="px-4 py-8 text-sm text-slate-600 sm:px-5">
          Nothing here right now.
        </div>
      )}
    </section>
  );
}

export default async function ReviewPage() {
  const user = await requireRole(["reviewer"]);
  const queue = await listReviewQueue({ perGroupLimit: 10 });

  return (
    <AccessShell user={user} eyebrow="Reviewer" title="Review queue">
      <div className="grid gap-5">
        <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm sm:px-5">
          Each content record appears once in this queue. Open the record to
          review translation and audio separately.
        </section>
        {queue.groups.map((group) => (
          <ReviewGroup key={group.key} group={group} />
        ))}
      </div>
    </AccessShell>
  );
}
