import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl flex-col justify-center gap-7 sm:min-h-[calc(100svh-6rem)] sm:gap-8">
        <div className="grid max-w-3xl gap-4 sm:gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 sm:text-sm sm:tracking-[0.18em]">
            AI Science Tutor Project
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
            Collect and review English to Igbo learning content.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Sign in to upload English lessons, translate them into Igbo, record
            clear audio, and check that everything is ready to use.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 w-full items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-800 transition hover:bg-white sm:w-auto"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
