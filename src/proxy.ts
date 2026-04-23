import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_ACCESS_TOKEN_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  getSafeRedirectTarget,
} from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/serverSupabase";

const AUTH_ROUTES = new Set(["/auth/login", "/auth/signup"]);
const PUBLIC_ROUTES = new Set(["/", "/auth/login", "/auth/signup"]);

async function hasValidSession(accessToken: string | undefined) {
  if (!accessToken) {
    return false;
  }

  const client = createServerSupabaseClient(accessToken);
  if (!client) {
    return false;
  }

  const { data, error } = await client.auth.getUser(accessToken);
  return Boolean(data.user && !error);
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAME);
  response.cookies.delete(AUTH_ACCESS_TOKEN_COOKIE_NAME);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(AUTH_ACCESS_TOKEN_COOKIE_NAME)?.value;
  const hasSession = await hasValidSession(accessToken);

  if (AUTH_ROUTES.has(pathname)) {
    if (hasSession) {
      const nextTarget = getSafeRedirectTarget(
        request.nextUrl.searchParams.get("next")
      );
      return NextResponse.redirect(new URL(nextTarget, request.url));
    }

    if (accessToken) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.has(pathname)) {
    if (accessToken && !hasSession) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }

    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    const nextTarget = `${pathname}${search}`;

    if (nextTarget !== "/") {
      loginUrl.searchParams.set("next", nextTarget);
    }

    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
