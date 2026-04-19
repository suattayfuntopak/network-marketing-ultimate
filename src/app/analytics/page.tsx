'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Filter,
  Presentation,
  ShoppingBag,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLanguage } from '@/components/common/LanguageProvider'
import { fetchAllOrders, fetchContacts, fetchTasks, type ContactRow, type OrderRow, type TaskRow } from '@/lib/queries'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const RANGE_OPTIONS = ['7d', '30d', '90d', 'all'] as const
type RangeOption = (typeof RANGE_OPTIONS)[number]

const STAGE_COLORS: Record<string, string> = {
  new: '#00d4ff',
  contact_planned: '#3b82f6',
  first_contact: '#6366f1',
  interested: '#8b5cf6',
  invited: '#a855f7',
  presentation_sent: '#f59e0b',
  presentation_done: '#f97316',
  followup_pending: '#ef4444',
  objection_handling: '#fb7185',
  ready_to_buy: '#10b981',
  became_customer: '#059669',
  ready_to_join: '#06b6d4',
  became_member: '#6366f1',
  nurture_later: '#64748b',
  dormant: '#475569',
  lost: '#ef4444',
}

const STAGE_LABELS: Record<string, { tr: string; en: string }> = {
  new: { tr: 'Yeni Aday', en: 'New Lead' },
  contact_planned: { tr: 'İletişim Planlandı', en: 'Contact Planned' },
  first_contact: { tr: 'İlk Temas', en: 'First Contact' },
  interested: { tr: 'İlgileniyor', en: 'Interested' },
  invited: { tr: 'Davet Edildi', en: 'Invited' },
  presentation_sent: { tr: 'Sunum Gönderildi', en: 'Presentation Sent' },
  presentation_done: { tr: 'Sunum Yapıldı', en: 'Presentation Done' },
  followup_pending: { tr: 'Takipte', en: 'Follow-up Active' },
  objection_handling: { tr: 'İtiraz Yönetimi', en: 'Objection Handling' },
  ready_to_buy: { tr: 'Karar Aşaması', en: 'Decision Stage' },
  became_customer: { tr: 'Müşteri Oldu', en: 'Became Customer' },
  ready_to_join: { tr: 'Katılıma Hazır', en: 'Ready to Join' },
  became_member: { tr: 'Ekip Üyesi', en: 'Became Member' },
  nurture_later: { tr: 'Sonra İlgilen', en: 'Nurture Later' },
  dormant: { tr: 'Pasif', en: 'Dormant' },
  lost: { tr: 'Kaybedildi', en: 'Lost' },
}

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

function addMonths(value: Date, months: number) {
  const next = new Date(value)
  next.setMonth(next.getMonth() + months)
  return next
}

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function inDateRange(value: string | null | undefined, start: Date | null, end: Date) {
  const parsed = parseDate(value)
  if (!parsed) return false
  if (!start) return parsed <= end
  return parsed >= start && parsed <= end
}

function getRangeBounds(range: RangeOption, today: Date) {
  if (range === 'all') {
    return { start: null, end: endOfDay(today), previousStart: null, previousEnd: null }
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const end = endOfDay(today)
  const start = startOfDay(addDays(today, -(days - 1)))
  const previousEnd = endOfDay(addDays(start, -1))
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)))
  return { start, end, previousStart, previousEnd }
}

function percent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function periodLabel(range: RangeOption, locale: 'tr' | 'en') {
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

function rangeButtonLabel(range: RangeOption, locale: 'tr' | 'en') {
  if (range === 'all') return locale === 'tr' ? 'Tümü' : 'All'
  return range.toUpperCase()
}

function formatDelta(current: number, previous: number | null, locale: 'tr' | 'en') {
  if (previous === null) {
    return {
      value: locale === 'tr' ? 'Genel görünüm' : 'Overall view',
      positive: true,
    }
  }

  const diff = current - previous
  const positive = diff >= 0
  const prefix = diff > 0 ? '+' : ''
  return {
    value: `${prefix}${diff}`,
    positive,
  }
}

function formatBucketLabel(start: Date, end: Date, range: RangeOption, locale: 'tr' | 'en') {
  const formatter = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: range === 'all' ? 'short' : 'short',
  })

  if (range === 'all') {
    return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' }).format(start)
  }

  if (start.getTime() === end.getTime()) {
    return formatter.format(start)
  }

  return `${formatter.format(start)}-${new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric' }).format(end)}`
}

function buildTrendSeries(
  range: RangeOption,
  locale: 'tr' | 'en',
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

      return {
        label: formatBucketLabel(monthStart, monthStart, range, locale),
        contacts: contacts.filter(contact => inDateRange(contact.created_at, monthStart, monthEnd)).length,
        touches: contacts.filter(contact => inDateRange(contact.last_contact_date, monthStart, monthEnd)).length,
        presentations: tasks.filter(task => task.type === 'presentation' && inDateRange(task.due_date, monthStart, monthEnd)).length,
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
      contacts: contacts.filter(contact => inDateRange(contact.created_at, normalizedStart, bucketEnd)).length,
      touches: contacts.filter(contact => inDateRange(contact.last_contact_date, normalizedStart, bucketEnd)).length,
      presentations: tasks.filter(task => task.type === 'presentation' && inDateRange(task.due_date, normalizedStart, bucketEnd)).length,
    }
  })
}

const CustomTooltip = ({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) => {
  if (!active || !payload) return null

  return (
    <div className="rounded-xl border border-border bg-elevated p-3 shadow-float">
      <p className="mb-1 text-xs font-semibold text-text-primary">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-xs text-text-secondary">
          {entry.name}: <span className="font-semibold text-text-primary">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { t, locale } = useLanguage()
  const [range, setRange] = useState<RangeOption>('30d')

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30_000,
  })

  const { data: orders = [] } = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
    staleTime: 30_000,
  })

  const today = startOfDay(new Date())
  const { start, end, previousStart, previousEnd } = getRangeBounds(range, today)

  const currentContacts = contacts.filter(contact => inDateRange(contact.created_at, start, end))
  const previousContacts = previousStart && previousEnd
    ? contacts.filter(contact => inDateRange(contact.created_at, previousStart, previousEnd))
    : []

  const currentTouches = contacts.filter(contact => inDateRange(contact.last_contact_date, start, end))
  const previousTouches = previousStart && previousEnd
    ? contacts.filter(contact => inDateRange(contact.last_contact_date, previousStart, previousEnd))
    : []

  const currentPresentations = tasks.filter(task => task.type === 'presentation' && inDateRange(task.due_date, start, end))
  const previousPresentations = previousStart && previousEnd
    ? tasks.filter(task => task.type === 'presentation' && inDateRange(task.due_date, previousStart, previousEnd))
    : []

  const currentOrders = orders.filter(order => inDateRange(order.order_date, start, end))
  const previousOrders = previousStart && previousEnd
    ? orders.filter(order => inDateRange(order.order_date, previousStart, previousEnd))
    : []

  const currentRecruits = contacts.filter(contact => contact.pipeline_stage === 'became_member' && inDateRange(contact.created_at, start, end))
  const previousRecruits = previousStart && previousEnd
    ? contacts.filter(contact => contact.pipeline_stage === 'became_member' && inDateRange(contact.created_at, previousStart, previousEnd))
    : []

  const currentOverdueTasks = tasks.filter(task => {
    const due = parseDate(task.due_date)
    if (!due) return false
    return (task.status === 'overdue' || (task.status === 'pending' && due < today)) && (!start || due >= start) && due <= end
  })

  const previousOverdueTasks = previousStart && previousEnd
    ? tasks.filter(task => {
      const due = parseDate(task.due_date)
      if (!due) return false
      return (task.status === 'overdue' || task.status === 'pending') && due >= previousStart && due <= previousEnd
    })
    : []

  const pipelineCounts = contacts.reduce<Record<string, number>>((accumulator, contact) => {
    accumulator[contact.pipeline_stage] = (accumulator[contact.pipeline_stage] ?? 0) + 1
    return accumulator
  }, {})

  const stageDistribution = Object.entries(pipelineCounts)
    .map(([stage, count]) => ({
      key: stage,
      label: STAGE_LABELS[stage]?.[locale] ?? stage,
      count,
      color: STAGE_COLORS[stage] ?? '#64748b',
      share: percent(count, contacts.length),
    }))
    .sort((left, right) => right.count - left.count)

  const topStage = stageDistribution[0]
  const dormantCount = (pipelineCounts.dormant ?? 0) + (pipelineCounts.lost ?? 0)
  const readyToCloseCount = (pipelineCounts.ready_to_buy ?? 0) + (pipelineCounts.became_customer ?? 0)
  const warmPipelineCount =
    (pipelineCounts.interested ?? 0) +
    (pipelineCounts.presentation_sent ?? 0) +
    (pipelineCounts.presentation_done ?? 0) +
    (pipelineCounts.followup_pending ?? 0)

  const trendSeries = buildTrendSeries(range, locale, contacts, tasks, end)

  const memberContacts = contacts.filter(contact => contact.pipeline_stage === 'became_member')
  const teamRhythm = memberContacts
    .map(contact => {
      const memberTasks = tasks.filter(task => task.contact_id === contact.id)
      const weekTaskCount = memberTasks.filter(task => inDateRange(task.due_date, addDays(today, -6), end)).length
      const overdueCount = memberTasks.filter(task => task.status === 'overdue').length

      return {
        id: contact.id,
        name: contact.full_name,
        value: weekTaskCount,
        overdue: overdueCount,
      }
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 6)

  const funnelSteps = [
    { stage: t.analytics.totalLeads, value: contacts.length },
    { stage: t.analytics.contacted, value: contacts.filter(contact => Boolean(contact.last_contact_date)).length },
    { stage: t.analytics.interested, value: contacts.filter(contact => ['interested', 'invited', 'presentation_sent', 'presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy'].includes(contact.pipeline_stage)).length },
    { stage: t.analytics.presented, value: contacts.filter(contact => ['presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy', 'became_customer', 'became_member'].includes(contact.pipeline_stage)).length },
    { stage: t.analytics.converted, value: (pipelineCounts.became_customer ?? 0) + (pipelineCounts.became_member ?? 0) },
  ].map(step => ({
    ...step,
    pct: percent(step.value, contacts.length),
  }))

  const conversionEngine = [
    {
      label: locale === 'tr' ? 'Temasa Geçme' : 'Touch Coverage',
      value: percent(currentTouches.length, Math.max(currentContacts.length, 1)),
      color: '#00d4ff',
    },
    {
      label: locale === 'tr' ? 'Sunuma Taşıma' : 'Presentation Lift',
      value: percent(currentPresentations.length, Math.max(currentTouches.length, 1)),
      color: '#8b5cf6',
    },
    {
      label: locale === 'tr' ? 'Siparişe Dönüşüm' : 'Order Conversion',
      value: percent(currentOrders.length, Math.max(currentPresentations.length, 1)),
      color: '#10b981',
    },
    {
      label: locale === 'tr' ? 'Ekibe Katılım' : 'Team Join Rate',
      value: percent(currentRecruits.length, Math.max(currentContacts.length, 1)),
      color: '#f59e0b',
    },
  ]

  const kpis = [
    {
      label: locale === 'tr' ? 'Yeni Adaylar' : 'New Prospects',
      value: currentContacts.length,
      delta: formatDelta(currentContacts.length, previousStart ? previousContacts.length : null, locale),
      icon: Users,
    },
    {
      label: locale === 'tr' ? 'Temaslar' : 'Touches',
      value: currentTouches.length,
      delta: formatDelta(currentTouches.length, previousStart ? previousTouches.length : null, locale),
      icon: Activity,
    },
    {
      label: locale === 'tr' ? 'Sunumlar' : 'Presentations',
      value: currentPresentations.length,
      delta: formatDelta(currentPresentations.length, previousStart ? previousPresentations.length : null, locale),
      icon: Presentation,
    },
    {
      label: locale === 'tr' ? 'Siparişler' : 'Orders',
      value: currentOrders.length,
      delta: formatDelta(currentOrders.length, previousStart ? previousOrders.length : null, locale),
      icon: ShoppingBag,
    },
    {
      label: locale === 'tr' ? 'Ekibe Katılım' : 'Team Adds',
      value: currentRecruits.length,
      delta: formatDelta(currentRecruits.length, previousStart ? previousRecruits.length : null, locale),
      icon: UserPlus,
    },
    {
      label: locale === 'tr' ? 'Geciken Takipler' : 'Overdue Follow-ups',
      value: currentOverdueTasks.length,
      delta: formatDelta(currentOverdueTasks.length, previousStart ? previousOverdueTasks.length : null, locale),
      icon: Clock3,
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-[1600px] space-y-6">
      <motion.div variants={item}>
        <Card className="relative overflow-hidden" padding="lg">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 82% 16%, rgba(0,212,255,0.12), transparent 45%), radial-gradient(ellipse at 12% 78%, rgba(139,92,246,0.12), transparent 55%)',
            }}
          />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
                <BarChart3 className="h-3.5 w-3.5" />
                {t.analytics.title}
              </div>
              <h1 className="mt-4 text-2xl font-bold text-text-primary lg:text-4xl">{t.analytics.title}</h1>
              <p className="mt-3 text-sm leading-6 text-text-secondary lg:text-base">
                {locale === 'tr'
                  ? `${periodLabel(range, locale)} için büyüme ritmini, süreç sağlığını ve dönüşüm motorunu tek ekranda gör.`
                  : `See growth rhythm, process health, and conversion strength for ${periodLabel(range, locale).toLowerCase()} on a single screen.`}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              {[
                {
                  label: locale === 'tr' ? 'En Yoğun Aşama' : 'Most Crowded Stage',
                  value: topStage ? `${topStage.label} · ${topStage.count}` : locale === 'tr' ? 'Veri bekleniyor' : 'Waiting for data',
                },
                {
                  label: locale === 'tr' ? 'Darboğaz' : 'Bottleneck',
                  value: currentOverdueTasks.length > 0
                    ? locale === 'tr' ? `${currentOverdueTasks.length} geciken takip` : `${currentOverdueTasks.length} overdue follow-ups`
                    : locale === 'tr' ? 'Takip tarafı temiz' : 'Follow-up side is clean',
                },
                {
                  label: locale === 'tr' ? 'Kapanışa Yakın' : 'Near Close',
                  value: locale === 'tr' ? `${readyToCloseCount} kayıt sıcak bölgede` : `${readyToCloseCount} records in the hot zone`,
                },
              ].map(insight => (
                <div key={insight.label} className="rounded-2xl border border-border-subtle bg-surface/45 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">{insight.label}</p>
                  <p className="mt-2 text-sm font-semibold text-text-primary">{insight.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-2">
        <div className="mr-1 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-text-secondary">
          <Filter className="h-3.5 w-3.5" />
          {locale === 'tr' ? 'Görünüm aralığı' : 'View range'}
        </div>
        {RANGE_OPTIONS.map(option => (
          <button
            key={option}
            onClick={() => setRange(option)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
              option === range
                ? 'border-primary/30 bg-primary text-background shadow-[0_10px_24px_rgba(0,212,255,0.22)]'
                : 'border-border bg-card text-text-secondary hover:border-border-strong hover:text-text-primary'
            }`}
          >
            {rangeButtonLabel(option, locale)}
          </button>
        ))}
        <Badge variant="default" className="ml-auto">{periodLabel(range, locale)}</Badge>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <Icon className="h-4 w-4 text-text-tertiary" />
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${kpi.delta.positive ? 'text-success' : 'text-error'}`}>
                  {kpi.delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.delta.value}
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-text-primary">{kpi.value}</p>
              <p className="mt-1 text-xs text-text-tertiary">{kpi.label}</p>
            </div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <motion.div variants={item}>
          <Card padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {locale === 'tr' ? 'Büyüme Ritmi' : 'Growth Rhythm'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === 'tr'
                    ? 'Yeni aday, temas ve sunum akışının seçili dönemde nasıl ilerlediğini gör.'
                    : 'See how new prospects, touches, and presentations are moving in the selected period.'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary" dot>{locale === 'tr' ? 'Yeni aday' : 'New prospects'}</Badge>
                <Badge variant="secondary" dot>{locale === 'tr' ? 'Temas' : 'Touches'}</Badge>
                <Badge variant="warning" dot>{locale === 'tr' ? 'Sunum' : 'Presentations'}</Badge>
              </div>
            </CardHeader>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries}>
                  <defs>
                    <linearGradient id="analyticsContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analyticsTouches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analyticsPresentations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={CustomTooltip} />
                  <Area type="monotone" dataKey="contacts" name={locale === 'tr' ? 'Yeni aday' : 'New prospects'} stroke="#00d4ff" fill="url(#analyticsContacts)" strokeWidth={2.4} />
                  <Area type="monotone" dataKey="touches" name={locale === 'tr' ? 'Temas' : 'Touches'} stroke="#8b5cf6" fill="url(#analyticsTouches)" strokeWidth={2.2} />
                  <Area type="monotone" dataKey="presentations" name={locale === 'tr' ? 'Sunum' : 'Presentations'} stroke="#f59e0b" fill="url(#analyticsPresentations)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-error" />
                  {locale === 'tr' ? 'Darboğazlar ve Uyarılar' : 'Bottlenecks & Alerts'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === 'tr'
                    ? 'Kısa vadede ivmeyi yavaşlatabilecek noktaları gör.'
                    : 'Surface the pockets that could slow your momentum in the short term.'}
                </CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {[
                {
                  label: locale === 'tr' ? 'En yoğun aşama' : 'Most crowded stage',
                  value: topStage ? `${topStage.label} · ${topStage.count}` : locale === 'tr' ? 'Veri yok' : 'No data',
                  tone: 'primary',
                },
                {
                  label: locale === 'tr' ? 'Takip riski' : 'Follow-up risk',
                  value: currentOverdueTasks.length > 0
                    ? locale === 'tr' ? `${currentOverdueTasks.length} geciken takip var` : `${currentOverdueTasks.length} overdue follow-ups`
                    : locale === 'tr' ? 'Geciken takip görünmüyor' : 'No overdue follow-ups',
                  tone: currentOverdueTasks.length > 0 ? 'error' : 'success',
                },
                {
                  label: locale === 'tr' ? 'Donuk / kaybedilen havuz' : 'Dormant / lost pool',
                  value: locale === 'tr' ? `${dormantCount} kayıt risk altında` : `${dormantCount} records at risk`,
                  tone: dormantCount > 0 ? 'warning' : 'success',
                },
                {
                  label: locale === 'tr' ? 'Sıcak kapanış alanı' : 'Near-close zone',
                  value: locale === 'tr' ? `${readyToCloseCount} kayıt kapanışa yakın` : `${readyToCloseCount} records near close`,
                  tone: readyToCloseCount > 0 ? 'secondary' : 'default',
                },
                {
                  label: locale === 'tr' ? 'İşleyen orta süreç' : 'Working mid-pipeline',
                  value: locale === 'tr' ? `${warmPipelineCount} kayıt dönüşüm hattında` : `${warmPipelineCount} records moving in pipeline`,
                  tone: 'default',
                },
              ].map(row => (
                <div key={row.label} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-primary">{row.label}</p>
                    <Badge variant={row.tone === 'error' ? 'error' : row.tone === 'warning' ? 'warning' : row.tone === 'success' ? 'success' : row.tone === 'secondary' ? 'secondary' : 'default'}>
                      {locale === 'tr' ? 'Durum' : 'Signal'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{row.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <motion.div variants={item}>
          <Card padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-secondary" />
                  {locale === 'tr' ? 'Süreç Dağılımı' : 'Pipeline Distribution'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === 'tr'
                    ? 'Hangi aşamalarda yoğunluk olduğunu ve paylarını birlikte incele.'
                    : 'Inspect both volume and share across your active pipeline stages.'}
                </CardDescription>
              </div>
              <Badge variant="default">{contacts.length} {locale === 'tr' ? 'toplam kayıt' : 'total records'}</Badge>
            </CardHeader>

            <div className="space-y-3">
              {stageDistribution.map(stage => (
                <div key={stage.key} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        <p className="truncate text-sm font-medium text-text-primary">{stage.label}</p>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background/70">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(stage.share, stage.count > 0 ? 10 : 0)}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                    <div className="min-w-[84px] text-right">
                      <p className="text-lg font-bold text-text-primary">{stage.count}</p>
                      <p className="text-xs text-text-tertiary">%{stage.share}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {locale === 'tr' ? 'Dönüşüm Motoru' : 'Conversion Engine'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === 'tr'
                    ? 'Seçili dönem içinde temas, sunum ve kapanış hattının ne kadar çalıştığını gör.'
                    : 'See how well the touch, presentation, and close engine worked in the selected period.'}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-4">
              {conversionEngine.map(metric => (
                <div key={metric.label} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-text-primary">{metric.label}</p>
                    <p className="text-lg font-bold text-text-primary">%{metric.value}</p>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background/70">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(metric.value, metric.value > 0 ? 10 : 0)}%`, backgroundColor: metric.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
        <motion.div variants={item}>
          <Card padding="lg">
            <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-accent" />
                  {locale === 'tr' ? 'Takım Ritmi' : 'Team Rhythm'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === 'tr'
                    ? 'Ekip üyelerinin son 7 gündeki görev ritmini ve geciken yükünü gör.'
                    : 'Review team members’ seven-day task rhythm and overdue load.'}
                </CardDescription>
              </div>
            </CardHeader>

            {teamRhythm.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface/25 px-4 py-8 text-center text-sm text-text-tertiary">
                {locale === 'tr'
                  ? 'Ekip ritmi gösterecek üye verisi henüz yok.'
                  : 'There is no member data yet to show team rhythm.'}
              </div>
            ) : (
              <div className="space-y-3">
                {teamRhythm.map(member => (
                  <div key={member.id} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{member.name}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {locale === 'tr'
                            ? `${member.value} görev hareketi · ${member.overdue} gecikmiş`
                            : `${member.value} task moves · ${member.overdue} overdue`}
                        </p>
                      </div>
                      <Badge variant={member.overdue > 0 ? 'warning' : 'success'}>
                        {member.value}
                      </Badge>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-background/70">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(percent(member.value, Math.max(teamRhythm[0]?.value ?? 1, 1)), member.value > 0 ? 10 : 0)}%`, backgroundColor: member.overdue > 0 ? '#f59e0b' : '#00d4ff' }}
                      />
                    </div>
                  </div>
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
                  <BarChart3 className="h-4 w-4 text-primary" />
                  {t.analytics.conversionFunnel}
                </CardTitle>
                <CardDescription className="mt-1">
                  {locale === 'tr'
                    ? 'Ham temasın gerçek dönüşüme nasıl indiğini yüzdelerle gör.'
                    : 'Track how raw contact volume cascades into real conversion.'}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3">
              {funnelSteps.map((step, index) => (
                <div key={step.stage} className="flex items-center gap-4">
                  <div className="w-24 shrink-0 text-xs text-text-secondary">{step.stage}</div>
                  <div className="relative h-9 flex-1 overflow-hidden rounded-2xl bg-surface">
                    <motion.div
                      className="h-full rounded-2xl"
                      style={{ backgroundColor: ['#00d4ff', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'][index] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(step.pct, step.value > 0 ? 12 : 0)}%` }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-primary">
                      {step.value}
                    </span>
                  </div>
                  <div className="w-12 text-right text-xs font-semibold text-text-primary">%{step.pct}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
