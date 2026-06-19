import { type MathItem } from "@/lib/content/types";

type MathToken =
  | {
      type: "fraction";
      numerator: string;
      denominator: string;
    }
  | {
      type: "text";
      value: string;
    };

function normalizeLatexForDisplay(value: string) {
  return value.replace(/\\\\(?=[A-Za-z]+)/g, "\\").trim();
}

function readBracedValue(value: string, openBraceIndex: number) {
  let depth = 0;
  let content = "";

  for (let index = openBraceIndex; index < value.length; index += 1) {
    const character = value[index];

    if (character === "{") {
      depth += 1;

      if (depth > 1) {
        content += character;
      }

      continue;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return { content, endIndex: index + 1 };
      }

      content += character;
      continue;
    }

    content += character;
  }

  return null;
}

function parseLatex(value: string): MathToken[] {
  const normalized = normalizeLatexForDisplay(value);
  const tokens: MathToken[] = [];
  let index = 0;

  while (index < normalized.length) {
    if (/\s/.test(normalized[index])) {
      index += 1;
      continue;
    }

    if (normalized.startsWith("\\frac", index)) {
      const numerator = readBracedValue(normalized, index + "\\frac".length);

      if (numerator) {
        const denominator = readBracedValue(normalized, numerator.endIndex);

        if (denominator) {
          tokens.push({
            type: "fraction",
            numerator: numerator.content,
            denominator: denominator.content,
          });
          index = denominator.endIndex;
          continue;
        }
      }
    }

    if (normalized.startsWith("\\times", index)) {
      tokens.push({ type: "text", value: "x" });
      index += "\\times".length;
      continue;
    }

    if (normalized.startsWith("\\div", index)) {
      tokens.push({ type: "text", value: "/" });
      index += "\\div".length;
      continue;
    }

    const nextLatexCommand = normalized.indexOf("\\", index + 1);
    const nextSpace = normalized.slice(index + 1).search(/\s/);
    const nextStopCandidates = [
      nextLatexCommand,
      nextSpace === -1 ? -1 : index + 1 + nextSpace,
    ].filter((candidate) => candidate > -1);
    const nextStop = nextStopCandidates.length
      ? Math.min(...nextStopCandidates)
      : normalized.length;

    tokens.push({
      type: "text",
      value: normalized.slice(index, nextStop),
    });
    index = nextStop;
  }

  return tokens.length ? tokens : [{ type: "text", value: normalized }];
}

function FractionView({
  numerator,
  denominator,
}: {
  numerator: string;
  denominator: string;
}) {
  return (
    <span className="inline-flex flex-col items-center justify-center align-middle text-[0.9em] leading-none">
      <span className="border-b border-current px-1 pb-0.5">
        {normalizeLatexForDisplay(numerator)}
      </span>
      <span className="px-1 pt-0.5">{normalizeLatexForDisplay(denominator)}</span>
    </span>
  );
}

function RenderedMath({
  latex,
  value,
}: {
  latex: string;
  value?: string | number;
}) {
  const displayValue = value ?? latex;
  const tokens = parseLatex(String(displayValue));

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 align-middle font-semibold text-slate-950">
      {tokens.map((token, index) =>
        token.type === "fraction" ? (
          <FractionView
            key={`${token.numerator}-${token.denominator}-${index}`}
            numerator={token.numerator}
            denominator={token.denominator}
          />
        ) : (
          <span
            key={`${token.value}-${index}`}
            className="whitespace-nowrap"
          >
            {token.value}
          </span>
        ),
      )}
    </span>
  );
}

export function PlaceholderChip({ item }: { item: MathItem }) {
  return (
    <span className="mx-0.5 inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md border border-emerald-300 bg-white px-2 py-0.5 align-middle text-sm shadow-sm">
      <span className="whitespace-nowrap font-semibold text-emerald-800">
        {item.placeholder}
      </span>
      <span className="text-slate-400">=</span>
      <RenderedMath latex={item.latex} value={item.value} />
    </span>
  );
}

export function MathPlaceholderPreview({
  text,
  mathItems,
}: {
  text: string;
  mathItems: MathItem[];
}) {
  const itemsByPlaceholder = new Map(
    mathItems.map((item) => [item.placeholder, item]),
  );
  const parts = text.split(/(<[A-Z0-9_]+>)/g).filter(Boolean);

  return (
    <div className="mt-1.5 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="break-words text-sm leading-7 text-slate-700">
        {parts.map((part, index) => {
          const item = itemsByPlaceholder.get(part);

          if (item) {
            return <PlaceholderChip key={`${part}-${index}`} item={item} />;
          }

          if (/^<[A-Z0-9_]+>$/.test(part)) {
            return (
              <span
                key={`${part}-${index}`}
                className="mx-0.5 inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-1 align-middle font-semibold text-amber-900"
              >
                {part}
              </span>
            );
          }

          return (
            <span key={`${part}-${index}`}>{part}</span>
          );
        })}
      </p>
    </div>
  );
}
