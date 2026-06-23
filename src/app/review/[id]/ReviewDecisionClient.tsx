"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type AudioStatus,
  type AudioReviewDecision,
  type TranslationStatus,
  type TranslationReviewDecision,
} from "@/lib/models/contentRecord";

type Notice = {
  kind: "success" | "error";
  title: string;
  message: string;
};

const translationReasons = [
  "Wrong meaning",
  "Poor Igbo grammar",
  "Wrong maths meaning",
  "Wrong tone-marked word",
  "Placeholder missing",
  "Placeholder duplicated",
  "Too literal",
  "Not child-friendly",
  "Wrong target style",
];

const audioReasons = [
  "Background noise",
  "Wrong pronunciation",
  "Wrong tone",
  "Text mismatch",
  "Too fast",
  "Too slow",
  "Voice unclear",
  "Clipping/distortion",
  "Long silence",
  "Wrong speaker",
  "Incomplete audio",
];

function FeedbackDialog({
  notice,
  onClose,
}: {
  notice: Notice | null;
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
        aria-labelledby="review-feedback-title"
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div
          className={`mb-4 h-1.5 rounded-full ${
            isSuccess ? "bg-emerald-600" : "bg-red-600"
          }`}
        />
        <h3
          id="review-feedback-title"
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

function DecisionOption<TDecision extends string>({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: TDecision;
  checked: boolean;
  onChange: (value: TDecision) => void;
  children: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => onChange(value)}
        className="h-4 w-4 border-slate-300 text-emerald-700 focus:ring-emerald-600"
      />
      <span>{children}</span>
    </label>
  );
}

function ViewOnlyCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <h2 className="text-lg font-semibold text-emerald-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-emerald-900">{message}</p>
    </section>
  );
}

export function ReviewDecisionClient({
  recordId,
  hasAudio,
  translationStatus,
  audioStatus,
}: {
  recordId: string;
  hasAudio: boolean;
  translationStatus: TranslationStatus;
  audioStatus: AudioStatus;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState<"translation" | "audio" | null>(
    null,
  );
  const [translationDecision, setTranslationDecision] =
    useState<TranslationReviewDecision>("approved");
  const [translationReason, setTranslationReason] = useState("");
  const [translationComments, setTranslationComments] = useState("");
  const [audioDecision, setAudioDecision] =
    useState<AudioReviewDecision>("approved");
  const [audioReason, setAudioReason] = useState("");
  const [audioComments, setAudioComments] = useState("");
  const translationLocked = translationStatus === "approved";
  const audioLocked = audioStatus === "approved";

  function showNotice(nextNotice: Notice) {
    setNotice(nextNotice);
  }

  async function submitTranslation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (translationDecision !== "approved" && !translationReason) {
      showNotice({
        kind: "error",
        title: "Choose a reason",
        message: "Pick why the translation needs work.",
      });
      return;
    }

    setSubmitting("translation");

    try {
      const response = await fetch(`/api/review/${recordId}/translation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: translationDecision,
          reason: translationReason,
          comments: translationComments,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save translation review.");
      }

      showNotice({
        kind: "success",
        title: "Translation review saved",
        message: "The translation decision was saved.",
      });
      router.refresh();
    } catch (error) {
      showNotice({
        kind: "error",
        title: "Could not save review",
        message:
          error instanceof Error
            ? error.message
            : "Could not save translation review.",
      });
    } finally {
      setSubmitting(null);
    }
  }

  async function submitAudio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasAudio) {
      showNotice({
        kind: "error",
        title: "No audio yet",
        message: "There is no audio recording to review.",
      });
      return;
    }

    if (audioDecision !== "approved" && !audioReason) {
      showNotice({
        kind: "error",
        title: "Choose a reason",
        message: "Pick why the audio needs work.",
      });
      return;
    }

    setSubmitting("audio");

    try {
      const response = await fetch(`/api/review/${recordId}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: audioDecision,
          reason: audioReason,
          comments: audioComments,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save audio review.");
      }

      showNotice({
        kind: "success",
        title: "Audio review saved",
        message: "The audio decision was saved.",
      });
      router.refresh();
    } catch (error) {
      showNotice({
        kind: "error",
        title: "Could not save review",
        message:
          error instanceof Error ? error.message : "Could not save audio review.",
      });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="grid gap-4">
      <FeedbackDialog notice={notice} onClose={() => setNotice(null)} />

      {translationLocked ? (
        <ViewOnlyCard
          title="Translation approved"
          message="The Igbo text is locked. You can view it, but you cannot change this decision here."
        />
      ) : (
        <form
          onSubmit={submitTranslation}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Translation review
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This decision only affects the Igbo text.
            </p>
          </div>

          <div className="grid gap-2">
            <DecisionOption
              name="translation-decision"
              value="approved"
              checked={translationDecision === "approved"}
              onChange={setTranslationDecision}
            >
              Approve translation
            </DecisionOption>
            <DecisionOption
              name="translation-decision"
              value="rejected"
              checked={translationDecision === "rejected"}
              onChange={setTranslationDecision}
            >
              Reject translation
            </DecisionOption>
            <DecisionOption
              name="translation-decision"
              value="needs_revision"
              checked={translationDecision === "needs_revision"}
              onChange={setTranslationDecision}
            >
              Request minor edit
            </DecisionOption>
          </div>

          {translationDecision !== "approved" ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Reason
              <select
                value={translationReason}
                onChange={(event) => setTranslationReason(event.target.value)}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Choose a reason</option>
                {translationReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Comments
            <textarea
              value={translationComments}
              onChange={(event) => setTranslationComments(event.target.value)}
              rows={4}
              className="resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <button
            type="submit"
            disabled={submitting === "translation"}
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting === "translation" ? "Saving..." : "Save translation review"}
          </button>
        </form>
      )}

      {audioLocked ? (
        <ViewOnlyCard
          title="Audio approved"
          message="The recording is locked. You can listen to it, but you cannot change this decision here."
        />
      ) : (
        <form
          onSubmit={submitAudio}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Audio review</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This decision only affects the recording.
            </p>
          </div>

          <div className="grid gap-2">
            <DecisionOption
              name="audio-decision"
              value="approved"
              checked={audioDecision === "approved"}
              onChange={setAudioDecision}
            >
              Approve audio
            </DecisionOption>
            <DecisionOption
              name="audio-decision"
              value="rejected"
              checked={audioDecision === "rejected"}
              onChange={setAudioDecision}
            >
              Reject audio
            </DecisionOption>
            <DecisionOption
              name="audio-decision"
              value="needs_rerecording"
              checked={audioDecision === "needs_rerecording"}
              onChange={setAudioDecision}
            >
              Request re-recording
            </DecisionOption>
          </div>

          {audioDecision !== "approved" ? (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Reason
              <select
                value={audioReason}
                onChange={(event) => setAudioReason(event.target.value)}
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Choose a reason</option>
                {audioReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Comments
            <textarea
              value={audioComments}
              onChange={(event) => setAudioComments(event.target.value)}
              rows={4}
              className="resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <button
            type="submit"
            disabled={submitting === "audio"}
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting === "audio" ? "Saving..." : "Save audio review"}
          </button>
        </form>
      )}
    </div>
  );
}
