import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import {
  reviewTranslation,
  type TranslationReviewDecision,
} from "@/lib/models/contentRecord";

export const runtime = "nodejs";

const decisions = new Set<TranslationReviewDecision>([
  "approved",
  "rejected",
  "needs_revision",
]);

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(["reviewer"]);

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        decision?: unknown;
        reason?: unknown;
        comments?: unknown;
      }
    | null;
  const decision = readString(body?.decision) as TranslationReviewDecision;

  if (!decisions.has(decision)) {
    return NextResponse.json(
      { error: "Choose a translation review decision." },
      { status: 400 },
    );
  }

  try {
    const result = await reviewTranslation({
      id,
      user: auth.user,
      decision,
      reason: readString(body?.reason),
      comments: readString(body?.comments),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save translation review.",
      },
      { status: 400 },
    );
  }
}
