import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-slate-50 px-4 py-8 text-slate-950 sm:px-6">
      <section className="max-w-lg rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 sm:text-sm sm:tracking-[0.18em]">
          Access denied
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-normal sm:text-3xl">
          This page needs a different role.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Ask an admin to update your role if you should be able to access this
          area.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:w-auto"
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
