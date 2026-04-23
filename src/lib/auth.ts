export const AUTH_COOKIE_NAME = "nmu-has-session";
export const AUTH_ACCESS_TOKEN_COOKIE_NAME = "nmu-access-token";
export const LOCALE_COOKIE_NAME = "nmu-locale";
export const THEME_COOKIE_NAME = "nmu-theme";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 55;

export function getSafeRedirectTarget(
  value: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padding)}`;

  if (typeof atob === "function") {
    return atob(padded);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }

  return null;
}

function getAccessTokenMaxAge(accessToken: string) {
  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return DEFAULT_ACCESS_TOKEN_MAX_AGE;

    const decoded = decodeBase64Url(payload);
    if (!decoded) return DEFAULT_ACCESS_TOKEN_MAX_AGE;

    const parsed = JSON.parse(decoded) as { exp?: number };
    if (typeof parsed.exp !== "number") return DEFAULT_ACCESS_TOKEN_MAX_AGE;

    const maxAge = parsed.exp - Math.floor(Date.now() / 1000) - 30;
    return Math.max(60, Math.min(maxAge, THIRTY_DAYS_IN_SECONDS));
  } catch {
    return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  }
}

export function syncAuthSessionCookies(
  session: { access_token?: string | null } | null | undefined
) {
  const accessToken = session?.access_token?.trim();

  if (!accessToken) {
    clearCookie(AUTH_COOKIE_NAME);
    clearCookie(AUTH_ACCESS_TOKEN_COOKIE_NAME);
    return;
  }

  const maxAge = getAccessTokenMaxAge(accessToken);
  writeCookie(AUTH_COOKIE_NAME, "1", maxAge);
  writeCookie(AUTH_ACCESS_TOKEN_COOKIE_NAME, accessToken, maxAge);
}

export function syncLocaleCookie(locale: "tr" | "en") {
  writeCookie(LOCALE_COOKIE_NAME, locale, ONE_YEAR_IN_SECONDS);
}

export function syncThemeCookie(theme: "dark" | "light") {
  writeCookie(THEME_COOKIE_NAME, theme, ONE_YEAR_IN_SECONDS);
}
