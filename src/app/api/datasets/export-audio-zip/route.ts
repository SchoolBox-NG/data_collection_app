import { NextRequest } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import {
  createAudioDatasetZip,
  parseDatasetExportFilters,
} from "@/lib/exports/datasetExport";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(["dataset_admin"]);

  if (response) {
    return response;
  }

  const filters = parseDatasetExportFilters(request.nextUrl.searchParams);
  const zip = await createAudioDatasetZip(filters);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="tts-audio-${today}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
