'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { campaigns } from '@/data/mockData'
import { Plus, Users, Calendar, Zap, ArrowRight } from 'lucide-react'

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

const CAMPAIGN_TYPE_LABELS: Record<string, { tr: string; en: string }> = {
  launch:              { tr: '7 Günlük Başlangıç',    en: '7-Day Launch' },
  product_promo:       { tr: 'Ürün Tanıtımı',          en: 'Product Promo' },
  recruit_activation:  { tr: 'Üye Aktivasyonu',        en: 'Recruit Activation' },
  retention:           { tr: 'Sadakat Kampanyası',     en: 'Retention' },
  event_push:          { tr: 'Etkinlik İtişi',         en: 'Event Push' },
  rank_sprint:         { tr: 'Rütbe Sprinti',           en: 'Rank Sprint' },
  social_challenge:    { tr: 'Sosyal Meydan Okuma',    en: 'Social Challenge' },
  duplication_sprint:  { tr: 'Duplikasyon Sprinti',    en: 'Duplication Sprint' },
}

export default function CampaignsPage() {
  const { t, locale } = useLanguage()

  const campaignTypeLabel = (type: string) =>
    CAMPAIGN_TYPE_LABELS[type]?.[locale] ?? type.replace(/_/g, ' ')

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.campaigns.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.campaigns.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>{t.campaigns.createCampaign}</Button>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> {t.campaigns.quickLaunch}</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: t.campaigns.templates.launch, desc: t.campaigns.templates.launchDesc, icon: '🚀' },
              { name: t.campaigns.templates.productPush, desc: t.campaigns.templates.productPushDesc, icon: '🎯' },
              { name: t.campaigns.templates.rankSprint, desc: t.campaigns.templates.rankSprintDesc, icon: '🏆' },
              { name: t.campaigns.templates.teamChallenge, desc: t.campaigns.templates.teamChallengeDesc, icon: '⚡' },
            ].map((template, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-colors text-center group">
                <span className="text-2xl">{template.icon}</span>
                <p className="text-sm font-medium text-text-primary mt-2">{template.name}</p>
                <p className="text-[10px] text-text-tertiary">{template.desc}</p>
                <span className="text-[10px] text-primary font-medium mt-2 inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{t.common.launch} <ArrowRight className="w-2.5 h-2.5" /></span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaigns.map((camp) => (
          <Card key={camp.id} hover>
            <div className="flex items-start justify-between mb-3">
              <Badge className={campaignTypeColors[camp.type] || 'bg-surface-hover text-text-secondary'} size="md">{campaignTypeLabel(camp.type)}</Badge>
              <Badge variant={camp.status === 'active' ? 'success' : 'default'} size="sm">{camp.status === 'active' ? t.common.active : t.common.paused}</Badge>
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">{camp.name}</h3>
            <p className="text-xs text-text-tertiary mb-4">{camp.description}</p>
            <div className="flex items-center gap-4 text-xs text-text-tertiary mb-4">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(camp.startDate).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })} - {new Date(camp.endDate).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{camp.metrics.totalEnrolled} {t.campaigns.enrolled}</span>
            </div>
            <Progress value={50} size="sm" variant="primary" showLabel label={t.common.progress} />
          </Card>
        ))}

        <Card hover className="min-h-[200px] flex flex-col items-center justify-center border-dashed border-2 cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><Plus className="w-6 h-6 text-primary" /></div>
          <p className="text-sm font-medium text-text-primary">{t.common.createCampaign}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{t.common.launchCampaign}</p>
        </Card>
      </motion.div>
    </motion.div>
  )
}
