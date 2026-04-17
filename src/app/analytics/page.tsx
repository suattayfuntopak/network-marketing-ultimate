'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { fetchAllOrders, fetchContacts, fetchTasks, type ContactRow, type OrderRow, type TaskRow } from '@/lib/queries'
import {
  Users,
  Target,
  ShoppingBag,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const stageColors: Record<string, string> = {
  new: '#64748b',
  contact_planned: '#8b5cf6',
  first_contact: '#06b6d4',
  interested: '#14b8a6',
  invited: '#3b82f6',
  presentation_sent: '#22c55e',
  followup_pending: '#f59e0b',
  objection_handling: '#f97316',
  ready_to_buy: '#10b981',
  became_customer: '#059669',
  ready_to_join: '#a855f7',
  became_member: '#d946ef',
  nurture_later: '#94a3b8',
  dormant: '#475569',
  lost: '#ef4444',
}

const stageLabels: Record<string, { tr: string; en: string }> = {
  new: { tr: 'Yeni', en: 'New' },
  contact_planned: { tr: 'Planlandı', en: 'Planned' },
  first_contact: { tr: 'İlk Temas', en: 'First Contact' },
  interested: { tr: 'İlgili', en: 'Interested' },
  invited: { tr: 'Davetli', en: 'Invited' },
  presentation_sent: { tr: 'Sunum', en: 'Presentation' },
  followup_pending: { tr: 'Takip', en: 'Follow-up' },
  objection_handling: { tr: 'İtiraz', en: 'Objection' },
  ready_to_buy: { tr: 'Hazır', en: 'Ready' },
  became_customer: { tr: 'Müşteri', en: 'Customer' },
  ready_to_join: { tr: 'Katılıma Hazır', en: 'Ready to Join' },
  became_member: { tr: 'Üye', en: 'Member' },
  nurture_later: { tr: 'Sonra', en: 'Later' },
  dormant: { tr: 'Pasif', en: 'Dormant' },
  lost: { tr: 'Kaybedildi', en: 'Lost' },
}

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const CustomTooltip = ({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) => {
  if (!active || !payload) return null
  return (
    <div className="bg-elevated border border-border rounded-xl p-3 shadow-float">
      <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="text-xs text-text-secondary">{item.name}: <span className="font-semibold text-text-primary">{item.value}</span></p>
      ))}
    </div>
  )
}

function dateOnly(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function monthKey(value: string | null | undefined) {
  const date = dateOnly(value)
  if (!date) return null
  return `${date.getFullYear()}-${date.getMonth()}`
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function countContactsForDay(contacts: ContactRow[], date: Date, extractor: (contact: ContactRow) => string | null | undefined) {
  return contacts.filter((contact) => {
    const value = dateOnly(extractor(contact))
    return Boolean(value) && value!.getTime() === date.getTime()
  }).length
}

function countTasksForDay(tasks: TaskRow[], date: Date) {
  return tasks.filter((task) => {
    const due = dateOnly(task.due_date)
    return Boolean(due) && due!.getTime() === date.getTime()
  }).length
}

export default function AnalyticsPage() {
  const { t, locale } = useLanguage()

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

  const totalContacts = contacts.length || 1
  const contactedCount = contacts.filter((contact) => Boolean(contact.last_contact_date)).length
  const presentationCount = contacts.filter((contact) => ['presentation_sent', 'followup_pending', 'objection_handling', 'ready_to_buy', 'became_customer', 'ready_to_join', 'became_member'].includes(contact.pipeline_stage)).length
  const customerCount = contacts.filter((contact) => contact.pipeline_stage === 'became_customer').length
  const recruitCount = contacts.filter((contact) => contact.pipeline_stage === 'became_member').length
  const reorderReadyCount = orders.filter((order) => order.status !== 'cancelled' && Boolean(order.next_reorder_date)).length
  const teamTasks = tasks.filter((task) => {
    const contact = contacts.find((entry) => entry.id === task.contact_id)
    return contact?.pipeline_stage === 'became_member'
  })
  const onboardingHealthyCount = teamTasks.filter((task) => task.status !== 'overdue').length

  const contactRate = Math.round((contactedCount / totalContacts) * 100)
  const presentationRate = contactedCount === 0 ? 0 : Math.round((presentationCount / contactedCount) * 100)
  const customerConv = Math.round((customerCount / totalContacts) * 100)
  const recruitConv = Math.round((recruitCount / totalContacts) * 100)
  const reorderRate = orders.length === 0 ? 0 : Math.round((reorderReadyCount / orders.length) * 100)
  const onboardingRate = teamTasks.length === 0 ? 0 : Math.round((onboardingHealthyCount / teamTasks.length) * 100)

  const weeklyActivityData = Array.from({ length: 7 }).map((_, index) => {
    const date = startOfToday()
    date.setDate(date.getDate() - (6 - index))
    return {
      day: [t.common.mon, t.common.tue, t.common.wed, t.common.thu, t.common.fri, t.common.sat, t.common.sun][date.getDay() === 0 ? 6 : date.getDay() - 1],
      contacts: countContactsForDay(contacts, date, (contact) => contact.last_contact_date),
      followUps: countTasksForDay(tasks, date),
      newLeads: countContactsForDay(contacts, date, (contact) => contact.created_at),
    }
  })

  const monthlyConversionData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const leads = contacts.filter((contact) => monthKey(contact.created_at) === key).length
    const customers = orders.filter((order) => monthKey(order.order_date) === key).length
    const recruits = contacts.filter((contact) => contact.pipeline_stage === 'became_member' && monthKey(contact.created_at) === key).length
    const rate = leads === 0 ? 0 : Math.round(((customers + recruits) / leads) * 100)
    return {
      month: date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' }),
      leads,
      customers,
      recruits,
      rate,
    }
  })

  const pipelineDistribution = Object.entries(
    contacts.reduce<Record<string, number>>((acc, contact) => {
      acc[contact.pipeline_stage] = (acc[contact.pipeline_stage] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([stage, count]) => ({
      stage: stageLabels[stage]?.[locale] ?? stage,
      count,
      color: stageColors[stage] ?? '#64748b',
    }))
    .sort((left, right) => right.count - left.count)

  const memberContacts = contacts.filter((contact) => contact.pipeline_stage === 'became_member')
  const teamActivityHeatmap = memberContacts.map((contact) => {
    const memberTasksByDay = dayKeys.reduce<Record<(typeof dayKeys)[number], number>>((acc, dayKey) => {
      acc[dayKey] = 0
      return acc
    }, { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 })

    tasks
      .filter((task) => task.contact_id === contact.id)
      .forEach((task) => {
        const dueDate = new Date(task.due_date)
        const dayIndex = dueDate.getDay() === 0 ? 6 : dueDate.getDay() - 1
        const dayKey = dayKeys[dayIndex]
        memberTasksByDay[dayKey] += 1
      })

    return {
      name: contact.full_name,
      ...memberTasksByDay,
    }
  })

  const funnelSteps = [
    { stage: t.analytics.totalLeads, value: contacts.length },
    { stage: t.analytics.contacted, value: contactedCount },
    { stage: t.analytics.interested, value: contacts.filter((contact) => ['interested', 'invited', 'presentation_sent', 'followup_pending', 'objection_handling', 'ready_to_buy', 'ready_to_join', 'became_customer', 'became_member'].includes(contact.pipeline_stage)).length },
    { stage: t.analytics.presented, value: presentationCount },
    { stage: t.analytics.converted, value: customerCount + recruitCount },
  ].map((step) => ({
    ...step,
    pct: contacts.length === 0 ? 0 : Math.round((step.value / contacts.length) * 100),
  }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.analytics.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.analytics.subtitle}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t.analytics.contactRate, value: `${contactRate}%`, change: `${contactedCount}`, up: true, icon: Users },
          { label: t.analytics.presentationRate, value: `${presentationRate}%`, change: `${presentationCount}`, up: true, icon: Target },
          { label: t.analytics.customerConv, value: `${customerConv}%`, change: `${customerCount}`, up: true, icon: ShoppingBag },
          { label: t.analytics.recruitConv, value: `${recruitConv}%`, change: `${recruitCount}`, up: recruitCount >= 1, icon: Users },
          { label: t.analytics.reorderRate, value: `${reorderRate}%`, change: `${reorderReadyCount}`, up: reorderReadyCount >= 1, icon: Activity },
          { label: t.analytics.onboardingRate, value: `${onboardingRate}%`, change: `${teamTasks.length}`, up: onboardingRate >= 50, icon: GraduationCap },
        ].map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-text-tertiary" />
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${kpi.up ? 'text-success' : 'text-error'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-xl font-bold text-text-primary kpi-number">{kpi.value}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>{t.analytics.weeklyActivity}</CardTitle></CardHeader>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivityData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={CustomTooltip} />
                  <Bar dataKey="contacts" fill="#00d4ff" radius={[4, 4, 0, 0]} name={t.analytics.contacted} />
                  <Bar dataKey="followUps" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={t.common.followUps} />
                  <Bar dataKey="newLeads" fill="#10b981" radius={[4, 4, 0, 0]} name={t.common.newLeads} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>{t.analytics.monthlyTrend}</CardTitle></CardHeader>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyConversionData}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} /><stop offset="95%" stopColor="#00d4ff" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gCustomers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gRecruits" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={CustomTooltip} />
                  <Area type="monotone" dataKey="leads" stroke="#00d4ff" fill="url(#gLeads)" strokeWidth={2} name={t.analytics.totalLeads} />
                  <Area type="monotone" dataKey="customers" stroke="#10b981" fill="url(#gCustomers)" strokeWidth={2} name={t.customers.title} />
                  <Area type="monotone" dataKey="recruits" stroke="#8b5cf6" fill="url(#gRecruits)" strokeWidth={2} name={t.team.title} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>{t.analytics.pipelineDist}</CardTitle></CardHeader>
            <div className="h-[250px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={pipelineDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" paddingAngle={2}>
                    {pipelineDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pipelineDistribution.map((stage, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs text-text-secondary flex-1">{stage.stage}</span>
                    <span className="text-xs font-semibold text-text-primary">{stage.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>{t.analytics.teamHeatmap}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-semibold text-text-tertiary uppercase tracking-wider pb-2 pr-4">{t.common.member}</th>
                    {[t.common.mon, t.common.tue, t.common.wed, t.common.thu, t.common.fri, t.common.sat, t.common.sun].map((day) => (
                      <th key={day} className="text-center text-[10px] font-semibold text-text-tertiary uppercase tracking-wider pb-2 w-10">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamActivityHeatmap.map((row, index) => (
                    <tr key={index}>
                      <td className="text-xs text-text-primary font-medium py-1 pr-4">{row.name}</td>
                      {dayKeys.map((day) => {
                        const value = row[day]
                        const opacity = value === 0 ? 0 : 0.15 + (value / 5) * 0.85
                        return (
                          <td key={day} className="py-1 px-0.5">
                            <div className="w-9 h-7 rounded" style={{ backgroundColor: `rgba(0, 212, 255, ${opacity})` }} title={`${value} ${t.common.actions}`} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle>{t.analytics.conversionFunnel}</CardTitle></CardHeader>
          <div className="space-y-3">
            {funnelSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-xs text-text-secondary shrink-0">{step.stage}</div>
                <div className="flex-1 h-8 bg-surface rounded-lg overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ backgroundColor: ['#00d4ff', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'][index] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-primary">{step.value}</span>
                </div>
                <div className="w-12 text-right text-xs font-semibold text-text-primary">{step.pct}%</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
