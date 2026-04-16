'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress, CircularProgress } from '@/components/ui/Progress'
import { useLanguage } from '@/components/common/LanguageProvider'
import { ranks, currentUser } from '@/data/mockData'
import { Trophy, Target, TrendingUp, Award, Star, Zap, Users } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function RankPage() {
  const { t } = useLanguage()
  const currentRank = ranks.find(r => r.name === currentUser.rank) || ranks[2]
  const nextRank = ranks.find(r => r.level === currentRank.level + 1)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.rank.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.rank.subtitle}</p>
      </motion.div>

      {/* Current Rank Hero */}
      <motion.div variants={item}>
        <Card glow="primary" className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-40" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <CircularProgress value={72} size={120} strokeWidth={8} variant="primary">
              <div className="text-center">
                <span className="text-3xl">{currentRank.badgeUrl}</span>
              </div>
            </CircularProgress>
            <div className="flex-1 text-center sm:text-left">
              <Badge variant="warning" size="md">{t.rank.currentRank}</Badge>
              <h2 className="text-2xl font-bold text-text-primary mt-2">{currentRank.name}</h2>
              <p className="text-sm text-text-secondary mt-1">{t.common.level} {currentRank.level} · 72% {t.common.progressTo} {nextRank?.name || 'Max'}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {currentRank.benefits.map((b, i) => <Badge key={i} variant="success" size="sm">{b}</Badge>)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Next Rank Requirements */}
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
              {nextRank.requirements.map((req, i) => {
                const current = req.type === 'personal_sales' ? 1450 : req.type === 'frontline' ? 3 : req.type === 'team_size' ? 12 : req.type === 'rank_advances' ? 1 : 0
                const pct = Math.min(Math.round((current / req.value) * 100), 100)
                const isMet = pct >= 100
                return (
                  <div key={i} className={`p-4 rounded-xl border ${isMet ? 'bg-success/5 border-success/15' : 'bg-surface/50 border-border-subtle'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isMet ? <Award className="w-4 h-4 text-success" /> : <Target className="w-4 h-4 text-text-tertiary" />}
                        <span className="text-sm font-medium text-text-primary">{req.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${isMet ? 'text-success' : 'text-text-primary'} kpi-number`}>
                        {req.type === 'personal_sales' ? `$${current}` : current} / {req.type === 'personal_sales' ? `$${req.value}` : req.value}
                      </span>
                    </div>
                    <Progress value={pct} variant={isMet ? 'success' : 'primary'} size="sm" />
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Rank Ladder */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> {t.rank.rankLadder}</CardTitle></CardHeader>
          <div className="space-y-3">
            {ranks.map((rank) => {
              const isCurrent = rank.name === currentUser.rank
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

      {/* Goals */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-warning" /> {t.rank.dailyGoals}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t.rank.contactsMade, current: 8, goal: 10, icon: Users },
              { label: t.rank.followUps, current: 5, goal: 8, icon: Target },
              { label: t.rank.presentations, current: 1, goal: 2, icon: Star },
              { label: t.rank.newLeads, current: 2, goal: 3, icon: TrendingUp },
            ].map((g, i) => {
              const Icon = g.icon
              const pct = Math.round((g.current / g.goal) * 100)
              return (
                <div key={i} className="p-4 rounded-xl bg-surface/50 border border-border-subtle text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${pct >= 100 ? 'text-success' : 'text-text-tertiary'}`} />
                  <p className="text-xl font-bold text-text-primary kpi-number">{g.current}<span className="text-sm text-text-tertiary">/{g.goal}</span></p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{g.label}</p>
                  <Progress value={pct} size="sm" variant={pct >= 100 ? 'success' : 'primary'} className="mt-2" />
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
