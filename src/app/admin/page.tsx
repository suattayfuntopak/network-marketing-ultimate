'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { Users, Settings, Globe, Lock, BarChart3, FileText, Zap } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function AdminPage() {
  const { t } = useLanguage()
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.admin.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.admin.subtitle}</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.admin.totalUsers, value: '1,247', icon: Users, color: 'text-primary' },
          { label: t.admin.activeToday, value: '892', icon: BarChart3, color: 'text-success' },
          { label: t.admin.contentItems, value: '156', icon: FileText, color: 'text-secondary' },
          { label: t.automations.title, value: '34', icon: Zap, color: 'text-warning' },
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

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: t.admin.sections.userManagement, desc: t.admin.sections.userManagementDesc, icon: Users, items: [t.admin.items.userDirectory, t.admin.items.roleAssignment, t.admin.items.teamStructure, t.admin.items.accessLogs] },
          { title: t.admin.sections.contentManagement, desc: t.admin.sections.contentManagementDesc, icon: FileText, items: [t.admin.items.academyCourses, t.admin.items.scriptLibrary, t.admin.items.emailTemplates, t.admin.items.campaignAssets] },
          { title: t.admin.sections.systemSettings, desc: t.admin.sections.systemSettingsDesc, icon: Settings, items: [t.admin.items.generalSettings, t.admin.items.emailConfig, t.admin.items.apiKeys, t.admin.items.integrations] },
          { title: t.admin.sections.security, desc: t.admin.sections.securityDesc, icon: Lock, items: [t.admin.items.authentication, t.admin.items.dataPrivacy, t.admin.items.auditLogs, t.admin.items.compliance] },
          { title: t.admin.sections.analyticsReports, desc: t.admin.sections.analyticsReportsDesc, icon: BarChart3, items: [t.admin.items.usageAnalytics, t.admin.items.performanceReports, t.admin.items.exportData, t.admin.items.customReports] },
          { title: t.admin.sections.localization, desc: t.admin.sections.localizationDesc, icon: Globe, items: [t.admin.items.languages, t.admin.items.translations, t.admin.items.regionalSettings, t.admin.items.currency] },
        ].map((section, i) => {
          const Icon = section.icon
          return (
            <Card key={i} hover>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{section.title}</h3>
                  <p className="text-[10px] text-text-tertiary">{section.desc}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item, j) => (
                  <button key={j} className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
                    <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                    {item}
                  </button>
                ))}
              </div>
            </Card>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
