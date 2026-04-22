'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { useAppStore } from '@/store/appStore'
import type { Notification } from '@/types'
import { Bell, Bot, Users, Calendar, Award, Target, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const typeIcons: Partial<Record<Notification['type'], LucideIcon>> = {
  follow_up_due: Target,
  team_alert: Users,
  achievement: Award,
  ai_suggestion: Bot,
  event_reminder: Calendar,
  system: Settings,
}

const typeColors: Record<string, string> = {
  follow_up_due: 'bg-warning/15 text-warning',
  team_alert: 'bg-primary/15 text-primary',
  achievement: 'bg-success/15 text-success',
  ai_suggestion: 'bg-secondary/15 text-secondary',
  event_reminder: 'bg-accent/15 text-accent',
  system: 'bg-surface-hover text-text-tertiary',
}

export default function NotificationsPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const h = useHeadingCase()
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore()

  const unread = notifications.filter((notification) => !notification.isRead)
  const read = notifications.filter((notification) => notification.isRead)

  function openNotification(notification: Notification) {
    markNotificationRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[900px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{h(t.notificationsPage.title)}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{unread.length} {t.notificationsPage.subtitle}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => markAllNotificationsRead()}>
          {h(t.notificationsPage.markAllRead)}
        </Button>
      </motion.div>

      {notifications.length === 0 && (
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center">
                <Bell className="w-5 h-5 text-text-tertiary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {h(locale === 'tr' ? 'Yeni bildirim yok' : 'No new notifications')}
                </p>
                <p className="text-xs text-text-tertiary">{locale === 'tr' ? 'Sistem yeni aksiyon olustugunda buraya dusurur.' : 'The system will surface new actions here.'}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {unread.length > 0 && (
        <motion.div variants={item}>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">{h(t.notificationsPage.unread)}</p>
          <div className="space-y-2">
            {unread.map((notification, index) => {
              const Icon = typeIcons[notification.type] || Bell
              return (
                <motion.div key={notification.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card hover onClick={() => openNotification(notification)} className="bg-primary/5 border-primary/10">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[notification.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
                          <Badge variant={notification.priority === 'high' ? 'error' : notification.priority === 'medium' ? 'warning' : 'default'} size="sm">
                            {notification.priority === 'high' ? t.common.high : notification.priority === 'medium' ? t.common.medium : t.common.low}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{notification.message}</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-[10px] text-text-muted">{new Date(notification.createdAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          {notification.actionUrl && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation()
                                openNotification(notification)
                              }}
                            >
                              {locale === 'tr' ? 'Aksiyona git' : 'Open action'}
                            </Button>
                          )}
                        </div>
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
            {read.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell
              return (
                <Card key={notification.id} hover onClick={() => notification.actionUrl && router.push(notification.actionUrl)} className="opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[notification.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{notification.message}</p>
                      <p className="text-[10px] text-text-muted mt-1">{new Date(notification.createdAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
