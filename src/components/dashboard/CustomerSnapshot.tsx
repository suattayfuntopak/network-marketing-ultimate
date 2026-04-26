'use client'

import { ArrowRight, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatTRY } from '@/components/dashboard/dashboardMetrics'
import type { OrderRow } from '@/lib/queries'

interface CustomerSnapshotProps {
  totalActive: number
  newLast30: number
  customerIds: string[] | null
  orders: OrderRow[]
  isLoading?: boolean
}

export function CustomerSnapshot({ totalActive, newLast30, customerIds, orders, isLoading }: CustomerSnapshotProps) {
  const { t, locale } = useLanguage()
  const router = useRouter()

  const customerSet = customerIds ? new Set(customerIds) : null
  const eligibleOrders = orders.filter((order) => order.status !== 'cancelled')
  const filteredOrders = customerSet
    ? eligibleOrders.filter((order) => customerSet.has(order.contact_id))
    : eligibleOrders
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total_try ?? 0), 0)
  const avgOrder = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0

  return (
    <Card className="h-full" padding="lg">
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-warning" />
            {t.dashboard.customerSnapshot}
          </CardTitle>
          <CardDescription className="mt-1">{t.dashboard.customerSnapshotHint}</CardDescription>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-[88px]" />
          <Skeleton className="h-[88px]" />
          <Skeleton className="h-[88px]" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Cell label={t.dashboard.activeCustomers} value={String(totalActive)} tone="text-warning" />
          <Cell label={t.dashboard.newCustomers} value={String(newLast30)} tone="text-success" />
          <Cell label={t.dashboard.avgLtv} value={formatTRY(avgOrder, locale)} tone="text-primary" />
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push('/customers')}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary-dim"
      >
        {locale === 'tr' ? 'Müşterilere git' : 'Open customers'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </Card>
  )
}

function Cell({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}
