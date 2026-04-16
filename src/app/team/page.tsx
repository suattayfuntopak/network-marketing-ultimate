'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { teamMembers } from '@/data/mockData'
import {
  Users, UserPlus, TrendingUp, AlertTriangle, Shield, Target,
  ChevronRight, Phone, MessageCircle, Award, Flame, Activity,
  BarChart3, Zap, CheckCircle2, Clock
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function TeamPage() {
  const { t } = useLanguage()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const member = selectedMember ? teamMembers.find(m => m.user.id === selectedMember) : null

  const activeCount = teamMembers.filter(m => m.riskLevel === 'low').length
  const atRiskCount = teamMembers.filter(m => m.riskLevel === 'high' || m.riskLevel === 'medium').length
  const avgActivity = Math.round(teamMembers.reduce((a, m) => a + m.activityScore, 0) / teamMembers.length)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.team.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{teamMembers.length} {t.team.subtitle}</p>
        </div>
        <Button size="sm" icon={<UserPlus className="w-3.5 h-3.5" />}>{t.team.inviteMember}</Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.team.totalMembers, value: teamMembers.length, icon: Users, color: 'text-primary' },
          { label: t.team.activeMembers, value: activeCount, icon: Activity, color: 'text-success' },
          { label: t.team.atRisk, value: atRiskCount, icon: AlertTriangle, color: 'text-warning' },
          { label: t.team.avgActivity, value: `${avgActivity}%`, icon: BarChart3, color: 'text-secondary' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center"><Icon className={`w-5 h-5 ${stat.color}`} /></div>
              <div><p className="text-xl font-bold text-text-primary kpi-number">{stat.value}</p><p className="text-xs text-text-tertiary">{stat.label}</p></div>
            </div>
          )
        })}
      </motion.div>

      {/* Team Members */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teamMembers.map((tm, i) => (
          <motion.div key={tm.user.id} variants={item}>
            <Card hover onClick={() => setSelectedMember(tm.user.id)} glow={tm.riskLevel === 'high' ? 'error' : 'none'}>
              <div className="flex items-start gap-4">
                <Avatar name={tm.user.name} size="lg" status={tm.activityScore > 50 ? 'online' : tm.activityScore > 20 ? 'away' : 'offline'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{tm.user.name}</h3>
                    <Badge variant={tm.riskLevel === 'low' ? 'success' : tm.riskLevel === 'medium' ? 'warning' : 'error'} size="sm">{t.team.riskLevel[tm.riskLevel as keyof typeof t.team.riskLevel]}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{tm.user.rank} · {tm.recruit?.joinDate ? new Date(tm.recruit.joinDate).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }) : '—'}</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div><p className="text-lg font-bold text-text-primary kpi-number">{tm.activityScore}</p><p className="text-[10px] text-text-tertiary">{t.common.activity}</p></div>
                    <div><p className="text-lg font-bold text-text-primary kpi-number">{tm.user.streak}</p><p className="text-[10px] text-text-tertiary">{t.common.streak}</p></div>
                    <div><p className="text-lg font-bold text-text-primary kpi-number">{tm.user.momentumScore}</p><p className="text-[10px] text-text-tertiary">{t.common.momentum}</p></div>
                  </div>
                  {tm.onboardingStatus === 'in_progress' && tm.recruit && (
                    <div className="mt-3">
                      <Progress value={tm.recruit.onboardingProgress} size="sm" variant="primary" showLabel label={t.common.onboarding} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={tm.pipelineHealth === 'strong' ? 'success' : tm.pipelineHealth === 'moderate' ? 'warning' : 'error'} size="sm">{t.team.pipelineHealth[tm.pipelineHealth as keyof typeof t.team.pipelineHealth]} {t.common.pipeline}</Badge>
                    <span className="text-[10px] text-text-tertiary">{t.common.lastActive}: {new Date(tm.lastActive).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Duplication Assets */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> {t.team.duplicationToolkit}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: t.team.launchChecklist, desc: t.team.first48h, icon: CheckCircle2 },
              { name: t.team.scriptPacks, desc: t.team.inviteFollowUp, icon: Target },
              { name: t.team.onboardingTemplates, desc: t.team.newMemberFlow, icon: Users },
              { name: t.team.teamMeetingKit, desc: t.team.weeklyCallGuide, icon: Clock },
            ].map((tool, i) => {
              const Icon = tool.icon
              return (
                <div key={i} className="p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-colors text-center">
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
