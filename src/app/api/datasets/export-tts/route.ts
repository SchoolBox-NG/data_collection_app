import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import {
  getTtsExportRows,
  parseDatasetExportFilters,
  ttsRowsToCsv,
  ttsRowsToJson,
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
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";
  const rows = await getTtsExportRows(filters);
  const today = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return downloadResponse({
      body: ttsRowsToJson(rows),
      filename: `tts-dataset-${today}.json`,
      contentType: "application/json; charset=utf-8",
    });
  }

  return downloadResponse({
    body: ttsRowsToCsv(rows),
    filename: `metadata-${today}.csv`,
    contentType: "text/csv; charset=utf-8",
  });
}
