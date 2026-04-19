'use client'

import { useRouter } from 'next/navigation'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { PipelineSegment } from './dashboardMetrics'

type PipelineSegmentDonutProps = {
  segments: PipelineSegment[]
  totalContacts: number
}

export function PipelineSegmentDonut({ segments, totalContacts }: PipelineSegmentDonutProps) {
  const { locale } = useLanguage()
  const router = useRouter()

  const data = segments.map((segment) => ({
    name: locale === 'tr' ? segment.labelTr : segment.labelEn,
    value: segment.count,
    color: segment.color,
    id: segment.id,
  }))

  const totalInPipeline = segments.reduce((sum, segment) => sum + segment.count, 0)

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-secondary" />
            {locale === 'tr' ? 'Süreç Dağılımı' : 'Pipeline Split'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? 'Havuzun nasıl dağıldığını tek bakışta gör ve ısınan tarafa odaklan.'
              : 'See how the pool is spread and focus on the warming side.'}
          </CardDescription>
        </div>
        <Badge variant="default">{totalContacts} {locale === 'tr' ? 'kişi' : 'people'}</Badge>
      </CardHeader>

      {totalInPipeline === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
          {locale === 'tr'
            ? 'Henüz süreç verisi yok. İlk kontaklar girilince dağılım canlanacak.'
            : 'Pipeline data has not formed yet. Add contacts to see distribution.'}
        </div>
      ) : (
        <div className="grid items-center gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
                {locale === 'tr' ? 'Toplam' : 'Total'}
              </p>
              <p className="mt-1 text-3xl font-bold text-text-primary">{totalInPipeline}</p>
            </div>
          </div>

          <div className="grid gap-2">
            {segments.map((segment) => {
              const share = totalInPipeline > 0 ? Math.round((segment.count / totalInPipeline) * 100) : 0
              return (
                <button
                  key={segment.id}
                  onClick={() => router.push('/pipeline')}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface/35 px-3 py-2.5 text-left transition-all hover:border-border-strong hover:bg-surface/55"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {locale === 'tr' ? segment.labelTr : segment.labelEn}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(share, segment.count > 0 ? 6 : 0)}%`, backgroundColor: segment.color }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-text-primary">{segment.count}</p>
                    <p className="text-[10px] text-text-tertiary">%{share}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
