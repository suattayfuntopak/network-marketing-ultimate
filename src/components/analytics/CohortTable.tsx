'use client'

import { Layers } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { CohortRow } from './analyticsMetrics'

type CohortTableProps = {
  rows: CohortRow[]
}

function conversionColor(ratio: number) {
  if (ratio === 0) return 'rgba(100,116,139,0.15)'
  if (ratio < 0.2) return 'rgba(59,130,246,0.35)'
  if (ratio < 0.4) return 'rgba(139,92,246,0.55)'
  if (ratio < 0.6) return 'rgba(245,158,11,0.7)'
  if (ratio < 0.8) return 'rgba(16,185,129,0.82)'
  return 'rgba(16,185,129,1)'
}

export function CohortTable({ rows }: CohortTableProps) {
  const { locale } = useLanguage()

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            {locale === 'tr' ? 'Kohort Analizi' : 'Cohort Analysis'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? 'Her ay eklenen adayların aşama aşama nasıl ilerlediğini gör.'
              : 'See how each monthly cohort of prospects progresses stage by stage.'}
          </CardDescription>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              <th className="pb-3 pr-2 font-semibold">{locale === 'tr' ? 'Kohort' : 'Cohort'}</th>
              <th className="pb-3 pr-2 font-semibold">{locale === 'tr' ? 'Giriş' : 'Entered'}</th>
              <th className="pb-3 pr-2 font-semibold">{locale === 'tr' ? 'Temas' : 'Touched'}</th>
              <th className="pb-3 pr-2 font-semibold">{locale === 'tr' ? 'Sunum' : 'Presented'}</th>
              <th className="pb-3 pr-2 font-semibold">{locale === 'tr' ? 'Dönüştü' : 'Converted'}</th>
              <th className="pb-3 pr-0 font-semibold">{locale === 'tr' ? 'Dönüşüm %' : 'Conv. %'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const conversionRatio = row.entered > 0 ? row.converted / row.entered : 0
              const touchedRatio = row.entered > 0 ? row.touched / row.entered : 0
              const presentedRatio = row.entered > 0 ? row.presented / row.entered : 0
              return (
                <tr key={row.key} className="border-t border-border-subtle">
                  <td className="py-3 pr-2 text-sm font-semibold text-text-primary">{row.label}</td>
                  <td className="py-3 pr-2 text-sm text-text-secondary">{row.entered}</td>
                  <td className="py-3 pr-2">
                    <div
                      className="flex h-6 items-center justify-center rounded-lg text-[11px] font-semibold text-background"
                      style={{ backgroundColor: conversionColor(touchedRatio) }}
                    >
                      {row.touched}
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div
                      className="flex h-6 items-center justify-center rounded-lg text-[11px] font-semibold text-background"
                      style={{ backgroundColor: conversionColor(presentedRatio) }}
                    >
                      {row.presented}
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div
                      className="flex h-6 items-center justify-center rounded-lg text-[11px] font-semibold text-background"
                      style={{ backgroundColor: conversionColor(conversionRatio) }}
                    >
                      {row.converted}
                    </div>
                  </td>
                  <td className="py-3 pr-0 text-sm font-semibold text-text-primary">
                    %{Math.round(conversionRatio * 100)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
