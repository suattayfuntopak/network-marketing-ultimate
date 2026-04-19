'use client'

import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Presentation,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { completeTask, fetchContacts, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const WEEK_DAYS = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const

const PIPELINE_LABELS = {
  tr: {
    new: 'Yeni Potansiyel',
    contact_planned: 'İletişim Planlandı',
    interested: 'İlgileniyor',
    presentation_done: 'Sunum Yapıldı',
    ready_to_buy: 'Karar Aşaması',
    became_customer: 'Müşteri Oldu',
    became_member: 'Ekip Üyesi',
    lost: 'Kaybedildi',
  },
  en: {
    new: 'New Lead',
    contact_planned: 'Contact Planned',
    interested: 'Interested',
    presentation_done: 'Presented',
    ready_to_buy: 'Decision Stage',
    became_customer: 'Became Customer',
    became_member: 'Became Member',
    lost: 'Lost',
  },
} as const

const PIPELINE_COLORS: Record<string, string> = {
  new: '#00d4ff',
  contact_planned: '#3b82f6',
  interested: '#8b5cf6',
  presentation_done: '#f59e0b',
  ready_to_buy: '#f97316',
  became_customer: '#10b981',
  became_member: '#6366f1',
  lost: '#ef4444',
}

const SUMMARY_STAGE_KEYS = [
  'new',
  'contact_planned',
  'interested',
  'presentation_done',
  'ready_to_buy',
  'became_customer',
  'became_member',
  'lost',
] as const

function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(23, 59, 59, 999)
  return next
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

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
  const weekDays = WEEK_DAYS[locale]

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const completeTaskMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())
  const weekStart = addDays(todayStart, -6)
  const weekEnd = endOfDay(addDays(todayStart, 6))
  const heroDateLabel = formatHeroDate(todayStart, locale)
  const fullName = currentUser?.name ?? ''

  const openTasks = tasks.filter(task => task.status === 'pending' || task.status === 'overdue')
  const focusTasks = openTasks
    .filter(task => new Date(task.due_date) <= todayEnd)
    .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())

  const overdueTasks = openTasks.filter(task => {
    const due = startOfDay(new Date(task.due_date))
    return task.status === 'overdue' || due.getTime() < todayStart.getTime()
  })

  const hotLeads = contacts
    .filter(contact => contact.temperature === 'hot' && contact.status === 'active')
    .sort((left, right) => stagePriority(left.pipeline_stage) - stagePriority(right.pipeline_stage))

  const staleHotLeads = hotLeads.filter(contact => {
    if (!contact.last_contact_date) return true
    const lastTouch = startOfDay(new Date(contact.last_contact_date))
    return lastTouch.getTime() < addDays(todayStart, -7).getTime()
  })

  const waitingDecisionContacts = contacts
    .filter(contact => ['presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy'].includes(contact.pipeline_stage))
    .filter(contact => !contact.next_follow_up_date || startOfDay(new Date(contact.next_follow_up_date)).getTime() <= todayStart.getTime())

  const upcomingSessions = tasks
    .filter(task => ['meeting', 'presentation', 'training'].includes(task.type))
    .filter(task => {
      const due = new Date(task.due_date)
      return due >= todayStart && due <= weekEnd && task.status !== 'completed' && task.status !== 'skipped'
    })
    .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())

  const riskItems: RiskItem[] = [
    ...overdueTasks.slice(0, 3).map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      meta: task.description || (locale === 'tr' ? 'Takip yeniden açılmayı bekliyor' : 'Follow-up is waiting to be reopened'),
      route: '/tasks',
      badge: locale === 'tr' ? 'Gecikmiş takip' : 'Overdue follow-up',
      variant: 'error' as const,
    })),
    ...staleHotLeads.slice(0, 2).map(contact => ({
      id: `hot-${contact.id}`,
      title: contact.full_name,
      meta: formatRelativeTouch(contact.last_contact_date, locale),
      route: `/contacts?contact=${contact.id}`,
      badge: locale === 'tr' ? 'Sıcak aday bekliyor' : 'Hot prospect idle',
      variant: 'warning' as const,
    })),
    ...waitingDecisionContacts.slice(0, 2).map(contact => ({
      id: `decision-${contact.id}`,
      title: contact.full_name,
      meta: locale === 'tr' ? 'Karar aşamasında net takip bekliyor' : 'Decision-stage follow-up is missing',
      route: `/contacts?contact=${contact.id}`,
      badge: locale === 'tr' ? 'Karar bekliyor' : 'Decision pending',
      variant: 'default' as const,
    })),
  ].slice(0, 6)

  const pipelineCounts = contacts.reduce<Record<string, number>>((accumulator, contact) => {
    accumulator[contact.pipeline_stage] = (accumulator[contact.pipeline_stage] ?? 0) + 1
    return accumulator
  }, {})

  const processSummary = SUMMARY_STAGE_KEYS.map(stage => ({
    key: stage,
    label: PIPELINE_LABELS[locale][stage],
    count: pipelineCounts[stage] ?? 0,
    color: PIPELINE_COLORS[stage] ?? '#64748b',
  }))
  const processSummaryMax = Math.max(...processSummary.map(stage => stage.count), 1)

  const weeklyBuckets = weekDays.map((day, index) => {
    const date = addDays(todayStart, -(6 - index))
    const dateKey = date.toISOString().split('T')[0]

    return {
      day,
      contacts: contacts.filter(contact => new Date(contact.created_at).toISOString().split('T')[0] === dateKey).length,
      touches: contacts.filter(contact => contact.last_contact_date && new Date(contact.last_contact_date).toISOString().split('T')[0] === dateKey).length,
      presentations: tasks.filter(task => task.type === 'presentation' && new Date(task.due_date).toISOString().split('T')[0] === dateKey).length,
    }
  })

  const weeklyPulse = {
    newContacts: weeklyBuckets.reduce((sum, entry) => sum + entry.contacts, 0),
    touches: weeklyBuckets.reduce((sum, entry) => sum + entry.touches, 0),
    presentations: weeklyBuckets.reduce((sum, entry) => sum + entry.presentations, 0),
  }

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
    },
    {
      label: locale === 'tr' ? 'Geciken Takipler' : 'Overdue Follow-ups',
      value: overdueTasks.length,
      hint: locale === 'tr'
        ? `${riskItems.length} kayıt hemen aksiyon istiyor`
        : `${riskItems.length} records need action now`,
      icon: AlertTriangle,
      route: '/tasks',
      accent: 'error',
    },
    {
      label: locale === 'tr' ? 'Sıcak Adaylar' : 'Hot Prospects',
      value: hotLeads.length,
      hint: locale === 'tr'
        ? `${staleHotLeads.length} tanesinde temas zayıf`
        : `${staleHotLeads.length} need a fresh touch`,
      icon: Flame,
      route: '/contacts?temperature=hot',
      accent: 'warning',
    },
    {
      label: locale === 'tr' ? 'Bu Hafta Toplantı / Sunum' : 'This Week Sessions',
      value: upcomingSessions.length,
      hint: locale === 'tr'
        ? `${upcomingSessions.filter(item => item.type === 'presentation').length} sunum, ${upcomingSessions.filter(item => item.type === 'meeting').length} toplantı`
        : `${upcomingSessions.filter(item => item.type === 'presentation').length} presentations, ${upcomingSessions.filter(item => item.type === 'meeting').length} meetings`,
      icon: Presentation,
      route: '/calendar',
      accent: 'secondary',
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
                {locale === 'tr' ? 'Bugünün Komuta Merkezi' : 'Today’s Command Center'}
              </div>
              <h1 className="mt-4 text-2xl font-bold text-text-primary lg:text-4xl">
                {t.dashboard.greeting}{fullName ? `, ${fullName}` : ''}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary lg:text-base">
                {focusTasks.length > 0
                  ? locale === 'tr'
                    ? `Bugün önce ${focusTasks.length} aksiyona odaklan. ${hotLeads.length} sıcak aday ve ${upcomingSessions.length} yaklaşan oturum görünür durumda.`
                    : `Start with ${focusTasks.length} actions today. You have ${hotLeads.length} hot prospects and ${upcomingSessions.length} upcoming sessions on deck.`
                  : locale === 'tr'
                    ? `Bugün için açık aksiyon baskısı yok. Şimdi sıcak adaylar, süreç kalitesi ve yaklaşan görüşmeler üzerinden ritmi büyütebilirsin.`
                    : `There is no immediate action pressure today. Use the room to grow momentum across hot prospects, process quality, and upcoming sessions.`}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px] lg:grid-cols-1">
              <div className="rounded-2xl border border-border-subtle bg-surface/45 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">
                  {locale === 'tr' ? 'Bugünün Tarihi' : "Today's Date"}
                </p>
                <p className="mt-2 text-sm font-semibold text-text-primary lg:text-base">{heroDateLabel}</p>
              </div>
              <div className="rounded-2xl border border-border-subtle bg-surface/45 px-4 py-4 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
                <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted">
                  {locale === 'tr' ? 'Bugünün Önceliği' : "Today's Priority"}
                </p>
                <p className="mt-2 text-sm font-semibold text-text-primary">
                  {focusTasks[0]?.title ?? (locale === 'tr' ? 'Ritmi koru ve sıcak adayları hareket ettir' : 'Protect momentum and move hot prospects')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => {
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
              className={`rounded-2xl border bg-gradient-to-br ${accentClass} p-5 text-left transition-all hover:border-border-strong`}
              onClick={() => router.push(kpi.route)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-tertiary">{kpi.label}</p>
                  <p className="mt-3 text-3xl font-bold text-text-primary">{kpi.value}</p>
                  <p className="mt-2 text-xs leading-5 text-text-secondary">{kpi.hint}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-background/45 p-3 shadow-[0_8px_24px_rgba(2,6,23,0.18)]">
                  <Icon className="h-5 w-5 text-text-primary" />
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <motion.div variants={item}>
            <Card className="overflow-hidden" padding="none">
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
                  focusTasks.slice(0, 5).map(task => {
                    const state = dueState(task, locale)
                    return (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface/40 p-3 text-left transition-all hover:border-border-strong hover:bg-surface/60"
                        onClick={() => router.push('/tasks')}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            router.push('/tasks')
                          }
                        }}
                      >
                        <button
                          onClick={event => {
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

          <motion.div variants={item}>
            <Card padding="lg">
              <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-secondary" />
                    {locale === 'tr' ? 'Süreç Takibi Özeti' : 'Pipeline Snapshot'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'tr'
                      ? 'Hangi aşamada kaç kişi olduğunu tek bakışta gör ve sıkışan alanları fark et.'
                      : 'See how many people sit in each key stage and spot where flow is slowing down.'}
                  </CardDescription>
                </div>
                <Badge variant="default">{contacts.length} {locale === 'tr' ? 'kişi' : 'people'}</Badge>
              </CardHeader>

              {contacts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
                  {locale === 'tr'
                    ? 'Henüz süreç verisi oluşmadı. İlk kontaklarla birlikte pano daha güçlü görünmeye başlayacak.'
                    : 'Pipeline data has not formed yet. The board will come alive as your first contacts enter the system.'}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {processSummary.map(stage => (
                    <button
                      key={stage.key}
                      onClick={() => router.push('/pipeline')}
                      className="rounded-2xl border border-border-subtle bg-surface/35 p-4 text-left transition-all hover:border-border-strong hover:bg-surface/55"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-text-tertiary">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.label}
                        </span>
                        <span className="text-2xl font-bold text-text-primary">{stage.count}</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-background/70">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max((stage.count / processSummaryMax) * 100, stage.count > 0 ? 12 : 0)}%`,
                            backgroundColor: stage.color,
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card padding="lg">
              <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-success" />
                    {locale === 'tr' ? 'Haftalık Nabız' : 'Weekly Pulse'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {locale === 'tr'
                      ? 'Yeni aday, temas ve sunum ritminin son 7 gündeki akışı.'
                      : 'Your seven-day rhythm across new prospects, touches, and presentations.'}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="primary" dot>{locale === 'tr' ? 'Yeni aday' : 'New prospects'}</Badge>
                  <Badge variant="secondary" dot>{locale === 'tr' ? 'Temas' : 'Touches'}</Badge>
                  <Badge variant="warning" dot>{locale === 'tr' ? 'Sunum' : 'Presentations'}</Badge>
                </div>
              </CardHeader>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: locale === 'tr' ? 'Yeni Aday' : 'New Prospects', value: weeklyPulse.newContacts, accent: 'text-primary' },
                  { label: locale === 'tr' ? 'Temas' : 'Touches', value: weeklyPulse.touches, accent: 'text-secondary' },
                  { label: locale === 'tr' ? 'Sunum' : 'Presentations', value: weeklyPulse.presentations, accent: 'text-warning' },
                ].map(metric => (
                  <div key={metric.label} className="rounded-2xl border border-border-subtle bg-surface/35 px-4 py-3">
                    <p className="text-xs font-medium text-text-tertiary">{metric.label}</p>
                    <p className={`mt-2 text-2xl font-bold ${metric.accent}`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyBuckets}>
                    <defs>
                      <linearGradient id="weeklyContacts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="weeklyTouches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="weeklyPresentations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#1e1e2e',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#f1f5f9',
                      }}
                    />
                    <Area type="monotone" dataKey="contacts" name={locale === 'tr' ? 'Yeni aday' : 'New prospects'} stroke="#00d4ff" fill="url(#weeklyContacts)" strokeWidth={2.4} />
                    <Area type="monotone" dataKey="touches" name={locale === 'tr' ? 'Temas' : 'Touches'} stroke="#8b5cf6" fill="url(#weeklyTouches)" strokeWidth={2.2} />
                    <Area type="monotone" dataKey="presentations" name={locale === 'tr' ? 'Sunum' : 'Presentations'} stroke="#f59e0b" fill="url(#weeklyPresentations)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <Card padding="lg" glow={riskItems.length > 0 ? 'error' : 'none'}>
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
                  {riskItems.map(record => (
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

          <motion.div variants={item}>
            <Card padding="lg">
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
                  {hotLeads.slice(0, 5).map(lead => (
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

          <motion.div variants={item}>
            <Card padding="lg">
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
                <Badge variant="secondary">{upcomingSessions.length}</Badge>
              </CardHeader>

              {upcomingSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
                  {locale === 'tr'
                    ? 'Bu hafta takvimde yaklaşan toplantı veya sunum görünmüyor.'
                    : 'No upcoming meeting or presentation is visible for this week.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.slice(0, 4).map(session => (
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
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
