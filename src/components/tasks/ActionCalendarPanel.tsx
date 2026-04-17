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
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers3,
  List,
  Sparkles,
} from 'lucide-react'

type CalendarEntry = {
  id: string
  kind: 'task' | 'event'
  title: string
  date: Date
  tone: 'primary' | 'success' | 'warning' | 'secondary' | 'default'
  meta: string
}

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function dayKey(value: Date) {
  const date = startOfDay(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function sameDay(left: Date, right: Date) {
  return dayKey(left) === dayKey(right)
}

function buildMonthGrid(currentMonth: Date) {
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const weekOffset = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - weekOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

function itemTone(task: TaskRow): CalendarEntry['tone'] {
  if (task.status === 'overdue') return 'warning'
  if (task.priority === 'urgent' || task.priority === 'high') return 'secondary'
  if (task.priority === 'medium') return 'primary'
  return 'default'
}

export function ActionCalendarPanel({
  locale,
  tasks,
  events,
  contactMap,
  onOpenEvents,
  onCreateTask,
}: {
  locale: 'tr' | 'en'
  tasks: TaskRow[]
  events: Event[]
  contactMap: Record<string, string>
  onOpenEvents: () => void
  onCreateTask: () => void
}) {
  const [view, setView] = useState<'month' | 'agenda'>('month')
  const [currentMonth, setCurrentMonth] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  const labels = locale === 'tr'
    ? {
        title: 'Takvim Akışı',
        subtitle: 'Görevleri ve etkinlikleri aynı takvimde izle.',
        month: 'Ay',
        agenda: 'Gündem',
        today: 'Bugün',
        allActions: 'Tüm Aksiyonlar',
        todayEvents: "Bugünün Etkinlikleri",
        dueFollowUps: 'Bugünkü Takipler',
        noAgenda: 'Bu gün için planlanmış aksiyon yok.',
        noMonthAgenda: 'Bu ay için planlanmış aksiyon görünmüyor.',
        openEvents: 'Etkinlikleri Aç',
        newTask: 'Yeni Görev',
        selectedDay: 'Seçili Gün',
        monthAgenda: 'Aylık Gündem',
        more: 'daha',
        event: 'Etkinlik',
        task: 'Takip',
      }
    : {
        title: 'Action Calendar',
        subtitle: 'Track tasks and events on one planning surface.',
        month: 'Month',
        agenda: 'Agenda',
        today: 'Today',
        allActions: 'All Actions',
        todayEvents: "Today's Events",
        dueFollowUps: "Today's Follow-ups",
        noAgenda: 'No actions planned for this day.',
        noMonthAgenda: 'No actions planned for this month.',
        openEvents: 'Open Events',
        newTask: 'New Task',
        selectedDay: 'Selected Day',
        monthAgenda: 'Monthly Agenda',
        more: 'more',
        event: 'Event',
        task: 'Task',
      }

  const weekdayLabels = locale === 'tr'
    ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const entries = useMemo<CalendarEntry[]>(() => {
    const taskEntries = tasks
      .filter((task) => task.status !== 'completed' && task.status !== 'skipped')
      .map((task) => ({
        id: `task-${task.id}`,
        kind: 'task' as const,
        title: task.title,
        date: startOfDay(new Date(task.due_date)),
        tone: itemTone(task),
        meta: task.contact_id ? contactMap[task.contact_id] ?? (locale === 'tr' ? 'Kontak görevi' : 'Contact task') : (locale === 'tr' ? 'Genel görev' : 'General task'),
      }))

    const eventEntries = events
      .filter((event) => event.status !== 'cancelled')
      .map((event) => ({
        id: `event-${event.id}`,
        kind: 'event' as const,
        title: event.title,
        date: startOfDay(new Date(event.startDate)),
        tone: (event.status === 'live' ? 'success' : 'primary') as CalendarEntry['tone'],
        meta: event.location || (event.meetingUrl ? (locale === 'tr' ? 'Sanal toplantı' : 'Virtual meeting') : labels.event),
      }))

    return [...taskEntries, ...eventEntries].sort((left, right) => left.date.getTime() - right.date.getTime())
  }, [contactMap, events, labels.event, locale, tasks])

  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
  const monthEntries = entries.filter((entry) => `${entry.date.getFullYear()}-${entry.date.getMonth()}` === monthKey)
  const selectedEntries = entries.filter((entry) => sameDay(entry.date, selectedDate))
  const today = startOfDay(new Date())
  const todayEntries = entries.filter((entry) => sameDay(entry.date, today))
  const todayEvents = todayEntries.filter((entry) => entry.kind === 'event').length
  const todayTasks = todayEntries.filter((entry) => entry.kind === 'task').length
  const calendarDays = buildMonthGrid(currentMonth)

  const agendaEntries = view === 'agenda' ? monthEntries : selectedEntries
  const agendaTitle = view === 'agenda'
    ? `${labels.monthAgenda} · ${currentMonth.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })}`
    : `${labels.selectedDay} · ${selectedDate.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', weekday: 'long' })}`

  return (
    <Card className="overflow-hidden">
      <div className="rounded-3xl border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(0,212,255,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_24%)] p-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{labels.title}</p>
            <h2 className="mt-2 text-2xl font-bold text-text-primary capitalize">
              {currentMonth.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{labels.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-border overflow-hidden bg-surface/60">
              {[
                { key: 'month', label: labels.month, Icon: CalendarDays },
                { key: 'agenda', label: labels.agenda, Icon: List },
              ].map(({ key, label, Icon }, index) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key as 'month' | 'agenda')}
                  className={cn(
                    'h-9 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors',
                    index > 0 && 'border-l border-border',
                    view === key ? 'bg-primary text-obsidian' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
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
            <Button size="sm" onClick={onCreateTask}>
              {labels.newTask}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: labels.allActions, value: monthEntries.length, Icon: Layers3 },
            { label: labels.todayEvents, value: todayEvents, Icon: CalendarClock },
            { label: labels.dueFollowUps, value: todayTasks, Icon: Bell },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface/40 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-3xl font-bold text-text-primary kpi-number">{value}</p>
              </div>
              <p className="mt-3 text-sm text-text-secondary font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="w-9 h-9 rounded-xl border border-border bg-surface/50 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="w-9 h-9 rounded-xl border border-border bg-surface/50 flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const now = startOfDay(new Date())
                setCurrentMonth(now)
                setSelectedDate(now)
              }}
            >
              {labels.today}
            </Button>
          </div>
          <p className="text-sm text-text-secondary">{agendaTitle}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.1fr)_minmax(320px,0.9fr)] gap-5">
          <div className="rounded-3xl border border-border overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-surface/30">
              {weekdayLabels.map((label) => (
                <div key={label} className="py-3 text-center text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const dayEntries = entries.filter((entry) => sameDay(entry.date, day))
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const isToday = sameDay(day, today)
                const isSelected = sameDay(day, selectedDate)
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'min-h-[124px] border-r border-b border-border p-2 text-left align-top transition-colors last:border-r-0',
                      isSelected && 'bg-primary/8',
                      !isSelected && 'hover:bg-surface/30',
                      !isCurrentMonth && 'opacity-35',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                        isToday ? 'bg-primary text-obsidian' : 'text-text-primary',
                      )}>
                        {day.getDate()}
                      </span>
                      {dayEntries.length > 0 && (
                        <Badge size="sm" variant="default" className="text-[9px] px-1.5 py-0">
                          {dayEntries.length}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {dayEntries.slice(0, 2).map((entry) => (
                        <div
                          key={entry.id}
                          className={cn(
                            'rounded-lg px-2 py-1 text-[10px] font-medium truncate border',
                            entry.tone === 'success' && 'bg-success/10 text-success border-success/20',
                            entry.tone === 'secondary' && 'bg-secondary/10 text-secondary border-secondary/20',
                            entry.tone === 'warning' && 'bg-warning/10 text-warning border-warning/20',
                            entry.tone === 'primary' && 'bg-primary/10 text-primary border-primary/20',
                            entry.tone === 'default' && 'bg-surface/70 text-text-secondary border-border-subtle',
                          )}
                        >
                          {entry.title}
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <p className="text-[10px] text-text-tertiary px-1">+{dayEntries.length - 2} {labels.more}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface/25 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/12 flex items-center justify-center text-secondary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{agendaTitle}</p>
                <p className="text-xs text-text-tertiary">
                  {view === 'agenda' ? monthEntries.length : selectedEntries.length} {labels.allActions.toLowerCase()}
                </p>
              </div>
            </div>

            {agendaEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                <p className="text-sm text-text-secondary">
                  {view === 'agenda' ? labels.noMonthAgenda : labels.noAgenda}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={onOpenEvents}>
                    {labels.openEvents}
                  </Button>
                  <Button size="sm" onClick={onCreateTask}>
                    {labels.newTask}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {agendaEntries
                  .slice()
                  .sort((left, right) => left.date.getTime() - right.date.getTime())
                  .map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-border-subtle bg-card/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{entry.title}</p>
                          <p className="text-xs text-text-tertiary mt-1">{entry.meta}</p>
                        </div>
                        <Badge
                          variant={entry.kind === 'event' ? 'primary' : entry.tone === 'warning' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {entry.kind === 'event' ? labels.event : labels.task}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-3">
                        {entry.date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          weekday: 'short',
                        })}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
