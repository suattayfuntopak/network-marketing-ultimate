'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MessagesSquare } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { InteractionMixEntry } from './analyticsMetrics'

type InteractionMixProps = {
  data: InteractionMixEntry[]
}

const STACK_COLORS = {
  call: '#00d4ff',
  message: '#8b5cf6',
  meeting: '#10b981',
  presentation: '#f59e0b',
  other: '#64748b',
}

export function InteractionMix({ data }: InteractionMixProps) {
  const { locale } = useLanguage()

  const totalsByType = data.reduce(
    (accumulator, entry) => {
      accumulator.call += entry.call
      accumulator.message += entry.message
      accumulator.meeting += entry.meeting
      accumulator.presentation += entry.presentation
      accumulator.other += entry.other
      return accumulator
    },
    { call: 0, message: 0, meeting: 0, presentation: 0, other: 0 },
  )

  const totalInteractions = Object.values(totalsByType).reduce((sum, value) => sum + value, 0)

  const labels = {
    tr: { call: 'Arama', message: 'Mesaj', meeting: 'Toplantı', presentation: 'Sunum', other: 'Diğer' },
    en: { call: 'Call', message: 'Message', meeting: 'Meeting', presentation: 'Presentation', other: 'Other' },
  } as const

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessagesSquare className="h-4 w-4 text-primary" />
            {locale === 'tr' ? 'Temas Kanalları' : 'Interaction Mix'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? 'Arama, mesaj, toplantı ve sunumun seçili dönemdeki dağılımı.'
              : 'Channel blend of call, message, meeting, and presentation.'}
          </CardDescription>
        </div>
      </CardHeader>

      {totalInteractions === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
          {locale === 'tr'
            ? 'Bu dönemde etkileşim kaydı yok.'
            : 'No interaction records for this period.'}
        </div>
      ) : (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#1e1e2e',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f1f5f9',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} iconType="circle" />
              <Bar dataKey="call" stackId="mix" name={labels[locale].call} fill={STACK_COLORS.call} radius={[0, 0, 0, 0]} />
              <Bar dataKey="message" stackId="mix" name={labels[locale].message} fill={STACK_COLORS.message} />
              <Bar dataKey="meeting" stackId="mix" name={labels[locale].meeting} fill={STACK_COLORS.meeting} />
              <Bar dataKey="presentation" stackId="mix" name={labels[locale].presentation} fill={STACK_COLORS.presentation} />
              <Bar dataKey="other" stackId="mix" name={labels[locale].other} fill={STACK_COLORS.other} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
