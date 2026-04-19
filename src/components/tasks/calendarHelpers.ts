import { cn } from '@/lib/utils'
import type { TaskRow } from '@/lib/queries'
import type { Event } from '@/types'

export type CalendarViewMode = 'month' | 'week' | 'day'

export type CalendarContext = {
  viewMode: CalendarViewMode
  focusDate: string
}

export type CalendarEntry = {
  id: string
  kind: 'task' | 'event'
  title: string
  day: Date
  sortDate: Date
  tone: 'primary' | 'success' | 'warning' | 'secondary' | 'default'
  meta: string
  task?: TaskRow
  event?: Event
}

export const CALENDAR_HOUR_START = 7
export const CALENDAR_HOUR_END = 21
export const CALENDAR_HOUR_HEIGHT = 56
export const CALENDAR_HOURS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START + 1 },
  (_, index) => CALENDAR_HOUR_START + index,
)

export function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

export function startOfWeek(value: Date) {
  const date = startOfDay(value)
  const dayIndex = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - dayIndex)
  return date
}

export function endOfWeek(value: Date) {
  const date = startOfWeek(value)
  date.setDate(date.getDate() + 6)
  return date
}

export function addDays(value: Date, amount: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

export function dayKey(value: Date) {
  const date = startOfDay(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function sameDay(left: Date, right: Date) {
  return dayKey(left) === dayKey(right)
}

export function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

export function isWithinRange(value: Date, from: Date, to: Date) {
  const target = startOfDay(value).getTime()
  return target >= startOfDay(from).getTime() && target <= startOfDay(to).getTime()
}

export function buildMonthGrid(currentDate: Date) {
  const monthStart = startOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart)

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function buildWeekDays(currentDate: Date) {
  const firstDay = startOfWeek(currentDate)
  return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index))
}

export function toInputDate(value: Date) {
  const date = startOfDay(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function itemTone(task: TaskRow): CalendarEntry['tone'] {
  if (task.status === 'overdue') return 'warning'
  if (task.priority === 'urgent' || task.priority === 'high') return 'secondary'
  if (task.priority === 'medium') return 'primary'
  return 'default'
}

export function shiftDate(value: Date, viewMode: CalendarViewMode, direction: 'prev' | 'next') {
  const multiplier = direction === 'prev' ? -1 : 1

  if (viewMode === 'day') {
    return addDays(value, multiplier)
  }

  if (viewMode === 'week') {
    return addDays(value, 7 * multiplier)
  }

  return new Date(value.getFullYear(), value.getMonth() + multiplier, value.getDate())
}

export function formatPeriodTitle(locale: 'tr' | 'en', viewMode: CalendarViewMode, focusDate: Date) {
  if (viewMode === 'day') {
    return focusDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    })
  }

  if (viewMode === 'week') {
    const weekStart = startOfWeek(focusDate)
    const weekEnd = endOfWeek(focusDate)
    const startLabel = weekStart.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
    })
    const endLabel = weekEnd.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${startLabel} - ${endLabel}`
  }

  return focusDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function entryToneClasses(entry: CalendarEntry) {
  return cn(
    'border',
    entry.tone === 'success' && 'bg-success/10 text-success border-success/20',
    entry.tone === 'secondary' && 'bg-secondary/10 text-secondary border-secondary/20',
    entry.tone === 'warning' && 'bg-warning/10 text-warning border-warning/20',
    entry.tone === 'primary' && 'bg-primary/10 text-primary border-primary/20',
    entry.tone === 'default' && 'bg-surface/70 text-text-secondary border-border-subtle',
  )
}

export function isTimedCalendarEntry(entry: CalendarEntry) {
  return entry.kind === 'event' && Boolean(entry.event)
}

export function entryStart(entry: CalendarEntry) {
  if (!entry.event) return null
  return new Date(entry.event.startDate)
}

export function entryEnd(entry: CalendarEntry) {
  if (!entry.event) return null
  return new Date(entry.event.endDate)
}

export function formatHourLabel(hour: number) {
  return `${`${hour}`.padStart(2, '0')}:00`
}
