'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { TaskRow } from '@/lib/queries'
import type { Event } from '@/types'
import {
  Bell,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Layers3,
} from 'lucide-react'

export type CalendarViewMode = 'month' | 'week' | 'day'

export type CalendarContext = {
  viewMode: CalendarViewMode
  focusDate: string
}

type CalendarEntry = {
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

const CALENDAR_HOUR_START = 7
const CALENDAR_HOUR_END = 21
const CALENDAR_HOUR_HEIGHT = 56
const CALENDAR_HOURS = Array.from(
  { length: CALENDAR_HOUR_END - CALENDAR_HOUR_START + 1 },
  (_, index) => CALENDAR_HOUR_START + index,
)

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function startOfWeek(value: Date) {
  const date = startOfDay(value)
  const dayIndex = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - dayIndex)
  return date
}

function endOfWeek(value: Date) {
  const date = startOfWeek(value)
  date.setDate(date.getDate() + 6)
  return date
}

function addDays(value: Date, amount: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + amount)
  return date
}

function dayKey(value: Date) {
  const date = startOfDay(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function sameDay(left: Date, right: Date) {
  return dayKey(left) === dayKey(right)
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function isWithinRange(value: Date, from: Date, to: Date) {
  const target = startOfDay(value).getTime()
  return target >= startOfDay(from).getTime() && target <= startOfDay(to).getTime()
}

function buildMonthGrid(currentDate: Date) {
  const monthStart = startOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart)

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

function buildWeekDays(currentDate: Date) {
  const firstDay = startOfWeek(currentDate)
  return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index))
}

function toInputDate(value: Date) {
  const date = startOfDay(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function itemTone(task: TaskRow): CalendarEntry['tone'] {
  if (task.status === 'overdue') return 'warning'
  if (task.priority === 'urgent' || task.priority === 'high') return 'secondary'
  if (task.priority === 'medium') return 'primary'
  return 'default'
}

function shiftDate(value: Date, viewMode: CalendarViewMode, direction: 'prev' | 'next') {
  const multiplier = direction === 'prev' ? -1 : 1

  if (viewMode === 'day') {
    return addDays(value, multiplier)
  }

  if (viewMode === 'week') {
    return addDays(value, 7 * multiplier)
  }

  return new Date(value.getFullYear(), value.getMonth() + multiplier, value.getDate())
}

function formatPeriodTitle(locale: 'tr' | 'en', viewMode: CalendarViewMode, focusDate: Date) {
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

function entryToneClasses(entry: CalendarEntry) {
  return cn(
    'border',
    entry.tone === 'success' && 'bg-success/10 text-success border-success/20',
    entry.tone === 'secondary' && 'bg-secondary/10 text-secondary border-secondary/20',
    entry.tone === 'warning' && 'bg-warning/10 text-warning border-warning/20',
    entry.tone === 'primary' && 'bg-primary/10 text-primary border-primary/20',
    entry.tone === 'default' && 'bg-surface/70 text-text-secondary border-border-subtle',
  )
}

function isTimedCalendarEntry(entry: CalendarEntry) {
  return entry.kind === 'event' && Boolean(entry.event)
}

function entryStart(entry: CalendarEntry) {
  if (!entry.event) return null
  return new Date(entry.event.startDate)
}

function entryEnd(entry: CalendarEntry) {
  if (!entry.event) return null
  return new Date(entry.event.endDate)
}

function formatHourLabel(hour: number) {
  return `${`${hour}`.padStart(2, '0')}:00`
}

export function ActionCalendarPanel({
  locale,
  tasks,
  events,
  contactMap,
  initialViewMode = 'month',
  initialFocusDate,
  onOpenEvents,
  onOpenTasks,
  onCreateEvent,
  onCreateTask,
  onOpenTask,
  onOpenEvent,
}: {
  locale: 'tr' | 'en'
  tasks: TaskRow[]
  events: Event[]
  contactMap: Record<string, string>
  initialViewMode?: CalendarViewMode
  initialFocusDate?: Date
  onOpenEvents: () => void
  onOpenTasks: () => void
  onCreateEvent: (date?: string, context?: CalendarContext) => void
  onCreateTask: (date?: string) => void
  onOpenTask?: (task: TaskRow, context?: CalendarContext) => void
  onOpenEvent?: (event: Event, context?: CalendarContext) => void
}) {
  const today = startOfDay(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode)
  const [focusDate, setFocusDate] = useState(initialFocusDate ? startOfDay(initialFocusDate) : today)

  const labels = locale === 'tr'
    ? {
        title: 'Takvim Akışı',
        subtitle: 'Görevleri ve etkinlikleri aynı takvimde izle.',
        today: 'Bugün',
        allActions: 'Tüm Aksiyonlar',
        todayEvents: "Bugünün Etkinlikleri",
        dueFollowUps: 'Bugünkü Takipler',
        noAgenda: 'Bu alan için planlanmış aksiyon görünmüyor. Herhangi bir güne çift tıklayarak görev ekleyebilirsin.',
        openEvents: 'Etkinlikleri Aç',
        openTasks: 'Görevleri Aç',
        addEvent: '+ Etkinlik Ekle',
        addTask: '+ Görev Ekle',
        more: 'daha',
        event: 'Etkinlik',
        task: 'Görev',
        time: 'Saat',
        month: 'Ay',
        week: 'Hafta',
        day: 'Gün',
        focus: 'görev ve etkinlik',
      }
    : {
        title: 'Action Calendar',
        subtitle: 'Track tasks and events on one planning surface.',
        today: 'Today',
        allActions: 'All Actions',
        todayEvents: "Today's Events",
        dueFollowUps: "Today's Tasks",
        noAgenda: 'No actions are visible here yet. Double-click any day to add a task.',
        openEvents: 'Open Events',
        openTasks: 'Open Tasks',
        addEvent: '+ Add Event',
        addTask: '+ Add Task',
        more: 'more',
        event: 'Event',
        task: 'Task',
        time: 'Time',
        month: 'Month',
        week: 'Week',
        day: 'Day',
        focus: 'tasks and events',
      }

  const weekdayLabels = locale === 'tr'
    ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const entries = useMemo<CalendarEntry[]>(() => {
    const taskEntries = tasks
      .filter((task) => task.status !== 'completed' && task.status !== 'skipped')
      .map((task) => {
        const dueDate = new Date(task.due_date)
        return {
          id: `task-${task.id}`,
          kind: 'task' as const,
          title: task.title,
          day: startOfDay(dueDate),
          sortDate: startOfDay(dueDate),
          tone: itemTone(task),
          meta: task.contact_id
            ? contactMap[task.contact_id] ?? (locale === 'tr' ? 'Kontak görevi' : 'Contact task')
            : (locale === 'tr' ? 'Genel görev' : 'General task'),
          task,
        }
      })

    const eventEntries = events
      .filter((event) => event.status !== 'cancelled')
      .map((event) => {
        const startDate = new Date(event.startDate)
        return {
          id: `event-${event.id}`,
          kind: 'event' as const,
          title: event.title,
          day: startOfDay(startDate),
          sortDate: startDate,
          tone: (event.status === 'live' ? 'success' : 'primary') as CalendarEntry['tone'],
          meta: event.location || (event.meetingUrl ? (locale === 'tr' ? 'Sanal toplantı' : 'Virtual meeting') : (locale === 'tr' ? 'Etkinlik' : 'Event')),
          event,
        }
      })

    return [...taskEntries, ...eventEntries].sort((left, right) => left.sortDate.getTime() - right.sortDate.getTime())
  }, [contactMap, events, locale, tasks])

  const visibleEntries = useMemo(() => {
    if (viewMode === 'day') {
      return entries.filter((entry) => sameDay(entry.day, focusDate))
    }

    if (viewMode === 'week') {
      const from = startOfWeek(focusDate)
      const to = endOfWeek(focusDate)
      return entries.filter((entry) => isWithinRange(entry.day, from, to))
    }

    return entries.filter((entry) => isSameMonth(entry.day, focusDate))
  }, [entries, focusDate, viewMode])

  const monthDays = useMemo(() => buildMonthGrid(focusDate), [focusDate])
  const weekDays = useMemo(() => buildWeekDays(focusDate), [focusDate])
  const periodTitle = formatPeriodTitle(locale, viewMode, focusDate)
  const todayEntries = entries.filter((entry) => sameDay(entry.day, today))
  const todayEvents = todayEntries.filter((entry) => entry.kind === 'event').length
  const todayTasks = todayEntries.filter((entry) => entry.kind === 'task').length
  const timeGridHeight = CALENDAR_HOURS.length * CALENDAR_HOUR_HEIGHT

  const entriesByDay = useMemo(() => {
    return entries.reduce<Record<string, CalendarEntry[]>>((accumulator, entry) => {
      const key = dayKey(entry.day)
      accumulator[key] ??= []
      accumulator[key].push(entry)
      return accumulator
    }, {})
  }, [entries])

  function buildContext(nextViewMode = viewMode, nextFocusDate = focusDate): CalendarContext {
    return {
      viewMode: nextViewMode,
      focusDate: toInputDate(nextFocusDate),
    }
  }

  function handleFocusDay(day: Date) {
    setFocusDate(startOfDay(day))
  }

  function handleOpenCreate(day: Date) {
    handleFocusDay(day)
    window.setTimeout(() => {
      onCreateTask(toInputDate(day))
    }, 0)
  }

  function handleOpenCreateEvent(day: Date) {
    handleFocusDay(day)
    window.setTimeout(() => {
      onCreateEvent(toInputDate(day), buildContext(viewMode, startOfDay(day)))
    }, 0)
  }

  function handleCellKeyDown(event: React.KeyboardEvent<HTMLDivElement>, day: Date) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleFocusDay(day)
    }
  }

  function handleEntryOpen(entry: CalendarEntry) {
    if (entry.kind === 'task' && entry.task) {
      onOpenTask?.(entry.task, buildContext())
      return
    }

    if (entry.kind === 'event' && entry.event) {
      onOpenEvent?.(entry.event, buildContext())
    }
  }

  function timedEntriesForDay(day: Date) {
    return (entriesByDay[dayKey(day)] ?? []).filter(isTimedCalendarEntry)
  }

  function allDayEntriesForDay(day: Date) {
    return (entriesByDay[dayKey(day)] ?? []).filter((entry) => !isTimedCalendarEntry(entry))
  }

  function timedEntryTop(entry: CalendarEntry) {
    const start = entryStart(entry)
    if (!start) return 0
    const minutesFromTop = (start.getHours() - CALENDAR_HOUR_START) * 60 + start.getMinutes()
    return Math.max(0, minutesFromTop) * CALENDAR_HOUR_HEIGHT / 60
  }

  function timedEntryHeight(entry: CalendarEntry) {
    const start = entryStart(entry)
    const end = entryEnd(entry)
    if (!start || !end) return 36

    const durationMinutes = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000))
    return Math.max(36, durationMinutes * CALENDAR_HOUR_HEIGHT / 60)
  }

  function currentTimeIndicatorTop() {
    const now = new Date()
    return (now.getHours() - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT + now.getMinutes() * CALENDAR_HOUR_HEIGHT / 60
  }

  const viewButtons: { key: CalendarViewMode; label: string; icon: React.ElementType }[] = [
    { key: 'month', label: labels.month, icon: CalendarDays },
    { key: 'week', label: labels.week, icon: CalendarRange },
    { key: 'day', label: labels.day, icon: Calendar },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="rounded-3xl border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_26%)] p-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{labels.title}</p>
            <h2 className="mt-2 text-2xl font-bold text-text-primary capitalize">{periodTitle}</h2>
            <p className="mt-1 text-sm text-text-secondary">{labels.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex items-center rounded-2xl border border-border bg-surface/35 p-1">
              <button
                type="button"
                onClick={() => setFocusDate((current) => shiftDate(current, viewMode, 'prev'))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-[144px] px-3 text-center text-sm font-semibold text-text-primary capitalize">
                {periodTitle}
              </span>
              <button
                type="button"
                onClick={() => setFocusDate((current) => shiftDate(current, viewMode, 'next'))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setFocusDate(today)}
            >
              {labels.today}
            </Button>

            <div className="inline-flex items-center rounded-2xl border border-border bg-surface/35 p-1">
              {viewButtons.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewMode(key)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5',
                    viewMode === key
                      ? 'bg-primary text-obsidian'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <Button size="sm" variant="outline" onClick={onOpenEvents}>
              {labels.openEvents}
            </Button>
            <Button size="sm" variant="outline" onClick={onOpenTasks}>
              {labels.openTasks}
            </Button>
            <Button size="sm" onClick={() => handleOpenCreateEvent(focusDate)}>
              {labels.addEvent}
            </Button>
            <Button size="sm" onClick={() => onCreateTask(toInputDate(focusDate))}>
              {labels.addTask}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: labels.allActions, value: visibleEntries.length, Icon: Layers3 },
            { label: labels.todayEvents, value: todayEvents, Icon: CalendarClock },
            { label: labels.dueFollowUps, value: todayTasks, Icon: Bell },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface/35 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-text-primary kpi-number">{value}</p>
              </div>
              <p className="mt-3 text-sm text-text-secondary font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5">
        {viewMode === 'month' && (
          <div className="rounded-3xl border border-border overflow-hidden bg-surface/15">
            <div className="grid grid-cols-7 border-b border-border bg-surface/30">
              {weekdayLabels.map((label) => (
                <div key={label} className="py-3 text-center text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayEntries = entriesByDay[dayKey(day)] ?? []
                const isCurrentMonth = isSameMonth(day, focusDate)
                const isToday = sameDay(day, today)
                const isFocused = sameDay(day, focusDate)

                return (
                  <div
                    key={day.toISOString()}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFocusDay(day)}
                    onDoubleClick={() => handleOpenCreate(day)}
                    onKeyDown={(event) => handleCellKeyDown(event, day)}
                    className={cn(
                      'h-[178px] overflow-hidden border-r border-b border-border p-3 text-left align-top transition-colors last:border-r-0 cursor-pointer',
                      isFocused && 'bg-primary/8 shadow-[inset_0_0_0_1px_rgba(0,212,255,0.18)]',
                      !isFocused && 'hover:bg-surface/30',
                      !isCurrentMonth && 'opacity-35',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                          isToday ? 'bg-primary text-obsidian' : 'text-text-primary',
                        )}
                      >
                        {day.getDate()}
                      </span>
                      {dayEntries.length > 0 && (
                        <Badge size="sm" variant="default" className="text-[9px] px-1.5 py-0">
                          {dayEntries.length}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5 overflow-hidden">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleEntryOpen(entry)
                          }}
                          onDoubleClick={(event) => event.stopPropagation()}
                          className={cn(
                            'flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[10px] font-medium text-left transition-colors hover:border-border',
                            entryToneClasses(entry),
                          )}
                        >
                          <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
                          <span className="truncate">{entry.title}</span>
                        </button>
                      ))}
                      {dayEntries.length > 3 && (
                        <p className="text-[10px] text-text-tertiary px-1">
                          +{dayEntries.length - 3} {labels.more}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="rounded-3xl border border-border overflow-hidden bg-surface/15">
            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border bg-surface/30">
              <div className="border-r border-border px-3 py-4 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {labels.time}
              </div>
              {weekDays.map((day) => {
                const isToday = sameDay(day, today)
                const isFocused = sameDay(day, focusDate)
                const dayEntries = entriesByDay[dayKey(day)] ?? []

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleFocusDay(day)}
                    onDoubleClick={() => handleOpenCreate(day)}
                    className={cn(
                      'border-r border-border px-3 py-3 text-left transition-colors last:border-r-0',
                      isFocused ? 'bg-primary/10' : 'hover:bg-surface/35',
                    )}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                      {day.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={cn(
                        'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-lg font-bold',
                        isToday ? 'bg-primary text-obsidian' : 'text-text-primary',
                      )}>
                        {day.getDate()}
                      </span>
                      <Badge size="sm" variant="default">{dayEntries.length}</Badge>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border bg-surface/10">
              <div className="border-r border-border px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Plan
              </div>
              {weekDays.map((day) => {
                const allDayEntries = allDayEntriesForDay(day)

                return (
                  <div
                    key={`${day.toISOString()}-all-day`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFocusDay(day)}
                    onDoubleClick={() => handleOpenCreate(day)}
                    onKeyDown={(event) => handleCellKeyDown(event, day)}
                    className="min-h-[88px] border-r border-border px-2 py-2 last:border-r-0"
                  >
                    <div className="space-y-1.5">
                      {allDayEntries.slice(0, 2).map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleEntryOpen(entry)
                          }}
                          onDoubleClick={(event) => event.stopPropagation()}
                          className={cn(
                            'w-full cursor-pointer rounded-xl px-2.5 py-2 text-left text-[11px] font-medium transition-colors hover:border-border',
                            entryToneClasses(entry),
                          )}
                        >
                          <p className="truncate">{entry.title}</p>
                        </button>
                      ))}
                      {allDayEntries.length > 2 && (
                        <p className="px-1 text-[10px] text-text-tertiary">
                          +{allDayEntries.length - 2} {labels.more}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex max-h-[780px] overflow-auto">
              <div className="w-[72px] shrink-0 border-r border-border bg-surface/20">
                <div style={{ height: timeGridHeight }} className="relative">
                  {CALENDAR_HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 flex justify-end pr-3"
                      style={{ top: (hour - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT - 8 }}
                    >
                      <span className="text-[10px] text-text-tertiary">{formatHourLabel(hour)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid min-w-[980px] flex-1 grid-cols-7">
                {weekDays.map((day) => {
                  const timedEntries = timedEntriesForDay(day)
                  const isToday = sameDay(day, today)
                  const nowTop = currentTimeIndicatorTop()

                  return (
                    <div
                      key={`${day.toISOString()}-timeline`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleFocusDay(day)}
                      onDoubleClick={() => handleOpenCreate(day)}
                      onKeyDown={(event) => handleCellKeyDown(event, day)}
                      className="relative border-r border-border last:border-r-0"
                      style={{ height: timeGridHeight }}
                    >
                      {CALENDAR_HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 border-t border-border/50"
                          style={{ top: (hour - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT }}
                        />
                      ))}

                      {isToday && nowTop >= 0 && nowTop <= timeGridHeight && (
                        <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: nowTop }}>
                          <div className="h-2 w-2 shrink-0 rounded-full bg-error -ml-1" />
                          <div className="flex-1 border-t-2 border-error" />
                        </div>
                      )}

                      {timedEntries.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleEntryOpen(entry)
                          }}
                          onDoubleClick={(event) => event.stopPropagation()}
                          className={cn(
                            'absolute left-2 right-2 z-20 overflow-hidden rounded-2xl border px-3 py-2 text-left shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] cursor-pointer',
                            entryToneClasses(entry),
                          )}
                          style={{
                            top: timedEntryTop(entry),
                            height: timedEntryHeight(entry),
                          }}
                        >
                          <p className="truncate text-xs font-semibold">{entry.title}</p>
                          <p className="mt-1 truncate text-[11px] opacity-80">{entry.meta}</p>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="rounded-3xl border border-border overflow-hidden bg-surface/15">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    {focusDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long' })}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-text-primary capitalize">
                    {focusDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                </div>
                <Badge size="md" variant="default">
                  {visibleEntries.length} {labels.focus}
                </Badge>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onDoubleClick={() => handleOpenCreate(focusDate)}
              onKeyDown={(event) => handleCellKeyDown(event, focusDate)}
              className="border-b border-border bg-surface/10 px-5 py-3"
            >
              <div className="space-y-2">
                {allDayEntriesForDay(focusDate).length > 0 ? (
                  allDayEntriesForDay(focusDate).map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleEntryOpen(entry)
                      }}
                      onDoubleClick={(event) => event.stopPropagation()}
                      className={cn(
                        'w-full cursor-pointer rounded-2xl px-4 py-3 text-left transition-colors hover:border-border',
                        entryToneClasses(entry),
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{entry.title}</p>
                          <p className="mt-1 truncate text-xs opacity-75">{entry.meta}</p>
                        </div>
                        <Badge
                          variant={entry.kind === 'event' ? 'primary' : entry.tone === 'warning' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {entry.kind === 'event' ? labels.event : labels.task}
                        </Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-text-tertiary">
                    {labels.noAgenda}
                  </p>
                )}
              </div>
            </div>

            <div className="flex max-h-[780px] overflow-auto">
              <div className="w-[72px] shrink-0 border-r border-border bg-surface/20">
                <div style={{ height: timeGridHeight }} className="relative">
                  {CALENDAR_HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 flex justify-end pr-3"
                      style={{ top: (hour - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT - 8 }}
                    >
                      <span className="text-[10px] text-text-tertiary">{formatHourLabel(hour)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onDoubleClick={() => handleOpenCreate(focusDate)}
                onKeyDown={(event) => handleCellKeyDown(event, focusDate)}
                className="relative flex-1"
                style={{ height: timeGridHeight }}
              >
                {CALENDAR_HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: (hour - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT }}
                  />
                ))}

                {sameDay(focusDate, today) && currentTimeIndicatorTop() >= 0 && currentTimeIndicatorTop() <= timeGridHeight && (
                  <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: currentTimeIndicatorTop() }}>
                    <div className="h-2 w-2 shrink-0 rounded-full bg-error -ml-1" />
                    <div className="flex-1 border-t-2 border-error" />
                  </div>
                )}

                {timedEntriesForDay(focusDate).map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleEntryOpen(entry)
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    className={cn(
                      'absolute left-3 right-3 z-20 overflow-hidden rounded-2xl border px-3 py-2 text-left shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] cursor-pointer',
                      entryToneClasses(entry),
                    )}
                    style={{
                      top: timedEntryTop(entry),
                      height: timedEntryHeight(entry),
                    }}
                  >
                    <p className="truncate text-sm font-semibold">{entry.title}</p>
                    <p className="mt-1 truncate text-xs opacity-80">{entry.meta}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
