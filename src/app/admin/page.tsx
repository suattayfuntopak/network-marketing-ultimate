'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { fetchContacts, fetchTasks } from '@/lib/queries'
import { academyCourses, automations as defaultAutomations, objections, scripts } from '@/data/mockData'
import { useAppStore } from '@/store/appStore'
import type { Automation } from '@/types'
import { Users, Settings, Globe, Lock, BarChart3, FileText, Zap, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type AdminAction = {
  title: string
  description: string
  route: string
  cta: string
}

export default function AdminPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()
  const [activeAction, setActiveAction] = useState<AdminAction | null>(null)
  const [automationItems] = usePersistentState<Automation[]>('nmu-automations', defaultAutomations)

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30_000,
  })

  const sections: Array<{
    title: string
    desc: string
    icon: LucideIcon
    items: AdminAction[]
  }> = [
    {
      title: t.admin.sections.userManagement,
      desc: t.admin.sections.userManagementDesc,
      icon: Users,
      items: [
        { title: t.admin.items.userDirectory, description: locale === 'tr' ? 'Ekipteki kisileri ve rol dagilimini gor.' : 'Review the team directory and roles.', route: '/team', cta: locale === 'tr' ? 'Ekibi aç' : 'Open team' },
        { title: t.admin.items.roleAssignment, description: locale === 'tr' ? 'Rol dagilimini ayarlar ve ekip durumuyla birlikte yonet.' : 'Manage role distribution alongside team status.', route: '/team', cta: locale === 'tr' ? 'Rol akışına git' : 'Open role flow' },
        { title: t.admin.items.teamStructure, description: locale === 'tr' ? 'Organizasyon yapisini ve ekip sagligini incele.' : 'Inspect organization structure and team health.', route: '/team', cta: locale === 'tr' ? 'Organizasyonu aç' : 'Open organization' },
        { title: t.admin.items.accessLogs, description: locale === 'tr' ? 'Bildirim ve son hareketleri denetle.' : 'Review notifications and recent access activity.', route: '/notifications', cta: locale === 'tr' ? 'Kayitlari gör' : 'View logs' },
      ],
    },
    {
      title: t.admin.sections.contentManagement,
      desc: t.admin.sections.contentManagementDesc,
      icon: FileText,
      items: [
        { title: t.admin.items.academyCourses, description: locale === 'tr' ? 'Akademi icerigini ve ogrenci akislarini yonet.' : 'Manage academy content and learner flows.', route: '/academy', cta: locale === 'tr' ? 'Akademiyi aç' : 'Open academy' },
        { title: t.admin.items.scriptLibrary, description: locale === 'tr' ? 'Senaryo kutuphanesini duzenle ve kullan.' : 'Maintain and use the script library.', route: '/scripts', cta: locale === 'tr' ? 'Havuzu aç' : 'Open library' },
        { title: t.admin.items.emailTemplates, description: locale === 'tr' ? 'Takip ve iletisim mesajlarini senaryo havuzunda yonet.' : 'Manage follow-up and communication messages in the script library.', route: '/scripts', cta: locale === 'tr' ? 'Mesajlari aç' : 'Open messages' },
        { title: t.admin.items.campaignAssets, description: locale === 'tr' ? 'Etkinlik akislari, davetler ve paylasim varliklarini etkinliklerde incele.' : 'Review event flows, invites, and shareable assets in events.', route: '/events', cta: locale === 'tr' ? 'Etkinlikleri aç' : 'Open events' },
      ],
    },
    {
      title: t.admin.sections.systemSettings,
      desc: t.admin.sections.systemSettingsDesc,
      icon: Settings,
      items: [
        { title: t.admin.items.generalSettings, description: locale === 'tr' ? 'Genel profil ve tercih ayarlarina git.' : 'Open profile and preference settings.', route: '/settings', cta: locale === 'tr' ? 'Ayarlari aç' : 'Open settings' },
        { title: t.admin.items.emailConfig, description: locale === 'tr' ? 'Bildirim ve iletisim akislarini ayarlar ekranindan yonet.' : 'Manage notification and communication flows from settings.', route: '/settings', cta: locale === 'tr' ? 'Iletisim ayarlarini aç' : 'Open communication settings' },
        { title: t.admin.items.apiKeys, description: locale === 'tr' ? 'AI ve entegrasyon anahtarlarina yakin ayar merkezi.' : 'Closest settings hub for AI and integration keys.', route: '/settings', cta: locale === 'tr' ? 'AI ayarlarini aç' : 'Open AI settings' },
        { title: t.admin.items.integrations, description: locale === 'tr' ? 'Otomasyon ve entegrasyon akislarini kontrol et.' : 'Control automation and integration flows.', route: '/automations', cta: locale === 'tr' ? 'Otomasyonlari aç' : 'Open automations' },
      ],
    },
    {
      title: t.admin.sections.security,
      desc: t.admin.sections.securityDesc,
      icon: Lock,
      items: [
        { title: t.admin.items.authentication, description: locale === 'tr' ? 'Kimlik dogrulama ve oturum davranisini denetle.' : 'Review authentication and session behavior.', route: '/settings', cta: locale === 'tr' ? 'Guvenlik ayarlarini aç' : 'Open security settings' },
        { title: t.admin.items.dataPrivacy, description: locale === 'tr' ? 'Veri gizliligi ve tercih yonetimi.' : 'Review privacy and preference management.', route: '/settings', cta: locale === 'tr' ? 'Gizlilik ayarlarini aç' : 'Open privacy settings' },
        { title: t.admin.items.auditLogs, description: locale === 'tr' ? 'Sistem uyarilari ve degisiklikler icin bildirim merkezi.' : 'Use the notification center as an audit trail checkpoint.', route: '/notifications', cta: locale === 'tr' ? 'Denetim izleğini aç' : 'Open audit trail' },
        { title: t.admin.items.compliance, description: locale === 'tr' ? 'Sistem uyumluluğu icin ayar ve rapor alanlari.' : 'Open the closest settings and reporting areas for compliance.', route: '/analytics', cta: locale === 'tr' ? 'Uyumluluk raporlarini aç' : 'Open compliance reports' },
      ],
    },
    {
      title: t.admin.sections.analyticsReports,
      desc: t.admin.sections.analyticsReportsDesc,
      icon: BarChart3,
      items: [
        { title: t.admin.items.usageAnalytics, description: locale === 'tr' ? 'Kullanim verilerini ve davranis trendlerini incele.' : 'Inspect usage data and behavioral trends.', route: '/analytics', cta: locale === 'tr' ? 'Analitigi aç' : 'Open analytics' },
        { title: t.admin.items.performanceReports, description: locale === 'tr' ? 'Performans raporlarini ve KPI ekranlarini ac.' : 'Open performance reports and KPI screens.', route: '/analytics', cta: locale === 'tr' ? 'Raporlari aç' : 'Open reports' },
        { title: t.admin.items.exportData, description: locale === 'tr' ? 'Veri cikisi icin musteri ve analitik ekranlarini kullan.' : 'Use customer and analytics modules for exports.', route: '/customers', cta: locale === 'tr' ? 'Veri modullerine git' : 'Open data modules' },
        { title: t.admin.items.customReports, description: locale === 'tr' ? 'Ozel rapor senaryolarini analitik uzerinden olustur.' : 'Create custom report scenarios from analytics.', route: '/analytics', cta: locale === 'tr' ? 'Ozel rapor alanini aç' : 'Open custom reporting' },
      ],
    },
    {
      title: t.admin.sections.localization,
      desc: t.admin.sections.localizationDesc,
      icon: Globe,
      items: [
        { title: t.admin.items.languages, description: locale === 'tr' ? 'Dil secenekleri ve kullanici tercihleri.' : 'Language options and user preferences.', route: '/settings', cta: locale === 'tr' ? 'Dil ayarlarini aç' : 'Open language settings' },
        { title: t.admin.items.translations, description: locale === 'tr' ? 'Ceviri akislarini ve aktif dili kontrol et.' : 'Review translations and active locale setup.', route: '/settings', cta: locale === 'tr' ? 'Ceviri ayarlarini aç' : 'Open translation settings' },
        { title: t.admin.items.regionalSettings, description: locale === 'tr' ? 'Bolgesel tarih, saat ve para birimi tercihleri.' : 'Inspect regional date, time, and currency preferences.', route: '/settings', cta: locale === 'tr' ? 'Bolgesel ayarlari aç' : 'Open regional settings' },
        { title: t.admin.items.currency, description: locale === 'tr' ? 'Para birimi kullanimini musteri ve siparis ekraninda takip et.' : 'Review currency usage in customers and orders.', route: '/customers', cta: locale === 'tr' ? 'Siparis ekranini aç' : 'Open orders view' },
      ],
    },
  ]

  const today = new Date().toISOString().slice(0, 10)
  const totalUsers = contacts.filter((contact) => contact.pipeline_stage === 'became_member').length + (currentUser ? 1 : 0)
  const activeToday = contacts.filter((contact) => contact.last_contact_date?.slice(0, 10) === today).length
    + tasks.filter((task) => task.due_date.slice(0, 10) === today || task.completed_at?.slice(0, 10) === today).length
  const contentItems = academyCourses.reduce((count, course) => count + course.modules.reduce((moduleCount, module) => moduleCount + module.lessons.length, 0), 0)
    + scripts.length
    + objections.length

  const statCards = [
    { label: t.admin.totalUsers, value: totalUsers.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US'), icon: Users, color: 'text-primary', route: '/team' },
    { label: t.admin.activeToday, value: activeToday.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US'), icon: BarChart3, color: 'text-success', route: '/dashboard' },
    { label: t.admin.contentItems, value: contentItems.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US'), icon: FileText, color: 'text-secondary', route: '/academy' },
    { label: t.automations.title, value: automationItems.length.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US'), icon: Zap, color: 'text-warning', route: '/automations' },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.admin.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.admin.subtitle}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <button
              key={index}
              type="button"
              onClick={() => router.push(stat.route)}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left hover:border-border-strong hover:bg-card-hover transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center"><Icon className={`w-5 h-5 ${stat.color}`} /></div>
              <div><p className="text-xl font-bold text-text-primary kpi-number">{stat.value}</p><p className="text-xs text-text-tertiary">{stat.label}</p></div>
            </button>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, index) => {
          const Icon = section.icon
          return (
            <Card key={index} hover>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{section.title}</h3>
                  <p className="text-[10px] text-text-tertiary">{section.desc}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {section.items.map((action) => (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => setActiveAction(action)}
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                      {action.title}
                    </span>
                    <ArrowRight className="w-3 h-3 text-text-muted" />
                  </button>
                ))}
              </div>
            </Card>
          )
        })}
      </motion.div>

      <Modal
        open={Boolean(activeAction)}
        onClose={() => setActiveAction(null)}
        title={activeAction?.title}
        description={activeAction?.description}
      >
        {activeAction && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-sm leading-relaxed text-text-secondary">{activeAction.description}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setActiveAction(null)}>{t.common.cancel}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  router.push(activeAction.route)
                  setActiveAction(null)
                }}
              >
                {activeAction.cta}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
