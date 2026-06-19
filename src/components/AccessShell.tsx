import Link from "next/link";
import { ReactNode } from "react";

import { LogoutButton } from "@/components/LogoutButton";
import { RoleBadges } from "@/components/RoleBadges";
import { type PublicUser } from "@/lib/models/user";

export function AccessShell({
  user,
  title,
  eyebrow,
  children,
}: {
  user: PublicUser;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-svh bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-sm font-semibold text-emerald-800">
              Igbo Dataset Studio
            </Link>
            <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:items-end">
            <RoleBadges roles={user.roles} />
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 sm:text-sm sm:tracking-[0.18em]">
            {eyebrow}
          </p>
          <h1 className="break-words text-2xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-3xl">
            {title}
          </h1>
        </div>
        {children}
      </section>
    </main>
  );
}
