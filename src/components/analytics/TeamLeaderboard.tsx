'use client'

import { Crown, Medal, Trophy, Users } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import { Sparkline } from '@/components/dashboard/Sparkline'
import type { TeamLeaderboardEntry } from './analyticsMetrics'

type TeamLeaderboardProps = {
  rows: TeamLeaderboardEntry[]
}

const MEDAL_ICONS = [Crown, Trophy, Medal]

export function TeamLeaderboard({ rows }: TeamLeaderboardProps) {
  const { t, locale } = useLanguage()
  const maxScore = rows[0]?.score ?? 1

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-accent" />
            {t.analytics.membersActivity}
          </CardTitle>
          <CardDescription className="mt-1">
            {t.analytics.membersActivityHint}
          </CardDescription>
        </div>
      </CardHeader>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
          {locale === 'tr' ? 'Ekip verisi henüz yok.' : 'No team data yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const Icon = MEDAL_ICONS[index] ?? null
            const share = Math.round((row.score / Math.max(maxScore, 1)) * 100)
            return (
              <div key={row.id} className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/45">
                    {Icon ? <Icon className="h-4 w-4 text-warning" /> : <span className="text-sm font-bold text-text-tertiary">#{index + 1}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">{row.name}</p>
                      <Badge variant={row.overdue > 0 ? 'warning' : 'success'}>
                        {row.score} {locale === 'tr' ? 'puan' : 'pts'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-text-secondary">
                      {row.completedTasks} {locale === 'tr' ? 'tamamlanan' : 'completed'} · {row.touches} {locale === 'tr' ? 'temas' : 'touches'} · {row.presentations} {locale === 'tr' ? 'sunum' : 'presentations'} · {row.overdue} {locale === 'tr' ? 'gecikmiş' : 'overdue'}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(share, row.score > 0 ? 8 : 0)}%`,
                          backgroundColor: row.overdue > 0 ? '#f59e0b' : '#10b981',
                        }}
                      />
                    </div>
                  </div>
                  <div className="hidden sm:block w-[84px] shrink-0">
                    <Sparkline
                      data={row.spark}
                      color={row.overdue > 0 ? '#f59e0b' : '#10b981'}
                      gradientId={`team-spark-${row.id}`}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
