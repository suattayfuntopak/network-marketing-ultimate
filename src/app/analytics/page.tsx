'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { weeklyActivityData, monthlyConversionData, pipelineDistribution, teamActivityHeatmap } from '@/data/mockData'
import {
  Users, Target, ShoppingBag, GraduationCap,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import type { TooltipContentProps, TooltipValueType } from 'recharts'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type TeamActivityRow = (typeof teamActivityHeatmap)[number]
type TeamActivityDay = Exclude<keyof TeamActivityRow, 'name'>

const teamActivityDays: TeamActivityDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

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

export default function AnalyticsPage() {
  const { t } = useLanguage()
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.analytics.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.analytics.subtitle}</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t.analytics.contactRate, value: '78%', change: '+5%', up: true, icon: Users },
          { label: t.analytics.presentationRate, value: '42%', change: '+8%', up: true, icon: Target },
          { label: t.analytics.customerConv, value: '31%', change: '+3%', up: true, icon: ShoppingBag },
          { label: t.analytics.recruitConv, value: '12%', change: '-2%', up: false, icon: Users },
          { label: t.analytics.reorderRate, value: '68%', change: '+12%', up: true, icon: Activity },
          { label: t.analytics.onboardingRate, value: '85%', change: '+5%', up: true, icon: GraduationCap },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
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
        {/* Activity Chart */}
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
                  <Bar dataKey="followUps" fill="#8b5cf6" radius={[4, 4, 0, 0]} name={t.rank.followUps} />
                  <Bar dataKey="newLeads" fill="#10b981" radius={[4, 4, 0, 0]} name={t.rank.newLeads} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Conversion Trend */}
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

        {/* Pipeline Distribution */}
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>{t.analytics.pipelineDist}</CardTitle></CardHeader>
            <div className="h-[250px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={pipelineDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" paddingAngle={2}>
                    {pipelineDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pipelineDistribution.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs text-text-secondary flex-1">{stage.stage}</span>
                    <span className="text-xs font-semibold text-text-primary">{stage.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Team Activity Heatmap */}
        <motion.div variants={item}>
          <Card>
            <CardHeader><CardTitle>{t.analytics.teamHeatmap}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-semibold text-text-tertiary uppercase tracking-wider pb-2 pr-4">{t.common.member}</th>
                    {[t.common.mon, t.common.tue, t.common.wed, t.common.thu, t.common.fri, t.common.sat, t.common.sun].map(d => (
                      <th key={d} className="text-center text-[10px] font-semibold text-text-tertiary uppercase tracking-wider pb-2 w-10">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamActivityHeatmap.map((row, i) => (
                    <tr key={i}>
                      <td className="text-xs text-text-primary font-medium py-1 pr-4">{row.name}</td>
                      {teamActivityDays.map(day => {
                        const val = row[day]
                        const opacity = val === 0 ? 0 : 0.15 + (val / 5) * 0.85
                        return (
                          <td key={day} className="py-1 px-0.5">
                            <div className="w-9 h-7 rounded" style={{ backgroundColor: `rgba(0, 212, 255, ${opacity})` }} title={`${val} ${t.common.actions}`} />
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

      {/* Funnel */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle>{t.analytics.conversionFunnel}</CardTitle></CardHeader>
          <div className="space-y-3">
            {[
              { stage: t.analytics.totalLeads, value: 120, pct: 100, color: '#00d4ff' },
              { stage: t.analytics.contacted, value: 94, pct: 78, color: '#06b6d4' },
              { stage: t.analytics.interested, value: 52, pct: 43, color: '#14b8a6' },
              { stage: t.analytics.presented, value: 38, pct: 32, color: '#10b981' },
              { stage: t.analytics.converted, value: 24, pct: 20, color: '#22c55e' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-xs text-text-secondary shrink-0">{step.stage}</div>
                <div className="flex-1 h-8 bg-surface rounded-lg overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ backgroundColor: step.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
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
