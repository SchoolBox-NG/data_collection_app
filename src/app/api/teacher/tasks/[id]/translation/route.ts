import { NextRequest, NextResponse } from "next/server";

import { requireApiRole } from "@/lib/auth/apiGuards";
import { submitTeacherTranslation } from "@/lib/models/contentRecord";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(["igbo_teacher"]);

  if (auth.response) {
    return auth.response;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        target_text_for_model?: unknown;
        teacher_notes?: unknown;
      }
    | null;

  try {
    const result = await submitTeacherTranslation({
      id,
      user: auth.user,
      target_text_for_model:
        typeof body?.target_text_for_model === "string"
          ? body.target_text_for_model
          : "",
      teacher_notes:
        typeof body?.teacher_notes === "string" ? body.teacher_notes : "",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not submit translation.",
      },
      { status: 400 },
    );
  }
}
