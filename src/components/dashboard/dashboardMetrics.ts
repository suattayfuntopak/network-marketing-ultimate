import type { ContactRow, OrderRow, TaskRow } from '@/lib/queries'
import type { Event } from '@/types'

export type Locale = 'tr' | 'en'

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

export function dayKey(value: Date) {
  const date = startOfDay(value)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

export function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function formatTRY(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

export type DeltaInfo = {
  diff: number
  percent: number | null
  positive: boolean
  neutral: boolean
}

export function calcDelta(current: number, previous: number): DeltaInfo {
  const diff = current - previous
  if (previous === 0) {
    return {
      diff,
      percent: current === 0 ? 0 : null,
      positive: diff >= 0,
      neutral: current === 0,
    }
  }
  return {
    diff,
    percent: Math.round((diff / previous) * 100),
    positive: diff >= 0,
    neutral: diff === 0,
  }
}

export function formatDelta(delta: DeltaInfo, locale: Locale) {
  if (delta.neutral) return locale === 'tr' ? 'Değişim yok' : 'No change'
  if (delta.percent === null) {
    const prefix = delta.diff > 0 ? '+' : ''
    return `${prefix}${delta.diff}`
  }
  const prefix = delta.percent > 0 ? '+' : ''
  return `${prefix}${delta.percent}%`
}

export function formatTRYDelta(delta: DeltaInfo, locale: Locale) {
  if (delta.neutral) return locale === 'tr' ? 'Değişim yok' : 'No change'
  if (delta.percent === null) {
    const prefix = delta.diff > 0 ? '+' : ''
    return `${prefix}${formatTRY(delta.diff, locale)}`
  }
  const prefix = delta.percent > 0 ? '+' : ''
  return `${prefix}${delta.percent}%`
}

type WindowBounds = { start: Date; end: Date }

export function todayBounds(reference: Date): WindowBounds {
  return { start: startOfDay(reference), end: endOfDay(reference) }
}

export function weekBounds(reference: Date): WindowBounds {
  return {
    start: startOfDay(addDays(reference, -6)),
    end: endOfDay(reference),
  }
}

export function monthBounds(reference: Date): WindowBounds {
  return {
    start: startOfDay(addDays(reference, -29)),
    end: endOfDay(reference),
  }
}

function inWindow(value: string | null | undefined, bounds: WindowBounds) {
  const parsed = parseDate(value)
  if (!parsed) return false
  return parsed >= bounds.start && parsed <= bounds.end
}

export function sumOrderRevenue(orders: OrderRow[], bounds: WindowBounds) {
  return orders
    .filter((order) => order.status !== 'cancelled' && inWindow(order.order_date, bounds))
    .reduce((sum, order) => sum + (order.total_try ?? 0), 0)
}

export function countOrders(orders: OrderRow[], bounds: WindowBounds) {
  return orders.filter((order) => order.status !== 'cancelled' && inWindow(order.order_date, bounds)).length
}

export type RevenueSnapshot = {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  todayDelta: DeltaInfo
  weekDelta: DeltaInfo
  monthDelta: DeltaInfo
  weekOrderCount: number
  avgOrderValue: number
  sparkline: { day: string; revenue: number }[]
}

export function buildRevenueSnapshot(orders: OrderRow[], reference: Date): RevenueSnapshot {
  const today = todayBounds(reference)
  const yesterday = todayBounds(addDays(reference, -1))
  const thisWeek = weekBounds(reference)
  const lastWeek: WindowBounds = {
    start: startOfDay(addDays(reference, -13)),
    end: endOfDay(addDays(reference, -7)),
  }
  const thisMonth = monthBounds(reference)
  const lastMonth: WindowBounds = {
    start: startOfDay(addDays(reference, -59)),
    end: endOfDay(addDays(reference, -30)),
  }

  const todayRevenue = sumOrderRevenue(orders, today)
  const yesterdayRevenue = sumOrderRevenue(orders, yesterday)
  const weekRevenue = sumOrderRevenue(orders, thisWeek)
  const lastWeekRevenue = sumOrderRevenue(orders, lastWeek)
  const monthRevenue = sumOrderRevenue(orders, thisMonth)
  const lastMonthRevenue = sumOrderRevenue(orders, lastMonth)
  const weekOrderCount = countOrders(orders, thisWeek)

  const sparkline = Array.from({ length: 14 }).map((_, index) => {
    const day = addDays(reference, -(13 - index))
    const bounds = todayBounds(day)
    return {
      day: dayKey(day),
      revenue: sumOrderRevenue(orders, bounds),
    }
  })

  return {
    todayRevenue,
    weekRevenue,
    monthRevenue,
    todayDelta: calcDelta(todayRevenue, yesterdayRevenue),
    weekDelta: calcDelta(weekRevenue, lastWeekRevenue),
    monthDelta: calcDelta(monthRevenue, lastMonthRevenue),
    weekOrderCount,
    avgOrderValue: weekOrderCount > 0 ? weekRevenue / weekOrderCount : 0,
    sparkline,
  }
}

export function computeActivityStreak(contacts: ContactRow[], tasks: TaskRow[], reference: Date) {
  const activeKeys = new Set<string>()
  for (const contact of contacts) {
    if (contact.last_contact_date) {
      activeKeys.add(dayKey(new Date(contact.last_contact_date)))
    }
  }
  for (const task of tasks) {
    if (task.status === 'completed' && task.completed_at) {
      activeKeys.add(dayKey(new Date(task.completed_at)))
    }
  }

  let streak = 0
  let cursor = startOfDay(reference)
  while (activeKeys.has(dayKey(cursor))) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  let longest = 0
  let running = 0
  const lookback = 180
  for (let i = lookback; i >= 0; i -= 1) {
    const day = addDays(reference, -i)
    if (activeKeys.has(dayKey(day))) {
      running += 1
      if (running > longest) longest = running
    } else {
      running = 0
    }
  }

  return { current: streak, longest }
}

export type HeatmapCell = {
  date: Date
  key: string
  intensity: number
  touches: number
  tasks: number
  orders: number
  weekday: number
}

export function buildActivityHeatmap(
  contacts: ContactRow[],
  tasks: TaskRow[],
  orders: OrderRow[],
  reference: Date,
  weeks = 12,
): HeatmapCell[] {
  const dailyTouches = new Map<string, number>()
  const dailyTasks = new Map<string, number>()
  const dailyOrders = new Map<string, number>()

  for (const contact of contacts) {
    if (!contact.last_contact_date) continue
    const key = dayKey(new Date(contact.last_contact_date))
    dailyTouches.set(key, (dailyTouches.get(key) ?? 0) + 1)
  }
  for (const task of tasks) {
    if (task.status !== 'completed' || !task.completed_at) continue
    const key = dayKey(new Date(task.completed_at))
    dailyTasks.set(key, (dailyTasks.get(key) ?? 0) + 1)
  }
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const key = dayKey(new Date(order.order_date))
    dailyOrders.set(key, (dailyOrders.get(key) ?? 0) + 1)
  }

  const total = weeks * 7
  const end = startOfDay(reference)
  const endWeekday = (end.getDay() + 6) % 7 // Monday=0
  const gridEnd = addDays(end, 6 - endWeekday)

  const cells: HeatmapCell[] = []
  for (let i = total - 1; i >= 0; i -= 1) {
    const date = addDays(gridEnd, -(total - 1 - i))
    const key = dayKey(date)
    const touches = dailyTouches.get(key) ?? 0
    const tasksCount = dailyTasks.get(key) ?? 0
    const ordersCount = dailyOrders.get(key) ?? 0
    const intensity = touches + tasksCount + ordersCount
    cells.push({
      date,
      key,
      intensity,
      touches,
      tasks: tasksCount,
      orders: ordersCount,
      weekday: (date.getDay() + 6) % 7,
    })
  }

  return cells
}

export type PipelineSegment = {
  id: 'cold' | 'warming' | 'hot' | 'converted' | 'lost'
  labelTr: string
  labelEn: string
  count: number
  stages: string[]
  color: string
}

const SEGMENT_DEFS: { id: PipelineSegment['id']; stages: string[]; color: string; labelTr: string; labelEn: string }[] = [
  {
    id: 'cold',
    stages: ['new', 'contact_planned', 'first_contact', 'nurture_later', 'dormant'],
    color: '#3b82f6',
    labelTr: 'Soğuk Havuz',
    labelEn: 'Cold Pool',
  },
  {
    id: 'warming',
    stages: ['interested', 'invited', 'presentation_sent', 'followup_pending', 'objection_handling'],
    color: '#8b5cf6',
    labelTr: 'Isınıyor',
    labelEn: 'Warming',
  },
  {
    id: 'hot',
    stages: ['presentation_done', 'ready_to_buy', 'ready_to_join'],
    color: '#f59e0b',
    labelTr: 'Kapanışa Yakın',
    labelEn: 'Near Close',
  },
  {
    id: 'converted',
    stages: ['became_customer', 'became_member'],
    color: '#10b981',
    labelTr: 'Dönüştü',
    labelEn: 'Converted',
  },
  {
    id: 'lost',
    stages: ['lost'],
    color: '#ef4444',
    labelTr: 'Kaybedildi',
    labelEn: 'Lost',
  },
]

export function buildPipelineSegments(contacts: ContactRow[]): PipelineSegment[] {
  return SEGMENT_DEFS.map((def) => ({
    id: def.id,
    labelTr: def.labelTr,
    labelEn: def.labelEn,
    stages: def.stages,
    color: def.color,
    count: contacts.filter((contact) => def.stages.includes(contact.pipeline_stage)).length,
  }))
}

export type ReorderDueEntry = {
  orderId: string
  contactId: string
  contactName: string
  dueDate: Date
  status: 'overdue' | 'today' | 'upcoming'
  daysFromToday: number
  lastOrderTry: number
}

export function buildReorderDue(
  orders: OrderRow[],
  contacts: ContactRow[],
  reference: Date,
  horizonDays = 14,
): ReorderDueEntry[] {
  const today = startOfDay(reference)
  const horizon = addDays(today, horizonDays)
  const contactMap = new Map(contacts.map((contact) => [contact.id, contact]))

  const latestByContact = new Map<string, OrderRow>()
  for (const order of orders) {
    if (!order.next_reorder_date) continue
    const existing = latestByContact.get(order.contact_id)
    if (!existing || new Date(order.order_date) > new Date(existing.order_date)) {
      latestByContact.set(order.contact_id, order)
    }
  }

  const entries: ReorderDueEntry[] = []
  for (const order of latestByContact.values()) {
    if (!order.next_reorder_date) continue
    const due = startOfDay(new Date(order.next_reorder_date))
    if (due > horizon) continue
    const daysFromToday = Math.round((due.getTime() - today.getTime()) / 86400000)
    const status: ReorderDueEntry['status'] = daysFromToday < 0 ? 'overdue' : daysFromToday === 0 ? 'today' : 'upcoming'
    const contact = contactMap.get(order.contact_id)
    entries.push({
      orderId: order.id,
      contactId: order.contact_id,
      contactName: contact?.full_name ?? '—',
      dueDate: due,
      status,
      daysFromToday,
      lastOrderTry: order.total_try ?? 0,
    })
  }

  return entries.sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())
}

export type UpcomingEventEntry = {
  id: string
  title: string
  startDate: Date
  type: string
  confirmed: number
  invited: number
  capacity: number | null
}

export function buildUpcomingEvents(events: Event[], reference: Date, horizonDays = 14): UpcomingEventEntry[] {
  const today = startOfDay(reference)
  const horizon = addDays(today, horizonDays)
  return events
    .filter((event) => {
      const start = new Date(event.startDate)
      return start >= today && start <= horizon && event.status !== 'cancelled'
    })
    .map((event) => ({
      id: event.id,
      title: event.title,
      startDate: new Date(event.startDate),
      type: event.type,
      confirmed: event.attendees.filter((attendee) => attendee.rsvpStatus === 'confirmed' || attendee.rsvpStatus === 'attended').length,
      invited: event.attendees.length,
      capacity: event.maxAttendees ?? null,
    }))
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime())
}
