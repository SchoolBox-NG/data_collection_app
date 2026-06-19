import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import { previewContentRecord } from "@/lib/content/prepareContent";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { response } = await requireApiRole(["content_admin"]);

  if (response) {
    return response;
  }

  const body = (await request.json().catch(() => null)) as
    | { record?: Record<string, unknown>; mathItems?: never }
    | null;

  if (!body?.record) {
    return NextResponse.json({ error: "Content record is required." }, { status: 400 });
  }

  try {
    return NextResponse.json({ preview: previewContentRecord(body.record) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not preview record." },
      { status: 400 },
    );
  }
}
