'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { notifications } from '@/data/mockData'
import type { Notification } from '@/types'
import { Bell, Bot, Users, Calendar, Award, Target, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const typeIcons: Partial<Record<Notification['type'], LucideIcon>> = {
  follow_up_due: Target, team_alert: Users, achievement: Award,
  ai_suggestion: Bot, event_reminder: Calendar, system: Settings,
}

const typeColors: Record<string, string> = {
  follow_up_due: 'bg-warning/15 text-warning', team_alert: 'bg-primary/15 text-primary',
  achievement: 'bg-success/15 text-success', ai_suggestion: 'bg-secondary/15 text-secondary',
  event_reminder: 'bg-accent/15 text-accent', system: 'bg-surface-hover text-text-tertiary',
}

export default function NotificationsPage() {
  const { t } = useLanguage()
  const unread = notifications.filter(n => !n.isRead)
  const read = notifications.filter(n => n.isRead)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[900px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.notificationsPage.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{unread.length} {t.notificationsPage.subtitle}</p>
        </div>
        <Button variant="ghost" size="sm">{t.notificationsPage.markAllRead}</Button>
      </motion.div>

      {unread.length > 0 && (
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{t.notificationsPage.unread}</p>
          <div className="space-y-2">
            {unread.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Bell
              return (
                <motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card hover className="bg-primary/5 border-primary/10">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[notif.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary">{notif.title}</p>
                          <Badge variant={notif.priority === 'high' ? 'error' : notif.priority === 'medium' ? 'warning' : 'default'} size="sm">
                            {notif.priority === 'high' ? t.common.high : notif.priority === 'medium' ? t.common.medium : t.common.low}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-text-muted mt-1">{new Date(notif.createdAt).toLocaleString('tr-TR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2" />
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {read.length > 0 && (
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{t.notificationsPage.earlier}</p>
          <div className="space-y-2">
            {read.map((notif) => {
              const Icon = typeIcons[notif.type] || Bell
              return (
                <Card key={notif.id} hover className="opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[notif.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-text-muted mt-1">{new Date(notif.createdAt).toLocaleString('tr-TR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
