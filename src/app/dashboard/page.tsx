'use client'

import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { CircularProgress } from '@/components/ui/Progress'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { useRouter } from 'next/navigation'
import { completeTask, fetchContacts, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import {
  Flame, TrendingUp, Users, ShoppingBag,
  UserPlus, GraduationCap, Target, ArrowRight, Clock,
  Zap, Bot, Calendar, ChevronRight, Sparkles, BarChart3,
  CheckCircle2, Presentation
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const WEEK_DAYS = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
} as const

const PIPELINE_LABELS = {
  tr: {
    new: 'Yeni Potansiyel',
    contact_planned: 'Iletisim Planlandi',
    first_contact: 'Ilk Iletisim',
    interested: 'Ilgileniyor',
    invited: 'Davet Edildi',
    presentation_sent: 'Sunum Gonderildi',
    presentation_done: 'Sunum Yapildi',
    followup_pending: 'Takip Ediliyor',
    objection_handling: 'Itiraz Yonetimi',
    ready_to_buy: 'Karar Asamasinda',
    became_customer: 'Musteri Oldu',
    ready_to_join: 'Katilmaya Hazir',
    became_member: 'Ekip Uyesi',
    nurture_later: 'Sonra Ilgilen',
    dormant: 'Pasif',
    lost: 'Kaybedildi',
  },
  en: {
    new: 'New Lead',
    contact_planned: 'Contact Planned',
    first_contact: 'First Contact',
    interested: 'Interested',
    invited: 'Invited',
    presentation_sent: 'Presentation Sent',
    presentation_done: 'Presentation Done',
    followup_pending: 'Follow-up Active',
    objection_handling: 'Objection Handling',
    ready_to_buy: 'Decision Stage',
    became_customer: 'Became Customer',
    ready_to_join: 'Ready to Join',
    became_member: 'Became Member',
    nurture_later: 'Nurture Later',
    dormant: 'Dormant',
    lost: 'Lost',
  },
} as const

const PIPELINE_COLORS: Record<string, string> = {
  new: '#00d4ff', contact_planned: '#3b82f6', first_contact: '#8b5cf6',
  interested: '#a855f7', invited: '#f59e0b', presentation_sent: '#f97316',
  presentation_done: '#fb923c', followup_pending: '#ef4444', ready_to_buy: '#10b981', became_customer: '#059669',
  ready_to_join: '#06b6d4', became_member: '#6366f1', nurture_later: '#64748b',
  lost: '#475569',
}

export default function DashboardPage() {
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()
  const router = useRouter()
  const qc = useQueryClient()
  const weekDays = WEEK_DAYS[locale]
  const emptyWeek = weekDays.map(day => ({ day, contacts: 0, presentations: 0 }))
  const pipelineLabels = PIPELINE_LABELS[locale]
  const chartContactsLabel = t.common.contactsMade
  const chartPresentationsLabel = t.dashboard.kpi.presentations

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const urgentTasks = tasks.filter(task =>
    (task.priority === 'urgent' || task.priority === 'high') &&
    (task.status === 'pending' || task.status === 'overdue')
  )
  const hotLeads = contacts.filter(c => c.temperature === 'hot' && c.status === 'active')
  const pendingTasks = tasks.filter(t => t.status === 'pending')

  const completeTaskMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Pipeline dağılımı — gerçek veriden hesaplanır
  const pipelineCounts = contacts.reduce<Record<string, number>>((acc, c) => {
    acc[c.pipeline_stage] = (acc[c.pipeline_stage] ?? 0) + 1
    return acc
  }, {})
  const pipelineDistribution = Object.entries(pipelineCounts).map(([stage, count]) => ({
    stage: pipelineLabels[stage as keyof typeof pipelineLabels] ?? stage.replace(/_/g, ' '),
    count,
    color: PIPELINE_COLORS[stage] ?? '#64748b',
  }))

  const fullName = currentUser?.name ?? ''
  const momentum = currentUser?.momentumScore ?? 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeklyBuckets = emptyWeek.map((entry, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      ...entry,
      dateKey: date.toISOString().split('T')[0],
    }
  })

  const contactCounts = contacts.reduce<Record<string, number>>((accumulator, contact) => {
    const key = new Date(contact.created_at).toISOString().split('T')[0]
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  const presentationCounts = tasks.reduce<Record<string, number>>((accumulator, task) => {
    if (task.type !== 'presentation') return accumulator
    const key = new Date(task.due_date).toISOString().split('T')[0]
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  const weeklyActivity = weeklyBuckets.map(bucket => ({
    day: bucket.day,
    contacts: contactCounts[bucket.dateKey] ?? 0,
    presentations: presentationCounts[bucket.dateKey] ?? 0,
  }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">

      {/* Hero Command Card */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden" padding="lg">
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.08), transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.06), transparent 50%)' }} />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                  {t.dashboard.greeting}{fullName ? `, ${fullName}` : ''}
                </h1>
                <p className="text-sm text-text-secondary max-w-lg">
                  {pendingTasks.length > 0
                    ? <><span className="text-primary font-semibold">{pendingTasks.length}</span> {t.dashboard.tasksDue} &nbsp;</>
                    : null}
                  {hotLeads.length > 0
                    ? <><span className="text-error font-semibold">{hotLeads.length}</span> {t.dashboard.hotLeadsWaiting}</>
                    : null}
                  {pendingTasks.length === 0 && hotLeads.length === 0 && t.dashboard.momentumStrong}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <CircularProgress value={momentum} size={100} strokeWidth={8} variant="primary">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-text-primary">{momentum}</span>
                      <span className="text-[10px] text-text-tertiary block">/ 100</span>
                    </div>
                  </CircularProgress>
                  <p className="text-xs text-text-secondary mt-2 font-medium">{t.dashboard.momentum}</p>
                </div>
                <div className="text-center">
                  <CircularProgress
                    value={tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}
                    size={100} strokeWidth={8} variant="success"
                  >
                    <div className="text-center">
                      <span className="text-2xl font-bold text-text-primary">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}
                      </span>
                      <span className="text-[10px] text-text-tertiary block">%</span>
                    </div>
                  </CircularProgress>
                  <p className="text-xs text-text-secondary mt-2 font-medium">{t.dashboard.dailyFocus}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* KPI Strip */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {[
          { label: t.dashboard.kpi.newLeads, value: contacts.length, icon: Users, color: 'text-primary' },
          { label: t.dashboard.kpi.followUps, value: pendingTasks.length, icon: Clock, color: 'text-warning' },
          { label: t.dashboard.kpi.presentations, value: contacts.filter(c => ['presentation_sent', 'presentation_done'].includes(c.pipeline_stage)).length, icon: Presentation, color: 'text-secondary' },
          { label: t.dashboard.kpi.conversions, value: contacts.filter(c => c.pipeline_stage === 'became_customer').length, icon: Target, color: 'text-success' },
          { label: t.dashboard.kpi.customers, value: contacts.filter(c => c.pipeline_stage === 'became_customer' || c.pipeline_stage === 'became_member').length, icon: ShoppingBag, color: 'text-emerald-400' },
          { label: t.dashboard.kpi.team, value: contacts.filter(c => c.pipeline_stage === 'became_member').length, icon: UserPlus, color: 'text-violet-400' },
          { label: t.dashboard.kpi.training, value: 0, icon: GraduationCap, color: 'text-accent' },
          { label: t.nav.events, value: 0, icon: Calendar, color: 'text-accent' },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          const routeMap = [
            '/contacts?segment=prospects',
            '/tasks',
            '/pipeline',
            '/customers',
            '/customers',
            '/team',
            '/academy',
            '/events',
          ]
          return (
            <motion.div key={i} whileHover={{ y: -2 }}
              className="bg-card border border-border rounded-xl p-4 min-h-[96px] cursor-pointer hover:bg-card-hover hover:border-border-strong transition-all"
              onClick={() => router.push(routeMap[i])}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                <span className="text-xs sm:text-sm text-text-tertiary font-medium leading-snug">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary leading-none">{kpi.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today's Tasks */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  {t.dashboard.todaysFocus}
                </CardTitle>
                <Badge variant="primary">{urgentTasks.length} {t.common.urgent}</Badge>
              </CardHeader>
              {urgentTasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-tertiary">
                  {locale === 'tr' ? 'Bugün acil görev yok.' : 'No urgent tasks for today.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {urgentTasks.slice(0, 5).map((task, i) => (
                    <motion.div key={task.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer group transition-all"
                      onClick={() => router.push('/tasks')}
                    >
                      <button
                        onClick={event => {
                          event.stopPropagation()
                          completeTaskMutation.mutate(task.id)
                        }}
                        disabled={completeTaskMutation.isPending}
                        className="w-5 h-5 rounded-md border-2 border-border-strong hover:border-primary hover:bg-primary/10 transition-colors shrink-0 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-primary/50" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                        {task.description && <p className="text-xs text-text-tertiary truncate">{task.description}</p>}
                      </div>
                      <Badge variant={task.status === 'overdue' ? 'error' : task.priority === 'urgent' ? 'error' : 'warning'} size="sm">
                        {task.status === 'overdue'
                          ? t.tasks.overdueTasks
                          : t.tasks.priority[task.priority as keyof typeof t.tasks.priority]}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border">
                <button onClick={() => router.push('/tasks')} className="text-xs text-primary hover:text-primary-dim font-medium flex items-center gap-1">
                  {t.common.viewAll} {tasks.length} {t.nav.tasks.toLowerCase()} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Pipeline Overview */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-secondary" />
                  {t.dashboard.pipelineOverview}
                </CardTitle>
                <Badge variant="default">
                  {contacts.length} {locale === 'tr' ? 'kişi' : 'people'}
                </Badge>
              </CardHeader>
              {pipelineDistribution.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-tertiary">
                  {locale === 'tr'
                    ? 'Henüz huni verisi yok. Kişi ekleyerek başlayabilirsin.'
                    : 'There is no pipeline data yet. Start by adding a few contacts.'}
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {pipelineDistribution.map((stage, i) => (
                    <motion.div key={stage.stage}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex-1 min-w-[90px] bg-surface/50 border border-border-subtle rounded-xl p-3 text-center hover:border-border cursor-pointer transition-all"
                      onClick={() => router.push('/pipeline')}
                    >
                      <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                        {stage.count}
                      </div>
                      <p className="text-[10px] text-text-tertiary font-medium truncate capitalize">{stage.stage}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Activity Chart */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  {t.dashboard.weeklyActivity}
                </CardTitle>
                <div className="flex gap-3">
                  <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" /> {t.common.contactsMade}
                  </span>
                  <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-secondary" /> {t.dashboard.kpi.presentations}
                  </span>
                </div>
              </CardHeader>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyActivity}>
                    <defs>
                      <linearGradient id="cC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', fontSize: '12px', color: '#f1f5f9' }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="contacts"
                      name={chartContactsLabel}
                      stroke="#00d4ff"
                      fill="url(#cC)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="presentations"
                      name={chartPresentationsLabel}
                      stroke="#8b5cf6"
                      fill="url(#cP)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* AI Next Best Actions */}
          <motion.div variants={item}>
            <Card glow="primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-secondary" />
                  {t.dashboard.aiRecommendations}
                </CardTitle>
                <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
              </CardHeader>
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-sm text-text-secondary font-medium">AI Koç aktifleştiriliyor</p>
                <p className="text-xs text-text-tertiary mt-1">Veri eklendikçe öneriler burada görünecek</p>
              </div>
            </Card>
          </motion.div>

          {/* Hot Leads */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-error" />
                  {t.dashboard.hotLeads}
                </CardTitle>
                <Badge variant="error">{hotLeads.length}</Badge>
              </CardHeader>
              {hotLeads.length === 0 ? (
                <div className="py-6 text-center text-sm text-text-tertiary">
                  Henüz sıcak lead yok
                </div>
              ) : (
                <div className="space-y-2">
                  {hotLeads.slice(0, 5).map((lead, i) => (
                    <motion.div key={lead.id}
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface/50 cursor-pointer group transition-colors"
                      onClick={() => router.push(`/contacts?contact=${lead.id}`)}
                    >
                      <Avatar name={lead.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{lead.full_name}</p>
                        <p className="text-[10px] text-text-tertiary truncate">
                          {[lead.profession, lead.location].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <TemperatureBadge temperature={lead.temperature} score={lead.temperature_score} />
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  {t.dashboard.upcomingEvents}
                </CardTitle>
              </CardHeader>
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm text-text-secondary font-medium">Yaklaşan etkinlik yok</p>
                <button onClick={() => router.push('/events')} className="mt-3 text-xs text-primary hover:text-primary-dim font-medium flex items-center gap-1 mx-auto">
                  {t.common.createNewEvent} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
