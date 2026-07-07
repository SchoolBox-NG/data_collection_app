import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import { updateReviewSourceText } from "@/lib/models/contentRecord";

export const runtime = "nodejs";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(["admin"]);

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        source_text_for_model?: unknown;
      }
    | null;

  try {
    const result = await updateReviewSourceText({
      id,
      source_text_for_model: readString(body?.source_text_for_model),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save source text.",
      },
      { status: 400 },
    );
  }
}
