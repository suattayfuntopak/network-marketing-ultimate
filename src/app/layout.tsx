import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { QueryProvider } from "@/components/common/QueryProvider";
import {
  LOCALE_COOKIE_NAME,
  THEME_COOKIE_NAME,
} from "@/lib/auth";
import type { Locale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Network Marketing Ultimate",
  description: "Tüm network marketing işinizi tek akıllı sistemden yönetin.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = (cookieStore.get(LOCALE_COOKIE_NAME)?.value === "en"
    ? "en"
    : "tr") as Locale;
  const initialTheme =
    cookieStore.get(THEME_COOKIE_NAME)?.value === "light" ? "light" : "dark";

  return (
    <html
      lang={initialLocale}
      data-theme={initialTheme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-obsidian text-text-primary">
        <QueryProvider>
          <ThemeProvider initialTheme={initialTheme}>
            <LanguageProvider initialLocale={initialLocale}>
              <AppLayout>{children}</AppLayout>
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
