import { MongoServerError } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { createUser } from "@/lib/models/user";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; name?: string; password?: string }
    | null;

  const email = body?.email?.trim() ?? "";
  const name = body?.name?.trim() ?? "";
  const password = body?.password ?? "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (name.length < 2) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({ email, name, password });
    const response = NextResponse.json({ user });
    await setSessionCookie(response, user);

    return response;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Could not create account. Check your MongoDB connection." },
      { status: 500 },
    );
  }
}
