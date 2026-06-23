import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import {
  getTranslationExportRows,
  parseDatasetExportFilters,
  translationRowsToCsv,
  translationRowsToJsonl,
} from "@/lib/exports/datasetExport";

export const runtime = "nodejs";

function downloadResponse(input: {
  body: string;
  filename: string;
  contentType: string;
}) {
  return new Response(input.body, {
    headers: {
      "Content-Type": input.contentType,
      "Content-Disposition": `attachment; filename="${input.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(["dataset_admin"]);

  if (response) {
    return response;
  }

  const filters = parseDatasetExportFilters(request.nextUrl.searchParams);
  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "jsonl";
  const rows = await getTranslationExportRows(filters);
  const today = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return downloadResponse({
      body: translationRowsToCsv(rows),
      filename: `translation-dataset-${today}.csv`,
      contentType: "text/csv; charset=utf-8",
    });
  }

  return downloadResponse({
    body: translationRowsToJsonl(rows),
    filename: `translation-dataset-${today}.jsonl`,
    contentType: "application/x-ndjson; charset=utf-8",
  });
}
