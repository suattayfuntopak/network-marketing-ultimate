import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSafeRedirectTarget } from "@/lib/auth";

const AUTH_ROUTES = new Set(["/auth/login", "/auth/signup"]);
const PUBLIC_ROUTES = new Set(["/", "/auth/login", "/auth/signup"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.get(AUTH_COOKIE_NAME)?.value === "1";

  if (AUTH_ROUTES.has(pathname)) {
    if (hasSession) {
      const nextTarget = getSafeRedirectTarget(
        request.nextUrl.searchParams.get("next")
      );
      return NextResponse.redirect(new URL(nextTarget, request.url));
    }

    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.has(pathname)) {
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
