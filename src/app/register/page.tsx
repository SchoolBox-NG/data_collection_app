import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getCurrentSession } from "@/lib/auth/session";

export default async function RegisterPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-svh gap-8 bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 sm:py-12 lg:grid-cols-[1fr_440px]">
      <section className="mx-auto flex w-full max-w-3xl flex-col justify-center gap-6 lg:py-16">
        <div className="grid gap-4 sm:gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 sm:text-sm sm:tracking-[0.18em]">
            Account setup
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
            Create an account for the education translation workflow.
          </h1>
          <p className="max-w-xl break-words text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            New users start as Igbo Teachers.
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-950">Create account</h2>
          
          <div className="mt-6">
            <AuthForm mode="register" />
          </div>
        </div>
      </section>
    </main>
  );
}
