'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchContacts, fetchTasks } from '@/lib/queries'
import { syncAuthSessionCookie } from '@/lib/auth'
import type { ContactRow, TaskRow } from '@/lib/queries'
import { useState, useRef, useEffect } from 'react'
import {
  LayoutDashboard, Users, Contact, ShoppingBag, GitBranch, ListTodo,
  GraduationCap, Calendar, BarChart3,
  Bot, Shield, ChevronLeft, ChevronRight, Zap,
  Target, Sparkles, X, LogOut, Settings, ChevronUp
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavDividerItem = { divider: true }
type NavLinkItem = { divider?: false; label: string; href: string; icon: LucideIcon; badge?: string; highlight?: boolean }
type NavItem = NavDividerItem | NavLinkItem

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen, currentUser, setCurrentUser } = useAppStore()
  const { t, locale, setLocale } = useLanguage()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const { data: contacts = [] } = useQuery<ContactRow[]>({ queryKey: ['contacts'], queryFn: fetchContacts })
  const { data: tasks = [] } = useQuery<TaskRow[]>({ queryKey: ['tasks'], queryFn: fetchTasks })

  const prospectsCount = contacts.length || undefined
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length || undefined

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    if (profileMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    syncAuthSessionCookie(false)
    setCurrentUser(null)
    router.replace('/auth/login')
  }

  const navItems: NavItem[] = [
    { label: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.prospects, href: '/prospects', icon: Users, badge: prospectsCount?.toString() },
    { label: t.nav.contacts, href: '/contacts', icon: Contact },
    { label: t.nav.customers, href: '/customers', icon: ShoppingBag },
    { label: t.nav.pipeline, href: '/pipeline', icon: GitBranch },
    { label: t.nav.tasks, href: '/tasks', icon: ListTodo, badge: pendingTasksCount?.toString() },
    { divider: true },
    { label: t.nav.academy, href: '/academy', icon: GraduationCap },
    { label: t.nav.events, href: '/events', icon: Calendar },
    { divider: true },
    { label: t.nav.team, href: '/team', icon: Target },
    { label: t.nav.analytics, href: '/analytics', icon: BarChart3 },
    { label: t.nav.aiCoach, href: '/ai', icon: Bot, highlight: true },
    { divider: true },
    { label: t.nav.automations, href: '/automations', icon: Zap },
    { label: t.nav.admin, href: '/admin', icon: Shield },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="text-xs font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                Network Marketing Ultimate
              </span>
              <span className="text-[10px] text-text-tertiary block -mt-0.5 tracking-wider uppercase">
                {t.sidebar.operatingSystem}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          if (item.divider) {
            return <div key={i} className="h-px bg-border my-3 mx-2" />
          }

          const navItem = item
          const isActive = pathname === navItem.href || pathname?.startsWith(navItem.href + '/')
          const Icon = navItem.icon

          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              onClick={() => setSidebarMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/15'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                navItem.highlight && !isActive && 'text-secondary hover:text-secondary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-primary')} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {navItem.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {navItem.badge && !sidebarCollapsed && (
                <span className="ml-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                  {navItem.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile + Dropdown */}
      <div className="px-3 pb-4 shrink-0 relative" ref={profileMenuRef}>
        {/* Dropdown Menu */}
        <AnimatePresence>
          {profileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 right-0 mb-2 mx-0 bg-elevated border border-border rounded-xl shadow-float z-50 overflow-hidden"
            >
              {/* Settings */}
              <Link
                href="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>{t.settings.title}</span>
              </Link>

              {/* Language */}
              <div className="px-4 py-3 border-t border-border-subtle">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                  {locale === 'tr' ? 'Dil' : 'Language'}
                </p>
                <div className="flex gap-2">
                  {[{ locale: 'tr' as const, flag: '🇹🇷', label: 'Türkçe' }, { locale: 'en' as const, flag: '🇺🇸', label: 'English' }].map(lang => (
                    <button
                      key={lang.locale}
                      onClick={() => { setLocale(lang.locale); setProfileMenuOpen(false) }}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        locale === lang.locale
                          ? 'bg-primary/15 text-primary border border-primary/25'
                          : 'bg-surface text-text-secondary hover:bg-surface-hover border border-border-subtle'
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-border-subtle">
                <button
                  onClick={() => { setProfileMenuOpen(false); handleLogout() }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{t.sidebar.logout}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card (trigger) */}
        <button
          onClick={() => setProfileMenuOpen(v => !v)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-xl bg-surface/50 border transition-all',
            profileMenuOpen ? 'border-primary/30 bg-primary/5' : 'border-border-subtle hover:bg-surface-hover hover:border-border',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Avatar name={currentUser?.name ?? '?'} size="sm" status="online" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap flex-1 min-w-0 text-left"
              >
                <p className="text-sm font-medium text-text-primary truncate">{currentUser?.name ?? '—'}</p>
                <p className="text-[10px] text-text-tertiary truncate">{currentUser?.role ?? t.sidebar.goldDirector}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <ChevronUp className={cn('w-3.5 h-3.5 text-text-tertiary shrink-0 transition-transform', !profileMenuOpen && 'rotate-180')} />
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="hidden lg:flex items-center justify-center h-10 mx-3 mb-3 rounded-xl bg-surface/50 border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col h-screen bg-graphite border-r border-border sticky top-0 transition-all duration-300 z-30',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-graphite border-r border-border z-50 lg:hidden"
            >
              <button
                onClick={() => setSidebarMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
