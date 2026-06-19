import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/guards";
import { updateUserRoles } from "@/lib/models/user";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireRole(["admin"]);

  const body = (await request.json().catch(() => null)) as
    | { roles?: string[] }
    | null;
  const { id } = await context.params;

  if (!Array.isArray(body?.roles) || body.roles.length === 0) {
    return NextResponse.json(
      { error: "Choose at least one role." },
      { status: 400 },
    );
  }

  const user = await updateUserRoles(id, body.roles);

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}
