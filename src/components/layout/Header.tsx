'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useRouter } from 'next/navigation'
import {
  Search, Bell, Bot, Menu, Command, X,
  Flame, TrendingUp, Sun, Moon,
  UserPlus, ListTodo, GitBranch
} from 'lucide-react'
import { useTheme } from '@/components/common/ThemeProvider'

export function Header() {
  const {
    toggleMobileSidebar, aiPanelOpen, toggleAIPanel,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery,
    currentUser, notifications, markAllNotificationsRead,
  } = useAppStore()
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length
  const streak = currentUser?.streak ?? 0
  const momentum = currentUser?.momentumScore ?? 0

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-graphite/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 h-9 px-3 rounded-xl bg-surface/60 border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{t.common.search}</span>
              <span className="hidden md:inline-flex items-center gap-0.5 ml-4 text-[10px] font-medium bg-surface-hover px-1.5 py-0.5 rounded">
                <Command className="w-2.5 h-2.5" />K
              </span>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Streak */}
            {streak > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warning/10 border border-warning/15">
                <Flame className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs font-bold text-warning">{streak}</span>
                <span className="text-[10px] text-warning/70">{t.header.streak}</span>
              </div>
            )}

            {/* Momentum */}
            {momentum > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 border border-success/15">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-bold text-success">{momentum}</span>
                <span className="text-[10px] text-success/70">{t.header.momentum}</span>
              </div>
            )}

            {/* AI Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAIPanel}
              className={cn(
                'flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium transition-all',
                aiPanelOpen
                  ? 'bg-secondary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                  : 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20'
              )}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">{t.header.aiCoach}</span>
            </motion.button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface/60 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-full mt-2 w-[360px] bg-elevated border border-border rounded-2xl shadow-float z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-primary">{t.notificationsPage.title}</h3>
                        <button onClick={() => markAllNotificationsRead()} className="text-xs text-primary hover:text-primary-dim">{t.common.markAllRead}</button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-sm text-text-tertiary">
                            {t.common.noData}
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              className={cn(
                                'flex gap-3 p-4 border-b border-border-subtle hover:bg-surface-hover/50 transition-colors cursor-pointer',
                                !notif.isRead && 'bg-primary/5'
                              )}
                            >
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                'bg-primary/15 text-primary',
                              )}>
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                                <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">{notif.message}</p>
                              </div>
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-border">
                        <button onClick={() => { router.push('/notifications'); setNotifOpen(false) }} className="w-full text-center text-xs text-primary hover:text-primary-dim font-medium py-1">
                          {t.common.viewAllNotifications}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              className="w-full max-w-xl bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="w-5 h-5 text-text-tertiary" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.common.search}
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-text-tertiary mb-3">{t.common.quickActions}</p>
                <div className="space-y-1">
                  {[
                    { label: t.common.addNewProspect, icon: UserPlus, route: '/prospects' },
                    { label: t.common.createTask,      icon: ListTodo,  route: '/tasks' },
                    { label: t.common.startAISession,  icon: Bot,       route: '/ai' },
                    { label: t.common.viewTodaysPipeline, icon: GitBranch, route: '/pipeline' },
                  ].map(({ label, icon: Icon, route }) => (
                    <button
                      key={route}
                      onClick={() => { router.push(route); setSearchOpen(false) }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <Icon className="w-4 h-4 text-text-tertiary" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
