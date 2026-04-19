'use client'

import { CalendarHeart } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { EventPerformanceRow } from './analyticsMetrics'

type EventPerformanceProps = {
  rows: EventPerformanceRow[]
}

export function EventPerformance({ rows }: EventPerformanceProps) {
  const { locale } = useLanguage()

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarHeart className="h-4 w-4 text-accent" />
            {locale === 'tr' ? 'Etkinlik Performansı' : 'Event Performance'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? 'Son etkinliklerin doluluk, katılım ve dönüşüm oranları.'
              : 'Fill rate, show rate and conversion for recent events.'}
          </CardDescription>
        </div>
      </CardHeader>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
          {locale === 'tr' ? 'Henüz etkinlik kaydı yok.' : 'No event records yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{row.title}</p>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">
                    {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(row.startDate)}
                    {' · '}
                    {row.invited} {locale === 'tr' ? 'davet' : 'invited'}
                    {' · '}
                    {row.confirmed} {locale === 'tr' ? 'onaylı' : 'confirmed'}
                    {' · '}
                    {row.attended} {locale === 'tr' ? 'katıldı' : 'attended'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.fillRate !== null && <Badge variant="primary">%{row.fillRate} {locale === 'tr' ? 'doluluk' : 'fill'}</Badge>}
                  {row.showRate !== null && <Badge variant="secondary">%{row.showRate} {locale === 'tr' ? 'katılım' : 'show'}</Badge>}
                  {row.conversionRate !== null && <Badge variant="success">%{row.conversionRate} {locale === 'tr' ? 'dönüşüm' : 'conversion'}</Badge>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] text-text-tertiary">
                {[
                  { label: locale === 'tr' ? 'Doluluk' : 'Fill', value: row.fillRate ?? 0, color: '#00d4ff' },
                  { label: locale === 'tr' ? 'Katılım' : 'Show', value: row.showRate ?? 0, color: '#8b5cf6' },
                  { label: locale === 'tr' ? 'Dönüşüm' : 'Conv.', value: row.conversionRate ?? 0, color: '#10b981' },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between">
                      <span>{metric.label}</span>
                      <span className="font-semibold text-text-secondary">%{metric.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(metric.value, 0)}%`, backgroundColor: metric.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
