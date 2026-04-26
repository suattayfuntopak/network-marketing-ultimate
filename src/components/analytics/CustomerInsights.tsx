'use client'

import { Heart, TrendingDown, Users } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { CustomerInsightsSummary } from './analyticsMetrics'
import { formatTRY } from './analyticsMetrics'
import type { ContactRow } from '@/lib/queries'

interface CustomerInsightsProps {
  summary: CustomerInsightsSummary
  contacts: ContactRow[]
}

const InsightTooltip = ({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) => {
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

export function CustomerInsights({ summary, contacts }: CustomerInsightsProps) {
  const { t, locale } = useLanguage()
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))

  return (
    <Card padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-warning" />
            {t.analytics.customerInsights}
          </CardTitle>
          <CardDescription className="mt-1">{t.analytics.customerInsightsHint}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="warning" dot>{t.analytics.activeCustomers}</Badge>
          <Badge variant="error" dot>{t.analytics.churnRisk}</Badge>
        </div>
      </CardHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <div>
          <div className="grid grid-cols-3 gap-3">
            <Cell label={t.analytics.activeCustomers} value={String(summary.active)} tone="text-warning" />
            <Cell label={t.analytics.newCustomers} value={String(summary.newInPeriod)} tone="text-success" />
            <Cell
              label={t.analytics.churnRisk}
              value={String(summary.churnRisk)}
              tone="text-error"
              hint={t.analytics.churnRiskHint}
            />
          </div>

          <div className="mt-4 h-[200px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="customerActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="customerRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={28} />
                <Tooltip content={InsightTooltip} />
                <Area type="monotone" dataKey="active" name={t.analytics.activeCustomers} stroke="#f59e0b" fill="url(#customerActive)" strokeWidth={2.2} />
                <Area type="monotone" dataKey="churnRisk" name={t.analytics.churnRisk} stroke="#ef4444" fill="url(#customerRisk)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{t.analytics.topCustomers}</h3>
          {summary.topCustomers.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-6 text-center text-xs text-text-tertiary">
              {locale === 'tr' ? 'Bu dönemde sipariş kaydı görünmüyor.' : 'No orders recorded in this period.'}
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {summary.topCustomers.map((entry, index) => {
                const contact = contactById.get(entry.contactId)
                return (
                  <li key={entry.contactId} className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background/45 text-xs font-semibold text-text-tertiary">
                        #{index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {contact?.full_name ?? (locale === 'tr' ? 'Bilinmeyen kontak' : 'Unknown contact')}
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          {entry.orders} {t.analytics.ordersTooltip}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success">{formatTRY(entry.revenue, locale)}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {summary.churnRisk > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-error/25 bg-error/10 px-3 py-1.5 text-[11px] font-semibold text-error">
              <TrendingDown className="h-3.5 w-3.5" />
              {summary.churnRisk} {t.analytics.churnRisk}
            </div>
          )}
          {summary.newInPeriod > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success">
              <Heart className="h-3.5 w-3.5" />
              {summary.newInPeriod} {t.analytics.newCustomers}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function Cell({ label, value, tone, hint }: { label: string; value: string; tone: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-[10px] text-text-tertiary leading-tight">{hint}</p>}
    </div>
  )
}
