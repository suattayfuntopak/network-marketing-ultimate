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
import {
  CALENDAR_HOUR_BOUNDARIES,
  CALENDAR_HOUR_HEIGHT,
  CALENDAR_HOUR_START,
  buildMonthGrid,
  buildWeekDays,
  dayKey,
  endOfWeek,
  entryEnd,
  entryStart,
  entryToneClasses,
  formatHourLabel,
  formatPeriodTitle,
  fromInputDate,
  isSameMonth,
  isTimedCalendarEntry,
  isWithinRange,
  itemTone,
  parseTaskTime,
  sameDay,
  shiftDate,
  startOfDay,
  startOfWeek,
  toInputDate,
  type CalendarContext,
  type CalendarEntry,
  type CalendarViewMode,
} from './calendarHelpers'

export type { CalendarContext, CalendarViewMode } from './calendarHelpers'

export function ActionCalendarPanel({
  locale,
  tasks,
  events,
  contactMap,
  initialViewMode = 'month',
  initialFocusDate,
  onOpenAllActions,
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
  onOpenAllActions?: () => void
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
        allActions: 'Tüm Aksiyonlar',
        todayEvents: "Bugünün Etkinlikleri",
        dueFollowUps: 'Bugünkü Görev & Takipler',
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
        allActions: 'All Actions',
        todayEvents: "Today's Events",
        dueFollowUps: "Today's Tasks & Follow-ups",
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
        const dueDate = fromInputDate(task.due_date)
        const taskTime = parseTaskTime(task.description)
        const startsAt = taskTime
          ? new Date(
              dueDate.getFullYear(),
              dueDate.getMonth(),
              dueDate.getDate(),
              taskTime.hour,
              taskTime.minute,
            )
          : null
        const endsAt = startsAt
          ? new Date(startsAt.getTime() + 30 * 60 * 1000)
          : null

        return {
          id: `task-${task.id}`,
          kind: 'task' as const,
          title: task.title,
          day: startOfDay(dueDate),
          sortDate: startsAt ?? startOfDay(dueDate),
          startsAt,
          endsAt,
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
          startsAt: startDate,
          endsAt: new Date(event.endDate),
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
  const timeGridHeight = (CALENDAR_HOUR_BOUNDARIES.length - 1) * CALENDAR_HOUR_HEIGHT

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
    <Card className="overflow-hidden" padding="none">
      <div className="rounded-3xl border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_26%)] p-3 sm:p-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{labels.title}</p>
            <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-text-primary capitalize">{periodTitle}</h2>
            <p className="mt-1 text-xs sm:text-sm text-text-secondary">{labels.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-1.5 sm:gap-2">
            <div className="inline-flex items-center rounded-2xl border border-border bg-surface/35 p-1">
              <button
                type="button"
                onClick={() => setFocusDate((current) => shiftDate(current, viewMode, 'prev'))}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 sm:px-3 sm:min-w-[144px] text-center text-xs sm:text-sm font-semibold text-text-primary capitalize whitespace-nowrap">
                {periodTitle}
              </span>
              <button
                type="button"
                onClick={() => setFocusDate((current) => shiftDate(current, viewMode, 'next'))}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="inline-flex items-center rounded-2xl border border-border bg-surface/35 p-1">
              {viewButtons.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewMode(key)}
                  className={cn(
                    'px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 sm:gap-1.5',
                    viewMode === key
                      ? 'bg-primary text-obsidian'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <Button size="sm" variant="outline" onClick={onOpenEvents} className="hidden md:inline-flex">
              {labels.openEvents}
            </Button>
            <Button size="sm" variant="outline" onClick={onOpenTasks} className="hidden md:inline-flex">
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

        <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: labels.allActions, value: visibleEntries.length, Icon: Layers3, onClick: onOpenAllActions ?? onOpenTasks },
            { label: labels.todayEvents, value: todayEvents, Icon: CalendarClock, onClick: onOpenEvents },
            { label: labels.dueFollowUps, value: todayTasks, Icon: Bell, onClick: onOpenTasks },
          ].map(({ label, value, Icon, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="rounded-2xl border border-border bg-surface/35 px-2.5 sm:px-4 py-2.5 sm:py-3 text-left transition-colors hover:bg-surface/55 hover:border-primary/30"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/12 flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-text-primary kpi-number">{value}</p>
              </div>
              <p className="mt-2 sm:mt-3 text-[11px] sm:text-sm text-text-secondary font-medium line-clamp-2 leading-tight">{label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {viewMode === 'month' && (
          <div className="rounded-3xl border border-border overflow-hidden bg-surface/15">
            <div className="grid grid-cols-7 border-b border-border bg-surface/30">
              {weekdayLabels.map((label) => (
                <div key={label} className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  <span className="sm:hidden">{label.slice(0, 1)}</span>
                  <span className="hidden sm:inline">{label}</span>
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
                      'h-[72px] sm:h-[128px] md:h-[160px] xl:h-[178px] overflow-hidden border-r border-b border-border p-1.5 sm:p-2.5 md:p-3 text-left align-top transition-colors last:border-r-0 cursor-pointer',
                      isFocused && 'bg-primary/8 shadow-[inset_0_0_0_1px_rgba(0,212,255,0.18)]',
                      !isFocused && 'hover:bg-surface/30',
                      !isCurrentMonth && 'opacity-35',
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <span
                        className={cn(
                          'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold',
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

                    <div className="mt-1.5 sm:mt-3 space-y-1 sm:space-y-1.5 overflow-hidden">
                      <div className="sm:hidden flex flex-wrap gap-1">
                        {dayEntries.slice(0, 3).map((entry) => (
                          <span
                            key={entry.id}
                            className={cn(
                              'inline-block h-1.5 w-1.5 rounded-full',
                              entry.kind === 'event' ? 'bg-secondary' : entry.tone === 'warning' ? 'bg-warning' : 'bg-primary',
                            )}
                          />
                        ))}
                      </div>
                      <div className="hidden sm:block space-y-1.5 overflow-hidden">
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
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="rounded-3xl border border-border overflow-hidden bg-surface/15">
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] sm:grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border bg-surface/30">
                  <div className="border-r border-border px-2 sm:px-3 py-3 sm:py-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-text-tertiary">
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
                          'border-r border-border px-2 sm:px-3 py-2 sm:py-3 text-left transition-colors last:border-r-0',
                          isFocused ? 'bg-primary/10' : 'hover:bg-surface/35',
                        )}
                      >
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                          {day.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}
                        </p>
                        <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-1 sm:gap-2">
                          <span className={cn(
                            'inline-flex h-7 sm:h-9 min-w-7 sm:min-w-9 items-center justify-center rounded-full px-1.5 sm:px-2 text-sm sm:text-lg font-bold',
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

                <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] sm:grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border bg-surface/10">
                  <div className="border-r border-border px-2 sm:px-3 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-text-tertiary">
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
                        className="min-h-[72px] sm:min-h-[88px] border-r border-border px-1.5 sm:px-2 py-1.5 sm:py-2 last:border-r-0"
                      >
                        <div className="space-y-1 sm:space-y-1.5">
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
                                'w-full cursor-pointer rounded-lg sm:rounded-xl px-1.5 sm:px-2.5 py-1.5 sm:py-2 text-left text-[10px] sm:text-[11px] font-medium transition-colors hover:border-border',
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

                <div className="relative max-h-[560px] sm:max-h-[780px] overflow-y-auto">
                  <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] sm:grid-cols-[72px_repeat(7,minmax(0,1fr))]" style={{ height: timeGridHeight }}>
                    <div className="border-r border-border bg-surface/20 relative">
                      {CALENDAR_HOUR_BOUNDARIES.map((hour) => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 flex justify-end pr-2 sm:pr-3"
                          style={{ top: (hour - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT - 8 }}
                        >
                          <span className="text-[10px] text-text-tertiary">{formatHourLabel(hour)}</span>
                        </div>
                      ))}
                    </div>

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
                        >
                          {CALENDAR_HOUR_BOUNDARIES.map((hour) => (
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
                                'absolute left-1 right-1 sm:left-2 sm:right-2 z-20 overflow-hidden rounded-xl sm:rounded-2xl border px-2 sm:px-3 py-1.5 sm:py-2 text-left shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] cursor-pointer',
                                entryToneClasses(entry),
                              )}
                              style={{
                                top: timedEntryTop(entry),
                                height: timedEntryHeight(entry),
                              }}
                            >
                              <p className="truncate text-[11px] sm:text-xs font-semibold">{entry.title}</p>
                              <p className="mt-0.5 sm:mt-1 truncate text-[10px] sm:text-[11px] opacity-80">{entry.meta}</p>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="rounded-3xl border border-border overflow-hidden bg-surface/15">
            <div className="border-b border-border px-3 sm:px-5 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    {focusDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long' })}
                  </p>
                  <h3 className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-bold text-text-primary capitalize truncate">
                    {focusDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                </div>
                <Badge size="md" variant="default" className="shrink-0">
                  {visibleEntries.length} {labels.focus}
                </Badge>
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onDoubleClick={() => handleOpenCreate(focusDate)}
              onKeyDown={(event) => handleCellKeyDown(event, focusDate)}
              className="border-b border-border bg-surface/10 px-3 sm:px-5 py-2.5 sm:py-3"
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
                        'w-full cursor-pointer rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-left transition-colors hover:border-border',
                        entryToneClasses(entry),
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] sm:text-sm font-semibold">{entry.title}</p>
                          <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs opacity-75">{entry.meta}</p>
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
                  <p className="text-xs sm:text-sm text-text-tertiary">
                    {labels.noAgenda}
                  </p>
                )}
              </div>
            </div>

            <div className="flex max-h-[560px] sm:max-h-[780px] overflow-auto">
              <div className="w-[56px] sm:w-[72px] shrink-0 border-r border-border bg-surface/20">
                <div style={{ height: timeGridHeight }} className="relative">
                  {CALENDAR_HOUR_BOUNDARIES.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 flex justify-end pr-2 sm:pr-3"
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
                {CALENDAR_HOUR_BOUNDARIES.map((hour) => (
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
                      'absolute left-2 right-2 sm:left-3 sm:right-3 z-20 overflow-hidden rounded-xl sm:rounded-2xl border px-2.5 sm:px-3 py-1.5 sm:py-2 text-left shadow-[0_18px_32px_-24px_rgba(0,0,0,0.75)] cursor-pointer',
                      entryToneClasses(entry),
                    )}
                    style={{
                      top: timedEntryTop(entry),
                      height: timedEntryHeight(entry),
                    }}
                  >
                    <p className="truncate text-[13px] sm:text-sm font-semibold">{entry.title}</p>
                    <p className="mt-0.5 sm:mt-1 truncate text-[11px] sm:text-xs opacity-80">{entry.meta}</p>
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
