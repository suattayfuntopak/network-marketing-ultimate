'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { translations, type Locale } from '@/lib/i18n'
import { syncLocaleCookie } from '@/lib/auth'

type Translations = typeof translations.en

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: translations.en as Translations,
})

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    const saved = localStorage.getItem('nmu-locale') as Locale | null
    if ((saved === 'tr' || saved === 'en') && saved !== locale) {
      setLocaleState(saved)
    }
  // Align client preference after hydration without causing a mismatched first render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  useEffect(() => {
    localStorage.setItem('nmu-locale', locale)
    document.documentElement.lang = locale
    syncLocaleCookie(locale)
  }, [locale])

  const t = translations[locale] as Translations

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
