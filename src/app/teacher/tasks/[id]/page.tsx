import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessShell } from "@/components/AccessShell";
import {
  MathPlaceholderPreview,
  PlaceholderChip,
} from "@/components/MathPlaceholderPreview";
import { requireRole } from "@/lib/auth/guards";
import { getTeacherTask } from "@/lib/models/contentRecord";
import { TeacherTranslationClient } from "./TeacherTranslationClient";

export const dynamic = "force-dynamic";

function fieldLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-950">
        {value || "Not set"}
      </p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <p className="mt-1.5 whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default async function TeacherTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["igbo_teacher"]);
  const { id } = await params;
  const task = await getTeacherTask({ id, user });

  if (!task) {
    notFound();
  }

  const sourcePlaceholders = task.math_items.filter((item) =>
    task.source_text_for_model.includes(item.placeholder),
  );

  return (
    <AccessShell user={user} eyebrow="Teacher task" title="Translate this lesson">
      <div>
        <Link
          href="/teacher/tasks"
          className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white"
        >
          Back to tasks
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)]">
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              English lesson
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <MetadataItem label="Record ID" value={task.record_id} />
              <MetadataItem label="Grade" value={task.grade} />
              <MetadataItem label="Topic" value={task.topic} />
              <MetadataItem label="Subtopic" value={task.subtopic} />
              <MetadataItem
                label="Lesson type"
                value={fieldLabel(task.content_type)}
              />
              <MetadataItem label="Maths" value={task.has_math ? "Yes" : "No"} />
              <MetadataItem label="Math status" value={fieldLabel(task.math_status)} />
            </div>
          </div>

          <TextBlock label="Original English" value={task.original_english} />
          <TextBlock label="Simple English" value={task.simplified_english} />

          <div>
            <p className="text-sm font-semibold text-slate-950">
              Sentence to translate
            </p>
            <MathPlaceholderPreview
              text={task.source_text_for_model}
              mathItems={task.math_items}
            />
            <details className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                Show text with math codes
              </summary>
              <p className="mt-1.5 break-words font-mono text-xs leading-5">
                {task.source_text_for_model}
              </p>
            </details>
          </div>

          {sourcePlaceholders.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Maths to keep the same
              </p>
              <div className="mt-2 grid gap-2">
                {sourcePlaceholders.map((item) => (
                  <div
                    key={item.placeholder}
                    className="grid gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-sm"
                  >
                    <div>
                      <PlaceholderChip item={item} />
                    </div>
                    <div className="grid gap-1 leading-6 text-emerald-950">
                      <p className="break-words">
                        <span className="font-medium">English reading: </span>
                        {item.spoken_english}
                      </p>
                      <p className="break-words">
                        <span className="font-medium">Igbo reading: </span>
                        {item.spoken_igbo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {task.glossary_terms.length ? (
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Helpful words
              </p>
              <div className="mt-2 grid gap-2">
                {task.glossary_terms.map((term) => (
                  <div
                    key={term.term_id}
                    className="rounded-md border border-indigo-200 bg-indigo-50 p-2.5 text-sm text-indigo-950"
                  >
                    <p className="font-semibold">{term.english}</p>
                    <p className="mt-1">
                      <span className="font-medium">Suggested Igbo: </span>
                      {term.selected_output}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium">Found in English: </span>
                      {term.matched_texts.join(", ")}
                    </p>
                    <p className="mt-1 leading-6">{term.teacher_instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-950">
              Your work
            </h2>
          </div>
          <TeacherTranslationClient task={task} />
        </section>
      </div>
    </AccessShell>
  );
}
