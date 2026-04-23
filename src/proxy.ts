import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSafeRedirectTarget } from "@/lib/auth";

const AUTH_ROUTES = new Set(["/auth/login", "/auth/signup"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionMarker = request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token"));
  const hasSession = hasSessionMarker && hasSupabaseAuthCookie;

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession ? "/dashboard" : "/auth/login", request.url)
    );
  }

  if (AUTH_ROUTES.has(pathname)) {
    if (hasSession) {
      const nextTarget = getSafeRedirectTarget(
        request.nextUrl.searchParams.get("next")
      );
      return NextResponse.redirect(new URL(nextTarget, request.url));
    }

    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    const nextTarget = `${pathname}${search}`;

    if (nextTarget !== "/") {
      loginUrl.searchParams.set("next", nextTarget);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
