'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { getSafeRedirectTarget, syncAuthSessionCookies } from '@/lib/auth'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const h = useHeadingCase()
  const a = t.auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function waitForSession(maxAttempts = 12, delayMs = 100) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        return session
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const session = await waitForSession()
    if (!session) {
      setError(locale === 'tr' ? 'Oturum hazırlanamadı, lütfen tekrar dene.' : 'Session could not be initialized. Please try again.')
      setLoading(false)
      return
    }

    syncAuthSessionCookies(session)
    router.replace(getSafeRedirectTarget(searchParams.get('next')))
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-4 py-8 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[20px] overflow-hidden border border-border-subtle bg-surface/50 flex items-center justify-center mx-auto mb-4 shadow-[0_0_36px_rgba(34,211,238,0.22)]">
            <Image
              src="/favicon.png"
              alt="Network Marketing Ultimate logo"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Network Marketing Ultimate</h1>
          <p className="text-text-tertiary text-sm mt-1 max-w-[280px] sm:max-w-none mx-auto">{a.tagline}</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <h2 className="text-xl font-semibold text-text-primary mb-1">{h(a.login)}</h2>
          <p className="text-text-tertiary text-sm mb-6">
            {locale === 'tr'
              ? 'Hesabına giriş yap ve işini yönet.'
              : 'Sign in to your workspace and keep the business moving.'}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{a.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={a.emailPlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{a.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={a.passwordPlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            >
              {loading ? a.signingIn : (
                <>{a.signInBtn} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-tertiary mt-6">
            {a.noAccount}{' '}
            <Link href="/auth/signup" className="text-primary hover:text-primary-dim font-medium transition-colors">
              {a.createAccount}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
