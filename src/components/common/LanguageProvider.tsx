'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { translations, type Locale } from '@/lib/i18n'

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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nmu-locale') as Locale | null
      if (saved === 'tr' || saved === 'en') return saved
    }
    return 'tr'
  })

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nmu-locale', l)
      document.documentElement.lang = l
    }
  }, [])

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
