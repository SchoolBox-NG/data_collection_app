import { NextRequest, NextResponse } from "next/server";

import {
  hasRole,
  requiredRolesForPath,
} from "@/lib/auth/roles";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session-token";

const AUTH_PAGES = new Set(["/login", "/register"]);
const AUTH_ONLY_PAGES = ["/dashboard"];

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function isAuthOnlyPath(pathname: string) {
  return AUTH_ONLY_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectToLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const requiredRoles = requiredRolesForPath(pathname);
  const requiresAuth = isAuthOnlyPath(pathname) || Boolean(requiredRoles);
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (session && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (!session) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    return redirectToLogin(request);
  }

  if (requiredRoles && !hasRole(session.roles, requiredRoles)) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: "You do not have access." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
