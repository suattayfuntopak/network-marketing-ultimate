'use client'

import { Award, BellRing, BookOpenCheck, Flame, MessageSquareQuote, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { usePersistentState } from '@/hooks/usePersistentState'
import { academyLibraryItems } from '@/data/academyLibrary'

export function EngagementCard() {
  const { t, locale } = useLanguage()
  const { currentUser, notifications } = useAppStore()

  const [viewedLibraryIds] = usePersistentState<string[]>('nmu-academy-library-viewed-v1', [])
  const [viewedObjectionIds] = usePersistentState<string[]>('nmu-academy-objection-viewed-v1', [])
  const [favoriteLibraryIds] = usePersistentState<string[]>('nmu-academy-library-favorites-v2', [])
  const [favoriteObjectionIds] = usePersistentState<string[]>('nmu-academy-objection-favorites-v2', [])

  const streak = currentUser?.streak ?? 0
  const xp = currentUser?.xp ?? 0
  const level = currentUser?.level ?? 1
  const momentum = Math.max(0, Math.min(100, currentUser?.momentumScore ?? 0))
  const xpInLevel = xp % 1000
  const xpProgress = (xpInLevel / 1000) * 100

  const totalLibrary = Math.max(academyLibraryItems.length, 1)
  const viewedLibraryCount = new Set(viewedLibraryIds).size
  const academyPercent = Math.round((viewedLibraryCount / totalLibrary) * 100)
  const unread = notifications.filter((notification) => !notification.isRead).length
  const scriptsOpened = new Set([...viewedLibraryIds, ...viewedObjectionIds, ...favoriteLibraryIds, ...favoriteObjectionIds]).size

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            {t.dashboard.engagement}
          </CardTitle>
          <CardDescription className="mt-1">{t.dashboard.engagementHint}</CardDescription>
        </div>
      </CardHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label={t.dashboard.streak}
            value={streak}
            icon={<Flame className="h-4 w-4" />}
            tone="warning"
          />
          <Stat
            label={t.dashboard.xp}
            value={xp}
            icon={<Sparkles className="h-4 w-4" />}
            tone="primary"
          />
          <Stat
            label={t.dashboard.level}
            value={level}
            icon={<Award className="h-4 w-4" />}
            tone="secondary"
          />
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              {t.dashboard.momentum}
            </span>
            <span className="font-semibold text-text-primary">{momentum}</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-success"
              style={{ width: `${momentum}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-text-tertiary">
            <span>{xpInLevel} / 1000 XP</span>
            <span>L{level}</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface/30 p-4">
          <div className="grid grid-cols-3 gap-3">
            <SmallStat
              label={t.dashboard.academyProgress}
              value={`%${academyPercent}`}
              hint={`${viewedLibraryCount}/${totalLibrary}`}
              icon={<BookOpenCheck className="h-3.5 w-3.5" />}
              accent="text-primary"
            />
            <SmallStat
              label={t.dashboard.notificationsUnread}
              value={String(unread)}
              hint={locale === 'tr' ? 'aktif kayıt' : 'open items'}
              icon={<BellRing className="h-3.5 w-3.5" />}
              accent="text-warning"
            />
            <SmallStat
              label={t.dashboard.scriptsOpened}
              value={String(scriptsOpened)}
              hint={t.dashboard.academyProgressHint}
              icon={<MessageSquareQuote className="h-3.5 w-3.5" />}
              accent="text-secondary"
            />
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-secondary/80"
              style={{ width: `${Math.min(100, academyPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

function Stat({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'primary' | 'secondary' | 'warning'
}) {
  const colors = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    warning: 'text-warning',
  }
  return (
    <div className="rounded-xl border border-border-subtle bg-surface/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`mt-1.5 flex items-center gap-1.5 text-2xl font-bold ${colors[tone]}`}>
        {icon}
        {value}
      </p>
    </div>
  )
}

function SmallStat({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-tertiary">
        <span className={accent}>{icon}</span>
        <span className="line-clamp-1">{label}</span>
      </div>
      <p className={`mt-1 text-lg font-bold ${accent}`}>{value}</p>
      <p className="text-[10px] text-text-tertiary line-clamp-1">{hint}</p>
    </div>
  )
}
