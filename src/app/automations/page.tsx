'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { automations } from '@/data/mockData'
import { Zap, Plus, Play, Pause, Clock, AlertTriangle, ArrowRight, Settings } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const triggerIcons: Record<string, any> = { stage_change: ArrowRight, date_reached: Clock, inactivity: AlertTriangle, manual: Play }

export default function AutomationsPage() {
  const { t } = useLanguage()

  const triggerLabel = (type: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t.events as any).triggerTypes?.[type] ?? type.replace(/_/g, ' ')

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.automations.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.automations.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>{t.automations.createAutomation}</Button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.automations.active, value: automations.filter(a => a.isActive).length, icon: Play, color: 'text-success' },
          { label: t.automations.totalRuns, value: automations.reduce((a, b) => a + b.runCount, 0), icon: Zap, color: 'text-primary' },
          { label: t.automations.thisWeek, value: 24, icon: Clock, color: 'text-warning' },
          { label: t.automations.templates, value: 8, icon: Settings, color: 'text-secondary' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center"><Icon className={`w-5 h-5 ${s.color}`} /></div>
              <div><p className="text-xl font-bold text-text-primary kpi-number">{s.value}</p><p className="text-xs text-text-tertiary">{s.label}</p></div>
            </div>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="space-y-3">
        {automations.map((auto) => {
          const Icon = triggerIcons[auto.trigger.type] || Zap
          return (
            <Card key={auto.id} hover>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${auto.isActive ? 'bg-success/15 text-success' : 'bg-surface-hover text-text-tertiary'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{auto.name}</h3>
                    <Badge variant={auto.isActive ? 'success' : 'default'} size="sm">{auto.isActive ? t.common.active : t.common.paused}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t.common.trigger}: {triggerLabel(auto.trigger.type)} · {auto.actions.length} {t.common.actions} · {t.common.run} {auto.runCount} {t.common.times}
                  </p>
                  {auto.lastRun && <p className="text-[10px] text-text-muted mt-0.5">{t.common.lastRun}: {new Date(auto.lastRun).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">{auto.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</Button>
                  <Button size="sm" variant="ghost"><Settings className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> {t.automations.automationTemplates}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: t.automations.templateNames.welcome, desc: t.automations.templateNames.welcomeDesc, icon: '👋' },
              { name: t.automations.templateNames.reorder, desc: t.automations.templateNames.reorderDesc, icon: '🔄' },
              { name: t.automations.templateNames.inactivity, desc: t.automations.templateNames.inactivityDesc, icon: '⚠️' },
              { name: t.automations.templateNames.eventFollowup, desc: t.automations.templateNames.eventFollowupDesc, icon: '📅' },
            ].map((t, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-colors text-center group">
                <span className="text-2xl">{t.icon}</span>
                <p className="text-sm font-medium text-text-primary mt-2">{t.name}</p>
                <p className="text-[10px] text-text-tertiary">{t.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
