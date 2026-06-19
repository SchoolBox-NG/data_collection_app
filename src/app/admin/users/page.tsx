import { AccessShell } from "@/components/AccessShell";
import { RoleBadges } from "@/components/RoleBadges";
import { requireRole } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/auth/roles";
import { listUsers } from "@/lib/models/user";

import { UserRolesForm } from "./UserRolesForm";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireRole(["admin"]);
  const users = await listUsers();

  return (
    <AccessShell user={user} eyebrow="Admin" title="Users and roles">
      <section className="grid gap-4">
        {users.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">No users have registered yet.</p>
          </div>
        ) : (
          users.map((targetUser) => (
            <article
              key={targetUser.id}
              className="grid min-w-0 gap-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_2fr]"
            >
              <div className="min-w-0">
                <h2 className="break-words text-lg font-semibold text-slate-950">
                  {targetUser.name}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-600">
                  {targetUser.email}
                </p>
                <div className="mt-4">
                  <RoleBadges roles={targetUser.roles} />
                </div>
              </div>
              <UserRolesForm
                userId={targetUser.id}
                email={targetUser.email}
                roles={targetUser.roles}
                locked={isAdminEmail(targetUser.email)}
              />
            </article>
          ))
        )}
      </section>
    </AccessShell>
  );
}
