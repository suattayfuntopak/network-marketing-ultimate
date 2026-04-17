'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { syncThemeCookie } from '@/lib/auth'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode
  initialTheme: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  useEffect(() => {
    const saved = localStorage.getItem('nmu-theme') as Theme | null
    if ((saved === 'light' || saved === 'dark') && saved !== theme) {
      setThemeState(saved)
    }
  // Align the hydrated client state with persisted preference after the initial paint.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tema değişince uygula
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nmu-theme', theme)
    syncThemeCookie(theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
