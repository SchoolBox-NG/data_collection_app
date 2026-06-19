import { type TargetStyle } from "@/lib/content/constants";

export type GlossaryStatus = "draft" | "approved" | "deprecated";

export type GlossaryCategory =
  | "general_number"
  | "place_value"
  | "fraction"
  | "decimal"
  | "operation"
  | "measurement"
  | "geometry"
  | "statistics"
  | "algebra";

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

const ALL_TARGET_STYLES: TargetStyle[] = [
  "standard_igbo",
  "code_mixed_igbo_english",
  "child_friendly_igbo",
];

export const APPROVED_GLOSSARY_TERMS: GlossaryTermDefinition[] = [
  {
    term_id: "fraction",
    english: "fraction",
    category: "fraction",
    outputs: {
      standard_igbo: "akụkụ nke ihe zuru ezu",
      code_mixed_igbo_english: "fraction",
      child_friendly_igbo: "fraction, ya bụ akụkụ nke ihe zuru ezu",
    },
    definition_igbo: "akụkụ nke ihe zuru ezu",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 80,
    topic_scope: ["fraction", "fractions"],
    aliases: ["fraction", "fractions"],
    teacher_note:
      "In code-mixed style, keep 'fraction' because learners may meet it in school texts. In child-friendly style, explain it immediately.",
  },
  {
    term_id: "number",
    english: "number",
    category: "general_number",
    outputs: {
      standard_igbo: "ọnụọgụ",
      code_mixed_igbo_english: "number",
      child_friendly_igbo: "ọnụọgụ, ya bụ ihe e ji agụta ma ọ bụ gbakọọ",
    },
    definition_igbo: "ọnụọgụ bụ ihe e ji agụta, atụ ihe, ma ọ bụ gbakọọ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 20,
    aliases: ["number", "numbers"],
    teacher_note:
      "Use this for the general idea of a number. Do not confuse it with digit.",
  },
  {
    term_id: "digit",
    english: "digit",
    category: "general_number",
    outputs: {
      standard_igbo: "akara ọnụọgụ",
      code_mixed_igbo_english: "digit",
      child_friendly_igbo:
        "digit, ya bụ otu akara e ji dee ọnụọgụ, dịka 0 ruo 9",
    },
    definition_igbo: "digit bụ akara otu n’ime 0 ruo 9 e ji dee ọnụọgụ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 60,
    aliases: ["digit", "digits"],
    teacher_note:
      "Use digit when referring to one symbol inside a number. Example: in 45, 4 and 5 are digits.",
  },
  {
    term_id: "numerator",
    english: "numerator",
    category: "fraction",
    outputs: {
      standard_igbo: "ọnụọgụ dị n’elu",
      code_mixed_igbo_english: "numerator",
      child_friendly_igbo: "numerator, ya bụ ọnụọgụ dị n’elu na fraction",
    },
    definition_igbo: "ọnụọgụ dị n’elu na fraction",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: ["nọmba elu"],
    status: "approved",
    priority: 100,
    topic_scope: ["fraction", "fractions", "numerator", "denominator"],
    aliases: [
      "numerator",
      "top number",
      "number on top",
      "upper number",
      "number above",
    ],
    teacher_note:
      "For code-mixed style, keep 'numerator' and explain it as the top number in a fraction.",
  },
  {
    term_id: "denominator",
    english: "denominator",
    category: "fraction",
    outputs: {
      standard_igbo: "ọnụọgụ dị n’okpuru",
      code_mixed_igbo_english: "denominator",
      child_friendly_igbo: "denominator, ya bụ ọnụọgụ dị n’okpuru na fraction",
    },
    definition_igbo: "ọnụọgụ dị n’okpuru na fraction",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: ["nọmba ala"],
    status: "approved",
    priority: 100,
    topic_scope: ["fraction", "fractions", "numerator", "denominator"],
    aliases: [
      "denominator",
      "bottom number",
      "number at the bottom",
      "lower number",
      "number below",
    ],
    teacher_note:
      "For code-mixed style, keep 'denominator' and explain it as the bottom number in a fraction.",
  },
  {
    term_id: "equal_parts",
    english: "equal parts",
    category: "fraction",
    outputs: {
      standard_igbo: "akụkụ hà nhata",
      code_mixed_igbo_english: "equal parts",
      child_friendly_igbo:
        "akụkụ hà nhata, ya bụ akụkụ niile hà otu nha",
    },
    definition_igbo: "akụkụ niile nwere otu nha",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: ["akụkụ yiri ibe ha"],
    status: "approved",
    priority: 95,
    topic_scope: ["fraction", "fractions", "equal parts", "shapes"],
    aliases: [
      "equal part",
      "equal parts",
      "same-size part",
      "same-size parts",
      "same size part",
      "same size parts",
      "same-sized part",
      "same-sized parts",
    ],
    teacher_note:
      "Use this when a whole or shape is divided into parts with the same size.",
  },
  {
    term_id: "parts",
    english: "parts",
    category: "fraction",
    outputs: {
      standard_igbo: "akụkụ",
      code_mixed_igbo_english: "parts",
      child_friendly_igbo: "parts, ya bụ akụkụ nke ihe dum",
    },
    definition_igbo: "akụkụ nke ihe dum ma ọ bụ shape",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 45,
    topic_scope: ["fraction", "fractions", "shapes", "equal parts"],
    aliases: ["part", "parts"],
    teacher_note:
      "Use this for pieces or sections. Use equal parts only when the pieces must have the same size.",
  },
  {
    term_id: "decimal",
    english: "decimal",
    category: "decimal",
    outputs: {
      standard_igbo: "ọnụọgụ nwere ntụpọ",
      code_mixed_igbo_english: "decimal",
      child_friendly_igbo: "decimal, ya bụ ọnụọgụ nwere ntụpọ decimal",
    },
    definition_igbo: "ọnụọgụ nwere ntụpọ decimal",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 80,
    topic_scope: ["decimal", "decimals"],
    aliases: ["decimal", "decimals", "decimal number", "decimal numbers"],
  },
  {
    term_id: "tenths",
    english: "tenths",
    category: "decimal",
    outputs: {
      standard_igbo: "otu ụzọ n’ime iri",
      code_mixed_igbo_english: "tenths",
      child_friendly_igbo: "tenths, ya bụ akụkụ iri nke otu ihe",
    },
    definition_igbo: "akụkụ iri nke otu ihe",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 70,
    topic_scope: ["decimal", "decimals", "place value"],
    aliases: ["tenth", "tenths"],
  },
  {
    term_id: "hundredths",
    english: "hundredths",
    category: "decimal",
    outputs: {
      standard_igbo: "otu ụzọ n’ime otu narị",
      code_mixed_igbo_english: "hundredths",
      child_friendly_igbo: "hundredths, ya bụ akụkụ otu narị nke otu ihe",
    },
    definition_igbo: "akụkụ otu narị nke otu ihe",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 70,
    topic_scope: ["decimal", "decimals", "place value"],
    aliases: ["hundredth", "hundredths"],
  },
  {
    term_id: "place_value",
    english: "place value",
    category: "place_value",
    outputs: {
      standard_igbo: "ọnọdụ ọnụọgụ",
      code_mixed_igbo_english: "place value",
      child_friendly_igbo:
        "place value, ya bụ uru digit nwere dabere n’ebe ọ nọ",
    },
    definition_igbo: "uru digit nwere dabere n’ebe ọ nọ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 90,
    topic_scope: ["place value", "number", "numeration"],
    aliases: ["place value", "place values"],
  },
  {
    term_id: "rounding",
    english: "rounding",
    category: "place_value",
    outputs: {
      standard_igbo: "ime ka ọnụọgụ dị mfe",
      code_mixed_igbo_english: "rounding",
      child_friendly_igbo:
        "rounding, ya bụ ime ka ọnụọgụ bụrụ nke dị nso ma dị mfe",
    },
    definition_igbo: "ịgbanwe ọnụọgụ ka ọ bụrụ nke dị nso ma dị mfe",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 80,
    topic_scope: ["rounding", "place value"],
    aliases: ["round", "rounds", "rounded", "rounding"],
  },
  {
    term_id: "nearest_thousand",
    english: "nearest thousand",
    category: "place_value",
    outputs: {
      standard_igbo: "puku kacha nso",
      code_mixed_igbo_english: "nearest thousand",
      child_friendly_igbo:
        "nearest thousand, ya bụ puku kacha nso na ọnụọgụ enyere",
    },
    definition_igbo: "puku dị nso na ọnụọgụ enyere",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 95,
    topic_scope: ["rounding", "place value", "thousand"],
    aliases: ["nearest thousand", "nearest thousands"],
  },
  {
    term_id: "thousand",
    english: "thousand",
    category: "place_value",
    outputs: {
      standard_igbo: "puku",
      code_mixed_igbo_english: "thousand",
      child_friendly_igbo: "puku, ya bụ 1000",
    },
    definition_igbo: "ọnụọgụ ruru otu puku",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 40,
    topic_scope: ["place value", "rounding", "large numbers"],
    requires_context: true,
    aliases: ["thousand", "thousands"],
  },
  {
    term_id: "hundred",
    english: "hundred",
    category: "place_value",
    outputs: {
      standard_igbo: "narị",
      code_mixed_igbo_english: "hundred",
      child_friendly_igbo: "narị, ya bụ 100",
    },
    definition_igbo: "ọnụọgụ ruru otu narị",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 40,
    topic_scope: ["place value", "rounding", "large numbers"],
    requires_context: true,
    aliases: ["hundred", "hundreds"],
  },
  {
    term_id: "ones",
    english: "ones",
    category: "place_value",
    outputs: {
      standard_igbo: "ọnọdụ otu",
      code_mixed_igbo_english: "ones",
      child_friendly_igbo: "ones, ya bụ ebe digit otu nọ na ọnụọgụ",
    },
    definition_igbo: "ebe digit otu nọ na ọnụọgụ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 70,
    topic_scope: ["place value"],
    aliases: ["ones", "units"],
  },
  {
    term_id: "tens",
    english: "tens",
    category: "place_value",
    outputs: {
      standard_igbo: "ọnọdụ iri",
      code_mixed_igbo_english: "tens",
      child_friendly_igbo: "tens, ya bụ ebe digit iri nọ na ọnụọgụ",
    },
    definition_igbo: "ebe digit iri nọ na ọnụọgụ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 70,
    topic_scope: ["place value"],
    aliases: ["tens"],
  },
  {
    term_id: "shape",
    english: "shape",
    category: "geometry",
    outputs: {
      standard_igbo: "ụdị ihe",
      code_mixed_igbo_english: "shape",
      child_friendly_igbo: "shape, ya bụ ụdị ihe a hụrụ ma ọ bụ sere",
    },
    definition_igbo: "ụdị ihe ma ọ bụ ọdịdị ihe",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 70,
    topic_scope: ["shape", "shapes", "geometry", "fractions"],
    aliases: ["shape", "shapes"],
    teacher_note:
      "Use this for the object or drawing being divided, compared, or named.",
  },
  {
    term_id: "multiply",
    english: "multiply",
    category: "operation",
    outputs: {
      standard_igbo: "mụbaa",
      code_mixed_igbo_english: "mụbaa",
      child_friendly_igbo: "mụbaa, ya bụ ijikọ otu ọnụọgụ ugboro ugboro",
    },
    definition_igbo: "ịjikọta otu ọnụọgụ ugboro ugboro",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 90,
    topic_scope: ["multiplication", "multiply", "operations"],
    aliases: ["multiply", "multiplies", "multiplying", "multiplication"],
  },
  {
    term_id: "add",
    english: "add",
    category: "operation",
    outputs: {
      standard_igbo: "gbakọọ ọnụ",
      code_mixed_igbo_english: "add",
      child_friendly_igbo:
        "gbakọọ ọnụ, ya bụ itinye ọnụọgụ abụọ ma ọ bụ karịa ọnụ",
    },
    definition_igbo: "itinye ọnụọgụ abụọ ma ọ bụ karịa ọnụ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 80,
    topic_scope: ["addition", "add", "operations"],
    aliases: ["add", "adds", "adding", "addition", "plus"],
  },
  {
    term_id: "subtract",
    english: "subtract",
    category: "operation",
    outputs: {
      standard_igbo: "wepụ",
      code_mixed_igbo_english: "subtract",
      child_friendly_igbo: "wepụ, ya bụ iwepụ otu ọnụọgụ n’ime ọzọ",
    },
    definition_igbo: "iwepụ otu ọnụọgụ n’ime ọzọ",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 80,
    topic_scope: ["subtraction", "subtract", "operations"],
    aliases: ["subtract", "subtracts", "subtracting", "subtraction", "minus"],
  },
  {
    term_id: "divide",
    english: "divide",
    category: "operation",
    outputs: {
      standard_igbo: "kewaa",
      code_mixed_igbo_english: "divide",
      child_friendly_igbo: "kewaa, ya bụ ịkekọrịta ihe n’akụkụ hà nhata",
    },
    definition_igbo: "ịkekọrịta ihe n’akụkụ hà nhata",
    allowed_styles: ALL_TARGET_STYLES,
    forbidden_translations: [],
    status: "approved",
    priority: 80,
    topic_scope: ["division", "divide", "operations"],
    aliases: ["divide", "divides", "dividing", "division"],
  },
];

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
