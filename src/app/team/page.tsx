'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { fetchContacts, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import {
  Users, UserPlus, AlertTriangle, Shield, Target,
  Activity, BarChart3, CheckCircle2, Clock,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type TeamCard = {
  id: string
  name: string
  roleLabel: string
  joinDate: string
  activityScore: number
  streak: number
  momentumScore: number
  onboardingStatus: 'not_started' | 'in_progress' | 'complete'
  onboardingProgress: number
  pipelineHealth: 'strong' | 'moderate' | 'weak' | 'critical'
  riskLevel: 'low' | 'medium' | 'high'
  lastActive: string
  status: 'online' | 'away' | 'offline'
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function formatMonthYear(value: string) {
  return new Date(value).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
}

function daysSince(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function derivePipelineHealth(score: number): TeamCard['pipelineHealth'] {
  if (score >= 80) return 'strong'
  if (score >= 55) return 'moderate'
  if (score >= 30) return 'weak'
  return 'critical'
}

function deriveRiskLevel(score: number): TeamCard['riskLevel'] {
  if (score >= 70) return 'low'
  if (score >= 40) return 'medium'
  return 'high'
}

function deriveStatus(activityScore: number): TeamCard['status'] {
  if (activityScore >= 75) return 'online'
  if (activityScore >= 40) return 'away'
  return 'offline'
}

export default function TeamPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()
  const router = useRouter()

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const memberContacts = contacts.filter(contact => contact.pipeline_stage === 'became_member')

  const currentUserCard: TeamCard | null = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    roleLabel: currentUser.rank ?? 'Lider',
    joinDate: currentUser.joinDate,
    activityScore: clamp(Math.round((currentUser.momentumScore + currentUser.streak * 4) / 2)),
    streak: currentUser.streak,
    momentumScore: currentUser.momentumScore,
    onboardingStatus: 'complete',
    onboardingProgress: 100,
    pipelineHealth: derivePipelineHealth(currentUser.momentumScore),
    riskLevel: deriveRiskLevel(currentUser.momentumScore),
    lastActive: new Date().toISOString(),
    status: deriveStatus(currentUser.momentumScore),
  } : null

  const teamCardsFromContacts: TeamCard[] = memberContacts.map(contact => {
    const memberTasks = tasks.filter(task => task.contact_id === contact.id)
    const completedTasks = memberTasks.filter(task => task.status === 'completed').length
    const activeTaskWeight = memberTasks.filter(task => task.status === 'pending' || task.status === 'overdue').length
    const relationship = contact.relationship_strength
    const temperature = contact.temperature_score
    const momentumScore = clamp(Math.round((relationship * 0.6) + (temperature * 0.4)))
    const activityScore = clamp(Math.round((relationship * 0.5) + (temperature * 0.3) + (completedTasks * 8) - (activeTaskWeight * 3)))
    const accountAgeInDays = daysSince(contact.created_at)
    const onboardingProgress = clamp(accountAgeInDays >= 30 ? 100 : Math.round((accountAgeInDays / 30) * 100))
    const onboardingStatus = onboardingProgress >= 100 ? 'complete' : onboardingProgress > 0 ? 'in_progress' : 'not_started'

    return {
      id: contact.id,
      name: contact.full_name,
      roleLabel: contact.profession || 'Ekip Uyesi',
      joinDate: contact.created_at,
      activityScore,
      streak: completedTasks,
      momentumScore,
      onboardingStatus,
      onboardingProgress,
      pipelineHealth: derivePipelineHealth(momentumScore),
      riskLevel: deriveRiskLevel(activityScore),
      lastActive: contact.last_contact_date ?? contact.updated_at,
      status: deriveStatus(activityScore),
    }
  })

  const teamCards = currentUserCard ? [currentUserCard, ...teamCardsFromContacts] : teamCardsFromContacts
  const activeCount = teamCards.filter(member => member.riskLevel === 'low').length
  const atRiskCount = teamCards.filter(member => member.riskLevel === 'high' || member.riskLevel === 'medium').length
  const avgActivity = teamCards.length > 0
    ? Math.round(teamCards.reduce((total, member) => total + member.activityScore, 0) / teamCards.length)
    : 0

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.team.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{teamCards.length} {t.team.subtitle}</p>
        </div>
        <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => router.push('/pipeline')}>
          {t.team.inviteMember}
        </Button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.team.totalMembers, value: teamCards.length, icon: Users, color: 'text-primary' },
          { label: t.team.activeMembers, value: activeCount, icon: Activity, color: 'text-success' },
          { label: t.team.atRisk, value: atRiskCount, icon: AlertTriangle, color: 'text-warning' },
          { label: t.team.avgActivity, value: `${avgActivity}%`, icon: BarChart3, color: 'text-secondary' },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary kpi-number">{stat.value}</p>
                <p className="text-xs text-text-tertiary">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teamCards.length === 0 ? (
          <Card className="lg:col-span-2">
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-text-muted opacity-40 mx-auto mb-3" />
              <p className="text-sm text-text-secondary font-medium">Henuz ekip uyesi yok</p>
              <p className="text-xs text-text-tertiary mt-1">Bir kisiyi “Ekip Uyesi” asamasina tasidiginda burada gorunecek.</p>
            </div>
          </Card>
        ) : (
          teamCards.map(member => (
            <motion.div key={member.id} variants={item}>
              <Card hover glow={member.riskLevel === 'high' ? 'error' : 'none'}>
                <div className="flex items-start gap-4">
                  <Avatar name={member.name} size="lg" status={member.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-text-primary">{member.name}</h3>
                      <Badge
                        variant={member.riskLevel === 'low' ? 'success' : member.riskLevel === 'medium' ? 'warning' : 'error'}
                        size="sm"
                      >
                        {t.team.riskLevel[member.riskLevel]}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{member.roleLabel} · {formatMonthYear(member.joinDate)}</p>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-lg font-bold text-text-primary kpi-number">{member.activityScore}</p>
                        <p className="text-[10px] text-text-tertiary">{t.common.activity}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-text-primary kpi-number">{member.streak}</p>
                        <p className="text-[10px] text-text-tertiary">{t.common.streak}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-text-primary kpi-number">{member.momentumScore}</p>
                        <p className="text-[10px] text-text-tertiary">{t.common.momentum}</p>
                      </div>
                    </div>

                    {member.onboardingStatus === 'in_progress' && (
                      <div className="mt-3">
                        <Progress value={member.onboardingProgress} size="sm" variant="primary" showLabel label={t.common.onboarding} />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge
                        variant={
                          member.pipelineHealth === 'strong'
                            ? 'success'
                            : member.pipelineHealth === 'moderate'
                              ? 'warning'
                              : 'error'
                        }
                        size="sm"
                      >
                        {t.team.pipelineHealth[member.pipelineHealth]} {t.common.pipeline}
                      </Badge>
                      <span className="text-[10px] text-text-tertiary">
                        {t.common.lastActive}: {new Date(member.lastActive).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> {t.team.duplicationToolkit}
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: t.team.launchChecklist, desc: t.team.first48h, icon: CheckCircle2 },
              { name: t.team.scriptPacks, desc: t.team.inviteFollowUp, icon: Target },
              { name: t.team.onboardingTemplates, desc: t.team.newMemberFlow, icon: Users },
              { name: t.team.teamMeetingKit, desc: t.team.weeklyCallGuide, icon: Clock },
            ].map((tool, index) => {
              const Icon = tool.icon
              return (
                <div key={index} className="p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-colors text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-primary">{tool.name}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{tool.desc}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
