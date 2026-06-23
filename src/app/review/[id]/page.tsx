import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessShell } from "@/components/AccessShell";
import {
  MathPlaceholderPreview,
  PlaceholderChip,
} from "@/components/MathPlaceholderPreview";
import { requireRole } from "@/lib/auth/guards";
import {
  getReviewRecord,
  type AudioStatus,
  type MathStatus,
  type ReviewRecordDetail,
  type TranslationStatus,
} from "@/lib/models/contentRecord";
import { ReviewDecisionClient } from "./ReviewDecisionClient";

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

function TextBlock({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "igbo" | "code";
}) {
  const textClass =
    tone === "code"
      ? "font-mono text-xs leading-5"
      : tone === "igbo"
        ? "text-base leading-7"
        : "text-sm leading-6";

  return (
    <div>
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <p
        className={`mt-2 whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-700 ${textClass}`}
      >
        {value || "Not provided"}
      </p>
    </div>
  );
}

function InfoGrid({ record }: { record: ReviewRecordDetail }) {
  const fields = [
    ["Grade", record.grade],
    ["Subject", record.subject],
    ["Topic", record.topic],
    ["Subtopic", record.subtopic || "Not set"],
    ["Lesson type", fieldLabel(record.content_type)],
    ["Target style", fieldLabel(record.target_style)],
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {fields.map(([label, value]) => (
        <div
          key={label}
          className="rounded-md border border-slate-200 bg-white px-3 py-2"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-medium text-slate-950">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function MathMap({ record }: { record: ReviewRecordDetail }) {
  const sourcePlaceholders = record.math_items.filter((item) =>
    record.source_text_for_model.includes(item.placeholder),
  );

  if (!sourcePlaceholders.length) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-slate-950">Math map</h2>
      {sourcePlaceholders.map((item) => (
        <div
          key={item.placeholder}
          className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"
        >
          <div>
            <PlaceholderChip item={item} />
          </div>
          <p className="break-words">
            <span className="font-medium">LaTeX: </span>
            {item.latex}
          </p>
          <p className="break-words">
            <span className="font-medium">Spoken English: </span>
            {item.spoken_english}
          </p>
          <p className="break-words">
            <span className="font-medium">Spoken Igbo: </span>
            {item.spoken_igbo}
          </p>
        </div>
      ))}
    </section>
  );
}

function PreviousComments({ record }: { record: ReviewRecordDetail }) {
  const events = [...record.review_events].reverse();

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-slate-950">
        Previous review comments
      </h2>
      {events.length ? (
        <div className="grid gap-3">
          {events.map((event, index) => (
            <article
              key={`${event.type}-${event.reviewed_at}-${index}`}
              className="rounded-md border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-slate-950">
                  {fieldLabel(event.type)} · {fieldLabel(event.status)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(event.reviewed_at)}
                </p>
              </div>
              <p className="mt-1 text-slate-600">{event.reviewer_email}</p>
              {event.reason ? (
                <p className="mt-2 text-slate-700">
                  <span className="font-medium">Reason: </span>
                  {event.reason}
                </p>
              ) : null}
              {event.comments ? (
                <p className="mt-2 whitespace-pre-wrap text-slate-700">
                  {event.comments}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          No previous comments yet.
        </p>
      )}
    </section>
  );
}

function AudioRecordings({ record }: { record: ReviewRecordDetail }) {
  if (!record.audio_versions.length && !record.audio_url) {
    return (
      <div>
        <p className="text-sm font-semibold text-slate-950">Audio recordings</p>
        <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          No audio submitted yet.
        </p>
      </div>
    );
  }

  const fallbackVersion =
    record.audio_versions.length || !record.audio_url
      ? []
      : [
          {
            audio_id: record.current_audio_id ?? "current-audio",
            file_url: record.audio_url,
            s3_key: "",
            status: record.audio_status,
            duration_seconds: 0,
            sample_rate: 0,
            channels: 0,
            bit_depth: 0,
            format: "wav" as const,
            recorded_by: "",
            version: 1,
            tts_text_snapshot: record.final_igbo_tts_text,
            review_comment: "",
            created_at: record.updated_at,
            is_current: true,
          },
        ];
  const audioVersions = record.audio_versions.length
    ? record.audio_versions
    : fallbackVersion;

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-950">Audio recordings</p>
        <p className="text-sm text-slate-500">
          {audioVersions.length} attempt{audioVersions.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="mt-2 grid gap-3">
        {audioVersions.map((audioVersion) => (
          <article
            key={audioVersion.audio_id}
            className={`grid gap-3 rounded-md border p-3 ${
              audioVersion.is_current
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  Attempt {audioVersion.version}
                  {audioVersion.is_current ? " · Current" : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(audioVersion.created_at)}
                </p>
              </div>
              <StatusBadge label="Audio" status={audioVersion.status} />
            </div>

            <audio controls src={audioVersion.file_url} className="w-full" />

            <div className="grid gap-1 text-sm leading-6 text-slate-700 sm:grid-cols-2">
              {audioVersion.duration_seconds ? (
                <p>
                  <span className="font-medium text-slate-900">Length: </span>
                  {audioVersion.duration_seconds.toFixed(1)}s
                </p>
              ) : null}
              {audioVersion.sample_rate ? (
                <p>
                  <span className="font-medium text-slate-900">Sample rate: </span>
                  {audioVersion.sample_rate.toLocaleString()} Hz
                </p>
              ) : null}
              {audioVersion.channels ? (
                <p>
                  <span className="font-medium text-slate-900">Channels: </span>
                  {audioVersion.channels}
                </p>
              ) : null}
              {audioVersion.bit_depth ? (
                <p>
                  <span className="font-medium text-slate-900">Bit depth: </span>
                  {audioVersion.bit_depth}-bit
                </p>
              ) : null}
            </div>

            {audioVersion.review_comment ? (
              <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                {audioVersion.review_comment}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["reviewer"]);
  const { id } = await params;
  const record = await getReviewRecord(id);

  if (!record) {
    notFound();
  }

  return (
    <AccessShell user={user} eyebrow="Reviewer" title={record.record_id}>
      <div>
        <Link
          href="/review"
          className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          Back to queue
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]">
        <div className="grid gap-5">
          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="Math" status={record.math_status} />
              <StatusBadge
                label="Translation"
                status={record.translation_status}
              />
              <StatusBadge label="Audio" status={record.audio_status} />
            </div>
            <InfoGrid record={record} />
          </section>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Source content
            </h2>
            <TextBlock label="Original English" value={record.original_english} />
            <TextBlock
              label="Simplified English"
              value={record.simplified_english}
            />
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Source text for model
              </p>
              <MathPlaceholderPreview
                text={record.source_text_for_model}
                mathItems={record.math_items}
              />
              <p className="mt-2 break-words rounded-md bg-slate-100 px-3 py-2 font-mono text-xs leading-5 text-slate-700">
                {record.source_text_for_model}
              </p>
            </div>
            <MathMap record={record} />
          </section>

          <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Teacher submission
            </h2>
            <TextBlock
              label="Teacher Igbo target text"
              value={record.target_text_for_model}
              tone="igbo"
            />
            <TextBlock
              label="Final Igbo TTS text"
              value={record.final_igbo_tts_text}
              tone="igbo"
            />
            <TextBlock label="Teacher notes" value={record.teacher_notes} />
            <AudioRecordings record={record} />
          </section>

          <PreviousComments record={record} />
        </div>

        <ReviewDecisionClient
          recordId={record.id}
          hasAudio={Boolean(record.audio_url)}
          translationStatus={record.translation_status}
          audioStatus={record.audio_status}
        />
      </div>
    </AccessShell>
  );
}
