"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { MathPlaceholderPreview } from "@/components/MathPlaceholderPreview";
import { type MathItem } from "@/lib/content/types";

type Notice = {
  kind: "success" | "error";
  message: string;
};

export function SourceTextEditorClient({
  recordId,
  initialSourceText,
  mathItems,
  canEdit,
}: {
  recordId: string;
  initialSourceText: string;
  mathItems: MathItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [sourceText, setSourceText] = useState(initialSourceText);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const changed = sourceText.trim() !== initialSourceText.trim();

  async function submitSourceText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sourceText.trim()) {
      setNotice({
        kind: "error",
        message: "Source text for model is required.",
      });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch(`/api/review/${recordId}/source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_text_for_model: sourceText,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save source text.");
      }

      setNotice({
        kind: "success",
        message: "Source text saved.",
      });
      router.refresh();
    } catch (error) {
      setNotice({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Could not save source text.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitSourceText} className="grid gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-950">
          Source text for model
        </p>
        <MathPlaceholderPreview text={sourceText} mathItems={mathItems} />
        <p className="mt-2 break-words rounded-md bg-slate-100 px-3 py-2 font-mono text-xs leading-5 text-slate-700">
          {sourceText || "Not provided"}
        </p>
      </div>

      {canEdit ? (
        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Edit source text
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              rows={4}
              className="min-h-28 resize-y rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {notice ? (
            <p
              className={`rounded-md border px-3 py-2 text-sm leading-6 ${
                notice.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={!changed || submitting}
              className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Saving..." : "Save source text"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceText(initialSourceText);
                setNotice(null);
              }}
              disabled={!changed || submitting}
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
