'use client'

import { useLanguage } from './LanguageProvider'
import type { Locale } from '@/lib/i18n'

const languages: { locale: Locale; flag: string; label: string }[] = [
  { locale: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { locale: 'en', flag: '🇺🇸', label: 'English' },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface/60 border border-border-subtle">
      {languages.map(lang => (
        <button
          key={lang.locale}
          onClick={() => setLocale(lang.locale)}
          title={lang.label}
          className={`w-8 h-7 rounded-lg flex items-center justify-center text-base transition-all ${
            locale === lang.locale
              ? 'bg-primary/15 ring-1 ring-primary/30 scale-105'
              : 'opacity-50 hover:opacity-80 hover:bg-surface-hover'
          }`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  )
}
