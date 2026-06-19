import { type MathItem } from "@/lib/content/types";
import {
  normalizeLatex,
  numberToEnglish,
  numberToIgbo,
  verbalizeMathExpression,
} from "./verbalizeIgbo";

type MathOccurrence = {
  raw: string;
  latex: string;
  start: number;
};

type ComponentSpec = {
  role: string;
  placeholder: string;
  latex: string;
  value: number | string;
  spoken_english: string;
  spoken_igbo: string;
  source_patterns: string[];
};

type MathEntity = {
  placeholder: string;
  latex: string;
  family: string;
  spoken_english: string;
  spoken_igbo: string;
  source_patterns: string[];
  components: ComponentSpec[];
};

const FRACTION_PART_TRIGGERS = {
  NUM: [
    "numerator",
    "top number",
    "number on top",
    "upper number",
    "number above",
  ],
  DEN: [
    "denominator",
    "bottom number",
    "number at the bottom",
    "lower number",
    "number below",
  ],
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractMathOccurrences(text: string): MathOccurrence[] {
  const occurrences: MathOccurrence[] = [];
  const patterns = [
    /\$([^$]+)\$/g,
    /\\\((.*?)\\\)/g,
    /\\\[(.*?)\\\]/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[0] && match[1] && typeof match.index === "number") {
        occurrences.push({
          raw: match[0],
          latex: normalizeLatex(match[1]),
          start: match.index,
        });
      }
    }
  }

  return occurrences.sort((left, right) => left.start - right.start);
}

export function extractMathExpressions(...texts: string[]) {
  return uniqueValues(
    texts.flatMap((text) => extractMathOccurrences(text).map((item) => item.latex)),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasAnyTrigger(text: string, triggers: string[]) {
  const normalizedText = text.toLowerCase();

  return triggers.some((trigger) => normalizedText.includes(trigger));
}

function placeholderFamilyForLatex(latex: string) {
  if (/^\\frac\{\d+\}\{\d+\}$/.test(latex)) {
    return "FRAC";
  }

  if (/=/.test(latex)) {
    return "EQ";
  }

  if (/\\times|\\div|[+\-*/x<>]/.test(latex)) {
    return "EXPR";
  }

  if (/^\d+(?:\.\d+)?\\?%$/.test(latex)) {
    return "PCT";
  }

  if (/^\d+\.\d+$/.test(latex)) {
    return "DEC";
  }

  return "NUM";
}

function createSemanticEntities(
  expressions: string[],
  simplifiedEnglish: string,
): MathEntity[] {
  const familyCounts = new Map<string, number>();

  return expressions.map((latex) => {
    const family = placeholderFamilyForLatex(latex);
    const count = (familyCounts.get(family) ?? 0) + 1;
    familyCounts.set(family, count);

    const placeholder = `<${family}_${count}>`;
    const verbalized = verbalizeMathExpression(latex);
    const components: ComponentSpec[] = [];
    const fraction = latex.match(/^\\frac\{(\d+)\}\{(\d+)\}$/);

    if (fraction) {
      const numerator = Number(fraction[1]);
      const denominator = Number(fraction[2]);

      if (hasAnyTrigger(simplifiedEnglish, FRACTION_PART_TRIGGERS.NUM)) {
        components.push({
          role: "NUM",
          placeholder: `<${family}_${count}_NUM>`,
          latex: String(numerator),
          value: numerator,
          spoken_english: numberToEnglish(numerator),
          spoken_igbo: numberToIgbo(numerator),
          source_patterns: [String(numerator), numberToEnglish(numerator)],
        });
      }

      if (hasAnyTrigger(simplifiedEnglish, FRACTION_PART_TRIGGERS.DEN)) {
        components.push({
          role: "DEN",
          placeholder: `<${family}_${count}_DEN>`,
          latex: String(denominator),
          value: denominator,
          spoken_english: numberToEnglish(denominator),
          spoken_igbo: numberToIgbo(denominator),
          source_patterns: [String(denominator), numberToEnglish(denominator)],
        });
      }
    }

    return {
      placeholder,
      latex,
      family,
      spoken_english: verbalized.spoken_english,
      spoken_igbo: verbalized.spoken_igbo,
      source_patterns: [verbalized.latex, ...verbalized.source_patterns],
      components,
    };
  });
}

function replaceInlineMath(
  text: string,
  latex: string,
  placeholder: string,
): { text: string; replacementFound: boolean } {
  const occurrences = extractMathOccurrences(text);
  const occurrence = occurrences.find((item) => item.latex === latex);

  if (!occurrence) {
    return { text, replacementFound: false };
  }

  return {
    text: `${text.slice(0, occurrence.start)}${placeholder}${text.slice(
      occurrence.start + occurrence.raw.length,
    )}`,
    replacementFound: true,
  };
}

function boundaryPattern(pattern: string) {
  const escaped = escapeRegExp(pattern);
  const startsWithWord = /^\w/.test(pattern);
  const endsWithWord = /\w$/.test(pattern);

  return new RegExp(
    `${startsWithWord ? "\\b" : ""}${escaped}${endsWithWord ? "\\b" : ""}`,
    "i",
  );
}

function replaceFirstPattern(text: string, patterns: string[], placeholder: string) {
  for (const pattern of uniqueValues(patterns)) {
    const expression = boundaryPattern(pattern);

    if (expression.test(text)) {
      return {
        text: text.replace(expression, placeholder),
        replacementFound: true,
      };
    }
  }

  return {
    text,
    replacementFound: false,
  };
}

function shouldSkipStandaloneExpression(
  latex: string,
  entities: MathEntity[],
  simplifiedEnglish: string,
) {
  return entities.some(
    (entity) =>
      entity.components.some((component) => component.latex === latex) &&
      extractMathOccurrences(simplifiedEnglish).some((item) => item.latex === latex),
  );
}

export function buildMathPreview(input: {
  original_english: string;
  simplified_english: string;
}) {
  const simplifiedExpressions = extractMathExpressions(input.simplified_english);
  const allExpressions =
    simplifiedExpressions.length > 0
      ? simplifiedExpressions
      : extractMathExpressions(input.original_english, input.simplified_english);
  const preliminaryEntities = createSemanticEntities(
    allExpressions,
    input.simplified_english,
  );
  const expressions = allExpressions.filter(
    (expression) =>
      !shouldSkipStandaloneExpression(
        expression,
        preliminaryEntities,
        input.simplified_english,
      ),
  );
  const entities = createSemanticEntities(expressions, input.simplified_english);
  let sourceTextForModel = input.simplified_english.trim();
  const warnings: string[] = [];
  const mathItems: MathItem[] = [];
  let position = 0;

  for (const entity of entities) {
    let replacement = replaceInlineMath(
      sourceTextForModel,
      entity.latex,
      entity.placeholder,
    );

    if (!replacement.replacementFound) {
      replacement = replaceFirstPattern(
        sourceTextForModel,
        entity.source_patterns,
        entity.placeholder,
      );
    }

    sourceTextForModel = replacement.text;

    if (!replacement.replacementFound) {
      warnings.push(
        `Detected ${entity.placeholder}, but no matching expression or spoken phrase was found in simplified English.`,
      );
    }

    mathItems.push({
      placeholder: entity.placeholder,
      latex: entity.latex,
      spoken_english: entity.spoken_english,
      spoken_igbo: entity.spoken_igbo,
      position,
      review_status: "pending",
      replacement_found: replacement.replacementFound,
      kind: "full",
      family: entity.family,
    });
    position += 1;

    for (const component of entity.components) {
      let componentReplacement = replaceInlineMath(
        sourceTextForModel,
        component.latex,
        component.placeholder,
      );

      if (!componentReplacement.replacementFound) {
        componentReplacement = replaceFirstPattern(
          sourceTextForModel,
          component.source_patterns,
          component.placeholder,
        );
      }

      sourceTextForModel = componentReplacement.text;

      if (!componentReplacement.replacementFound) {
        warnings.push(
          `Detected ${component.placeholder}, but no matching component value was found in simplified English.`,
        );
      }

      mathItems.push({
        placeholder: component.placeholder,
        latex: component.latex,
        value: component.value,
        spoken_english: component.spoken_english,
        spoken_igbo: component.spoken_igbo,
        position,
        review_status: "pending",
        replacement_found: componentReplacement.replacementFound,
        kind: "component",
        family: entity.family,
        role: component.role,
        component_of: entity.placeholder,
      });
      position += 1;
    }
  }

  return {
    has_math: mathItems.length > 0,
    source_text_for_model: sourceTextForModel,
    math_items: mathItems,
    warnings,
  };
}
