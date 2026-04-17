export const AUTH_COOKIE_NAME = "nmu-has-session";
export const LOCALE_COOKIE_NAME = "nmu-locale";
export const THEME_COOKIE_NAME = "nmu-theme";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

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

export function syncAuthSessionCookie(hasSession: boolean) {
  if (hasSession) {
    writeCookie(AUTH_COOKIE_NAME, "1", THIRTY_DAYS_IN_SECONDS);
    return;
  }

  clearCookie(AUTH_COOKIE_NAME);
}

export function syncLocaleCookie(locale: "tr" | "en") {
  writeCookie(LOCALE_COOKIE_NAME, locale, ONE_YEAR_IN_SECONDS);
}

export function syncThemeCookie(theme: "dark" | "light") {
  writeCookie(THEME_COOKIE_NAME, theme, ONE_YEAR_IN_SECONDS);
}
