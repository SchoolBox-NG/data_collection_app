"use client";

import { ChangeEvent, FormEvent, useState } from "react";

import { MathPlaceholderPreview } from "@/components/MathPlaceholderPreview";
import {
  CONTENT_TYPES,
  DIFFICULTY_LEVELS,
  TARGET_LANGUAGES,
  TARGET_STYLES,
} from "@/lib/content/constants";
import {
  type ContentImportInput,
  type ContentPreview,
  type ImportResult,
  type MathItem,
} from "@/lib/content/types";
import {
  type GlossaryTermUsage,
  type StoredGlossaryTermUsage,
} from "@/lib/content/glossary";

const initialRecord: ContentImportInput = {
  grade: "Primary 6",
  subject: "Mathematics",
  topic: "Fractions",
  subtopic: "Multiplication of fractions",
  content_type: "worked_example",
  difficulty: "medium",
  curriculum_source: "",
  target_language: "ibo_Latn",
  target_style: "code_mixed_igbo_english",
  original_english: "Calculate $\\frac{3}{4} \\times \\frac{2}{5}$.",
  simplified_english: "Let us multiply three quarters by two fifths.",
};

function fieldLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
      >
        {children}
      </select>
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  required,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={rows}
        className="resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-base leading-7 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function SpokenMathFields({ items }: { items: MathItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-3">
      <p className="text-sm font-semibold text-emerald-950">
        Spoken maths fields
      </p>
      {items.map((item) => (
        <div
          key={item.placeholder}
          className="grid gap-2 rounded-md border border-emerald-200 bg-white p-3 text-sm"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-slate-950">{item.placeholder}</p>
            {item.kind === "component" ? (
              <p className="text-xs font-medium text-slate-500">
                Component of {item.component_of}: {item.role}
              </p>
            ) : null}
          </div>
          <p className="break-words text-slate-600">
            {item.kind === "component" ? "Value" : "LaTeX"}:{" "}
            <span className="font-medium text-slate-900">
              {item.value ?? item.latex}
            </span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Spoken English
              </p>
              <p className="mt-1 break-words text-slate-900">
                {item.spoken_english}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Spoken Igbo
              </p>
              <p className="mt-1 break-words text-slate-900">
                {item.spoken_igbo}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GlossaryTermsPanel({
  terms,
  emptyText,
}: {
  terms: Array<GlossaryTermUsage | StoredGlossaryTermUsage>;
  emptyText?: string;
}) {
  if (!terms.length) {
    return emptyText ? (
      <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
    ) : null;
  }

  return (
    <div className="mt-4 grid gap-3">
      <p className="text-sm font-semibold text-slate-950">Glossary terms</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {terms.map((term) => (
          <div
            key={term.term_id}
            className="grid gap-3 rounded-md border border-indigo-200 bg-white p-3 text-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{term.english}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  ID: {term.term_id}
                </p>
              </div>
              <span className="w-fit rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                {term.status}
              </span>
            </div>

            <div className="rounded-md bg-indigo-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Use for this style
              </p>
              <p className="mt-1 break-words font-semibold text-slate-950">
                {term.selected_output}
              </p>
            </div>

            {"all_style_outputs" in term ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Standard Igbo
                  </p>
                  <p className="mt-1 break-words text-slate-900">
                    {term.all_style_outputs.standard_igbo}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Code-mixed
                  </p>
                  <p className="mt-1 break-words text-slate-900">
                    {term.all_style_outputs.code_mixed_igbo_english}
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Child-friendly
                  </p>
                  <p className="mt-1 break-words text-slate-900">
                    {term.all_style_outputs.child_friendly_igbo}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <p className="break-words text-slate-700">
                <span className="font-medium text-slate-950">Definition: </span>
                {term.definition_igbo}
              </p>
              <p className="break-words text-slate-700">
                <span className="font-medium text-slate-950">
                  Teacher instruction:{" "}
                </span>
                {term.teacher_instruction}
              </p>
              <p className="break-words text-slate-700">
                <span className="font-medium text-slate-950">Matched: </span>
                {term.matched_texts.join(", ")}
              </p>
              {term.forbidden_translations.length ? (
                <p className="break-words text-red-700">
                  <span className="font-medium">Do not use: </span>
                  {term.forbidden_translations.join(", ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: ImportResult | null }) {
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold text-slate-950">Import result</h3>
      <p className="mt-2 text-sm text-slate-600">
        Created {result.created.length} record{result.created.length === 1 ? "" : "s"}
        {result.errors.length ? `, with ${result.errors.length} issue(s).` : "."}
      </p>

      {result.created.length ? (
        <div className="mt-4 grid gap-2">
          {result.created.map((record) => (
            <div
              key={record.id}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
            >
              <p className="font-semibold">{record.record_id}</p>
              <MathPlaceholderPreview
                text={record.source_text_for_model}
                mathItems={record.math_items}
              />
              <p className="mt-3 break-words font-mono text-xs text-emerald-900">
                {record.source_text_for_model}
              </p>
              <GlossaryTermsPanel terms={record.glossary_terms} />
              <SpokenMathFields items={record.math_items} />
            </div>
          ))}
        </div>
      ) : null}

      {result.errors.length ? (
        <div className="mt-4 grid gap-2">
          {result.errors.map((error) => (
            <div
              key={`${error.row}-${error.message}`}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              Row {error.row}: {error.message}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ContentImportClient() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [record, setRecord] = useState<ContentImportInput>(initialRecord);
  const [preview, setPreview] = useState<ContentPreview | null>(null);
  const [mathItems, setMathItems] = useState<MathItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingSingle, setSavingSingle] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  function updateRecord<Key extends keyof ContentImportInput>(
    key: Key,
    value: ContentImportInput[Key],
  ) {
    setRecord((currentRecord) => ({ ...currentRecord, [key]: value }));
    setPreview(null);
    setMathItems([]);
    setResult(null);
    setError("");
  }

  async function requestPreview() {
    setLoadingPreview(true);
    setError("");

    const response = await fetch("/api/content/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record }),
    });
    const data = (await response.json().catch(() => null)) as
      | { preview?: ContentPreview; error?: string }
      | null;

    setLoadingPreview(false);

    if (!response.ok || !data?.preview) {
      throw new Error(data?.error ?? "Could not preview content.");
    }

    setPreview(data.preview);
    setMathItems(data.preview.math_items);
    return data.preview;
  }

  async function handlePreview() {
    try {
      await requestPreview();
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Preview failed.");
    }
  }

  function updateMathItem(index: number, patch: Partial<MathItem>) {
    setMathItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
    setResult(null);
  }

  async function handleSingleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setSavingSingle(true);

    try {
      const activePreview = preview ?? (await requestPreview());
      const activeMathItems = preview ? mathItems : activePreview.math_items;
      const response = await fetch("/api/content/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "single",
          record,
          mathItems: activePreview.has_math ? activeMathItems : [],
        }),
      });
      const data = (await response.json().catch(() => null)) as ImportResult | null;

      if (!response.ok || !data) {
        throw new Error("Could not save content.");
      }

      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save content.");
    } finally {
      setSavingSingle(false);
    }
  }

  async function handleBulkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a JSON, CSV, or XLSX file.");
      return;
    }

    setError("");
    setResult(null);
    setSavingBulk(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/content/import", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as ImportResult | null;

      if (!response.ok && !data) {
        throw new Error("Could not import file.");
      }

      setResult(data);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Could not import file.");
    } finally {
      setSavingBulk(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
    setError("");
  }

  return (
    <div className="grid gap-6">
      <div className="inline-grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:w-fit">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`h-10 rounded-md px-4 text-sm font-semibold transition ${
            mode === "single"
              ? "bg-emerald-700 text-white"
              : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          Single form
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`h-10 rounded-md px-4 text-sm font-semibold transition ${
            mode === "bulk"
              ? "bg-emerald-700 text-white"
              : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          Bulk upload
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {mode === "single" ? (
        <form onSubmit={handleSingleSubmit} className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Curriculum metadata
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextInput
                label="Grade"
                value={record.grade}
                onChange={(value) => updateRecord("grade", value)}
                required
              />
              <TextInput
                label="Subject"
                value={record.subject}
                onChange={(value) => updateRecord("subject", value)}
                required
              />
              <TextInput
                label="Topic"
                value={record.topic}
                onChange={(value) => updateRecord("topic", value)}
                required
              />
              <TextInput
                label="Subtopic"
                value={record.subtopic ?? ""}
                onChange={(value) => updateRecord("subtopic", value)}
              />
              <SelectInput
                label="Content type"
                value={String(record.content_type)}
                onChange={(value) => updateRecord("content_type", value)}
              >
                {CONTENT_TYPES.map((contentType) => (
                  <option key={contentType} value={contentType}>
                    {fieldLabel(contentType)}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="Difficulty level"
                value={String(record.difficulty ?? "medium")}
                onChange={(value) => updateRecord("difficulty", value)}
              >
                {DIFFICULTY_LEVELS.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {fieldLabel(difficulty)}
                  </option>
                ))}
              </SelectInput>
              <TextInput
                label="Curriculum source"
                value={record.curriculum_source ?? ""}
                onChange={(value) => updateRecord("curriculum_source", value)}
                placeholder="NERDC"
              />
              <SelectInput
                label="Target language"
                value={record.target_language ?? "ibo_Latn"}
                onChange={(value) => updateRecord("target_language", value)}
              >
                {TARGET_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="Target style"
                value={String(record.target_style)}
                onChange={(value) => updateRecord("target_style", value)}
              >
                {TARGET_STYLES.map((targetStyle) => (
                  <option key={targetStyle} value={targetStyle}>
                    {fieldLabel(targetStyle)}
                  </option>
                ))}
              </SelectInput>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">English content</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Simplified English becomes the source text for translation training.
            </p>
            <div className="mt-5 grid gap-4">
              <TextAreaInput
                label="Original English"
                value={record.original_english}
                onChange={(value) => updateRecord("original_english", value)}
                required
              />
              <TextAreaInput
                label="Simplified English"
                value={record.simplified_english}
                onChange={(value) => updateRecord("simplified_english", value)}
                required
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Maths detection preview
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The backend detects maths, creates placeholders, and prepares
                  the model source text.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePreview}
                disabled={loadingPreview}
                className="h-11 w-full rounded-md border border-emerald-700 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 sm:w-auto"
              >
                {loadingPreview ? "Checking..." : "Detect maths"}
              </button>
            </div>

            {preview ? (
              <div className="mt-5 grid gap-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Math detected: {preview.has_math ? "Yes" : "No"}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Source text for translation model:
                  </p>
                  <MathPlaceholderPreview
                    text={preview.source_text_for_model}
                    mathItems={mathItems.length ? mathItems : preview.math_items}
                  />
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Raw placeholder text
                  </p>
                  <p className="mt-1 break-words rounded-md bg-slate-100 px-3 py-2 font-mono text-xs leading-5 text-slate-700">
                    {preview.source_text_for_model}
                  </p>
                  <GlossaryTermsPanel
                    terms={preview.glossary_terms}
                    emptyText="No glossary terms detected yet."
                  />
                </div>

                {preview.math_items.length ? (
                  <div className="grid gap-3">
                    {preview.math_items.map((item) => (
                      <div
                        key={item.placeholder}
                        className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"
                      >
                        <p className="font-semibold">Detected item: {item.latex}</p>
                        <p className="mt-1">
                          Generated placeholder:{" "}
                          <span className="font-semibold">{item.placeholder}</span>
                        </p>
                        {item.kind === "component" ? (
                          <p className="mt-1">
                            Component of {item.component_of}: {item.role}
                          </p>
                        ) : null}
                        {!item.replacement_found ? (
                          <p className="mt-2 text-amber-800">
                            This placeholder was detected, but the simplified
                            English did not contain a matching expression or
                            spoken phrase.
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {preview.warnings.length ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {preview.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Run detection after entering the English content.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Spoken maths fields
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review or edit the spoken version for each detected placeholder.
            </p>

            {mathItems.length ? (
              <div className="mt-5 grid gap-4">
                {mathItems.map((item, index) => (
                  <div
                    key={item.placeholder}
                    className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-1 text-sm">
                      <p className="font-semibold text-slate-950">{item.placeholder}</p>
                      <p className="break-words text-slate-600">
                        {item.kind === "component" ? "Value" : "LaTeX"}:{" "}
                        {item.value ?? item.latex}
                      </p>
                      {item.kind === "component" ? (
                        <p className="text-slate-600">
                          Component of {item.component_of}: {item.role}
                        </p>
                      ) : null}
                    </div>
                    <TextInput
                      label="Spoken English"
                      value={item.spoken_english}
                      onChange={(value) =>
                        updateMathItem(index, { spoken_english: value })
                      }
                      required
                    />
                    <TextInput
                      label="Spoken Igbo"
                      value={item.spoken_igbo}
                      onChange={(value) => updateMathItem(index, { spoken_igbo: value })}
                      required
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                No maths fields yet. Run detection to create placeholder cards.
              </p>
            )}
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={savingSingle || loadingPreview}
              className="h-12 w-full rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
            >
              {savingSingle ? "Saving..." : "Save content record"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRecord(initialRecord);
                setPreview(null);
                setMathItems([]);
                setResult(null);
                setError("");
              }}
              className="h-12 w-full rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-white sm:w-auto"
            >
              Reset example
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="grid gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Bulk upload CSV, Excel, or JSON
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload records with the same fields as the single form. The backend
              generates record IDs, math placeholders, source text, review
              statuses, and timestamps for each row.
            </p>

            <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">
              Upload file
              <input
                type="file"
                accept=".csv,.json,.xlsx,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>

            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Recommended columns
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                grade, subject, topic, subtopic, content_type, difficulty,
                curriculum_source, target_language, target_style,
                original_english, simplified_english
              </p>
            </div>
          </section>

          <button
            type="submit"
            disabled={savingBulk}
            className="h-12 w-full rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-fit"
          >
            {savingBulk ? "Importing..." : "Import file"}
          </button>
        </form>
      )}

      <ResultPanel result={result} />
    </div>
  );
}
