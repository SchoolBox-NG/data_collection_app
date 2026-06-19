import {
  CONTENT_TYPES,
  DIFFICULTY_LEVELS,
  isContentType,
  isDifficultyLevel,
  isTargetStyle,
  type TargetStyle,
  TARGET_STYLES,
} from "@/lib/content/constants";
import {
  type ContentImportInput,
  type ContentPreview,
  type MathItem,
} from "@/lib/content/types";
import {
  buildGlossaryUsageForStorage,
  detectGlossaryTerms,
  type GlossaryTermUsage,
} from "@/lib/content/glossary";
import { buildMathPreview } from "@/lib/math/detectMath";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInput(input: Partial<ContentImportInput>): ContentImportInput {
  return {
    grade: clean(input.grade),
    subject: clean(input.subject),
    topic: clean(input.topic),
    subtopic: clean(input.subtopic),
    content_type: clean(input.content_type) || CONTENT_TYPES[0],
    difficulty: clean(input.difficulty) || DIFFICULTY_LEVELS[1],
    curriculum_source: clean(input.curriculum_source),
    target_language: clean(input.target_language) || "ibo_Latn",
    target_style: clean(input.target_style) || TARGET_STYLES[1],
    original_english: clean(input.original_english),
    simplified_english: clean(input.simplified_english),
  };
}

function required(value: string, label: string, errors: string[]) {
  if (!value) {
    errors.push(`${label} is required.`);
  }
}

export function validateContentInput(input: ContentImportInput) {
  const errors: string[] = [];

  required(input.grade, "Grade", errors);
  required(input.subject, "Subject", errors);
  required(input.topic, "Topic", errors);
  required(String(input.content_type), "Content type", errors);
  required(input.original_english, "Original English", errors);
  required(input.simplified_english, "Simplified English", errors);
  required(String(input.target_style), "Target style", errors);

  if (input.content_type && !isContentType(String(input.content_type))) {
    errors.push(`Content type must be one of: ${CONTENT_TYPES.join(", ")}.`);
  }

  if (input.difficulty && !isDifficultyLevel(String(input.difficulty))) {
    errors.push(`Difficulty must be one of: ${DIFFICULTY_LEVELS.join(", ")}.`);
  }

  if (input.target_style && !isTargetStyle(String(input.target_style))) {
    errors.push(`Target style must be one of: ${TARGET_STYLES.join(", ")}.`);
  }

  return errors;
}

function mathMapFromItems(items: MathItem[]) {
  return Object.fromEntries(
    items.map((item) => [
      item.placeholder,
      {
        latex: item.latex,
        value: item.value,
        spoken_en: item.spoken_english,
        spoken_english: item.spoken_english,
        spoken_igbo: item.spoken_igbo,
        review_status: item.review_status,
        kind: item.kind,
        family: item.family,
        role: item.role,
        component_of: item.component_of,
      },
    ]),
  );
}

export function validateMathItems(items: MathItem[]) {
  const errors: string[] = [];
  const placeholders = new Set<string>();

  for (const item of items) {
    if (!item.placeholder) {
      errors.push("Every maths item must have a placeholder.");
    }

    if (placeholders.has(item.placeholder)) {
      errors.push(`${item.placeholder} is duplicated.`);
    }

    placeholders.add(item.placeholder);

    if (!item.spoken_english.trim()) {
      errors.push(`${item.placeholder} needs spoken English.`);
    }

    if (!item.spoken_igbo.trim()) {
      errors.push(`${item.placeholder} needs spoken Igbo.`);
    }
  }

  return errors;
}

function validateGlossaryTerms(terms: GlossaryTermUsage[], targetStyle: string) {
  const errors: string[] = [];

  for (const term of terms) {
    if (term.status !== "approved") {
      errors.push(`${term.english} is not an approved glossary term.`);
    }

    if (!term.all_style_outputs[targetStyle as keyof typeof term.all_style_outputs]) {
      errors.push(`${term.english} is not configured for ${targetStyle}.`);
    }
  }

  return errors;
}

export function previewContentRecord(
  rawInput: Partial<ContentImportInput>,
  mathOverrides?: MathItem[],
): ContentPreview {
  const input = normalizeInput(rawInput);
  const generated = buildMathPreview(input);
  const targetStyle = input.target_style as TargetStyle;
  const glossaryTerms = detectGlossaryTerms({
    original_english: input.original_english,
    simplified_english: input.simplified_english,
    topic: input.topic,
    subtopic: input.subtopic,
    target_style: targetStyle,
  });
  const mathItems =
    mathOverrides?.map((override, index) => ({
      ...generated.math_items[index],
      ...override,
      position: index,
      review_status: override.review_status ?? "pending",
    })) ?? generated.math_items;

  return {
    input,
    has_math: mathItems.length > 0,
    source_text_for_model: generated.source_text_for_model,
    math_items: mathItems,
    math_map: mathMapFromItems(mathItems),
    glossary_terms_used: glossaryTerms.map((term) => term.term_id),
    glossary_terms: glossaryTerms,
    glossary_terms_for_storage: buildGlossaryUsageForStorage(glossaryTerms),
    warnings: generated.warnings,
  };
}

export function prepareContentRecord(
  rawInput: Partial<ContentImportInput>,
  mathOverrides?: MathItem[],
) {
  const preview = previewContentRecord(rawInput, mathOverrides);
  const inputErrors = validateContentInput(preview.input);
  const mathErrors = preview.has_math ? validateMathItems(preview.math_items) : [];
  const glossaryErrors = validateGlossaryTerms(
    preview.glossary_terms,
    String(preview.input.target_style),
  );
  const errors = [...inputErrors, ...mathErrors, ...glossaryErrors];

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  return preview;
}

export function getFinalIgboTtsText(input: {
  target_text_for_model: string;
  math_items: Array<Pick<MathItem, "placeholder" | "spoken_igbo">>;
}) {
  let ttsText = input.target_text_for_model;

  for (const item of input.math_items) {
    ttsText = ttsText.split(item.placeholder).join(item.spoken_igbo);
  }

  return ttsText;
}
