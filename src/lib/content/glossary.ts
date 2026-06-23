import { type TargetStyle } from "@/lib/content/constants";
import { APPROVED_GLOSSARY_TERMS } from "@/lib/glossary/terms";

export { APPROVED_GLOSSARY_TERMS };

export type GlossaryStatus = "draft" | "approved" | "deprecated";

export type GlossaryCategory =
  | "general_number"
  | "number"
  | "place_value"
  | "fraction"
  | "decimal"
  | "percentage"
  | "operation"
  | "measurement"
  | "geometry"
  | "statistics"
  | "algebra"
  | "problem_solving";

export type GlossaryTermOutputs = Record<TargetStyle, string>;

export type GlossaryTermDefinition = {
  term_id: string;
  english: string;
  category: GlossaryCategory;
  outputs: GlossaryTermOutputs;
  definition_igbo: string;
  aliases: string[];
  allowed_styles: TargetStyle[];
  forbidden_translations: string[];
  priority: number;
  topic_scope?: string[];
  requires_context?: boolean;
  teacher_note?: string;
  status: GlossaryStatus;
};

export type GlossaryTermUsage = {
  term_id: string;
  english: string;
  category: GlossaryCategory;
  matched_texts: string[];
  selected_output: string;
  all_style_outputs: GlossaryTermOutputs;
  definition_igbo: string;
  forbidden_translations: string[];
  teacher_instruction: string;
  priority: number;
  status: GlossaryStatus;
};

export type StoredGlossaryTermUsage = {
  term_id: string;
  english: string;
  category: GlossaryCategory;
  matched_texts: string[];
  selected_output: string;
  definition_igbo: string;
  teacher_instruction: string;
  forbidden_translations: string[];
  status: GlossaryStatus;
};

export type GlossaryDetectionInput = {
  original_english: string;
  simplified_english: string;
  topic?: string;
  subtopic?: string;
  target_style: TargetStyle;
};

export type GlossaryValidationIssue = {
  term_id: string;
  english: string;
  severity: "error" | "warning";
  message: string;
};

export type GlossaryValidationResult = {
  ok: boolean;
  issues: GlossaryValidationIssue[];
};

type InternalMatch = {
  term: GlossaryTermDefinition;
  matched_text: string;
  start: number;
  end: number;
  priority: number;
  alias_length: number;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripInlineMath(text: string) {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]+\$/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ");
}

function hasTopicContext(term: GlossaryTermDefinition, input: GlossaryDetectionInput) {
  if (!term.topic_scope?.length) {
    return true;
  }

  const topicText = normalizeText(
    [input.topic, input.subtopic].filter(Boolean).join(" "),
  );

  if (!topicText) {
    return false;
  }

  return term.topic_scope.some((topic) => topicText.includes(normalizeText(topic)));
}

function isSpecificPhrase(alias: string) {
  return normalizeText(alias).split(" ").length >= 2;
}

function shouldIncludeMatch(
  term: GlossaryTermDefinition,
  alias: string,
  input: GlossaryDetectionInput,
) {
  if (term.status !== "approved") {
    return false;
  }

  if (!term.allowed_styles.includes(input.target_style)) {
    return false;
  }

  if (!term.requires_context) {
    return true;
  }

  if (isSpecificPhrase(alias)) {
    return true;
  }

  return hasTopicContext(term, input);
}

function matchAlias(
  text: string,
  alias: string,
): Array<{
  matched_text: string;
  start: number;
  end: number;
}> {
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return [];
  }

  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}_])(${escapeRegExp(normalizedAlias)})(?=$|[^\\p{L}\\p{N}_])`,
    "gu",
  );
  const matches: Array<{
    matched_text: string;
    start: number;
    end: number;
  }> = [];

  for (const match of text.matchAll(pattern)) {
    const fullMatch = match[0];
    const matchedText = match[1];

    if (!matchedText) {
      continue;
    }

    const fullStart = match.index ?? 0;
    const offsetInsideFullMatch = fullMatch.indexOf(matchedText);
    const start = fullStart + offsetInsideFullMatch;
    const end = start + matchedText.length;

    matches.push({
      matched_text: matchedText,
      start,
      end,
    });
  }

  return matches;
}

function overlaps(a: InternalMatch, b: InternalMatch) {
  return a.start < b.end && b.start < a.end;
}

function removeOverlappingMatches(matches: InternalMatch[]) {
  const sorted = [...matches].sort((a, b) => {
    const lengthDiff = b.alias_length - a.alias_length;

    if (lengthDiff !== 0) {
      return lengthDiff;
    }

    const priorityDiff = b.priority - a.priority;

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.start - b.start;
  });
  const selected: InternalMatch[] = [];

  for (const match of sorted) {
    const hasOverlap = selected.some((existing) => overlaps(existing, match));

    if (!hasOverlap) {
      selected.push(match);
    }
  }

  return selected.sort((a, b) => a.start - b.start);
}

function selectedOutput(term: GlossaryTermDefinition, targetStyle: TargetStyle) {
  return term.outputs[targetStyle] || term.outputs.standard_igbo;
}

function buildTeacherInstruction(
  term: GlossaryTermDefinition,
  targetStyle: TargetStyle,
) {
  const output = selectedOutput(term, targetStyle);
  const base =
    targetStyle === "standard_igbo"
      ? `Use the approved Igbo wording: "${output}".`
      : targetStyle === "code_mixed_igbo_english"
        ? `Use the approved code-mixed wording: "${output}".`
        : `Use the child-friendly wording: "${output}".`;
  const forbidden = term.forbidden_translations.length
    ? ` Avoid: ${term.forbidden_translations.map((item) => `"${item}"`).join(", ")}.`
    : "";
  const note = term.teacher_note ? ` ${term.teacher_note}` : "";

  return `${base}${forbidden}${note}`.trim();
}

function groupMatchesByTerm(matches: InternalMatch[], targetStyle: TargetStyle) {
  const grouped = new Map<string, GlossaryTermUsage>();

  for (const match of matches) {
    const term = match.term;
    const existing = grouped.get(term.term_id);

    if (!existing) {
      grouped.set(term.term_id, {
        term_id: term.term_id,
        english: term.english,
        category: term.category,
        matched_texts: [match.matched_text],
        selected_output: selectedOutput(term, targetStyle),
        all_style_outputs: term.outputs,
        definition_igbo: term.definition_igbo,
        forbidden_translations: term.forbidden_translations,
        teacher_instruction: buildTeacherInstruction(term, targetStyle),
        priority: term.priority,
        status: term.status,
      });
      continue;
    }

    if (!existing.matched_texts.includes(match.matched_text)) {
      existing.matched_texts.push(match.matched_text);
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.priority - a.priority);
}

export function detectGlossaryTerms(
  input: GlossaryDetectionInput,
): GlossaryTermUsage[] {
  const sourceText = normalizeText(
    stripInlineMath(
      [input.original_english, input.simplified_english]
        .filter(Boolean)
        .join(" "),
    ),
  );

  if (!sourceText) {
    return [];
  }

  const rawMatches: InternalMatch[] = [];

  for (const term of APPROVED_GLOSSARY_TERMS) {
    for (const alias of term.aliases) {
      if (!shouldIncludeMatch(term, alias, input)) {
        continue;
      }

      for (const aliasMatch of matchAlias(sourceText, alias)) {
        rawMatches.push({
          term,
          matched_text: aliasMatch.matched_text,
          start: aliasMatch.start,
          end: aliasMatch.end,
          priority: term.priority,
          alias_length: normalizeText(alias).length,
        });
      }
    }
  }

  return groupMatchesByTerm(removeOverlappingMatches(rawMatches), input.target_style);
}

function normalizedIncludes(haystack: string, needle: string) {
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);

  if (!normalizedNeedle) {
    return false;
  }

  return normalizedHaystack.includes(normalizedNeedle);
}

function acceptableOutputsForUsage(usage: GlossaryTermUsage) {
  return Array.from(
    new Set([
      usage.selected_output,
      usage.all_style_outputs.standard_igbo,
      usage.all_style_outputs.code_mixed_igbo_english,
      usage.all_style_outputs.child_friendly_igbo,
    ].filter(Boolean)),
  );
}

export function validateGlossaryTranslation(input: {
  target_translation: string;
  usages: GlossaryTermUsage[];
  strict?: boolean;
}): GlossaryValidationResult {
  const issues: GlossaryValidationIssue[] = [];

  for (const usage of input.usages) {
    for (const forbidden of usage.forbidden_translations) {
      if (normalizedIncludes(input.target_translation, forbidden)) {
        issues.push({
          term_id: usage.term_id,
          english: usage.english,
          severity: "error",
          message: `Forbidden translation "${forbidden}" was found for "${usage.english}".`,
        });
      }
    }

    const acceptableOutputs = acceptableOutputsForUsage(usage);
    const hasAnyApprovedOutput = acceptableOutputs.some((output) =>
      normalizedIncludes(input.target_translation, output),
    );

    if (!hasAnyApprovedOutput) {
      issues.push({
        term_id: usage.term_id,
        english: usage.english,
        severity: input.strict ? "error" : "warning",
        message: `No approved glossary output found for "${usage.english}". Expected one of: ${acceptableOutputs
          .map((output) => `"${output}"`)
          .join(", ")}.`,
      });
    }
  }

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}

export function buildGlossaryUsageForStorage(
  usages: GlossaryTermUsage[],
): StoredGlossaryTermUsage[] {
  return usages.map((usage) => ({
    term_id: usage.term_id,
    english: usage.english,
    category: usage.category,
    matched_texts: usage.matched_texts,
    selected_output: usage.selected_output,
    definition_igbo: usage.definition_igbo,
    teacher_instruction: usage.teacher_instruction,
    forbidden_translations: usage.forbidden_translations,
    status: usage.status,
  }));
}
