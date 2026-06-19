"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    setLoading(false);

    if (!response.ok) {
      setError(data?.error ?? "Something went wrong.");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {isRegister ? (
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Name
          <input
            name="name"
            autoComplete="name"
            required
            className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
            placeholder="Your name"
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          placeholder="you@example.com"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={8}
          className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-md bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
      </button>

      <p className="text-sm text-slate-600">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          replace
          href={isRegister ? "/login" : "/register"}
          className="font-semibold text-emerald-800 hover:text-emerald-950"
        >
          {isRegister ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
