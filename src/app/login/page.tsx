import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getCurrentSession } from "@/lib/auth/session";

function sanitizeNextPath(nextPath?: string) {
  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//") ||
    nextPath === "/login" ||
    nextPath === "/register"
  ) {
    return "/dashboard";
  }

  return nextPath;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-svh gap-8 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 sm:py-12 lg:grid-cols-[1fr_440px]">
      <section className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-6 lg:py-16">
        <div className="grid gap-4 sm:gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 sm:text-sm sm:tracking-[0.18em]">
            Igbo Dataset Studio
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
            Sign in to manage translation, audio review, and dataset access.
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            This first slice protects the workflow with MongoDB users, signed
            sessions, and role-based access.
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-950">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600">
            Use the admin email to get full access after registration.
          </p>
          <div className="mt-6">
            <AuthForm mode="login" nextPath={sanitizeNextPath(next)} />
          </div>
        </div>
      </section>
    </main>
  );
}
