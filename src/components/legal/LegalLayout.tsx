'use client'

import Link from 'next/link'
import { ArrowLeft, Moon, ScrollText, ShieldCheck, Sun } from 'lucide-react'

import { useLanguage } from '@/components/common/LanguageProvider'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useTheme } from '@/components/common/ThemeProvider'
import { legalContent, type LegalSlug } from '@/lib/legalContent'

const RELATED_ORDER: LegalSlug[] = ['privacy', 'terms', 'kvkk']

export function LegalLayout({ slug }: { slug: LegalSlug }) {
  const { t, locale } = useLanguage()
  const { theme, setTheme } = useTheme()
  const doc = legalContent[locale][slug]
  const labels = t.landing.legalPage
  const formattedDate = formatLastUpdated(doc.lastUpdated, locale)
  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen bg-obsidian text-text-primary">
      <header className="border-b border-border-subtle bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
          >
            <ArrowLeft size={16} />
            {labels.backToHome}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface/40 text-text-secondary transition hover:border-primary/40 hover:text-primary"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-tertiary">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            {slug === 'privacy' ? <ShieldCheck size={14} /> : <ScrollText size={14} />}
          </span>
          <span>{labels.related[slug]}</span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-text-tertiary">
          {doc.lastUpdatedLabel}: {formattedDate}
        </p>
        <p className="mt-6 text-base leading-relaxed text-text-secondary">{doc.intro}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold tracking-tight text-text-primary">{section.heading}</h2>
              <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-text-secondary">
                {section.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-2xl border border-border-subtle bg-surface/40 px-4 py-3 text-xs text-text-tertiary">
          {labels.disclaimer}
        </p>

        <div className="mt-10 border-t border-border-subtle pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-text-tertiary">{labels.relatedTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RELATED_ORDER.filter((entry) => entry !== slug).map((entry) => (
              <Link
                key={entry}
                href={`/legal/${entry}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-primary/40 hover:text-primary"
              >
                {labels.related[entry]}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function formatLastUpdated(value: string, locale: 'tr' | 'en'): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return value
  }
}
