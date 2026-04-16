'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { automations } from '@/data/mockData'
import type { Automation, AutomationTrigger } from '@/types'
import { Zap, Plus, Play, Pause, Clock, AlertTriangle, ArrowRight, Settings, ExternalLink } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const triggerIcons: Partial<Record<AutomationTrigger['type'], LucideIcon>> = {
  stage_change: ArrowRight,
  date_reached: Clock,
  inactivity: AlertTriangle,
  manual: Play,
  task_overdue: AlertTriangle,
  order_placed: Zap,
  course_completed: Zap,
  event_attended: Zap,
}

const blankAutomation: Omit<Automation, 'id' | 'userId' | 'conditions' | 'actions' | 'runCount'> = {
  name: '',
  trigger: { type: 'manual', config: {} },
  isActive: true,
  lastRun: undefined,
}

function automationDestination(automation: Automation) {
  if (automation.name.toLowerCase().includes('sipariş') || automation.trigger.type === 'order_placed') return '/customers'
  if (automation.name.toLowerCase().includes('üye') || automation.trigger.type === 'inactivity') return '/team'
  if (automation.trigger.type === 'stage_change') return '/pipeline'
  if (automation.trigger.type === 'course_completed') return '/academy'
  if (automation.trigger.type === 'event_attended') return '/events'
  return '/tasks'
}

export default function AutomationsPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [automationItems, setAutomationItems] = useState<Automation[]>(automations)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(blankAutomation)
  const [activeAutomation, setActiveAutomation] = useState<Automation | null>(null)
  const [editForm, setEditForm] = useState(blankAutomation)

  const triggerLabel = (type: AutomationTrigger['type']) =>
    t.events.triggerTypes[type] ?? type.replace(/_/g, ' ')

  function openCreateModal(prefill?: Partial<typeof blankAutomation>) {
    setCreateForm({
      ...blankAutomation,
      ...prefill,
      trigger: prefill?.trigger ?? blankAutomation.trigger,
    })
    setCreateOpen(true)
  }

  function createAutomation() {
    const nextAutomation: Automation = {
      id: `automation-${Date.now()}`,
      userId: 'u1',
      conditions: [],
      actions: [],
      runCount: 0,
      ...createForm,
    }
    setAutomationItems((current) => [nextAutomation, ...current])
    setCreateOpen(false)
  }

  function toggleAutomation(automation: Automation) {
    const updated = { ...automation, isActive: !automation.isActive }
    setAutomationItems((current) => current.map((item) => (item.id === automation.id ? updated : item)))
    if (activeAutomation?.id === automation.id) {
      setActiveAutomation(updated)
      setEditForm((current) => ({ ...current, isActive: updated.isActive }))
    }
  }

  function openAutomationSettings(automation: Automation) {
    setActiveAutomation(automation)
    setEditForm({
      name: automation.name,
      trigger: automation.trigger,
      isActive: automation.isActive,
      lastRun: automation.lastRun,
    })
  }

  function saveAutomation() {
    if (!activeAutomation) return
    const updated = { ...activeAutomation, ...editForm }
    setActiveAutomation(updated)
    setAutomationItems((current) => current.map((item) => (item.id === activeAutomation.id ? updated : item)))
  }

  function testAutomation() {
    if (!activeAutomation) return
    const updated: Automation = {
      ...activeAutomation,
      runCount: activeAutomation.runCount + 1,
      lastRun: new Date().toISOString().split('T')[0],
    }
    setActiveAutomation(updated)
    setAutomationItems((current) => current.map((item) => (item.id === activeAutomation.id ? updated : item)))
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.automations.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.automations.subtitle}</p>
        </div>
        <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openCreateModal()}>
          {t.automations.createAutomation}
        </Button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.automations.active, value: automationItems.filter((automation) => automation.isActive).length, icon: Play, color: 'text-success' },
          { label: t.automations.totalRuns, value: automationItems.reduce((count, automation) => count + automation.runCount, 0), icon: Zap, color: 'text-primary' },
          { label: t.automations.thisWeek, value: automationItems.filter((automation) => automation.lastRun).length, icon: Clock, color: 'text-warning' },
          { label: t.automations.templates, value: 4, icon: Settings, color: 'text-secondary' },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center"><Icon className={`w-5 h-5 ${stat.color}`} /></div>
              <div><p className="text-xl font-bold text-text-primary kpi-number">{stat.value}</p><p className="text-xs text-text-tertiary">{stat.label}</p></div>
            </div>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="space-y-3">
        {automationItems.map((automation) => {
          const Icon = triggerIcons[automation.trigger.type] || Zap
          return (
            <Card key={automation.id} hover onClick={() => openAutomationSettings(automation)}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${automation.isActive ? 'bg-success/15 text-success' : 'bg-surface-hover text-text-tertiary'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{automation.name}</h3>
                    <Badge variant={automation.isActive ? 'success' : 'default'} size="sm">{automation.isActive ? t.common.active : t.common.paused}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t.common.trigger}: {triggerLabel(automation.trigger.type)} · {automation.actions.length} {t.common.actions} · {t.common.run} {automation.runCount} {t.common.times}
                  </p>
                  {automation.lastRun && <p className="text-[10px] text-text-muted mt-0.5">{t.common.lastRun}: {new Date(automation.lastRun).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleAutomation(automation)
                    }}
                  >
                    {automation.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation()
                      openAutomationSettings(automation)
                    }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
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
              { name: t.automations.templateNames.welcome, desc: t.automations.templateNames.welcomeDesc, icon: '👋', trigger: 'stage_change' as const },
              { name: t.automations.templateNames.reorder, desc: t.automations.templateNames.reorderDesc, icon: '🔄', trigger: 'date_reached' as const },
              { name: t.automations.templateNames.inactivity, desc: t.automations.templateNames.inactivityDesc, icon: '⚠️', trigger: 'inactivity' as const },
              { name: t.automations.templateNames.eventFollowup, desc: t.automations.templateNames.eventFollowupDesc, icon: '📅', trigger: 'event_attended' as const },
            ].map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openCreateModal({ name: template.name, trigger: { type: template.trigger, config: {} }, isActive: true })}
                className="p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-colors text-center group"
              >
                <span className="text-2xl">{template.icon}</span>
                <p className="text-sm font-medium text-text-primary mt-2">{template.name}</p>
                <p className="text-[10px] text-text-tertiary">{template.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t.automations.createAutomation}
        description={locale === 'tr' ? 'Yeni bir otomasyon kur ve uygun tetikleyiciyi belirle.' : 'Create a new automation and define its trigger.'}
      >
        <div className="p-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Otomasyon adi' : 'Automation name'}</span>
            <input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Tetikleyici' : 'Trigger'}</span>
            <select
              value={createForm.trigger.type}
              onChange={(event) => setCreateForm((current) => ({ ...current, trigger: { ...current.trigger, type: event.target.value as AutomationTrigger['type'] } }))}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
            >
              {['stage_change', 'task_overdue', 'date_reached', 'inactivity', 'order_placed', 'course_completed', 'event_attended', 'manual'].map((type) => (
                <option key={type} value={type}>{triggerLabel(type as AutomationTrigger['type'])}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={createForm.isActive} onChange={(event) => setCreateForm((current) => ({ ...current, isActive: event.target.checked }))} />
            {locale === 'tr' ? 'Olusturuldugunda aktif olsun' : 'Activate immediately'}
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t.common.cancel}</Button>
            <Button type="button" onClick={createAutomation}>{t.common.create}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(activeAutomation)}
        onClose={() => setActiveAutomation(null)}
        title={activeAutomation?.name}
        description={activeAutomation ? `${triggerLabel(activeAutomation.trigger.type)} · ${activeAutomation.runCount} ${t.common.times}` : undefined}
      >
        {activeAutomation && (
          <div className="p-5 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Otomasyon adi' : 'Automation name'}</span>
              <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Tetikleyici' : 'Trigger'}</span>
              <select
                value={editForm.trigger.type}
                onChange={(event) => setEditForm((current) => ({ ...current, trigger: { ...current.trigger, type: event.target.value as AutomationTrigger['type'] } }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {['stage_change', 'task_overdue', 'date_reached', 'inactivity', 'order_placed', 'course_completed', 'event_attended', 'manual'].map((type) => (
                  <option key={type} value={type}>{triggerLabel(type as AutomationTrigger['type'])}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleAutomation(activeAutomation)}>
                {activeAutomation.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {activeAutomation.isActive ? (locale === 'tr' ? 'Duraklat' : 'Pause') : (locale === 'tr' ? 'Aktif et' : 'Activate')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={testAutomation}>
                <Play className="w-3.5 h-3.5" /> {locale === 'tr' ? 'Simdi test et' : 'Test now'}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => router.push(automationDestination(activeAutomation))}>
                <ExternalLink className="w-3.5 h-3.5" /> {locale === 'tr' ? 'Ilgili akisa git' : 'Open related flow'}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setActiveAutomation(null)}>{t.common.cancel}</Button>
              <Button type="button" onClick={saveAutomation}>{t.common.save}</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
