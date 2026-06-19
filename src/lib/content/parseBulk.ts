import { readSheet } from "read-excel-file/node";

import { type ContentImportInput } from "@/lib/content/types";

function normalizeHeader(header: unknown) {
  return String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mapRows(headers: unknown[], rows: unknown[][]) {
  const normalizedHeaders = headers.map(normalizeHeader);

  return rows
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) => {
      const record: Record<string, string> = {};

      normalizedHeaders.forEach((header, index) => {
        record[header] = String(row[index] ?? "").trim();
      });

      return record as Partial<ContentImportInput>;
    });
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const next = csv[index + 1];

    if (character === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }

    if (character === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += character;
  }

  row.push(current);
  rows.push(row);

  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

function normalizeJsonRecords(value: unknown) {
  if (Array.isArray(value)) {
    return value as Partial<ContentImportInput>[];
  }

  if (
    value &&
    typeof value === "object" &&
    "records" in value &&
    Array.isArray((value as { records: unknown }).records)
  ) {
    return (value as { records: Partial<ContentImportInput>[] }).records;
  }

  if (value && typeof value === "object") {
    return [value as Partial<ContentImportInput>];
  }

  throw new Error("JSON upload must be an object, an array, or { records: [...] }.");
}

export async function parseBulkContentFile(file: File) {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".json")) {
    return normalizeJsonRecords(JSON.parse(buffer.toString("utf8")));
  }

  if (name.endsWith(".csv")) {
    const rows = parseCsvRows(buffer.toString("utf8"));
    const [headers, ...body] = rows;

    if (!headers) {
      return [];
    }

    return mapRows(headers, body);
  }

  if (name.endsWith(".xlsx")) {
    const rows = (await readSheet(buffer)) as unknown[][];
    const [headers, ...body] = rows;

    if (!headers) {
      return [];
    }

    return mapRows(headers, body);
  }

  throw new Error("Upload a JSON, CSV, or XLSX file.");
}
