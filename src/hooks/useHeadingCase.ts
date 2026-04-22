'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/components/common/LanguageProvider'
import { toHeadingCase } from '@/lib/headingCase'

/** Locale-aware title case for UI headings (see `toHeadingCase`). */
export function useHeadingCase() {
  const { locale } = useLanguage()
  return useMemo(
    () => (text: string) => toHeadingCase(text, locale === 'tr' ? 'tr' : 'en'),
    [locale],
  )
}
