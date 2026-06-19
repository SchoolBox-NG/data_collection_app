import Link from "next/link";

import { AccessShell } from "@/components/AccessShell";
import { requireUser } from "@/lib/auth/guards";
import {
  hasRole,
  ROLE_DASHBOARD_LINKS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const availableLinks = ROLE_DASHBOARD_LINKS.filter((link) =>
    hasRole(user.roles, link.roles),
  );

  return (
    <AccessShell user={user} eyebrow="Dashboard" title={`Welcome, ${user.name}`}>
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {availableLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md sm:p-5"
            >
              <h2 className="text-lg font-semibold text-slate-950">{link.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {link.description}
              </p>
            </Link>
          ))}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-950">Your access</h2>
          <div className="mt-5 grid gap-4">
            {user.roles.map((role) => (
              <div key={role} className="border-b border-slate-100 pb-4 last:border-0">
                <p className="font-semibold text-slate-900">{ROLE_LABELS[role]}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AccessShell>
  );
}
