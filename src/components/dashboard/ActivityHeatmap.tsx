'use client'

import { Activity } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { HeatmapCell } from './dashboardMetrics'

type ActivityHeatmapProps = {
  cells: HeatmapCell[]
  weeks?: number
}

function intensityClass(intensity: number, max: number) {
  if (intensity === 0) return 'bg-surface/40 border-border-subtle/40'
  const ratio = intensity / Math.max(max, 1)
  if (ratio < 0.25) return 'bg-primary/20 border-primary/20'
  if (ratio < 0.5) return 'bg-primary/40 border-primary/30'
  if (ratio < 0.75) return 'bg-primary/60 border-primary/40'
  return 'bg-primary border-primary'
}

const WEEKDAYS_TR = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz']
const WEEKDAYS_EN = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

export function ActivityHeatmap({ cells, weeks = 12 }: ActivityHeatmapProps) {
  const { locale } = useLanguage()
  const weekdays = locale === 'tr' ? WEEKDAYS_TR : WEEKDAYS_EN
  const max = cells.reduce((maximum, cell) => (cell.intensity > maximum ? cell.intensity : maximum), 0)

  const columns: HeatmapCell[][] = []
  for (let week = 0; week < weeks; week += 1) {
    const slice = cells.slice(week * 7, week * 7 + 7)
    if (slice.length === 7) columns.push(slice)
  }

  const activeDays = cells.filter((cell) => cell.intensity > 0).length

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            {locale === 'tr' ? 'Aktivite Haritası' : 'Activity Heatmap'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? `Son ${weeks} haftalık temas, tamamlanan görev ve sipariş yoğunluğu.`
              : `Touch, completed task, and order density over the last ${weeks} weeks.`}
          </CardDescription>
        </div>
        <div className="text-right text-[11px] text-text-tertiary">
          <p>{locale === 'tr' ? 'Aktif gün' : 'Active days'}</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {activeDays} / {cells.length}
          </p>
        </div>
      </CardHeader>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <div className="flex shrink-0 flex-col justify-between py-1 text-[10px] text-text-tertiary">
          {weekdays.map((label, index) => (
            <span key={index} className="leading-[14px]">
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-[4px]">
          {columns.map((column, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[4px]">
              {column.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key} · ${locale === 'tr' ? 'temas' : 'touches'}: ${cell.touches}, ${locale === 'tr' ? 'görev' : 'tasks'}: ${cell.tasks}, ${locale === 'tr' ? 'sipariş' : 'orders'}: ${cell.orders}`}
                  className={`h-[14px] w-[14px] rounded-[3px] border transition-colors ${intensityClass(cell.intensity, max)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-text-tertiary">
        <span>{locale === 'tr' ? 'Az' : 'Less'}</span>
        <span className="h-[10px] w-[10px] rounded-[3px] border border-border-subtle/40 bg-surface/40" />
        <span className="h-[10px] w-[10px] rounded-[3px] border border-primary/20 bg-primary/20" />
        <span className="h-[10px] w-[10px] rounded-[3px] border border-primary/30 bg-primary/40" />
        <span className="h-[10px] w-[10px] rounded-[3px] border border-primary/40 bg-primary/60" />
        <span className="h-[10px] w-[10px] rounded-[3px] border border-primary bg-primary" />
        <span>{locale === 'tr' ? 'Çok' : 'More'}</span>
      </div>
    </Card>
  )
}
