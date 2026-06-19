import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { hasRole, type Role } from "@/lib/auth/roles";

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: readonly Role[]) {
  const user = await requireUser();

  if (!hasRole(user.roles, roles)) {
    redirect("/unauthorized");
  }

  return user;
}
