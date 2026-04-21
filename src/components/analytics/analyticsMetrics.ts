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
