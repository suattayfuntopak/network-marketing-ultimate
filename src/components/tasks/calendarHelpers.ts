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
  startsAt?: Date | null
  endsAt?: Date | null
  tone: 'primary' | 'success' | 'warning' | 'secondary' | 'default'
  meta: string
  task?: TaskRow
  event?: Event
}

export const CALENDAR_HOUR_START = 0
export const CALENDAR_HOUR_END = 24
export const CALENDAR_HOUR_HEIGHT = 56
export const CALENDAR_HOURS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START },
  (_, index) => CALENDAR_HOUR_START + index,
)
export const CALENDAR_HOUR_BOUNDARIES = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START + 1 },
  (_, index) => CALENDAR_HOUR_START + index,
)

const TASK_TIME_PATTERN = /^(?:Saat|Time):\s*([01]\d|2[0-3]):([0-5]\d)$/i

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

export function fromInputDate(value: string) {
  const [year, month, day] = value.split('-').map((part) => Number(part))
  return new Date(year, month - 1, day)
}

export function itemTone(task: TaskRow): CalendarEntry['tone'] {
  if (task.status === 'overdue') return 'warning'
  if (task.priority === 'urgent' || task.priority === 'high') return 'secondary'
  if (task.priority === 'medium') return 'primary'
  return 'default'
}

export function parseTaskTime(description: string | null | undefined) {
  const lines = (description ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const timeLine = lines.find((line) => TASK_TIME_PATTERN.test(line))
  if (!timeLine) return null

  const match = timeLine.match(TASK_TIME_PATTERN)
  if (!match) return null

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  }
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
  return Boolean(entry.startsAt && entry.endsAt)
}

export function entryStart(entry: CalendarEntry) {
  if (!entry.startsAt) return null
  return new Date(entry.startsAt)
}

export function entryEnd(entry: CalendarEntry) {
  if (!entry.endsAt) return null
  return new Date(entry.endsAt)
}

export function formatHourLabel(hour: number) {
  return `${`${hour % 24}`.padStart(2, '0')}:00`
}
