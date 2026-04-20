'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { TrendingUp, Wallet } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import { formatTRY, type TopProductRow } from './analyticsMetrics'

type RevenueSeriesPoint = { label: string; revenue: number; orders: number }

type RevenueSectionProps = {
  series: RevenueSeriesPoint[]
  topProducts: TopProductRow[]
  totalRevenue: number
  avgOrderValue: number
  orderCount: number
}

function TooltipBox({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0]?.payload as RevenueSeriesPoint | undefined
  if (!datum) return null
  return (
    <div className="rounded-xl border border-border bg-elevated p-3 shadow-float">
      <p className="mb-1 text-xs font-semibold text-text-primary">{label}</p>
      <p className="text-xs text-text-secondary">
        <span className="font-semibold text-text-primary">{formatTRYValue(datum.revenue)}</span>
      </p>
      <p className="text-xs text-text-tertiary">{datum.orders} orders</p>
    </div>
  )
}

function formatTRYValue(value: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value)
}

export function RevenueSection({ series, topProducts, totalRevenue, avgOrderValue, orderCount }: RevenueSectionProps) {
  const { locale } = useLanguage()

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
      <Card padding="lg">
        <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-success" />
              {locale === 'tr' ? 'Gelir Akışı' : 'Revenue Flow'}
            </CardTitle>
            <CardDescription className="mt-1">
              {locale === 'tr'
                ? 'Seçili dönemde gelir ve sipariş ritmi.'
                : 'Revenue and order rhythm for the selected period.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{formatTRY(totalRevenue, locale)}</Badge>
            <Badge variant="default">Ø {formatTRY(avgOrderValue, locale)}</Badge>
            <Badge variant="primary">{orderCount} {locale === 'tr' ? 'sipariş' : 'orders'}</Badge>
          </div>
        </CardHeader>

        <div className="h-[220px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                width={36}
                tickFormatter={(value) => {
                  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
                  if (value >= 1_000) return `${Math.round(value / 1000)}k`
                  return `${value}`
                }}
              />
              <Tooltip content={TooltipBox} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fill="url(#analyticsRevenue)"
                strokeWidth={2.4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              {locale === 'tr' ? 'Çok Satan Ürünler' : 'Top Products'}
            </CardTitle>
            <CardDescription className="mt-1">
              {locale === 'tr'
                ? 'Seçili dönemde gelirin hangi üründen geldiğini gör.'
                : 'See which products drove revenue in the selected period.'}
            </CardDescription>
          </div>
        </CardHeader>

        {topProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
            {locale === 'tr' ? 'Ürün verisi henüz oluşmadı.' : 'No product data yet.'}
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((product, index) => {
              const maxRevenue = topProducts[0]?.revenue ?? 1
              const share = Math.round((product.revenue / Math.max(maxRevenue, 1)) * 100)
              return (
                <div key={product.productId} className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <p className="truncate text-sm font-semibold text-text-primary">{product.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-text-primary">{formatTRY(product.revenue, locale)}</p>
                      <p className="text-[10px] text-text-tertiary">{product.quantity} {locale === 'tr' ? 'adet' : 'units'}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max(share, product.revenue > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
