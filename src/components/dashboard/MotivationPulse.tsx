'use client'

import { useSyncExternalStore } from 'react'
import { ArrowRight, Heart, Sparkles, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DAILY_SUGGESTION_LINES } from '@/app/motivation/motivationData'

type FavoriteMessage = { id: string; text: string; updatedAt: string }

interface MotivationPulseProps {
  streak: number
}

const subscribeNoop = () => () => {}

export function MotivationPulse({ streak }: MotivationPulseProps) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [favorites] = usePersistentState<FavoriteMessage[]>('nmu-motivation-favorite-messages', [], { version: 1 })
  const [favQuoteIds] = usePersistentState<string[]>('nmu-motivation-fav-quotes', [], { version: 1 })

  const dayIndex = useSyncExternalStore<number | null>(
    subscribeNoop,
    () => (DAILY_SUGGESTION_LINES.length === 0 ? null : Math.floor(Date.now() / 86400000) % DAILY_SUGGESTION_LINES.length),
    () => null,
  )

  const dailyLine = (() => {
    if (dayIndex === null) return null
    const entry = DAILY_SUGGESTION_LINES[dayIndex]
    if (!entry) return null
    return locale === 'tr' ? entry.tr : entry.en
  })()

  const favoritesCount = favorites.length + favQuoteIds.length

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-secondary" />
            {t.dashboard.motivationPulse}
          </CardTitle>
          <CardDescription className="mt-1">{t.dashboard.motivationPulseHint}</CardDescription>
        </div>
        <Badge variant="secondary">{streak}🔥</Badge>
      </CardHeader>

      <div className="space-y-3">
        <div className="rounded-2xl border border-secondary/25 bg-secondary/8 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            {locale === 'tr' ? 'Günün ipucu' : 'Today’s prompt'}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-primary">
            {dailyLine ?? (locale === 'tr' ? 'Bugün küçük bir adım büyük bir fark yaratır.' : 'A small step today still moves the needle.')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border-subtle bg-surface/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
              {locale === 'tr' ? 'Gün serisi' : 'Streak'}
            </p>
            <p className="mt-1.5 text-2xl font-bold text-warning">{streak}</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
              {locale === 'tr' ? 'Favoriler' : 'Favorites'}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-bold text-secondary">
              <Star className="h-5 w-5" />
              {favoritesCount}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/motivation')}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary-dim"
        >
          {t.dashboard.motivationOpen}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}
