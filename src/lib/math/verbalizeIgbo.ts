export type VerbalizedMath = {
  latex: string;
  spoken_english: string;
  spoken_igbo: string;
  source_patterns: string[];
};

const numberWordsEnglish: Record<number, string> = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",
};

const numberWordsIgbo: Record<number, string> = {
  0: "efu",
  1: "otu",
  2: "abụọ",
  3: "atọ",
  4: "anọ",
  5: "ise",
  6: "isii",
  7: "asaa",
  8: "asatọ",
  9: "itoolu",
  10: "iri",
  11: "iri na otu",
  12: "iri na abụọ",
  13: "iri na atọ",
  14: "iri na anọ",
  15: "iri na ise",
  16: "iri na isii",
  17: "iri na asaa",
  18: "iri na asatọ",
  19: "iri na itoolu",
  20: "iri abụọ",
};

const denominatorWords: Record<number, { singular: string; plural: string }> = {
  2: { singular: "half", plural: "halves" },
  3: { singular: "third", plural: "thirds" },
  4: { singular: "quarter", plural: "quarters" },
  5: { singular: "fifth", plural: "fifths" },
  6: { singular: "sixth", plural: "sixths" },
  7: { singular: "seventh", plural: "sevenths" },
  8: { singular: "eighth", plural: "eighths" },
  9: { singular: "ninth", plural: "ninths" },
  10: { singular: "tenth", plural: "tenths" },
  100: { singular: "hundredth", plural: "hundredths" },
  1000: { singular: "thousandth", plural: "thousandths" },
};

const operatorWords: Record<
  string,
  { english: string; igbo: string; patterns: string[] }
> = {
  "+": { english: "plus", igbo: "gbakwunyere", patterns: ["plus", "added to"] },
  "-": { english: "minus", igbo: "wepu", patterns: ["minus", "take away"] },
  "\\times": {
    english: "multiplied by",
    igbo: "mụbaa",
    patterns: ["multiplied by", "times", "by"],
  },
  "*": {
    english: "multiplied by",
    igbo: "mụbaa",
    patterns: ["multiplied by", "times", "by"],
  },
  "x": {
    english: "multiplied by",
    igbo: "mụbaa",
    patterns: ["multiplied by", "times", "by"],
  },
  "\\div": {
    english: "divided by",
    igbo: "kewaa",
    patterns: ["divided by", "over"],
  },
  "/": {
    english: "divided by",
    igbo: "kewaa",
    patterns: ["divided by", "over"],
  },
  "=": { english: "equals", igbo: "ha nhata", patterns: ["equals", "is equal to"] },
  ">": {
    english: "greater than",
    igbo: "kariri",
    patterns: ["greater than", "more than"],
  },
  "<": { english: "less than", igbo: "pere mpe", patterns: ["less than"] },
};

export function numberToEnglish(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    return String(value);
  }

  if (numberWordsEnglish[value]) {
    return numberWordsEnglish[value];
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const remainder = value % 10;
    const tensWords: Record<number, string> = {
      2: "twenty",
      3: "thirty",
      4: "forty",
      5: "fifty",
      6: "sixty",
      7: "seventy",
      8: "eighty",
      9: "ninety",
    };

    return remainder
      ? `${tensWords[tens]} ${numberToEnglish(remainder)}`
      : tensWords[tens];
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    const prefix = `${numberToEnglish(hundreds)} hundred`;

    return remainder ? `${prefix} ${numberToEnglish(remainder)}` : prefix;
  }

  if (value < 1000000) {
    const thousands = Math.floor(value / 1000);
    const remainder = value % 1000;
    const prefix = `${numberToEnglish(thousands)} thousand`;

    return remainder ? `${prefix} ${numberToEnglish(remainder)}` : prefix;
  }

  return String(value);
}

export function numberToIgbo(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    return String(value);
  }

  if (numberWordsIgbo[value]) {
    return numberWordsIgbo[value];
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const remainder = value % 10;
    const prefix = `iri ${numberToIgbo(tens)}`;

    return remainder ? `${prefix} na ${numberToIgbo(remainder)}` : prefix;
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    const prefix =
      hundreds === 1 ? "otu narị" : `narị ${numberToIgbo(hundreds)}`;

    return remainder ? `${prefix} na ${numberToIgbo(remainder)}` : prefix;
  }

  if (value < 1000000) {
    const thousands = Math.floor(value / 1000);
    const remainder = value % 1000;
    const prefix =
      thousands === 1 ? "otu puku" : `puku ${numberToIgbo(thousands)}`;

    return remainder ? `${prefix} na ${numberToIgbo(remainder)}` : prefix;
  }

  return String(value);
}

function fractionToEnglish(numerator: number, denominator: number) {
  const numeratorText = numberToEnglish(numerator);
  const denominatorText =
    denominatorWords[denominator]?.[numerator === 1 ? "singular" : "plural"] ??
    `${numberToEnglish(denominator)}ths`;

  return `${numeratorText} ${denominatorText}`;
}

function fractionToIgbo(numerator: number, denominator: number) {
  return `${numberToIgbo(numerator)} n'ime ${numberToIgbo(denominator)}`;
}

export function normalizeLatex(expression: string) {
  return expression
    .trim()
    .replace(/\\\\(?=[a-zA-Z]+)/g, "\\")
    .replace(/^\$+|\$+$/g, "")
    .replace(/^\\\(|\\\)$/g, "")
    .replace(/^\\\[|\\\]$/g, "")
    .replace(/\s+/g, " ");
}

function stripEscapedPercent(value: string) {
  return value.replace(/\\%/g, "%");
}

function stripNumberSeparators(value: string) {
  return value.replace(/,/g, "");
}

function isNumericOperand(value: string) {
  return /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/.test(value);
}

function decimalToEnglish(value: string) {
  const [whole, decimal] = stripNumberSeparators(value).split(".");

  return `${numberToEnglish(Number(whole))} point ${decimal
    .split("")
    .map((digit) => numberToEnglish(Number(digit)))
    .join(" ")}`;
}

function decimalToIgbo(value: string) {
  const [whole, decimal] = stripNumberSeparators(value).split(".");

  return `${numberToIgbo(Number(whole))} ntụpọ ${decimal
    .split("")
    .map((digit) => numberToIgbo(Number(digit)))
    .join(" ")}`;
}

function numberStringToEnglish(value: string) {
  const cleanValue = stripNumberSeparators(value);

  if (cleanValue.includes(".")) {
    return decimalToEnglish(value);
  }

  return numberToEnglish(Number(cleanValue));
}

function numberStringToIgbo(value: string) {
  const cleanValue = stripNumberSeparators(value);

  if (cleanValue.includes(".")) {
    return decimalToIgbo(value);
  }

  return numberToIgbo(Number(cleanValue));
}

function verbalizeOperand(operand: string) {
  const fraction = operand.match(/^\\frac\{(\d+)\}\{(\d+)\}$/);

  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);

    return {
      english: fractionToEnglish(numerator, denominator),
      igbo: fractionToIgbo(numerator, denominator),
    };
  }

  if (/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%$/.test(stripEscapedPercent(operand))) {
    const value = stripEscapedPercent(operand).replace("%", "");

    return {
      english: `${numberStringToEnglish(value)} percent`,
      igbo: `${numberStringToIgbo(value)} pasent`,
    };
  }

  if (isNumericOperand(operand)) {
    return {
      english: numberStringToEnglish(operand),
      igbo: numberStringToIgbo(operand),
    };
  }

  return {
    english: operand,
    igbo: operand,
  };
}

function operandPattern() {
  return String.raw`(?:\\frac\{\d+\}\{\d+\}|(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:\\?%)?)`;
}

function tokenizeExpression(latex: string) {
  const tokenPattern = new RegExp(
    String.raw`\s*(${operandPattern()}|\\times|\\div|[+\-*/=<>x])\s*`,
    "gy",
  );
  const tokens: string[] = [];
  let index = 0;

  while (index < latex.length) {
    tokenPattern.lastIndex = index;
    const match = tokenPattern.exec(latex);

    if (!match) {
      return null;
    }

    tokens.push(match[1]);
    index = tokenPattern.lastIndex;
  }

  return tokens;
}

function isOperator(token: string) {
  return Boolean(operatorWords[token]);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function combinePatternParts(parts: string[][], limit = 24) {
  let combinations = [""];

  for (const part of parts) {
    const nextCombinations: string[] = [];

    for (const prefix of combinations) {
      for (const value of part) {
        nextCombinations.push(`${prefix} ${value}`.trim());

        if (nextCombinations.length >= limit) {
          break;
        }
      }

      if (nextCombinations.length >= limit) {
        break;
      }
    }

    combinations = nextCombinations;
  }

  return uniqueValues(combinations);
}

function verbalizeTokenSequence(tokens: string[]) {
  if (tokens.length < 3 || tokens.length % 2 === 0) {
    return null;
  }

  const englishParts: string[] = [];
  const igboParts: string[] = [];
  const sourcePatternParts: string[][] = [];

  for (const [index, token] of tokens.entries()) {
    if (index % 2 === 0) {
      const operand = verbalizeOperand(token);
      englishParts.push(operand.english);
      igboParts.push(operand.igbo);
      sourcePatternParts.push([operand.english]);
      continue;
    }

    const operator = operatorWords[token];

    if (!operator) {
      return null;
    }

    englishParts.push(operator.english);
    igboParts.push(operator.igbo);
    sourcePatternParts.push(operator.patterns);
  }

  return {
    spoken_english: englishParts.join(" "),
    spoken_igbo: igboParts.join(" "),
    source_patterns: combinePatternParts(sourcePatternParts),
  };
}

export function verbalizeMathExpression(expression: string): VerbalizedMath {
  const latex = normalizeLatex(expression);
  const tokens = tokenizeExpression(latex);

  if (tokens?.some(isOperator)) {
    const sequence = verbalizeTokenSequence(tokens);

    if (sequence) {
      return {
        latex,
        spoken_english: sequence.spoken_english,
        spoken_igbo: sequence.spoken_igbo,
        source_patterns: sequence.source_patterns,
      };
    }
  }

  const operand = verbalizeOperand(latex);

  return {
    latex,
    spoken_english: operand.english,
    spoken_igbo: operand.igbo,
    source_patterns: [operand.english],
  };
}
