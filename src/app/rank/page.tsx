'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress, CircularProgress } from '@/components/ui/Progress'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { fetchAllOrders, fetchContacts, fetchTasks, type ContactRow, type OrderRow, type TaskRow } from '@/lib/queries'
import { ranks } from '@/data/mockData'
import { Trophy, Target, TrendingUp, Award, Star, Zap, Users } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function isToday(value: string | null | undefined) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  date.setHours(0, 0, 0, 0)
  return date.getTime() === startOfToday().getTime()
}

export default function RankPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()

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

  const currentRank = ranks.find((rank) => rank.name === currentUser?.rank) || ranks[2]
  const nextRank = ranks.find((rank) => rank.level === currentRank.level + 1)

  const personalSales = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + order.total_try, 0)

  const memberContacts = contacts.filter((contact) => contact.pipeline_stage === 'became_member')
  const frontlineCount = memberContacts.length
  const teamSize = memberContacts.length
  const rankAdvances = memberContacts.filter((contact) => {
    const memberTasks = tasks.filter((task) => task.contact_id === contact.id)
    return memberTasks.filter((task) => task.status === 'completed').length >= 2
  }).length

  const nextRankProgress = nextRank?.requirements.map((requirement) => {
    const current =
      requirement.type === 'personal_sales'
        ? personalSales
        : requirement.type === 'frontline'
          ? frontlineCount
          : requirement.type === 'team_size'
            ? teamSize
            : requirement.type === 'rank_advances'
              ? rankAdvances
              : 0

    const percentage = Math.min(Math.round((current / requirement.value) * 100), 100)
    return {
      requirement,
      current,
      percentage,
      isMet: percentage >= 100,
    }
  }) ?? []

  const overallProgress = nextRankProgress.length === 0
    ? 100
    : Math.round(nextRankProgress.reduce((sum, entry) => sum + entry.percentage, 0) / nextRankProgress.length)

  const todaysGoals = [
    {
      label: t.rank.contactsMade,
      current: contacts.filter((contact) => isToday(contact.last_contact_date)).length,
      goal: 10,
      icon: Users,
    },
    {
      label: t.rank.followUps,
      current: tasks.filter((task) => isToday(task.due_date)).length,
      goal: 8,
      icon: Target,
    },
    {
      label: t.rank.presentations,
      current: contacts.filter((contact) => contact.pipeline_stage === 'presentation_sent').length,
      goal: 2,
      icon: Star,
    },
    {
      label: t.rank.newLeads,
      current: contacts.filter((contact) => isToday(contact.created_at)).length,
      goal: 3,
      icon: TrendingUp,
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.rank.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.rank.subtitle}</p>
      </motion.div>

      <motion.div variants={item}>
        <Card glow="primary" className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-40" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <CircularProgress value={overallProgress} size={120} strokeWidth={8} variant="primary">
              <div className="text-center">
                <span className="text-3xl">{currentRank.badgeUrl}</span>
              </div>
            </CircularProgress>
            <div className="flex-1 text-center sm:text-left">
              <Badge variant="warning" size="md">{t.rank.currentRank}</Badge>
              <h2 className="text-2xl font-bold text-text-primary mt-2">{currentRank.name}</h2>
              <p className="text-sm text-text-secondary mt-1">{t.common.level} {currentRank.level} · {overallProgress}% {t.common.progressTo} {nextRank?.name || 'Max'}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {currentRank.benefits.map((benefit, index) => <Badge key={index} variant="success" size="sm">{benefit}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {nextRank && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {t.rank.requirements} {nextRank.name}
              </CardTitle>
              <span className="text-3xl">{nextRank.badgeUrl}</span>
            </CardHeader>
            <div className="space-y-4">
              {nextRankProgress.map((entry, index) => (
                <div key={index} className={`p-4 rounded-xl border ${entry.isMet ? 'bg-success/5 border-success/15' : 'bg-surface/50 border-border-subtle'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.isMet ? <Award className="w-4 h-4 text-success" /> : <Target className="w-4 h-4 text-text-tertiary" />}
                      <span className="text-sm font-medium text-text-primary">{entry.requirement.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${entry.isMet ? 'text-success' : 'text-text-primary'} kpi-number`}>
                      {entry.requirement.type === 'personal_sales' ? `₺${Math.round(entry.current)}` : entry.current} / {entry.requirement.type === 'personal_sales' ? `₺${entry.requirement.value}` : entry.requirement.value}
                    </span>
                  </div>
                  <Progress value={entry.percentage} variant={entry.isMet ? 'success' : 'primary'} size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> {t.rank.rankLadder}</CardTitle></CardHeader>
          <div className="space-y-3">
            {ranks.map((rank) => {
              const isCurrent = rank.name === currentUser?.rank
              const isPast = rank.level < currentRank.level
              return (
                <div key={rank.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isCurrent ? 'bg-primary/5 border-primary/20' : isPast ? 'bg-success/5 border-success/10' : 'bg-surface/30 border-border-subtle'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isCurrent ? 'bg-primary/15 ring-2 ring-primary/30' : isPast ? 'bg-success/15' : 'bg-surface-hover'}`}>
                    {rank.badgeUrl}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{rank.name}</span>
                      {isCurrent && <Badge variant="primary" size="sm">{t.common.current}</Badge>}
                      {isPast && <Badge variant="success" size="sm">{t.common.achieved}</Badge>}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{t.common.level} {rank.level} · {rank.requirements.length} {t.common.requirements}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">{rank.benefits.length} {t.common.benefits}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-warning" /> {t.rank.dailyGoals}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {todaysGoals.map((goal, index) => {
              const Icon = goal.icon
              const percentage = Math.min(Math.round((goal.current / goal.goal) * 100), 100)
              return (
                <div key={index} className="p-4 rounded-xl bg-surface/50 border border-border-subtle text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${percentage >= 100 ? 'text-success' : 'text-text-tertiary'}`} />
                  <p className="text-xl font-bold text-text-primary kpi-number">{goal.current}<span className="text-sm text-text-tertiary">/{goal.goal}</span></p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{goal.label}</p>
                  <Progress value={percentage} size="sm" variant={percentage >= 100 ? 'success' : 'primary'} className="mt-2" />
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
