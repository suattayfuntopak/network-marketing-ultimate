'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/components/common/LanguageProvider'
import { getSafeRedirectTarget, syncAuthSessionCookie } from '@/lib/auth'
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const a = t.auth
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // E-posta onayı gerekmeyebilir — önce session kontrol et
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      syncAuthSessionCookie(true)
      router.replace(getSafeRedirectTarget(searchParams.get('next')))
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-success/15 border border-success/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            {locale === 'tr' ? 'Hesabın oluşturuldu!' : 'Your account is ready!'}
          </h2>
          <p className="text-text-tertiary text-sm mb-6">
            {locale === 'tr'
              ? 'E-posta adresine bir onay bağlantısı gönderdik. Onayladıktan sonra giriş yapabilirsin.'
              : 'We sent a verification link to your email. Once you confirm it, you can sign in.'}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface border border-border text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
          >
            {locale === 'tr' ? 'Giriş sayfasına git' : 'Go to sign in'}
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,212,255,0.25)]">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Network Marketing Ultimate</h1>
          <p className="text-text-tertiary text-sm mt-1">{a.tagline}</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <h2 className="text-xl font-semibold text-text-primary mb-1">{a.signup}</h2>
          <p className="text-text-tertiary text-sm mb-6">
            {locale === 'tr'
              ? 'Ücretsiz hesabını oluştur ve başla.'
              : 'Create your account and get started in minutes.'}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{a.fullName}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  placeholder={locale === 'tr' ? 'Adın Soyadın' : 'Your full name'}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

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
                  minLength={6}
                  placeholder={a.passwordPlaceholder}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">
                {locale === 'tr' ? 'En az 6 karakter' : 'At least 6 characters'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            >
              {loading ? a.creatingAccount : (
                <>{a.signUpBtn} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-tertiary mt-6">
            {a.hasAccount}{' '}
            <Link href="/auth/login" className="text-primary hover:text-primary-dim font-medium transition-colors">
              {a.signIn}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
