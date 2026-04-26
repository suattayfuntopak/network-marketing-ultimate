import type { ContactRow, InteractionRow, OrderRow, TaskRow } from '@/lib/queries'
import { CONTACT_ACTIVITY_LOG_CHANNEL } from '@/lib/contactActivityLog'
import type { Event } from '@/types'

export type Locale = 'tr' | 'en'
export type RangeOption = '7d' | '30d' | '90d' | 'all'

export function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

export function endOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(23, 59, 59, 999)
  return next
}

export function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(value: Date, months: number) {
  const next = new Date(value)
  next.setMonth(next.getMonth() + months)
  return next
}

export function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export type Bounds = { start: Date | null; end: Date }

export function inDateRange(value: string | null | undefined, bounds: Bounds) {
  const parsed = parseDate(value)
  if (!parsed) return false
  if (!bounds.start) return parsed <= bounds.end
  return parsed >= bounds.start && parsed <= bounds.end
}

export function getRangeBounds(range: RangeOption, today: Date) {
  if (range === 'all') {
    return {
      start: null as Date | null,
      end: endOfDay(today),
      previousStart: null as Date | null,
      previousEnd: null as Date | null,
    }
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const end = endOfDay(today)
  const start = startOfDay(addDays(today, -(days - 1)))
  const previousEnd = endOfDay(addDays(start, -1))
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)))
  return { start, end, previousStart, previousEnd }
}

export function percent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

export function periodLabel(range: RangeOption, locale: Locale) {
  if (locale === 'tr') {
    if (range === '7d') return 'Son 7 gün'
    if (range === '30d') return 'Son 30 gün'
    if (range === '90d') return 'Son 90 gün'
    return 'Tüm zamanlar'
  }

  if (range === '7d') return 'Last 7 days'
  if (range === '30d') return 'Last 30 days'
  if (range === '90d') return 'Last 90 days'
  return 'All time'
}

export function rangeButtonLabel(range: RangeOption, locale: Locale) {
  if (range === 'all') return locale === 'tr' ? 'Tümü' : 'All'
  const number = range.replace('d', '')
  return locale === 'tr' ? `${number}G` : `${number}D`
}

export function formatTRY(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatBucketLabel(start: Date, end: Date, range: RangeOption, locale: Locale) {
  if (range === 'all') {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' }).format(start)
  }
  const dayFormatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })

  if (start.getTime() === end.getTime()) {
    return dayFormatter.format(start)
  }

  return `${dayFormatter.format(start)}-${new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric' }).format(end)}`
}

export function buildRevenueSeries(
  range: RangeOption,
  locale: Locale,
  orders: OrderRow[],
  end: Date,
) {
  if (range === 'all') {
    return Array.from({ length: 6 }).map((_, index) => {
      const monthStart = startOfDay(addMonths(new Date(end), -(5 - index)))
      monthStart.setDate(1)
      const monthEnd = endOfDay(addMonths(monthStart, 1))
      monthEnd.setDate(0)

      return {
        label: formatBucketLabel(monthStart, monthStart, range, locale),
        revenue: orders
          .filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, { start: monthStart, end: monthEnd }))
          .reduce((sum, order) => sum + (order.total_try ?? 0), 0),
        orders: orders.filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, { start: monthStart, end: monthEnd })).length,
      }
    })
  }

  const bucketSize = range === '7d' ? 1 : range === '30d' ? 5 : 15
  const bucketCount = range === '7d' ? 7 : 6

  return Array.from({ length: bucketCount }).map((_, index) => {
    const bucketStart = startOfDay(addDays(end, -((bucketCount - 1 - index) * bucketSize)))
    const normalizedStart = range === '7d' ? bucketStart : startOfDay(addDays(bucketStart, -(bucketSize - 1)))
    const bucketEnd = endOfDay(range === '7d' ? bucketStart : addDays(normalizedStart, bucketSize - 1))

    return {
      label: formatBucketLabel(normalizedStart, range === '7d' ? normalizedStart : bucketEnd, range, locale),
      revenue: orders
        .filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, { start: normalizedStart, end: bucketEnd }))
        .reduce((sum, order) => sum + (order.total_try ?? 0), 0),
      orders: orders.filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, { start: normalizedStart, end: bucketEnd })).length,
    }
  })
}

export function buildTrendSeries(
  range: RangeOption,
  locale: Locale,
  contacts: ContactRow[],
  tasks: TaskRow[],
  end: Date,
) {
  if (range === 'all') {
    return Array.from({ length: 6 }).map((_, index) => {
      const monthStart = startOfDay(addMonths(new Date(end), -(5 - index)))
      monthStart.setDate(1)
      const monthEnd = endOfDay(addMonths(monthStart, 1))
      monthEnd.setDate(0)
      const bounds: Bounds = { start: monthStart, end: monthEnd }

      return {
        label: formatBucketLabel(monthStart, monthStart, range, locale),
        contacts: contacts.filter((contact) => inDateRange(contact.created_at, bounds)).length,
        touches: contacts.filter((contact) => inDateRange(contact.last_contact_date, bounds)).length,
        presentations: tasks.filter((task) => task.type === 'presentation' && inDateRange(task.due_date, bounds)).length,
      }
    })
  }

  const bucketSize = range === '7d' ? 1 : range === '30d' ? 5 : 15
  const bucketCount = range === '7d' ? 7 : 6

  return Array.from({ length: bucketCount }).map((_, index) => {
    const bucketStart = startOfDay(addDays(end, -((bucketCount - 1 - index) * bucketSize)))
    const normalizedStart = range === '7d' ? bucketStart : startOfDay(addDays(bucketStart, -(bucketSize - 1)))
    const bucketEnd = endOfDay(range === '7d' ? bucketStart : addDays(normalizedStart, bucketSize - 1))
    const bounds: Bounds = { start: normalizedStart, end: bucketEnd }

    return {
      label: formatBucketLabel(normalizedStart, range === '7d' ? normalizedStart : bucketEnd, range, locale),
      contacts: contacts.filter((contact) => inDateRange(contact.created_at, bounds)).length,
      touches: contacts.filter((contact) => inDateRange(contact.last_contact_date, bounds)).length,
      presentations: tasks.filter((task) => task.type === 'presentation' && inDateRange(task.due_date, bounds)).length,
    }
  })
}

export type InteractionMixEntry = {
  label: string
  call: number
  message: number
  meeting: number
  presentation: number
  other: number
}

const INTERACTION_TYPE_TO_KEY: Record<InteractionRow['type'], keyof Omit<InteractionMixEntry, 'label'>> = {
  call: 'call',
  message: 'message',
  meeting: 'meeting',
  presentation: 'presentation',
  email: 'other',
  note: 'other',
  follow_up: 'other',
}

export function buildInteractionMix(
  range: RangeOption,
  locale: Locale,
  interactions: InteractionRow[],
  end: Date,
): InteractionMixEntry[] {
  const buckets = range === 'all'
    ? Array.from({ length: 6 }).map((_, index) => {
        const start = startOfDay(addMonths(new Date(end), -(5 - index)))
        start.setDate(1)
        const bucketEnd = endOfDay(addMonths(start, 1))
        bucketEnd.setDate(0)
        return { start, end: bucketEnd }
      })
    : Array.from({ length: range === '7d' ? 7 : 6 }).map((_, index) => {
        const bucketSize = range === '7d' ? 1 : range === '30d' ? 5 : 15
        const bucketCount = range === '7d' ? 7 : 6
        const bucketStart = startOfDay(addDays(end, -((bucketCount - 1 - index) * bucketSize)))
        const normalizedStart = range === '7d' ? bucketStart : startOfDay(addDays(bucketStart, -(bucketSize - 1)))
        const bucketEnd = endOfDay(range === '7d' ? bucketStart : addDays(normalizedStart, bucketSize - 1))
        return { start: normalizedStart, end: bucketEnd }
      })

  return buckets.map((bucket) => {
    const entry: InteractionMixEntry = {
      label: formatBucketLabel(bucket.start, bucket.end, range, locale),
      call: 0,
      message: 0,
      meeting: 0,
      presentation: 0,
      other: 0,
    }
    for (const interaction of interactions) {
      if (interaction.channel === CONTACT_ACTIVITY_LOG_CHANNEL) continue
      const parsed = parseDate(interaction.date)
      if (!parsed) continue
      if (parsed < bucket.start || parsed > bucket.end) continue
      const key = INTERACTION_TYPE_TO_KEY[interaction.type] ?? 'other'
      entry[key] += 1
    }
    return entry
  })
}

export type CohortRow = {
  key: string
  label: string
  entered: number
  touched: number
  presented: number
  converted: number
}

export function buildCohortTable(contacts: ContactRow[], locale: Locale, months = 6): CohortRow[] {
  const now = new Date()
  const rows: CohortRow[] = []
  for (let i = months - 1; i >= 0; i -= 1) {
    const cohortStart = startOfDay(addMonths(new Date(now), -i))
    cohortStart.setDate(1)
    const cohortEnd = endOfDay(addMonths(cohortStart, 1))
    cohortEnd.setDate(0)

    const members = contacts.filter((contact) => {
      const created = parseDate(contact.created_at)
      if (!created) return false
      return created >= cohortStart && created <= cohortEnd
    })

    const touched = members.filter((contact) => Boolean(contact.last_contact_date))
    const presented = members.filter((contact) =>
      ['presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy', 'became_customer', 'became_member'].includes(contact.pipeline_stage),
    )
    const converted = members.filter((contact) =>
      ['became_customer', 'became_member'].includes(contact.pipeline_stage),
    )

    rows.push({
      key: cohortStart.toISOString().split('T')[0],
      label: formatBucketLabel(cohortStart, cohortStart, 'all', locale),
      entered: members.length,
      touched: touched.length,
      presented: presented.length,
      converted: converted.length,
    })
  }
  return rows
}

export type EventPerformanceRow = {
  id: string
  title: string
  startDate: Date
  status: string
  invited: number
  confirmed: number
  attended: number
  noShow: number
  converted: number
  fillRate: number | null
  showRate: number | null
  conversionRate: number | null
}

export function buildEventPerformance(events: Event[], limit = 6): EventPerformanceRow[] {
  return events
    .slice()
    .sort((left, right) => new Date(right.startDate).getTime() - new Date(left.startDate).getTime())
    .slice(0, limit)
    .map((event) => {
      const invited = event.attendees.length
      const confirmed = event.attendees.filter((attendee) => attendee.rsvpStatus === 'confirmed' || attendee.rsvpStatus === 'attended').length
      const attended = event.attendees.filter((attendee) => attendee.rsvpStatus === 'attended').length
      const noShow = event.attendees.filter((attendee) => attendee.rsvpStatus === 'no_show').length
      const converted = event.attendees.filter((attendee) => attendee.followUpStatus === 'converted').length
      return {
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        status: event.status,
        invited,
        confirmed,
        attended,
        noShow,
        converted,
        fillRate: event.maxAttendees && event.maxAttendees > 0 ? percent(confirmed, event.maxAttendees) : null,
        showRate: confirmed > 0 ? percent(attended, confirmed) : null,
        conversionRate: invited > 0 ? percent(converted, invited) : null,
      }
    })
}

export type TopProductRow = {
  productId: string
  name: string
  quantity: number
  revenue: number
  orderCount: number
}

export function buildTopProducts(orders: OrderRow[], bounds: Bounds, limit = 6): TopProductRow[] {
  const aggregate = new Map<string, TopProductRow>()
  const scoped = orders.filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, bounds))

  for (const order of scoped) {
    const items = (order.items ?? []) as Array<{ product_id: string; product_name: string; quantity: number; unit_price_try: number }>
    for (const item of items) {
      const key = item.product_id ?? item.product_name ?? 'unknown'
      const existing = aggregate.get(key) ?? {
        productId: key,
        name: item.product_name ?? key,
        quantity: 0,
        revenue: 0,
        orderCount: 0,
      }
      existing.quantity += item.quantity ?? 0
      existing.revenue += (item.quantity ?? 0) * (item.unit_price_try ?? 0)
      existing.orderCount += 1
      aggregate.set(key, existing)
    }
  }

  return Array.from(aggregate.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, limit)
}

export type TeamLeaderboardEntry = {
  id: string
  name: string
  touches: number
  presentations: number
  conversions: number
  completedTasks: number
  overdue: number
  score: number
  spark: { value: number }[]
}

export function buildTeamLeaderboard(
  contacts: ContactRow[],
  tasks: TaskRow[],
  bounds: Bounds,
  reference: Date,
  limit = 6,
): TeamLeaderboardEntry[] {
  const members = contacts.filter((contact) => contact.pipeline_stage === 'became_member')
  const sparkDays = 14

  const rows = members.map<TeamLeaderboardEntry>((member) => {
    const memberTasks = tasks.filter((task) => task.contact_id === member.id)
    const periodTasks = memberTasks.filter((task) => inDateRange(task.due_date, bounds))
    const touches = periodTasks.filter((task) => task.type === 'call' || task.type === 'follow_up' || task.type === 'meeting').length
    const presentations = periodTasks.filter((task) => task.type === 'presentation').length
    const conversions = periodTasks.filter((task) => task.status === 'completed' && task.type === 'presentation').length
    const completedTasks = periodTasks.filter((task) => task.status === 'completed').length
    const overdue = memberTasks.filter((task) => task.status === 'overdue').length

    const spark = Array.from({ length: sparkDays }).map((_, index) => {
      const day = addDays(reference, -(sparkDays - 1 - index))
      const dayKey = day.toISOString().split('T')[0]
      const value = memberTasks.filter((task) => task.completed_at && task.completed_at.split('T')[0] === dayKey).length
      return { value }
    })

    const score = completedTasks * 3 + touches * 2 + presentations * 4 + conversions * 10 - overdue * 2

    return {
      id: member.id,
      name: member.full_name,
      touches,
      presentations,
      conversions,
      completedTasks,
      overdue,
      score: Math.max(score, 0),
      spark,
    }
  })

  return rows.sort((left, right) => right.score - left.score).slice(0, limit)
}

type Bucket = { start: Date; end: Date }

function bucketsForRange(range: RangeOption, end: Date): Bucket[] {
  if (range === 'all') {
    return Array.from({ length: 6 }).map((_, index) => {
      const start = startOfDay(addMonths(new Date(end), -(5 - index)))
      start.setDate(1)
      const bucketEnd = endOfDay(addMonths(start, 1))
      bucketEnd.setDate(0)
      return { start, end: bucketEnd }
    })
  }

  const bucketSize = range === '7d' ? 1 : range === '30d' ? 5 : 15
  const bucketCount = range === '7d' ? 7 : 6

  return Array.from({ length: bucketCount }).map((_, index) => {
    const bucketStart = startOfDay(addDays(end, -((bucketCount - 1 - index) * bucketSize)))
    const normalizedStart = range === '7d' ? bucketStart : startOfDay(addDays(bucketStart, -(bucketSize - 1)))
    const bucketEnd = endOfDay(range === '7d' ? bucketStart : addDays(normalizedStart, bucketSize - 1))
    return { start: normalizedStart, end: bucketEnd }
  })
}

export function buildTeamAddsSeries(
  range: RangeOption,
  contacts: ContactRow[],
  end: Date,
): { value: number }[] {
  const buckets = bucketsForRange(range, end)
  return buckets.map((bucket) => ({
    value: contacts.filter((contact) => {
      if (contact.pipeline_stage !== 'became_member') return false
      const movedAt = parseDate(contact.updated_at) ?? parseDate(contact.created_at)
      if (!movedAt) return false
      return movedAt >= bucket.start && movedAt <= bucket.end
    }).length,
  }))
}

export function buildOverdueSeries(
  range: RangeOption,
  tasks: TaskRow[],
  end: Date,
): { value: number }[] {
  const buckets = bucketsForRange(range, end)
  return buckets.map((bucket) => {
    const moment = bucket.end.getTime()
    return {
      value: tasks.filter((task) => {
        if (task.status === 'skipped') return false
        if (task.status === 'completed') {
          if (!task.completed_at) return false
          if (new Date(task.completed_at).getTime() <= moment) return false
        }
        const due = parseDate(task.due_date)
        if (!due) return false
        return due.getTime() < moment
      }).length,
    }
  })
}

export type CustomerInsightsSummary = {
  active: number
  newInPeriod: number
  churnRisk: number
  topCustomers: Array<{ contactId: string; revenue: number; orders: number; lastOrderAt: string | null }>
  trend: { label: string; active: number; churnRisk: number }[]
}

export function buildCustomerInsights(
  range: RangeOption,
  locale: Locale,
  customerIds: string[] | null,
  contacts: ContactRow[],
  orders: OrderRow[],
  bounds: Bounds,
  end: Date,
): CustomerInsightsSummary {
  const customerSet = customerIds && customerIds.length > 0 ? new Set(customerIds) : null
  const isCustomerContact = (contactId: string, contact?: ContactRow) => {
    if (customerSet) return customerSet.has(contactId)
    return contact?.pipeline_stage === 'became_customer'
  }

  const activeContacts = contacts.filter((contact) => isCustomerContact(contact.id, contact))
  const active = activeContacts.length

  const newInPeriod = activeContacts.filter((contact) => {
    const reference = parseDate(contact.updated_at) ?? parseDate(contact.created_at)
    if (!reference) return false
    return inDateRange(reference.toISOString(), bounds)
  }).length

  const churnCutoff = addDays(end, -90)
  const lastOrderByContact = new Map<string, Date>()
  const revenueByContact = new Map<string, { revenue: number; orders: number }>()

  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const contactId = order.contact_id
    if (!contactId) continue
    const orderDate = parseDate(order.order_date)
    if (orderDate) {
      const existing = lastOrderByContact.get(contactId)
      if (!existing || orderDate > existing) {
        lastOrderByContact.set(contactId, orderDate)
      }
    }
    if (inDateRange(order.order_date, bounds)) {
      const summary = revenueByContact.get(contactId) ?? { revenue: 0, orders: 0 }
      summary.revenue += order.total_try ?? 0
      summary.orders += 1
      revenueByContact.set(contactId, summary)
    }
  }

  const churnRisk = activeContacts.filter((contact) => {
    const lastOrder = lastOrderByContact.get(contact.id)
    if (!lastOrder) return true
    return lastOrder < churnCutoff
  }).length

  const topCustomers = Array.from(revenueByContact.entries())
    .filter(([contactId]) => isCustomerContact(contactId))
    .map(([contactId, summary]) => ({
      contactId,
      revenue: summary.revenue,
      orders: summary.orders,
      lastOrderAt: lastOrderByContact.get(contactId)?.toISOString() ?? null,
    }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5)

  const buckets = bucketsForRange(range, end)
  const trend = buckets.map((bucket) => {
    const activeAt = activeContacts.filter((contact) => {
      const reference = parseDate(contact.created_at)
      if (!reference) return false
      return reference <= bucket.end
    }).length
    const cutoff = addDays(bucket.end, -90)
    const risk = activeContacts.filter((contact) => {
      const reference = parseDate(contact.created_at)
      if (!reference || reference > bucket.end) return false
      const lastOrder = lastOrderByContact.get(contact.id)
      if (!lastOrder) return true
      return lastOrder < cutoff
    }).length
    return {
      label: formatBucketLabel(bucket.start, bucket.end, range, locale),
      active: activeAt,
      churnRisk: risk,
    }
  })

  return { active, newInPeriod, churnRisk, topCustomers, trend }
}

export type ProductPerformanceRow = {
  productId: string
  name: string
  units: number
  revenue: number
  orderCount: number
  reorderCycleDays: number | null
  avgDaysBetween: number | null
  reorderHealth: 'on_track' | 'slow' | 'unknown'
}

interface OrderItemSummary {
  product_id?: string | null
  product_name?: string | null
  name?: string | null
  quantity?: number | null
  unit_price_try?: number | null
  total_try?: number | null
}

export function buildProductPerformance(
  orders: OrderRow[],
  bounds: Bounds,
  productMeta: Map<string, { name: string; reorder_cycle_days: number | null }>,
  limit = 8,
): ProductPerformanceRow[] {
  const aggregate = new Map<string, ProductPerformanceRow & { dates: Date[] }>()
  const scoped = orders.filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, bounds))

  for (const order of scoped) {
    const items = Array.isArray(order.items) ? (order.items as OrderItemSummary[]) : []
    const orderDate = parseDate(order.order_date)
    for (const raw of items) {
      const productId = raw.product_id ?? null
      const meta = productId ? productMeta.get(productId) : null
      const key = productId ?? `name:${(raw.product_name ?? raw.name ?? 'unknown').toLowerCase()}`
      const name = meta?.name ?? raw.product_name ?? raw.name ?? 'Unknown product'
      const quantity = Number(raw.quantity ?? 0) || 0
      const unitPrice = Number(raw.unit_price_try ?? 0) || 0
      const lineRevenue = Number(raw.total_try ?? quantity * unitPrice) || 0
      const existing = aggregate.get(key)
      if (existing) {
        existing.units += quantity
        existing.revenue += lineRevenue
        existing.orderCount += 1
        if (orderDate) existing.dates.push(orderDate)
      } else {
        aggregate.set(key, {
          productId: key,
          name,
          units: quantity,
          revenue: lineRevenue,
          orderCount: 1,
          reorderCycleDays: meta?.reorder_cycle_days ?? null,
          avgDaysBetween: null,
          reorderHealth: 'unknown',
          dates: orderDate ? [orderDate] : [],
        })
      }
    }
  }

  return Array.from(aggregate.values())
    .map((row) => {
      let avgDaysBetween: number | null = null
      if (row.dates.length >= 2) {
        const sorted = row.dates.slice().sort((a, b) => a.getTime() - b.getTime())
        const gaps: number[] = []
        for (let i = 1; i < sorted.length; i += 1) {
          gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / 86400000)
        }
        avgDaysBetween = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
      }
      let reorderHealth: ProductPerformanceRow['reorderHealth'] = 'unknown'
      if (row.reorderCycleDays && avgDaysBetween) {
        reorderHealth = avgDaysBetween <= row.reorderCycleDays * 1.25 ? 'on_track' : 'slow'
      }
      return {
        productId: row.productId,
        name: row.name,
        units: row.units,
        revenue: row.revenue,
        orderCount: row.orderCount,
        reorderCycleDays: row.reorderCycleDays,
        avgDaysBetween,
        reorderHealth,
      }
    })
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, limit)
}

export type AiUsagePoint = { date: string; count: number }

export type EngagementSummary = {
  series: { label: string; value: number }[]
  todayUsage: number
  windowUsage: number
  windowLimit: number
}

export function buildEngagementMetrics(
  range: RangeOption,
  locale: Locale,
  aiUsage: AiUsagePoint[],
  end: Date,
): EngagementSummary {
  const buckets = bucketsForRange(range, end)
  const usageMap = new Map<string, number>()
  for (const point of aiUsage) {
    usageMap.set(point.date, (usageMap.get(point.date) ?? 0) + point.count)
  }
  const series = buckets.map((bucket) => {
    let value = 0
    for (const [dateKey, count] of usageMap.entries()) {
      const parsed = new Date(`${dateKey}T00:00:00.000Z`)
      if (parsed >= bucket.start && parsed <= bucket.end) {
        value += count
      }
    }
    return { label: formatBucketLabel(bucket.start, bucket.end, range, locale), value }
  })
  const todayKey = end.toISOString().slice(0, 10)
  const todayUsage = usageMap.get(todayKey) ?? 0
  const windowUsage = series.reduce((sum, point) => sum + point.value, 0)
  return { series, todayUsage, windowUsage, windowLimit: buckets.length * 50 }
}
