'use client'

import { ArrowRight, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLanguage } from '@/components/common/LanguageProvider'

interface AiStudioShortcutProps {
  used: number
  limit: number
  remaining: number
  lastUsedAt: string | null
  isLoading?: boolean
}

function formatRelativeTime(value: string | null, locale: 'tr' | 'en') {
  if (!value) return locale === 'tr' ? 'henüz üretim yok' : 'no draft yet'
  const date = new Date(value)
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  if (diffMinutes < 1) return locale === 'tr' ? 'az önce' : 'just now'
  if (diffMinutes < 60) {
    return locale === 'tr' ? `${diffMinutes} dk önce` : `${diffMinutes} min ago`
  }
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return locale === 'tr' ? `${diffHours} saat önce` : `${diffHours}h ago`
  }
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function AiStudioShortcut({ used, limit, remaining, lastUsedAt, isLoading }: AiStudioShortcutProps) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const usedRatio = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            {t.dashboard.aiStudio}
          </CardTitle>
          <CardDescription className="mt-1">{t.dashboard.aiStudioHint}</CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <Skeleton className="h-[140px]" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-primary">{remaining}</span>
            <span className="text-xs text-text-tertiary">
              / {limit} · {t.dashboard.aiRemaining}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
              style={{ width: `${usedRatio}%` }}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface/40 px-3 py-2 text-xs text-text-secondary">
            <span>
              {used} {t.dashboard.aiUsedToday}
            </span>
            <span className="text-text-tertiary">{formatRelativeTime(lastUsedAt, locale)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/ai')}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary-dim"
      >
        {t.dashboard.aiOpen}
        <ArrowRight className="h-4 w-4" />
      </button>
    </Card>
  )
}
