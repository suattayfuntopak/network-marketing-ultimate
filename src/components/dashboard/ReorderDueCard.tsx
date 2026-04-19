'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, RefreshCcw } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import { formatTRY, type ReorderDueEntry } from './dashboardMetrics'

type ReorderDueCardProps = {
  entries: ReorderDueEntry[]
}

export function ReorderDueCard({ entries }: ReorderDueCardProps) {
  const { locale } = useLanguage()
  const router = useRouter()
  const overdueCount = entries.filter((entry) => entry.status === 'overdue').length
  const todayCount = entries.filter((entry) => entry.status === 'today').length

  const dueLabel = (entry: ReorderDueEntry) => {
    if (entry.status === 'overdue') {
      return locale === 'tr' ? `${Math.abs(entry.daysFromToday)} gün gecikmiş` : `${Math.abs(entry.daysFromToday)} days overdue`
    }
    if (entry.status === 'today') return locale === 'tr' ? 'Bugün' : 'Today'
    return locale === 'tr' ? `${entry.daysFromToday} gün sonra` : `In ${entry.daysFromToday} days`
  }

  const variant = (entry: ReorderDueEntry) =>
    entry.status === 'overdue' ? 'error' : entry.status === 'today' ? 'warning' : 'default'

  return (
    <Card className="h-full" padding="lg" glow={overdueCount > 0 ? 'warning' : 'none'}>
      <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCcw className="h-4 w-4 text-warning" />
            {locale === 'tr' ? 'Yeniden Sipariş Bekleyen' : 'Reorder Due'}
          </CardTitle>
          <CardDescription className="mt-1">
            {locale === 'tr'
              ? 'Önümüzdeki 14 gün içinde tekrar siparişe geçmesi beklenen müşteriler.'
              : 'Customers due for a reorder in the next 14 days.'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && <Badge variant="error">{overdueCount} {locale === 'tr' ? 'gecikmiş' : 'overdue'}</Badge>}
          {todayCount > 0 && <Badge variant="warning">{todayCount} {locale === 'tr' ? 'bugün' : 'today'}</Badge>}
          <Badge variant="default">{entries.length}</Badge>
        </div>
      </CardHeader>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
          {locale === 'tr'
            ? 'Yaklaşan yeniden sipariş görünmüyor. Sadakat ritmi kontrollü.'
            : 'No upcoming reorders. Loyalty rhythm is under control.'}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 6).map((entry) => (
            <button
              key={entry.orderId}
              onClick={() => router.push(`/contacts?contact=${entry.contactId}`)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface/35 px-3 py-2.5 text-left transition-all hover:border-border-strong hover:bg-surface/55"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <RefreshCcw className="h-4 w-4 text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-text-primary">{entry.contactName}</p>
                  <Badge variant={variant(entry)}>{dueLabel(entry)}</Badge>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  {locale === 'tr' ? 'Son sipariş' : 'Last order'}: <span className="font-semibold text-text-primary">{formatTRY(entry.lastOrderTry, locale)}</span>
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-text-primary" />
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
