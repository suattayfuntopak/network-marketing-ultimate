'use client'

import { Award, Bot, Flame, Sparkles } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import type { EngagementSummary } from './analyticsMetrics'

interface EngagementMetricsProps {
  engagement: EngagementSummary
}

const UsageTooltip = ({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) => {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-border bg-elevated p-3 shadow-float">
      <p className="mb-1 text-xs font-semibold text-text-primary">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-text-secondary">
          {entry.name}: <span className="font-semibold text-text-primary">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export function EngagementMetrics({ engagement }: EngagementMetricsProps) {
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()

  const streak = currentUser?.streak ?? 0
  const xp = currentUser?.xp ?? 0
  const momentum = Math.max(0, Math.min(100, currentUser?.momentumScore ?? 0))

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-primary" />
            {t.analytics.engagement}
          </CardTitle>
          <CardDescription className="mt-1">{t.analytics.engagementHint}</CardDescription>
        </div>
      </CardHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(280px,1fr)]">
        <div className="space-y-3">
          <Tile
            icon={<Flame className="h-4 w-4 text-warning" />}
            label={t.analytics.streakBest}
            value={`${streak}🔥`}
            hint={locale === 'tr' ? 'Aktif gün serisi' : 'Active streak'}
          />
          <Tile
            icon={<Sparkles className="h-4 w-4 text-secondary" />}
            label={t.analytics.xpEarned}
            value={String(xp)}
            hint={locale === 'tr' ? 'Toplam kazanılan XP' : 'Total XP earned'}
          />
          <Tile
            icon={<Award className="h-4 w-4 text-primary" />}
            label={t.analytics.momentumScore}
            value={`${momentum}/100`}
            hint={locale === 'tr' ? 'İvme göstergesi' : 'Momentum score'}
            progress={momentum}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t.analytics.dailyAiUsage}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
              <Bot className="h-3.5 w-3.5 text-primary" />
              {engagement.windowUsage}
            </span>
          </div>
          {engagement.windowUsage === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-xs text-text-tertiary">
              {t.analytics.noAiUsage}
            </div>
          ) : (
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagement.series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={28} allowDecimals={false} />
                  <Tooltip content={UsageTooltip} cursor={{ fill: 'rgba(0,212,255,0.06)' }} />
                  <Bar dataKey="value" name={t.analytics.dailyAiUsage} fill="#00d4ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function Tile({
  icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  progress?: number
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary">
          {icon}
          {label}
        </span>
        <span className="text-lg font-bold text-text-primary">{value}</span>
      </div>
      <p className="mt-1 text-[11px] text-text-tertiary">{hint}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-background/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-success"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
