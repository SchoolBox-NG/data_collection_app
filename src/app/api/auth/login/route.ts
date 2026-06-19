import { NextRequest, NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { authenticateUser } from "@/lib/models/user";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ user });
    await setSessionCookie(response, user);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not sign in. Check your MongoDB connection." },
      { status: 500 },
    );
  }
}
