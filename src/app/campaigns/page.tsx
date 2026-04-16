'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { campaigns } from '@/data/mockData'
import type { Campaign } from '@/types'
import { Plus, Users, Calendar, Zap, ArrowRight, ExternalLink, Pause, Play } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const campaignTypeColors: Record<string, string> = {
  launch: 'bg-primary/15 text-primary',
  product_promo: 'bg-success/15 text-success',
  recruit_activation: 'bg-secondary/15 text-secondary',
  retention: 'bg-warning/15 text-warning',
  event_push: 'bg-accent/15 text-accent',
  rank_sprint: 'bg-amber-500/15 text-amber-400',
  social_challenge: 'bg-rose-500/15 text-rose-400',
  duplication_sprint: 'bg-emerald-500/15 text-emerald-400',
}

const campaignTypeLabels: Record<string, { tr: string; en: string }> = {
  launch: { tr: '7 Günlük Başlangıç', en: '7-Day Launch' },
  product_promo: { tr: 'Ürün Tanıtımı', en: 'Product Promo' },
  recruit_activation: { tr: 'Üye Aktivasyonu', en: 'Recruit Activation' },
  retention: { tr: 'Sadakat Kampanyası', en: 'Retention' },
  event_push: { tr: 'Etkinlik İtişi', en: 'Event Push' },
  rank_sprint: { tr: 'Rütbe Sprinti', en: 'Rank Sprint' },
  social_challenge: { tr: 'Sosyal Meydan Okuma', en: 'Social Challenge' },
  duplication_sprint: { tr: 'Duplikasyon Sprinti', en: 'Duplication Sprint' },
}

const templateMap = [
  { type: 'launch', icon: '🚀' as const, nameKey: 'launch', descKey: 'launchDesc' },
  { type: 'product_promo', icon: '🎯' as const, nameKey: 'productPush', descKey: 'productPushDesc' },
  { type: 'rank_sprint', icon: '🏆' as const, nameKey: 'rankSprint', descKey: 'rankSprintDesc' },
  { type: 'social_challenge', icon: '⚡' as const, nameKey: 'teamChallenge', descKey: 'teamChallengeDesc' },
]

const blankCampaign: Omit<Campaign, 'id' | 'userId' | 'enrollments' | 'metrics'> = {
  name: '',
  type: 'launch',
  description: '',
  startDate: '2026-04-17',
  endDate: '2026-04-24',
  status: 'draft',
}

function campaignDestination(type: Campaign['type']) {
  if (type === 'launch' || type === 'recruit_activation' || type === 'duplication_sprint') return '/team'
  if (type === 'product_promo' || type === 'retention') return '/customers'
  if (type === 'event_push') return '/events'
  if (type === 'rank_sprint') return '/rank'
  return '/scripts'
}

export default function CampaignsPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [campaignItems, setCampaignItems] = usePersistentState<Campaign[]>('nmu-campaigns', campaigns)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(blankCampaign)
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [editForm, setEditForm] = useState(blankCampaign)

  function campaignTypeLabel(type: string) {
    return campaignTypeLabels[type]?.[locale] ?? type.replace(/_/g, ' ')
  }

  function campaignProgress(campaign: Campaign) {
    if (campaign.enrollments.length === 0) return 0
    return Math.round(
      campaign.enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) /
      campaign.enrollments.length,
    )
  }

  function openCreateModal(prefill?: Partial<typeof blankCampaign>) {
    setCreateForm({ ...blankCampaign, ...prefill })
    setCreateOpen(true)
  }

  function createCampaign() {
    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      userId: 'u1',
      enrollments: [],
      metrics: { totalEnrolled: 0, totalCompleted: 0, conversionRate: 0 },
      ...createForm,
      name: createForm.name.trim() || (locale === 'tr' ? 'Yeni Kampanya' : 'New Campaign'),
      description: createForm.description.trim(),
    }
    setCampaignItems((current) => [newCampaign, ...current])
    setCreateOpen(false)
  }

  function openCampaign(campaign: Campaign) {
    setActiveCampaign(campaign)
    setEditForm({
      name: campaign.name,
      type: campaign.type,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
    })
  }

  function saveCampaign() {
    if (!activeCampaign) return
    const nextCampaign = { ...activeCampaign, ...editForm }
    setActiveCampaign(nextCampaign)
    setCampaignItems((current) => current.map((campaign) => (campaign.id === activeCampaign.id ? nextCampaign : campaign)))
    setActiveCampaign(null)
  }

  function toggleCampaignStatus(campaign: Campaign) {
    const nextStatus: Campaign['status'] = campaign.status === 'active' ? 'paused' : 'active'
    const updated = { ...campaign, status: nextStatus }
    setCampaignItems((current) => current.map((item) => (item.id === campaign.id ? updated : item)))
    if (activeCampaign?.id === campaign.id) {
      setActiveCampaign(updated)
      setEditForm((current) => ({ ...current, status: nextStatus }))
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.campaigns.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.campaigns.subtitle}</p>
        </div>
        <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openCreateModal()}>
          {t.campaigns.createCampaign}
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {t.campaigns.quickLaunch}
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {templateMap.map((template) => (
              <button
                key={template.type}
                type="button"
                onClick={() =>
                  openCreateModal({
                    type: template.type as Campaign['type'],
                    name: t.campaigns.templates[template.nameKey as keyof typeof t.campaigns.templates],
                    description: t.campaigns.templates[template.descKey as keyof typeof t.campaigns.templates],
                    status: 'active',
                  })
                }
                className="p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-colors text-center group"
              >
                <span className="text-2xl">{template.icon}</span>
                <p className="text-sm font-medium text-text-primary mt-2">{t.campaigns.templates[template.nameKey as keyof typeof t.campaigns.templates]}</p>
                <p className="text-[10px] text-text-tertiary">{t.campaigns.templates[template.descKey as keyof typeof t.campaigns.templates]}</p>
                <span className="text-[10px] text-primary font-medium mt-2 inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.common.launch} <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaignItems.map((campaign) => (
          <Card key={campaign.id} hover onClick={() => openCampaign(campaign)}>
            <div className="flex items-start justify-between mb-3">
              <Badge className={campaignTypeColors[campaign.type] || 'bg-surface-hover text-text-secondary'} size="md">
                {campaignTypeLabel(campaign.type)}
              </Badge>
              <Badge variant={campaign.status === 'active' ? 'success' : 'default'} size="sm">
                {campaign.status === 'active' ? t.common.active : campaign.status === 'paused' ? t.common.paused : campaign.status}
              </Badge>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">{campaign.name}</h3>
            <p className="text-xs text-text-tertiary mb-4">{campaign.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary mb-4">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(campaign.startDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })} - {new Date(campaign.endDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{campaign.metrics.totalEnrolled} {t.campaigns.enrolled}</span>
            </div>
            <Progress value={campaignProgress(campaign)} size="sm" variant="primary" showLabel label={t.common.progress} />
          </Card>
        ))}

        <Card hover onClick={() => openCreateModal()} className="min-h-[200px] flex flex-col items-center justify-center border-dashed border-2 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-text-primary">{t.common.createCampaign}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{t.common.launchCampaign}</p>
        </Card>
      </motion.div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t.campaigns.createCampaign}
        description={locale === 'tr' ? 'Yeni bir kampanya akisi kur ve hemen yayina al.' : 'Create a new campaign flow and launch it fast.'}
      >
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Kampanya adi' : 'Campaign name'}</span>
              <input value={createForm.name} onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Tur' : 'Type'}</span>
              <select value={createForm.type} onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value as Campaign['type'] }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50">
                {Object.keys(campaignTypeLabels).map((type) => (
                  <option key={type} value={type}>{campaignTypeLabel(type)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Baslangic' : 'Start'}</span>
              <input type="date" value={createForm.startDate} onChange={(event) => setCreateForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Bitis' : 'End'}</span>
              <input type="date" value={createForm.endDate} onChange={(event) => setCreateForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Aciklama' : 'Description'}</span>
            <textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t.common.cancel}</Button>
            <Button type="button" onClick={createCampaign}>{t.common.create}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(activeCampaign)}
        onClose={() => setActiveCampaign(null)}
        title={activeCampaign?.name}
        description={activeCampaign ? `${campaignTypeLabel(activeCampaign.type)} · ${campaignProgress(activeCampaign)}%` : undefined}
      >
        {activeCampaign && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Kampanya adi' : 'Campaign name'}</span>
                <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Durum' : 'Status'}</span>
                <select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as Campaign['status'] }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50">
                  {['draft', 'active', 'paused', 'completed'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{locale === 'tr' ? 'Aciklama' : 'Description'}</span>
              <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>

            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-text-primary">{activeCampaign.metrics.totalEnrolled}</p>
                  <p className="text-[11px] text-text-tertiary">{t.campaigns.enrolled}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">{activeCampaign.metrics.totalCompleted}</p>
                  <p className="text-[11px] text-text-tertiary">{locale === 'tr' ? 'tamamlandi' : 'completed'}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">%{activeCampaign.metrics.conversionRate}</p>
                  <p className="text-[11px] text-text-tertiary">{locale === 'tr' ? 'donusum' : 'conversion'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleCampaignStatus(activeCampaign)}>
                {activeCampaign.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {activeCampaign.status === 'active' ? (locale === 'tr' ? 'Duraklat' : 'Pause') : (locale === 'tr' ? 'Aktif et' : 'Activate')}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => router.push(campaignDestination(activeCampaign.type))}>
                <ExternalLink className="w-3.5 h-3.5" /> {locale === 'tr' ? 'Ilgili akisa git' : 'Open related flow'}
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setActiveCampaign(null)}>{t.common.cancel}</Button>
              <Button type="button" onClick={saveCampaign}>{t.common.save}</Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
