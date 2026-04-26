'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
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
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import {
  fetchActiveCustomers,
  fetchAiUsageSeries,
  fetchAllInteractions,
  fetchAllOrders,
  fetchContacts,
  fetchEvents,
  fetchProducts,
  fetchTasks,
  type ContactRow,
  type InteractionRow,
  type OrderRow,
  type ProductRow,
  type TaskRow,
} from '@/lib/queries'
import type { Event } from '@/types'
import { PipelineSegmentDonut } from '@/components/dashboard/PipelineSegmentDonut'
import { Sparkline } from '@/components/dashboard/Sparkline'
import { buildPipelineSegments } from '@/components/dashboard/dashboardMetrics'
import {
  buildCohortTable,
  buildCustomerInsights,
  buildEngagementMetrics,
  buildEventPerformance,
  buildInteractionMix,
  buildOverdueSeries,
  buildProductPerformance,
  buildRevenueSeries,
  buildTeamAddsSeries,
  buildTeamLeaderboard,
  buildTopProducts,
  buildTrendSeries,
  getRangeBounds,
  inDateRange,
  parseDate,
  percent,
  periodLabel,
  rangeButtonLabel,
  startOfDay,
  type RangeOption,
} from '@/components/analytics/analyticsMetrics'
import { RevenueSection } from '@/components/analytics/RevenueSection'
import { ConversionGauges } from '@/components/analytics/ConversionGauges'
import { InteractionMix } from '@/components/analytics/InteractionMix'
import { EventPerformance } from '@/components/analytics/EventPerformance'
import { CohortTable } from '@/components/analytics/CohortTable'
import { TeamLeaderboard } from '@/components/analytics/TeamLeaderboard'
import { CustomerInsights } from '@/components/analytics/CustomerInsights'
import { ProductPerformance } from '@/components/analytics/ProductPerformance'
import { EngagementMetrics } from '@/components/analytics/EngagementMetrics'
import { ErrorCard } from '@/components/analytics/ErrorCard'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const RANGE_OPTIONS: RangeOption[] = ['7d', '30d', '90d', 'all']

function formatDelta(current: number, previous: number | null, locale: 'tr' | 'en') {
  if (previous === null) {
    return {
      value: locale === 'tr' ? 'Genel görünüm' : 'Overall view',
      positive: true,
      neutral: true,
    }
  }

  const diff = current - previous
  if (diff === 0) {
    return {
      value: locale === 'tr' ? 'Değişim yok' : 'No change',
      positive: true,
      neutral: true,
    }
  }
  const positive = diff >= 0
  if (previous === 0) {
    return {
      value: `${diff > 0 ? '+' : ''}${diff}`,
      positive,
      neutral: false,
    }
  }
  const pct = Math.round((diff / Math.max(previous, 1)) * 100)
  return {
    value: `${pct > 0 ? '+' : ''}${pct}%`,
    positive,
    neutral: false,
  }
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
  const h = useHeadingCase()
  const [range, setRange] = useState<RangeOption>('30d')

  const contactsQuery = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })
  const contacts = contactsQuery.data ?? []

  const tasksQuery = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30_000,
  })
  const tasks = tasksQuery.data ?? []

  const ordersQuery = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
    staleTime: 30_000,
  })
  const orders = ordersQuery.data ?? []

  const interactionsQuery = useQuery<InteractionRow[]>({
    queryKey: ['interactions-all'],
    queryFn: fetchAllInteractions,
    staleTime: 30_000,
  })
  const interactions = interactionsQuery.data ?? []

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 30_000,
  })
  const events = eventsQuery.data ?? []

  const productsQuery = useQuery<ProductRow[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 60_000,
  })
  const products = productsQuery.data ?? []

  const customersQuery = useQuery({
    queryKey: ['active-customers-summary'],
    queryFn: fetchActiveCustomers,
    staleTime: 60_000,
  })

  const aiUsageQuery = useQuery({
    queryKey: ['ai-usage-series', 90],
    queryFn: () => fetchAiUsageSeries(90),
    staleTime: 60_000,
  })

  const isInitialLoading =
    (contactsQuery.isPending && !contactsQuery.data) ||
    (tasksQuery.isPending && !tasksQuery.data) ||
    (ordersQuery.isPending && !ordersQuery.data) ||
    (interactionsQuery.isPending && !interactionsQuery.data) ||
    (eventsQuery.isPending && !eventsQuery.data)

  const hasFatalError =
    contactsQuery.isError &&
    tasksQuery.isError &&
    ordersQuery.isError &&
    interactionsQuery.isError &&
    eventsQuery.isError

  const handleRetry = () => {
    contactsQuery.refetch()
    tasksQuery.refetch()
    ordersQuery.refetch()
    interactionsQuery.refetch()
    eventsQuery.refetch()
    productsQuery.refetch()
    customersQuery.refetch()
    aiUsageQuery.refetch()
  }

  const today = startOfDay(new Date())
  const { start, end, previousStart, previousEnd } = getRangeBounds(range, today)
  const currentBounds = { start, end }
  const previousBounds = previousStart && previousEnd ? { start: previousStart, end: previousEnd } : null

  const currentContacts = contacts.filter((contact) => inDateRange(contact.created_at, currentBounds))
  const previousContacts = previousBounds
    ? contacts.filter((contact) => inDateRange(contact.created_at, previousBounds))
    : []

  const currentTouches = contacts.filter((contact) => inDateRange(contact.last_contact_date, currentBounds))
  const previousTouches = previousBounds
    ? contacts.filter((contact) => inDateRange(contact.last_contact_date, previousBounds))
    : []

  const currentPresentations = tasks.filter((task) => task.type === 'presentation' && inDateRange(task.due_date, currentBounds))
  const previousPresentations = previousBounds
    ? tasks.filter((task) => task.type === 'presentation' && inDateRange(task.due_date, previousBounds))
    : []

  const currentOrders = orders.filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, currentBounds))
  const previousOrders = previousBounds
    ? orders.filter((order) => order.status !== 'cancelled' && inDateRange(order.order_date, previousBounds))
    : []

  const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total_try ?? 0), 0)
  const avgOrderValue = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0

  const currentRecruits = contacts.filter((contact) => contact.pipeline_stage === 'became_member' && inDateRange(contact.created_at, currentBounds))
  const previousRecruits = previousBounds
    ? contacts.filter((contact) => contact.pipeline_stage === 'became_member' && inDateRange(contact.created_at, previousBounds))
    : []

  const currentOverdueTasks = tasks.filter((task) => {
    const due = parseDate(task.due_date)
    if (!due) return false
    return (task.status === 'overdue' || (task.status === 'pending' && due < today)) && (!start || due >= start) && due <= end
  })

  const previousOverdueTasks = previousBounds
    ? tasks.filter((task) => {
        const due = parseDate(task.due_date)
        if (!due) return false
        return (task.status === 'overdue' || task.status === 'pending') && due >= previousBounds.start! && due <= previousBounds.end
      })
    : []

  const pipelineSegments = buildPipelineSegments(contacts)
  const pipelineCounts = contacts.reduce<Record<string, number>>((accumulator, contact) => {
    accumulator[contact.pipeline_stage] = (accumulator[contact.pipeline_stage] ?? 0) + 1
    return accumulator
  }, {})

  const dormantCount = (pipelineCounts.dormant ?? 0) + (pipelineCounts.lost ?? 0)
  const readyToCloseCount = (pipelineCounts.ready_to_buy ?? 0) + (pipelineCounts.became_customer ?? 0)
  const warmPipelineCount =
    (pipelineCounts.interested ?? 0) +
    (pipelineCounts.presentation_sent ?? 0) +
    (pipelineCounts.presentation_done ?? 0) +
    (pipelineCounts.followup_pending ?? 0)
  const topSegment = pipelineSegments.slice().sort((left, right) => right.count - left.count)[0]

  const trendSeries = buildTrendSeries(range, locale, contacts, tasks, end)
  const revenueSeries = buildRevenueSeries(range, locale, orders, end)
  const interactionSeries = buildInteractionMix(range, locale, interactions, end)
  const topProducts = buildTopProducts(orders, currentBounds, 6)
  const teamAddsSeries = buildTeamAddsSeries(range, contacts, end)
  const overdueSeries = buildOverdueSeries(range, tasks, end)
  const cohortMonths = range === '7d' ? 3 : range === '30d' ? 6 : range === '90d' ? 9 : 12
  const cohortRows = buildCohortTable(contacts, locale, cohortMonths)
  const eventRows = buildEventPerformance(events, 6)
  const teamRows = buildTeamLeaderboard(contacts, tasks, currentBounds, today, 6)

  const productMeta = new Map(
    products.map((product) => [product.id, { name: product.name, reorder_cycle_days: product.reorder_cycle_days ?? null }] as const),
  )
  const productPerformance = buildProductPerformance(orders, currentBounds, productMeta, 8)
  const customerInsights = buildCustomerInsights(
    range,
    locale,
    customersQuery.data?.customerIds ?? null,
    contacts,
    orders,
    currentBounds,
    end,
  )
  const engagement = buildEngagementMetrics(range, locale, aiUsageQuery.data ?? [], end)

  const gaugeEntries = [
    {
      key: 'touch',
      label: locale === 'tr' ? 'Temas' : 'Touch',
      value: percent(currentTouches.length, Math.max(currentContacts.length, 1)),
      color: '#00d4ff',
      caption: `${currentTouches.length}/${Math.max(currentContacts.length, 1)}`,
    },
    {
      key: 'presentation',
      label: locale === 'tr' ? 'Sunum' : 'Presentation',
      value: percent(currentPresentations.length, Math.max(currentTouches.length, 1)),
      color: '#8b5cf6',
      caption: `${currentPresentations.length}/${Math.max(currentTouches.length, 1)}`,
    },
    {
      key: 'order',
      label: locale === 'tr' ? 'Sipariş' : 'Order',
      value: percent(currentOrders.length, Math.max(currentPresentations.length, 1)),
      color: '#10b981',
      caption: `${currentOrders.length}/${Math.max(currentPresentations.length, 1)}`,
    },
    {
      key: 'team',
      label: locale === 'tr' ? 'Ekibe Katılım' : 'Team Join',
      value: percent(currentRecruits.length, Math.max(currentContacts.length, 1)),
      color: '#f59e0b',
      caption: `${currentRecruits.length}/${Math.max(currentContacts.length, 1)}`,
    },
  ]

  const kpis = [
    {
      label: locale === 'tr' ? 'Yeni Adaylar' : 'New Prospects',
      value: currentContacts.length,
      delta: formatDelta(currentContacts.length, previousBounds ? previousContacts.length : null, locale),
      icon: Users,
      sparkData: trendSeries.map((point) => ({ value: point.contacts })),
      sparkColor: '#00d4ff',
      sparkId: 'kpi-contacts',
    },
    {
      label: locale === 'tr' ? 'Temaslar' : 'Touches',
      value: currentTouches.length,
      delta: formatDelta(currentTouches.length, previousBounds ? previousTouches.length : null, locale),
      icon: Activity,
      sparkData: trendSeries.map((point) => ({ value: point.touches })),
      sparkColor: '#8b5cf6',
      sparkId: 'kpi-touches',
    },
    {
      label: locale === 'tr' ? 'Sunumlar' : 'Presentations',
      value: currentPresentations.length,
      delta: formatDelta(currentPresentations.length, previousBounds ? previousPresentations.length : null, locale),
      icon: Presentation,
      sparkData: trendSeries.map((point) => ({ value: point.presentations })),
      sparkColor: '#f59e0b',
      sparkId: 'kpi-presentations',
    },
    {
      label: locale === 'tr' ? 'Gelir' : 'Revenue',
      value: new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
        notation: currentRevenue >= 1_000_000 ? 'compact' : 'standard',
      }).format(currentRevenue),
      delta: formatDelta(currentRevenue, previousBounds ? previousOrders.reduce((sum, order) => sum + (order.total_try ?? 0), 0) : null, locale),
      icon: ShoppingBag,
      sparkData: revenueSeries.map((point) => ({ value: point.revenue })),
      sparkColor: '#10b981',
      sparkId: 'kpi-revenue',
    },
    {
      label: locale === 'tr' ? 'Ekibe Katılım' : 'Team Adds',
      value: currentRecruits.length,
      delta: formatDelta(currentRecruits.length, previousBounds ? previousRecruits.length : null, locale),
      icon: UserPlus,
      sparkData: teamAddsSeries,
      sparkColor: '#f59e0b',
      sparkId: 'kpi-recruits',
    },
    {
      label: locale === 'tr' ? 'Geciken Takipler' : 'Overdue Follow-ups',
      value: currentOverdueTasks.length,
      delta: formatDelta(currentOverdueTasks.length, previousBounds ? previousOverdueTasks.length : null, locale),
      icon: Clock3,
      sparkData: overdueSeries,
      sparkColor: '#ef4444',
      sparkId: 'kpi-overdue',
      inverseDelta: true,
    },
  ]

  if (hasFatalError) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6">
        <ErrorCard onRetry={handleRetry} />
      </div>
    )
  }

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
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary lg:text-4xl">{h(t.analytics.title)}</h1>
              <p className="mt-2 sm:mt-3 text-[13px] sm:text-sm leading-6 text-text-secondary lg:text-base">
                {locale === 'tr'
                  ? `${periodLabel(range, locale)} için gelir, süreç kalitesi, dönüşüm motoru ve ekip performansını tek ekranda gör.`
                  : `Revenue, pipeline quality, conversion engine, and team performance for ${periodLabel(range, locale).toLowerCase()} on a single screen.`}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-2">
        <div className="mr-1 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-text-secondary">
          <Filter className="h-3.5 w-3.5" />
          {h(locale === 'tr' ? 'Görünüm aralığı' : 'View range')}
        </div>
        {RANGE_OPTIONS.map((option) => (
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

      <motion.div variants={item} className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {isInitialLoading && Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`kpi-skeleton-${index}`} className="h-[128px] sm:h-[148px]" />
        ))}
        {!isInitialLoading && kpis.map((kpi) => {
          const Icon = kpi.icon
          const isPositive = kpi.inverseDelta ? !kpi.delta.positive : kpi.delta.positive
          const trendClass = kpi.delta.neutral
            ? 'text-text-tertiary'
            : isPositive
              ? 'text-success'
              : 'text-error'
          return (
            <div key={kpi.label} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <Icon className="h-4 w-4 text-text-tertiary" />
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${trendClass}`}>
                  {!kpi.delta.neutral && (kpi.delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />)}
                  {kpi.delta.value}
                </span>
              </div>
              <p className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold text-text-primary truncate">{kpi.value}</p>
              <p className="mt-1 text-[11px] sm:text-xs text-text-tertiary line-clamp-2 leading-tight">{kpi.label}</p>
              <div className="mt-2 h-[28px]">
                <Sparkline data={kpi.sparkData} color={kpi.sparkColor} gradientId={kpi.sparkId} height={28} />
              </div>
            </div>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <RevenueSection
          series={revenueSeries}
          topProducts={topProducts}
          totalRevenue={currentRevenue}
          avgOrderValue={avgOrderValue}
          orderCount={currentOrders.length}
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <motion.div variants={item} className="h-full">
          <Card className="h-full" padding="lg">
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
            <div className="h-[240px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendSeries} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
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
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={28} />
                  <Tooltip content={CustomTooltip} />
                  <Area type="monotone" dataKey="contacts" name={locale === 'tr' ? 'Yeni aday' : 'New prospects'} stroke="#00d4ff" fill="url(#analyticsContacts)" strokeWidth={2.4} />
                  <Area type="monotone" dataKey="touches" name={locale === 'tr' ? 'Temas' : 'Touches'} stroke="#8b5cf6" fill="url(#analyticsTouches)" strokeWidth={2.2} />
                  <Area type="monotone" dataKey="presentations" name={locale === 'tr' ? 'Sunum' : 'Presentations'} stroke="#f59e0b" fill="url(#analyticsPresentations)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="h-full">
          <Card className="h-full" padding="lg">
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
                  label: locale === 'tr' ? 'En büyük segment' : 'Largest segment',
                  value: topSegment ? `${locale === 'tr' ? topSegment.labelTr : topSegment.labelEn} · ${topSegment.count}` : locale === 'tr' ? 'Veri yok' : 'No data',
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
              ].map((row) => (
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

      <motion.div variants={item}>
        <PipelineSegmentDonut segments={pipelineSegments} totalContacts={contacts.length} />
      </motion.div>

      <motion.div variants={item}>
        <ConversionGauges entries={gaugeEntries} />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
        <motion.div variants={item} className="h-full">
          <InteractionMix data={interactionSeries} />
        </motion.div>
        <motion.div variants={item} className="h-full">
          <EventPerformance rows={eventRows} />
        </motion.div>
      </div>

      <motion.div variants={item}>
        <CohortTable rows={cohortRows} />
      </motion.div>

      <motion.div variants={item}>
        <TeamLeaderboard rows={teamRows} />
      </motion.div>

      <motion.div variants={item}>
        <CustomerInsights summary={customerInsights} contacts={contacts} />
      </motion.div>

      <motion.div variants={item}>
        <ProductPerformance rows={productPerformance} />
      </motion.div>

      <motion.div variants={item}>
        <EngagementMetrics engagement={engagement} />
      </motion.div>

      <motion.div variants={item}>
        <Card padding="lg">
          <CardHeader className="mb-5 items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-secondary" />
                {t.analytics.conversionFunnel}
              </CardTitle>
              <CardDescription className="mt-1">
                {locale === 'tr'
                  ? 'Ham temasın dönüşüme nasıl indiğini aşama-aşama gör.'
                  : 'Track how raw contact volume cascades into real conversion.'}
              </CardDescription>
            </div>
            <Badge variant="default">{t.analytics.selectedPeriod} · {periodLabel(range, locale)}</Badge>
          </CardHeader>

          <div className="space-y-2">
            {(() => {
              const cohort = range === 'all'
                ? contacts
                : contacts.filter((contact) => inDateRange(contact.created_at, currentBounds))
              const baseSteps = [
                { stage: t.analytics.totalLeads, value: cohort.length, color: '#00d4ff' },
                { stage: t.analytics.contacted, value: cohort.filter((contact) => Boolean(contact.last_contact_date)).length, color: '#3b82f6' },
                {
                  stage: t.analytics.interested,
                  value: cohort.filter((contact) =>
                    ['interested', 'invited', 'presentation_sent', 'presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy'].includes(contact.pipeline_stage),
                  ).length,
                  color: '#8b5cf6',
                },
                {
                  stage: t.analytics.presented,
                  value: cohort.filter((contact) =>
                    ['presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy', 'became_customer', 'became_member'].includes(contact.pipeline_stage),
                  ).length,
                  color: '#f59e0b',
                },
                {
                  stage: t.analytics.converted,
                  value: cohort.filter((contact) =>
                    ['became_customer', 'became_member'].includes(contact.pipeline_stage),
                  ).length,
                  color: '#10b981',
                },
              ]
              return baseSteps
                .map((step, index, array) => {
                  const pct = percent(step.value, Math.max(cohort.length, 1))
                  const dropFromPrev = index === 0 ? null : array[index - 1].value - step.value
                  return { ...step, pct, dropFromPrev }
                })
                .map((step, index) => (
                  <div key={step.stage} className="rounded-2xl border border-border-subtle bg-surface/35 p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-20 sm:w-28 shrink-0 text-[11px] sm:text-xs font-semibold text-text-secondary line-clamp-2 leading-tight">{step.stage}</div>
                      <div className="relative h-8 sm:h-9 flex-1 overflow-hidden rounded-xl sm:rounded-2xl bg-background/70">
                        <motion.div
                          className="h-full rounded-xl sm:rounded-2xl"
                          style={{ backgroundColor: step.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(step.pct, step.value > 0 ? 8 : 0)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.08 }}
                        />
                        <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs font-semibold text-text-primary">{step.value}</span>
                      </div>
                      <div className="w-10 sm:w-16 text-right text-[11px] sm:text-xs font-semibold text-text-primary">%{step.pct}</div>
                    </div>
                    {step.dropFromPrev !== null && step.dropFromPrev > 0 && (
                      <p className="mt-1.5 sm:mt-2 pl-[92px] sm:pl-[132px] text-[10px] text-text-tertiary">
                        ↓ {step.dropFromPrev} {locale === 'tr' ? 'kişi önceki aşamadan devam etmedi' : 'dropped from previous stage'}
                      </p>
                    )}
                  </div>
                ))
            })()}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
