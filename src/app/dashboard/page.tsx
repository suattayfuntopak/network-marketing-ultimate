'use client'

import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  Presentation,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { completeTask, fetchAllOrders, fetchContacts, fetchEvents, fetchTasks } from '@/lib/queries'
import type { ContactRow, OrderRow, TaskRow } from '@/lib/queries'
import type { Event } from '@/types'
import {
  addDays,
  buildActivityHeatmap,
  buildPipelineSegments,
  buildReorderDue,
  buildRevenueSnapshot,
  buildUpcomingEvents,
  calcDelta,
  computeActivityStreak,
  endOfDay,
  formatDelta,
  formatTRY,
  startOfDay,
} from '@/components/dashboard/dashboardMetrics'
import { RevenueStrip } from '@/components/dashboard/RevenueStrip'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { PipelineSegmentDonut } from '@/components/dashboard/PipelineSegmentDonut'
import { ReorderDueCard } from '@/components/dashboard/ReorderDueCard'
import { DeltaPill } from '@/components/dashboard/DeltaPill'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

function formatHeroDate(value: Date, locale: 'tr' | 'en') {
  if (locale === 'tr') {
    const day = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' }).format(value)
    const month = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(value)
    const year = new Intl.DateTimeFormat('tr-TR', { year: 'numeric' }).format(value)
    const weekday = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(value)
    return `${day} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${year} ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

function formatCompactDate(value: string, locale: 'tr' | 'en') {
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function formatRelativeTouch(value: string | null | undefined, locale: 'tr' | 'en') {
  if (!value) return locale === 'tr' ? 'Henüz temas yok' : 'No touch yet'
  const date = startOfDay(new Date(value))
  const today = startOfDay(new Date())
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000)

  if (diff <= 0) return locale === 'tr' ? 'Bugün temas edildi' : 'Touched today'
  if (diff === 1) return locale === 'tr' ? 'Dün temas edildi' : 'Touched yesterday'
  return locale === 'tr' ? `${diff} gündür temas yok` : `No touch for ${diff} days`
}

function dueState(task: TaskRow, locale: 'tr' | 'en') {
  const due = startOfDay(new Date(task.due_date))
  const today = startOfDay(new Date())
  if (task.status === 'overdue' || due.getTime() < today.getTime()) {
    return {
      label: locale === 'tr' ? 'Gecikmiş' : 'Overdue',
      variant: 'error' as const,
    }
  }
  if (due.getTime() === today.getTime()) {
    return {
      label: locale === 'tr' ? 'Bugün' : 'Today',
      variant: 'warning' as const,
    }
  }
  return {
    label: formatCompactDate(task.due_date, locale),
    variant: 'default' as const,
  }
}

function stagePriority(stage: string) {
  const order = ['ready_to_buy', 'presentation_done', 'interested', 'contact_planned', 'new']
  const index = order.indexOf(stage)
  return index === -1 ? order.length : index
}

type RiskItem = {
  id: string
  title: string
  meta: string
  route: string
  badge: string
  variant: 'error' | 'warning' | 'default'
}

export default function DashboardPage() {
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()
  const router = useRouter()
  const queryClient = useQueryClient()

  const contactsQuery = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })
  const contacts = contactsQuery.data ?? []

  const tasksQuery = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })
  const tasks = tasksQuery.data ?? []

  const ordersQuery = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
    staleTime: 30_000,
  })
  const orders = ordersQuery.data ?? []

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 30_000,
  })
  const events = eventsQuery.data ?? []

  const isInitialLoading =
    (contactsQuery.isPending && !contactsQuery.data) ||
    (tasksQuery.isPending && !tasksQuery.data) ||
    (ordersQuery.isPending && !ordersQuery.data) ||
    (eventsQuery.isPending && !eventsQuery.data)

  const completeTaskMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = addDays(todayStart, -6)
  const weekEnd = endOfDay(addDays(todayStart, 6))
  const previousWeekStart = addDays(weekStart, -7)
  const previousWeekEnd = endOfDay(addDays(weekStart, -1))
  const heroDateLabel = formatHeroDate(todayStart, locale)
  const fullName = currentUser?.name ?? ''

  const revenueSnapshot = buildRevenueSnapshot(orders, now)
  const streak = computeActivityStreak(contacts, tasks, now)
  const heatmap = buildActivityHeatmap(contacts, tasks, orders, now, 12)
  const pipelineSegments = buildPipelineSegments(contacts)
  const reorderDue = buildReorderDue(orders, contacts, now, 14)
  const upcomingEventEntries = buildUpcomingEvents(events, now, 14)

  const openTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'overdue')
  const focusTasks = openTasks
    .filter((task) => new Date(task.due_date) <= todayEnd)
    .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())

  const overdueTasks = openTasks.filter((task) => {
    const due = startOfDay(new Date(task.due_date))
    return task.status === 'overdue' || due.getTime() < todayStart.getTime()
  })

  const hotLeads = contacts
    .filter((contact) => contact.temperature === 'hot' && contact.status === 'active')
    .sort((left, right) => stagePriority(left.pipeline_stage) - stagePriority(right.pipeline_stage))

  const staleHotLeads = hotLeads.filter((contact) => {
    if (!contact.last_contact_date) return true
    const lastTouch = startOfDay(new Date(contact.last_contact_date))
    return lastTouch.getTime() < addDays(todayStart, -7).getTime()
  })

  const waitingDecisionContacts = contacts
    .filter((contact) => ['presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy'].includes(contact.pipeline_stage))
    .filter((contact) => !contact.next_follow_up_date || startOfDay(new Date(contact.next_follow_up_date)).getTime() <= todayStart.getTime())

  const upcomingSessions = tasks
    .filter((task) => ['meeting', 'presentation', 'training'].includes(task.type))
    .filter((task) => {
      const due = new Date(task.due_date)
      return due >= todayStart && due <= weekEnd && task.status !== 'completed' && task.status !== 'skipped'
    })
    .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())

  const riskItems: RiskItem[] = [
    ...overdueTasks.slice(0, 3).map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      meta: task.description || (locale === 'tr' ? 'Takip yeniden açılmayı bekliyor' : 'Follow-up is waiting to be reopened'),
      route: '/tasks',
      badge: locale === 'tr' ? 'Gecikmiş takip' : 'Overdue follow-up',
      variant: 'error' as const,
    })),
    ...staleHotLeads.slice(0, 2).map((contact) => ({
      id: `hot-${contact.id}`,
      title: contact.full_name,
      meta: formatRelativeTouch(contact.last_contact_date, locale),
      route: `/contacts?contact=${contact.id}`,
      badge: locale === 'tr' ? 'Sıcak aday bekliyor' : 'Hot prospect idle',
      variant: 'warning' as const,
    })),
    ...waitingDecisionContacts.slice(0, 2).map((contact) => ({
      id: `decision-${contact.id}`,
      title: contact.full_name,
      meta: locale === 'tr' ? 'Karar aşamasında net takip bekliyor' : 'Decision-stage follow-up is missing',
      route: `/contacts?contact=${contact.id}`,
      badge: locale === 'tr' ? 'Karar bekliyor' : 'Decision pending',
      variant: 'default' as const,
    })),
  ].slice(0, 6)

  const currentWeekTouches = contacts.filter((contact) => {
    if (!contact.last_contact_date) return false
    const date = new Date(contact.last_contact_date)
    return date >= weekStart && date <= weekEnd
  }).length
  const previousWeekTouches = contacts.filter((contact) => {
    if (!contact.last_contact_date) return false
    const date = new Date(contact.last_contact_date)
    return date >= previousWeekStart && date <= previousWeekEnd
  }).length

  const previousWeekFocus = tasks.filter((task) => {
    const due = new Date(task.due_date)
    return due >= previousWeekStart && due <= previousWeekEnd
  }).length
  const currentWeekFocus = tasks.filter((task) => {
    const due = new Date(task.due_date)
    return due >= weekStart && due <= weekEnd
  }).length

  const currentWeekOverdue = overdueTasks.length
  const previousWeekOverdue = tasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'skipped') return false
    const due = new Date(task.due_date)
    return due >= previousWeekStart && due <= previousWeekEnd
  }).length

  const previousWeekSessions = tasks.filter((task) => {
    if (!['meeting', 'presentation', 'training'].includes(task.type)) return false
    const due = new Date(task.due_date)
    return due >= previousWeekStart && due <= previousWeekEnd
  }).length

  const kpis = [
    {
      label: locale === 'tr' ? 'Bugünkü Aksiyonlar' : "Today's Actions",
      value: focusTasks.length,
      hint: locale === 'tr'
        ? `${overdueTasks.length} gecikmiş, ${Math.max(focusTasks.length - overdueTasks.length, 0)} bugün`
        : `${overdueTasks.length} overdue, ${Math.max(focusTasks.length - overdueTasks.length, 0)} due today`,
      icon: Zap,
      route: '/tasks',
      accent: 'primary',
      delta: calcDelta(currentWeekFocus, previousWeekFocus),
      deltaTone: 'auto' as const,
    },
    {
      label: locale === 'tr' ? 'Geciken Takipler' : 'Overdue Follow-ups',
      value: overdueTasks.length,
      hint: locale === 'tr' ? `${riskItems.length} kayıt hemen aksiyon istiyor` : `${riskItems.length} records need action now`,
      icon: AlertTriangle,
      route: '/tasks',
      accent: 'error',
      delta: calcDelta(currentWeekOverdue, previousWeekOverdue),
      deltaTone: 'inverse' as const,
    },
    {
      label: locale === 'tr' ? 'Sıcak Adaylar' : 'Hot Prospects',
      value: hotLeads.length,
      hint: locale === 'tr' ? `${staleHotLeads.length} tanesinde temas zayıf` : `${staleHotLeads.length} need a fresh touch`,
      icon: Flame,
      route: '/contacts?temperature=hot',
      accent: 'warning',
      delta: calcDelta(currentWeekTouches, previousWeekTouches),
      deltaTone: 'auto' as const,
    },
    {
      label: locale === 'tr' ? 'Bu Hafta Toplantı / Sunum' : 'This Week Sessions',
      value: upcomingSessions.length,
      hint: locale === 'tr'
        ? `${upcomingSessions.filter((item) => item.type === 'presentation').length} sunum, ${upcomingSessions.filter((item) => item.type === 'meeting').length} toplantı`
        : `${upcomingSessions.filter((item) => item.type === 'presentation').length} presentations, ${upcomingSessions.filter((item) => item.type === 'meeting').length} meetings`,
      icon: Presentation,
      route: '/calendar',
      accent: 'secondary',
      delta: calcDelta(upcomingSessions.length, previousWeekSessions),
      deltaTone: 'auto' as const,
    },
  ] as const

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item}>
        <Card className="relative overflow-hidden" padding="lg">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 85% 22%, rgba(0,212,255,0.10), transparent 45%), radial-gradient(ellipse at 18% 82%, rgba(139,92,246,0.12), transparent 55%)',
            }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {locale === 'tr' ? 'Bugünün Komuta Merkezi' : 'Today\u2019s Command Center'}
              </div>
              <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-text-primary lg:text-4xl">
                {t.dashboard.greeting}{fullName ? `, ${fullName}` : ''}
              </h1>
              <p className="mt-2 sm:mt-3 max-w-2xl text-[13px] sm:text-sm leading-6 text-text-secondary lg:text-base">
                {focusTasks.length > 0
                  ? locale === 'tr'
                    ? `Bugün önce ${focusTasks.length} aksiyona odaklan. ${hotLeads.length} sıcak aday ve ${upcomingSessions.length} yaklaşan oturum görünür durumda.`
                    : `Start with ${focusTasks.length} actions today. You have ${hotLeads.length} hot prospects and ${upcomingSessions.length} upcoming sessions on deck.`
                  : locale === 'tr'
                    ? `Bugün için açık aksiyon baskısı yok. Şimdi sıcak adaylar, süreç kalitesi ve yaklaşan görüşmeler üzerinden ritmi büyütebilirsin.`
                    : `There is no immediate action pressure today. Use the room to grow momentum across hot prospects, process quality, and upcoming sessions.`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
                <span className="rounded-full border border-border-subtle bg-surface/40 px-3 py-1 font-semibold">{heroDateLabel}</span>
                <span className="rounded-full border border-border-subtle bg-surface/40 px-3 py-1">
                  {locale === 'tr' ? 'Öncelik' : 'Priority'}:{' '}
                  <span className="font-semibold text-text-primary">
                    {focusTasks[0]?.title ?? (locale === 'tr' ? 'Ritmi koru' : 'Protect momentum')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <RevenueStrip snapshot={revenueSnapshot} streak={streak} />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isInitialLoading && Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`kpi-skeleton-${index}`} className="h-[128px] sm:h-[148px]" />
        ))}
        {!isInitialLoading && kpis.map((kpi) => {
          const Icon = kpi.icon
          const accentClass = {
            primary: 'from-primary/18 to-primary/5 border-primary/20',
            secondary: 'from-secondary/18 to-secondary/5 border-secondary/20',
            warning: 'from-warning/18 to-warning/5 border-warning/20',
            error: 'from-error/18 to-error/5 border-error/20',
          }[kpi.accent]

          return (
            <motion.button
              key={kpi.label}
              variants={item}
              whileHover={{ y: -2 }}
              className={`rounded-2xl border bg-gradient-to-br ${accentClass} p-3.5 sm:p-5 text-left transition-all hover:border-border-strong`}
              onClick={() => router.push(kpi.route)}
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-text-tertiary line-clamp-1">{kpi.label}</p>
                  <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-text-primary">{kpi.value}</p>
                  <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs leading-5 text-text-secondary line-clamp-2">{kpi.hint}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="rounded-xl sm:rounded-2xl border border-white/8 bg-background/45 p-2 sm:p-3 shadow-[0_8px_24px_rgba(2,6,23,0.18)]">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-text-primary" />
                  </div>
                  <DeltaPill
                    delta={kpi.delta}
                    label={formatDelta(kpi.delta, locale)}
                    tone={kpi.deltaTone}
                  />
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <motion.div variants={item} className="h-full xl:col-start-1 xl:row-start-1">
          <Card className="h-full overflow-hidden" padding="none">
              <div className="border-b border-border px-5 py-4">
                <CardHeader className="mb-0 items-start gap-3 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-4 w-4 text-primary" />
                      {locale === 'tr' ? 'Bugün İçin Öncelik' : 'Act Now'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {locale === 'tr'
                        ? 'Seni ileri taşıyacak işler, gecikenler ve en yakın aksiyonlar.'
                        : 'The tasks, misses, and near-term actions that will move the day.'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{focusTasks.length} {locale === 'tr' ? 'aksiyon' : 'items'}</Badge>
                    {overdueTasks.length > 0 && <Badge variant="error">{overdueTasks.length} {locale === 'tr' ? 'gecikmiş' : 'overdue'}</Badge>}
                  </div>
                </CardHeader>
              </div>

              <div className="space-y-3 p-5">
                {focusTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface/30 px-4 py-8 text-center text-sm text-text-tertiary">
                    {locale === 'tr'
                      ? 'Bugün için planlı veya gecikmiş aksiyon görünmüyor. Şimdi sıcak adaylar ve yaklaşan görüşmelere odaklanabilirsin.'
                      : 'No planned or overdue actions are visible for today. Use the moment to work your hot prospects and upcoming sessions.'}
                  </div>
                ) : (
                  focusTasks.slice(0, 5).map((task) => {
                    const state = dueState(task, locale)
                    return (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface/40 p-3 text-left transition-all hover:border-border-strong hover:bg-surface/60"
                        onClick={() => router.push('/tasks')}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            router.push('/tasks')
                          }
                        }}
                      >
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            completeTaskMutation.mutate(task.id)
                          }}
                          disabled={completeTaskMutation.isPending}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-background/40 transition-all hover:border-primary hover:bg-primary/10"
                        >
                          <CheckCircle2 className="h-4 w-4 text-text-muted group-hover:text-primary" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-text-primary">{task.title}</p>
                            <Badge variant={state.variant}>{state.label}</Badge>
                            <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'error' : 'default'}>
                              {t.tasks.priority[task.priority as keyof typeof t.tasks.priority]}
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-text-secondary">
                            {task.description || (locale === 'tr' ? 'Aksiyon detayına girerek not ve kişi bağlantısını yönetebilirsin.' : 'Open the action to manage notes and contact context.')}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-text-primary" />
                      </div>
                    )
                  })
                )}
              </div>

              <div className="border-t border-border px-5 py-4">
                <button
                  onClick={() => router.push('/tasks')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-dim"
                >
                  {locale === 'tr' ? 'Tüm görevler ve takipler' : 'View all tasks and follow-ups'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Card>
          </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-1 xl:row-start-2">
          <ActivityHeatmap cells={heatmap} weeks={12} />
        </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-1 xl:row-start-3">
          <PipelineSegmentDonut segments={pipelineSegments} totalContacts={contacts.length} />
        </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-1 xl:row-start-4">
          <ReorderDueCard entries={reorderDue} />
        </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-2 xl:row-start-1">
          <Card className="h-full" padding="lg" glow={riskItems.length > 0 ? 'error' : 'none'}>
              <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-error" />
                    {locale === 'tr' ? 'Riskte Olanlar' : 'Needs Attention'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'tr'
                      ? 'Geciken takipler, sıcak ama bekleyen adaylar ve karar aşamasında duran kişiler.'
                      : 'Overdue follow-ups, stalled hot prospects, and decision-stage people waiting for movement.'}
                  </CardDescription>
                </div>
                <Badge variant={riskItems.length > 0 ? 'error' : 'default'}>{riskItems.length}</Badge>
              </CardHeader>

              {riskItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
                  {locale === 'tr'
                    ? 'Şu an kritik bekleyen kayıt görünmüyor. Tempo kontrollü ilerliyor.'
                    : 'No critical records are waiting right now. Momentum is under control.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {riskItems.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => router.push(record.route)}
                      className="group flex w-full items-start gap-3 rounded-2xl border border-border-subtle bg-surface/35 p-3 text-left transition-all hover:border-border-strong hover:bg-surface/55"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/45">
                        <Activity className="h-4 w-4 text-text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-text-primary">{record.title}</p>
                          <Badge variant={record.variant}>{record.badge}</Badge>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-text-secondary">{record.meta}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-2 xl:row-start-2">
          <Card className="h-full" padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="h-4 w-4 text-warning" />
                  {locale === 'tr' ? 'Sıcak Adaylar' : 'Hot Prospects'}
                </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'tr'
                      ? 'Sonraki temasla hızlı ilerleyebilecek en güçlü adaylar.'
                      : 'The strongest prospects that can move quickly with the next touch.'}
                  </CardDescription>
                </div>
                <Badge variant="warning">{hotLeads.length}</Badge>
              </CardHeader>

              {hotLeads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
                  {t.dashboard.noHotProspects}
                </div>
              ) : (
                <div className="space-y-3">
                  {hotLeads.slice(0, 5).map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => router.push(`/contacts?contact=${lead.id}`)}
                      className="group flex w-full items-start gap-3 rounded-2xl border border-border-subtle bg-surface/35 p-3 text-left transition-all hover:border-border-strong hover:bg-surface/55"
                    >
                      <Avatar name={lead.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-text-primary">{lead.full_name}</p>
                          <TemperatureBadge temperature={lead.temperature} score={lead.temperature_score} />
                        </div>
                        <p className="mt-1 truncate text-xs text-text-secondary">
                          {[lead.profession, lead.location].filter(Boolean).join(' · ') || (locale === 'tr' ? 'Detay profili açılmaya hazır' : 'Profile is ready to be opened')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="default">{formatRelativeTouch(lead.last_contact_date, locale)}</Badge>
                          {lead.next_follow_up_date && (
                            <Badge variant="primary">
                              {locale === 'tr' ? 'Sonraki takip' : 'Next follow-up'} · {formatCompactDate(lead.next_follow_up_date, locale)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-2 xl:row-start-3">
          <Card className="h-full" padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-accent" />
                  {locale === 'tr' ? 'Yaklaşan Oturumlar' : 'Upcoming Sessions'}
                </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'tr'
                      ? 'Bu hafta takvime girilmiş toplantı, sunum ve eğitim akışı.'
                      : 'Meetings, presentations, and training sessions already set on the calendar this week.'}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{upcomingSessions.length + upcomingEventEntries.length}</Badge>
              </CardHeader>

              {upcomingSessions.length === 0 && upcomingEventEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
                  {locale === 'tr'
                    ? 'Bu hafta takvimde yaklaşan oturum görünmüyor.'
                    : 'No upcoming session is visible this week.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.slice(0, 3).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => router.push('/calendar')}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface/35 p-3 text-left transition-all hover:border-border-strong hover:bg-surface/55"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                        <Calendar className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">{session.title}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {formatCompactDate(session.due_date, locale)} · {t.tasks.types[session.type as keyof typeof t.tasks.types] ?? session.type}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-text-primary" />
                    </button>
                  ))}
                  {upcomingEventEntries.slice(0, 3).map((event) => {
                    const occupancy = event.capacity && event.capacity > 0 ? Math.round((event.confirmed / event.capacity) * 100) : null
                    return (
                      <button
                        key={`event-${event.id}`}
                        onClick={() => router.push('/events')}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface/35 p-3 text-left transition-all hover:border-border-strong hover:bg-surface/55"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10">
                          <TrendingUp className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-text-primary">{event.title}</p>
                            {occupancy !== null && <Badge variant="secondary">%{occupancy}</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-text-secondary">
                            {formatCompactDate(event.startDate.toISOString(), locale)} · {event.confirmed}/{event.invited} {locale === 'tr' ? 'katılımcı' : 'attendees'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-text-primary" />
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>

        <motion.div variants={item} className="h-full xl:col-start-2 xl:row-start-4">
          <Card className="h-full" padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {locale === 'tr' ? 'Bu Ay' : 'This Month'}
                </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'tr'
                      ? 'Son 30 günün hızlı özeti.'
                      : 'Quick pulse of the last 30 days.'}
                  </CardDescription>
                </div>
              </CardHeader>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">{locale === 'tr' ? 'Gelir' : 'Revenue'}</p>
                  <p className="mt-1.5 text-lg font-bold text-text-primary">{formatTRY(revenueSnapshot.monthRevenue, locale)}</p>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">{locale === 'tr' ? 'Ort. Sepet' : 'Avg Order'}</p>
                  <p className="mt-1.5 text-lg font-bold text-text-primary">{formatTRY(revenueSnapshot.avgOrderValue, locale)}</p>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">{locale === 'tr' ? 'Yeniden Sipariş' : 'Reorder Due'}</p>
                  <p className="mt-1.5 text-lg font-bold text-text-primary">{reorderDue.length}</p>
                </div>
                <div className="rounded-2xl border border-border-subtle bg-surface/35 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">{locale === 'tr' ? 'Aktif Havuz' : 'Active Pool'}</p>
                  <p className="mt-1.5 text-lg font-bold text-text-primary">{pipelineSegments.filter((segment) => segment.id !== 'lost').reduce((sum, segment) => sum + segment.count, 0)}</p>
                </div>
              </div>
            </Card>
          </motion.div>
      </div>
    </motion.div>
  )
}
