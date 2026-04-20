'use client'

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'

type GaugeEntry = {
  key: string
  label: string
  value: number
  color: string
  caption: string
}

type ConversionGaugesProps = {
  entries: GaugeEntry[]
}

export function ConversionGauges({ entries }: ConversionGaugesProps) {
  const { locale } = useLanguage()

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-success" />
            {locale === 'tr' ? 'Dönüşüm Motoru' : 'Conversion Engine'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? 'Her aşamada dönüşüm hızını dört radyal ölçerle gör.'
              : 'See conversion velocity across four radial gauges.'}
          </CardDescription>
        </div>
      </CardHeader>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {entries.map((entry) => {
          const data = [{ name: entry.label, value: Math.min(entry.value, 100), fill: entry.color }]
          return (
            <div key={entry.key} className="rounded-2xl border border-border-subtle bg-surface/35 p-2.5 sm:p-3">
              <div className="relative mx-auto h-[110px] sm:h-[140px] w-full max-w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="72%"
                    outerRadius="100%"
                    data={data}
                    startAngle={220}
                    endAngle={-40}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background={{ fill: 'rgba(148,163,184,0.12)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
                  <p className="text-xl sm:text-2xl font-bold text-text-primary">%{entry.value}</p>
                </div>
              </div>
              <p className="mt-1 text-center text-[11px] sm:text-xs font-semibold text-text-primary truncate">{entry.label}</p>
              <p className="mt-1 text-center text-[10px] text-text-tertiary">{entry.caption}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
