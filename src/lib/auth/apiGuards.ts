import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { hasRole, type Role } from "@/lib/auth/roles";

export async function requireApiRole(roles: readonly Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      ),
    };
  }

  if (!hasRole(user.roles, roles)) {
    return {
      user: null,
      response: NextResponse.json({ error: "You do not have access." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
