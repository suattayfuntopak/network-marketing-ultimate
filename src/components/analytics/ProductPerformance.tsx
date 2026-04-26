'use client'

import { Package, RefreshCcw } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { ProductPerformanceRow } from './analyticsMetrics'
import { formatTRY } from './analyticsMetrics'

interface ProductPerformanceProps {
  rows: ProductPerformanceRow[]
}

export function ProductPerformance({ rows }: ProductPerformanceProps) {
  const { t, locale } = useLanguage()
  const maxRevenue = rows[0]?.revenue ?? 1

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4 text-secondary" />
            {t.analytics.productPerformance}
          </CardTitle>
          <CardDescription className="mt-1">{t.analytics.productPerformanceHint}</CardDescription>
        </div>
      </CardHeader>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
          {locale === 'tr' ? 'Bu dönemde sipariş kaydı yok.' : 'No order records in this period.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => {
            const share = Math.round((row.revenue / Math.max(maxRevenue, 1)) * 100)
            const healthBadge = (() => {
              if (row.reorderHealth === 'on_track') {
                return <Badge variant="success">{locale === 'tr' ? 'Döngüde' : 'On track'}</Badge>
              }
              if (row.reorderHealth === 'slow') {
                return <Badge variant="warning">{locale === 'tr' ? 'Yavaşlamış' : 'Slowing'}</Badge>
              }
              return null
            })()
            return (
              <li key={row.productId} className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/45 text-xs font-semibold text-text-tertiary">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">{row.name}</p>
                      {healthBadge}
                    </div>
                    <p className="mt-1 text-[11px] text-text-tertiary">
                      {row.units} {t.analytics.units} · {row.orderCount} {t.analytics.ordersTooltip}
                      {row.reorderCycleDays ? (
                        <>
                          {' · '}
                          <RefreshCcw className="inline h-3 w-3" /> {t.analytics.reorderCycle} {row.reorderCycleDays}{locale === 'tr' ? 'g' : 'd'}
                        </>
                      ) : (
                        <> · {t.analytics.noReorderCycle}</>
                      )}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(share, row.revenue > 0 ? 6 : 0)}%`,
                          backgroundColor: row.reorderHealth === 'slow' ? '#f59e0b' : '#8b5cf6',
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">{formatTRY(row.revenue, locale)}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
