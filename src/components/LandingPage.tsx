'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import {
  Bot,
  Brain,
  Calendar,
  ChevronDown,
  GraduationCap,
  Heart,
  KanbanSquare,
  LineChart,
  ListChecks,
  Mail,
  Moon,
  MoveRight,
  Package,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { useLanguage } from '@/components/common/LanguageProvider'
import { useTheme } from '@/components/common/ThemeProvider'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { submitWaitlistEmail } from '@/lib/queries'

interface LandingPageProps {
  onNavigateToRegister: () => void
  onNavigateToLogin: () => void
}

interface ModuleEntry {
  key: keyof typeof MODULE_ICON
  href: string
}

const MODULE_ICON: Record<string, LucideIcon> = {
  contacts: Users,
  pipeline: KanbanSquare,
  customers: Wallet,
  products: Package,
  tasks: ListChecks,
  calendar: Calendar,
  events: Sparkles,
  academy: GraduationCap,
  scripts: ScrollText,
  ai: Bot,
  motivation: Heart,
  analytics: LineChart,
}

const MODULE_GRID: ModuleEntry[] = [
  { key: 'contacts', href: '/contacts' },
  { key: 'pipeline', href: '/pipeline' },
  { key: 'customers', href: '/customers' },
  { key: 'products', href: '/products' },
  { key: 'tasks', href: '/tasks' },
  { key: 'calendar', href: '/calendar' },
  { key: 'events', href: '/events' },
  { key: 'academy', href: '/academy' },
  { key: 'scripts', href: '/scripts' },
  { key: 'ai', href: '/ai' },
  { key: 'motivation', href: '/motivation' },
  { key: 'analytics', href: '/analytics' },
]

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const

export default function LandingPage({ onNavigateToRegister, onNavigateToLogin }: LandingPageProps) {
  const { t, locale } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 16)
  })

  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen bg-obsidian text-text-primary antialiased overflow-x-clip">
      <Navbar
        scrolled={scrolled}
        isDark={isDark}
        onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
        onLogin={onNavigateToLogin}
        onRegister={onNavigateToRegister}
        labels={t.landing.nav}
      />

      <main>
        <Hero
          labels={t.landing.hero}
          mockGreeting={t.landing.hero.mockGreeting}
          mockKpis={[
            { label: t.landing.hero.mockKpiContacts, value: '142', accent: 'text-primary' },
            { label: t.landing.hero.mockKpiPipeline, value: '36', accent: 'text-secondary' },
            { label: t.landing.hero.mockKpiRevenue, value: '₺18.4k', accent: 'text-success' },
          ]}
          mockAi={{ title: t.landing.hero.mockAiTitle, body: t.landing.hero.mockAiBody }}
          mockMotivation={{ title: t.landing.hero.mockMotivationTitle, body: t.landing.hero.mockMotivationBody }}
          onPrimary={onNavigateToRegister}
          onSecondary={() => scrollToId('modules')}
        />

        <TrustStrip
          badges={[
            t.landing.trust.badge1,
            t.landing.trust.badge2,
            t.landing.trust.badge3,
            t.landing.trust.badge4,
          ]}
        />

        <section id="modules" className="relative px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <SectionHeader title={t.landing.modules.title} subtitle={t.landing.modules.sub} />
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_GRID.map((module, index) => {
                const Icon = MODULE_ICON[module.key]
                const item = (t.landing.modules.items as Record<string, { title: string; desc: string }>)[module.key]
                if (!item) return null
                return (
                  <motion.a
                    key={module.key}
                    href={module.href}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.32) }}
                    whileHover={{ y: -4 }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-[0_20px_60px_rgba(0,212,255,0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon size={20} />
                      </span>
                      <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.desc}</p>
                  </motion.a>
                )
              })}
            </div>
          </div>
        </section>

        <DeepDiveStrip
          eyebrow={t.landing.deepDive.ai.eyebrow}
          title={t.landing.deepDive.ai.title}
          body={t.landing.deepDive.ai.body}
          highlights={[
            t.landing.deepDive.ai.highlight1,
            t.landing.deepDive.ai.highlight2,
            t.landing.deepDive.ai.highlight3,
          ]}
          mock={<AiStudioMock body={t.landing.hero.mockAiBody} />}
          orientation="left"
        />

        <DeepDiveStrip
          eyebrow={t.landing.deepDive.pipeline.eyebrow}
          title={t.landing.deepDive.pipeline.title}
          body={t.landing.deepDive.pipeline.body}
          highlights={[
            t.landing.deepDive.pipeline.highlight1,
            t.landing.deepDive.pipeline.highlight2,
            t.landing.deepDive.pipeline.highlight3,
          ]}
          mock={<PipelineMock />}
          orientation="right"
        />

        <DeepDiveStrip
          eyebrow={t.landing.deepDive.motivation.eyebrow}
          title={t.landing.deepDive.motivation.title}
          body={t.landing.deepDive.motivation.body}
          highlights={[
            t.landing.deepDive.motivation.highlight1,
            t.landing.deepDive.motivation.highlight2,
            t.landing.deepDive.motivation.highlight3,
          ]}
          mock={<MotivationMock title={t.landing.hero.mockMotivationTitle} body={t.landing.hero.mockMotivationBody} />}
          orientation="left"
        />

        <section id="how" className="relative px-4 py-24 sm:px-6 lg:py-32 border-t border-border-subtle">
          <div className="mx-auto max-w-5xl">
            <SectionHeader title={t.landing.how.title} centered />
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {(['one', 'two', 'three'] as const).map((step, index) => {
                const data = t.landing.how.steps[step]
                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="relative rounded-2xl border border-border bg-card p-6"
                  >
                    <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent opacity-70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{data.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{data.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="relative px-4 py-24 sm:px-6 lg:py-32 border-t border-border-subtle">
          <div className="mx-auto max-w-5xl">
            <SectionHeader title={t.landing.testimonials.title} subtitle={t.landing.testimonials.sub} centered />
            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="rounded-2xl border border-dashed border-border-strong bg-card/40 p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-surface ring-1 ring-border" />
                    <div className="flex-1">
                      <div className="h-3 w-24 rounded bg-surface" />
                      <div className="mt-1 h-2.5 w-16 rounded bg-surface/70" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm italic text-text-tertiary">&ldquo; {t.landing.testimonials.slot} &rdquo;</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="relative px-4 py-24 sm:px-6 lg:py-32 border-t border-border-subtle">
          <div className="mx-auto max-w-3xl">
            <SectionHeader title={t.landing.faq.title} centered />
            <div className="mt-10 divide-y divide-border-subtle rounded-2xl border border-border bg-card">
              {FAQ_KEYS.map((key, index) => {
                const item = t.landing.faq.items[key]
                const isOpen = openFaq === index
                return (
                  <button
                    key={key}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="block w-full px-5 py-5 text-left transition hover:bg-surface/30"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-medium tracking-tight">{item.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-text-tertiary transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 text-sm leading-relaxed text-text-secondary"
                        >
                          {item.a}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <PricingSection
          labels={t.landing.pricing}
          locale={locale}
          onPrimary={onNavigateToRegister}
        />

        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:py-32 border-t border-border-subtle">
          <div className="absolute inset-0 -z-10 gradient-mesh opacity-40" />
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.landing.cta.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">{t.landing.cta.sub}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryButton onClick={onNavigateToRegister} size="lg">
                {t.landing.cta.primary}
                <MoveRight size={16} />
              </PrimaryButton>
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="rounded-xl border border-border bg-card/50 px-6 py-3 text-sm font-semibold text-text-primary transition hover:border-primary/50 hover:text-primary"
              >
                {t.landing.cta.secondary}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer footer={t.landing.footer} />
    </div>
  )
}

interface NavbarProps {
  scrolled: boolean
  isDark: boolean
  onToggleTheme: () => void
  onLogin: () => void
  onRegister: () => void
  labels: ReturnType<typeof useLanguage>['t']['landing']['nav']
}

function Navbar({ scrolled, isDark, onToggleTheme, onLogin, onRegister, labels }: NavbarProps) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-border-subtle bg-obsidian/85 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
            <Image src="/favicon.png" alt="NMU" width={36} height={36} className="h-full w-full object-cover" />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            Network Marketing{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Ultimate</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {[
            ['#modules', labels.modules],
            ['#how', labels.howItWorks],
            ['#faq', labels.faq],
            ['#pricing', labels.pricing],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-text-secondary transition hover:text-primary"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-card text-text-secondary transition hover:border-primary/40 hover:text-primary"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="hidden rounded-xl border border-border-subtle bg-card px-3.5 py-2 text-sm font-medium text-text-secondary transition hover:border-primary/40 hover:text-text-primary md:inline-flex"
          >
            {labels.login}
          </button>
          <PrimaryButton onClick={onRegister} size="sm">
            {labels.start}
          </PrimaryButton>
        </div>
      </div>
    </header>
  )
}

interface HeroProps {
  labels: ReturnType<typeof useLanguage>['t']['landing']['hero']
  mockGreeting: string
  mockKpis: { label: string; value: string; accent: string }[]
  mockAi: { title: string; body: string }
  mockMotivation: { title: string; body: string }
  onPrimary: () => void
  onSecondary: () => void
}

function Hero({ labels, mockGreeting, mockKpis, mockAi, mockMotivation, onPrimary, onSecondary }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 lg:pt-40 lg:pb-28">
      <div className="absolute inset-0 -z-10 gradient-mesh opacity-90" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr,1fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            <Sparkles size={12} /> {labels.badge}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {labels.title1}{' '}
            <span className="bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text text-transparent">
              {labels.title2}
            </span>{' '}
            {labels.title3}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg"
          >
            {labels.sub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <PrimaryButton onClick={onPrimary} size="lg">
              {labels.ctaPrimary}
              <MoveRight size={16} />
            </PrimaryButton>
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-xl border border-border bg-card/60 px-5 py-3 text-sm font-semibold text-text-primary transition hover:border-primary/40 hover:text-primary"
            >
              {labels.ctaSecondary}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent blur-2xl" />
          <div className="rounded-2xl border border-border bg-card/90 shadow-elevated">
            <div className="flex items-center gap-1.5 border-b border-border-subtle px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-3 text-[11px] text-text-tertiary">app.suattayfuntopak.com</span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary">{mockGreeting}</p>
                  <p className="mt-0.5 text-sm font-semibold tracking-tight">Suat Tayfun</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning">
                  <Sparkles size={12} /> 7 day streak
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {mockKpis.map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-border-subtle bg-surface/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{kpi.label}</p>
                    <p className={`mt-1 text-lg font-bold ${kpi.accent}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              <Sparkline className="mt-4" />
              <div className="mt-4 grid grid-cols-1 gap-2.5">
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/8 p-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Bot size={14} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-primary">{mockAi.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{mockAi.body}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl border border-secondary/25 bg-secondary/8 p-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                    <Heart size={14} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-secondary">{mockMotivation.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{mockMotivation.body}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Sparkline({ className }: { className?: string }) {
  const points = [12, 18, 14, 22, 20, 28, 26, 36, 32, 42]
  const max = Math.max(...points)
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100
      const y = 100 - (p / max) * 100
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <div className={`relative h-12 w-full overflow-hidden rounded-xl border border-border-subtle bg-surface/40 ${className ?? ''}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(0,212,255)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(0,212,255)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#spark)" />
        <path d={path} fill="none" stroke="rgb(0,212,255)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

function TrustStrip({ badges }: { badges: string[] }) {
  return (
    <div className="border-y border-border-subtle bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-sm font-medium text-text-secondary sm:px-6">
        {badges.map((badge, index) => (
          <span key={badge} className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary/70" />
            {badge}
            {index < badges.length - 1 ? <span className="hidden text-border-strong sm:inline">·</span> : null}
          </span>
        ))}
      </div>
    </div>
  )
}

interface DeepDiveProps {
  eyebrow: string
  title: string
  body: string
  highlights: string[]
  mock: ReactNode
  orientation: 'left' | 'right'
}

function DeepDiveStrip({ eyebrow, title, body, highlights, mock, orientation }: DeepDiveProps) {
  const reversed = orientation === 'right'
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:py-28 border-t border-border-subtle">
      <div className={`mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 ${reversed ? 'lg:[direction:rtl]' : ''}`}>
        <motion.div
          initial={{ opacity: 0, x: reversed ? 20 : -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="lg:[direction:ltr]"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            <Brain size={12} />
            {eyebrow}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">{body}</p>
          <ul className="mt-6 space-y-2.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-text-primary">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Sparkles size={12} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: reversed ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:[direction:ltr]"
        >
          {mock}
        </motion.div>
      </div>
    </section>
  )
}

function AiStudioMock({ body }: { body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-card">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Bot size={14} className="text-primary" /> AI Studio
        </div>
        <span className="text-[11px] text-text-tertiary">12 / 50 today</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-border-subtle bg-surface/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Audience</p>
          <p className="mt-1 text-sm font-medium">Hot prospect · WhatsApp</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/8 p-3">
          <p className="text-[11px] uppercase tracking-wider text-primary">Draft</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{body}</p>
        </div>
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary">
            Send <MoveRight size={12} />
          </span>
        </div>
      </div>
    </div>
  )
}

function PipelineMock() {
  const stages = [
    { name: 'Cold', color: 'bg-cold', count: 12 },
    { name: 'Warm', color: 'bg-warm', count: 8 },
    { name: 'Hot', color: 'bg-hot', count: 4 },
  ]
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <KanbanSquare size={14} className="text-primary" /> Pipeline
        </div>
        <span className="text-[11px] text-text-tertiary">15 stages</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stages.map((stage) => (
          <div key={stage.name} className="rounded-xl border border-border-subtle bg-surface/40 p-3">
            <p className="text-[11px] uppercase tracking-wider text-text-tertiary">{stage.name}</p>
            <p className="mt-1 text-2xl font-bold">{stage.count}</p>
            <div className={`mt-2 h-1.5 w-full rounded-full ${stage.color}/40`}>
              <div className={`h-full w-2/3 rounded-full ${stage.color}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border-subtle bg-surface/40 p-3">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Warmth · Ahmet K.</span>
          <span className="font-semibold text-primary">82</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-surface">
          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-primary via-secondary to-warning" />
        </div>
      </div>
    </div>
  )
}

function MotivationMock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Heart size={14} className="text-secondary" /> {title}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{body}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border-subtle bg-surface/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Streak</p>
          <p className="mt-1 text-2xl font-bold text-warning">7</p>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface/50 p-3">
          <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Sent today</p>
          <p className="mt-1 text-2xl font-bold text-primary">14</p>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary/15 px-3 py-1.5 text-xs font-semibold text-secondary">
        <Sparkles size={12} /> +120 XP
      </div>
    </div>
  )
}

type WaitlistFeedback =
  | { kind: 'idle' }
  | { kind: 'success' }
  | { kind: 'duplicate' }
  | { kind: 'invalid' }
  | { kind: 'error' }

function PricingSection({
  labels,
  locale,
  onPrimary,
}: {
  labels: ReturnType<typeof useLanguage>['t']['landing']['pricing']
  locale: 'tr' | 'en'
  onPrimary: () => void
}) {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<WaitlistFeedback>({ kind: 'idle' })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (!email.trim()) {
      setFeedback({ kind: 'invalid' })
      return
    }
    setSubmitting(true)
    setFeedback({ kind: 'idle' })
    try {
      const result = await submitWaitlistEmail({
        email,
        source: 'landing-pricing',
        locale,
      })
      if (result.status === 'ok') {
        setFeedback({ kind: 'success' })
        setEmail('')
      } else if (result.status === 'duplicate') {
        setFeedback({ kind: 'duplicate' })
        setEmail('')
      } else if (result.status === 'invalid') {
        setFeedback({ kind: 'invalid' })
      } else {
        setFeedback({ kind: 'error' })
      }
    } catch {
      setFeedback({ kind: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const feedbackMessage = (() => {
    switch (feedback.kind) {
      case 'success':
        return { text: labels.notifySuccess, tone: 'text-success' }
      case 'duplicate':
        return { text: labels.notifyDuplicate, tone: 'text-success' }
      case 'invalid':
        return { text: labels.notifyInvalid, tone: 'text-warning' }
      case 'error':
        return { text: labels.notifyError, tone: 'text-error' }
      default:
        return { text: labels.notifyHint, tone: 'text-text-tertiary' }
    }
  })()

  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:py-32 border-t border-border-subtle">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <Sparkles size={12} /> {labels.badge}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{labels.title}</h2>
          <p className="mt-3 text-base text-text-secondary">{labels.sub}</p>
        </div>

        <div className="mt-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-card to-surface/40 p-6 shadow-elevated sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">{labels.cardTitle}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight">{labels.cardPrice}</span>
                <span className="text-sm text-text-tertiary">{labels.cardPeriod}</span>
              </div>
              <ul className="mt-5 grid grid-cols-1 gap-2 text-sm text-text-secondary sm:grid-cols-2">
                {labels.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                      <Sparkles size={12} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <PrimaryButton onClick={onPrimary} size="lg">
                {labels.ctaPrimary}
                <MoveRight size={16} />
              </PrimaryButton>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
                noValidate
              >
                <label className="relative flex flex-1 items-center">
                  <Mail size={14} className="absolute left-3 text-text-tertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (feedback.kind !== 'idle') setFeedback({ kind: 'idle' })
                    }}
                    placeholder={labels.notifyPlaceholder}
                    disabled={submitting}
                    aria-invalid={feedback.kind === 'invalid' || feedback.kind === 'error'}
                    className="w-full rounded-xl border border-border-subtle bg-surface/60 py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-60"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? labels.ctaSubmitting : labels.ctaSecondary}
                </button>
              </form>
              <p className={`text-[11px] ${feedbackMessage.tone}`} aria-live="polite">
                {feedback.kind === 'success' || feedback.kind === 'duplicate' ? '✓ ' : ''}
                {feedbackMessage.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer({ footer }: { footer: ReturnType<typeof useLanguage>['t']['landing']['footer'] }) {
  return (
    <footer className="border-t border-border-subtle bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
              <Image src="/favicon.png" alt="NMU" width={32} height={32} className="h-full w-full object-cover" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Network Marketing{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Ultimate</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
            <a href={`mailto:${footer.contactLine}`} className="text-text-secondary hover:text-primary">
              {footer.contactLine}
            </a>
          </p>
        </div>

        <FooterColumn title={footer.product}>
          <FooterLink href="/dashboard">{footer.productLinks.dashboard}</FooterLink>
          <FooterLink href="/pipeline">{footer.productLinks.pipeline}</FooterLink>
          <FooterLink href="/ai">{footer.productLinks.ai}</FooterLink>
          <FooterLink href="/motivation">{footer.productLinks.motivation}</FooterLink>
          <FooterLink href="/analytics">{footer.productLinks.analytics}</FooterLink>
        </FooterColumn>

        <FooterColumn title={footer.resources}>
          <FooterLink href="/academy">{footer.resourcesLinks.academy}</FooterLink>
          <FooterLink href="/scripts">{footer.resourcesLinks.scripts}</FooterLink>
          <FooterLink href="#">{footer.resourcesLinks.blog}</FooterLink>
        </FooterColumn>

        <FooterColumn title={footer.legal}>
          <FooterLink href="/legal/privacy">{footer.legalLinks.privacy}</FooterLink>
          <FooterLink href="/legal/terms">{footer.legalLinks.terms}</FooterLink>
          <FooterLink href="/legal/kvkk">{footer.legalLinks.kvkk}</FooterLink>
        </FooterColumn>
      </div>
      <div className="border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-text-tertiary sm:px-6">
          {footer.copy}
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-primary">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a href={href} className="text-text-secondary transition hover:text-primary">
        {children}
      </a>
    </li>
  )
}

function SectionHeader({
  title,
  subtitle,
  centered,
}: {
  title: string
  subtitle?: string
  centered?: boolean
}) {
  return (
    <div className={centered ? 'text-center' : 'max-w-2xl'}>
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className={`mt-3 text-base leading-relaxed text-text-secondary sm:text-lg ${centered ? 'mx-auto max-w-2xl' : ''}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

interface PrimaryButtonProps {
  onClick: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

function PrimaryButton({ onClick, children, size = 'md' }: PrimaryButtonProps) {
  const sizeClasses =
    size === 'lg'
      ? 'px-6 py-3 text-sm sm:text-base'
      : size === 'sm'
        ? 'px-3.5 py-2 text-xs sm:text-sm'
        : 'px-5 py-2.5 text-sm'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary font-semibold text-obsidian shadow-[0_12px_32px_rgba(0,212,255,0.18)] transition hover:shadow-[0_16px_44px_rgba(0,212,255,0.25)] active:translate-y-px ${sizeClasses}`}
    >
      {children}
    </button>
  )
}

function scrollToId(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
