'use client'

import { CalendarRange, Flame, TrendingUp, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { DeltaPill } from './DeltaPill'
import { Sparkline } from './Sparkline'
import { formatTRY, formatTRYDelta, type RevenueSnapshot } from './dashboardMetrics'

type RevenueStripProps = {
  snapshot: RevenueSnapshot
  streak: { current: number; longest: number }
}

export function RevenueStrip({ snapshot, streak }: RevenueStripProps) {
  const { locale } = useLanguage()
  const sparkData = snapshot.sparkline.map((point) => ({ value: point.revenue }))
  const accentClasses = [
    'from-primary/18 to-primary/5 border-primary/20',
    'from-error/18 to-error/5 border-error/20',
    'from-warning/18 to-warning/5 border-warning/20',
    'from-secondary/18 to-secondary/5 border-secondary/20',
  ] as const

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card padding="md" className={`relative h-[128px] sm:h-[148px] overflow-hidden border bg-gradient-to-br ${accentClasses[0]}`}>
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
              <Wallet className="h-3.5 w-3.5" />
              {locale === 'tr' ? 'Bugünkü Gelir' : "Today's Revenue"}
            </p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{formatTRY(snapshot.todayRevenue, locale)}</p>
            <div className="mt-2">
              <DeltaPill delta={snapshot.todayDelta} label={formatTRYDelta(snapshot.todayDelta, locale)} />
            </div>
          </div>
        </div>
      </Card>

      <Card padding="md" className={`relative h-[128px] sm:h-[148px] overflow-hidden border bg-gradient-to-br ${accentClasses[1]}`}>
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
              <TrendingUp className="h-3.5 w-3.5" />
              {locale === 'tr' ? 'Bu Hafta Gelir' : 'This Week Revenue'}
            </p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{formatTRY(snapshot.weekRevenue, locale)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DeltaPill delta={snapshot.weekDelta} label={formatTRYDelta(snapshot.weekDelta, locale)} />
              <span className="text-[11px] text-text-tertiary">
                {snapshot.weekOrderCount} {locale === 'tr' ? 'sipariş' : 'orders'} · Ø {formatTRY(snapshot.avgOrderValue, locale)}
              </span>
            </div>
          </div>
          <div className="hidden sm:block w-[96px] shrink-0">
            <Sparkline data={sparkData} color="#00d4ff" gradientId="revenueStripWeek" />
          </div>
        </div>
      </Card>

      <Card padding="md" className={`relative h-[128px] sm:h-[148px] overflow-hidden border bg-gradient-to-br ${accentClasses[2]}`}>
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
              <CalendarRange className="h-3.5 w-3.5" />
              {locale === 'tr' ? 'Son 30 Gün Gelir' : 'Last 30d Revenue'}
            </p>
            <p className="mt-2 text-2xl font-bold text-text-primary">{formatTRY(snapshot.monthRevenue, locale)}</p>
            <div className="mt-2">
              <DeltaPill delta={snapshot.monthDelta} label={formatTRYDelta(snapshot.monthDelta, locale)} />
            </div>
          </div>
        </div>
      </Card>

      <Card padding="md" className={`relative h-[128px] sm:h-[148px] overflow-hidden border bg-gradient-to-br ${accentClasses[3]}`}>
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
              <Flame className="h-3.5 w-3.5" />
              {locale === 'tr' ? 'Aktivite Serisi' : 'Activity Streak'}
            </p>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {streak.current} <span className="text-sm font-semibold text-text-secondary">{locale === 'tr' ? 'gün' : 'days'}</span>
            </p>
            <p className="mt-2 text-[11px] text-text-tertiary">
              {locale === 'tr' ? 'En uzun seri' : 'Longest streak'}: <span className="font-semibold text-text-secondary">{streak.longest}</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
