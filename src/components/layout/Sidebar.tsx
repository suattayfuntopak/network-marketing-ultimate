'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useQuery } from '@tanstack/react-query'
import { fetchContacts, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import { useMemo } from 'react'
import {
  LayoutDashboard, Users, ShoppingBag, GitBranch, ListTodo,
  CalendarDays, GraduationCap, Calendar, BarChart3,
  Bot, ChevronLeft, ChevronRight,
  Target, Sparkles, X
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavDividerItem = { divider: true }
type NavLinkItem = { divider?: false; label: string; href: string; icon: LucideIcon; badge?: string; highlight?: boolean }
type NavItem = NavDividerItem | NavLinkItem

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, sidebarMobileOpen, setSidebarMobileOpen } = useAppStore()
  const { t, locale } = useLanguage()

  const { data: contacts = [] } = useQuery<ContactRow[]>({ queryKey: ['contacts'], queryFn: fetchContacts })
  const { data: tasks = [] } = useQuery<TaskRow[]>({ queryKey: ['tasks'], queryFn: fetchTasks })

  const contactsCount = contacts.length || undefined
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length || undefined
  const versionLabel = useMemo(
    () => (locale === 'tr' ? 'NMU v 1.0' : 'NMU v 1.0'),
    [locale]
  )

  const navItems: NavItem[] = [
    { label: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.contacts, href: '/contacts', icon: Users, badge: contactsCount?.toString() },
    { label: t.nav.customers, href: '/customers', icon: ShoppingBag },
    { label: t.nav.pipeline, href: '/pipeline', icon: GitBranch },
    { label: t.nav.tasks, href: '/tasks', icon: ListTodo, badge: pendingTasksCount?.toString() },
    { label: t.nav.calendar, href: '/calendar', icon: CalendarDays },
    { divider: true },
    { label: t.nav.academy, href: '/academy', icon: GraduationCap },
    { label: t.nav.events, href: '/events', icon: Calendar },
    { divider: true },
    { label: t.nav.team, href: '/team', icon: Target },
    { label: t.nav.analytics, href: '/analytics', icon: BarChart3 },
    { label: t.nav.aiCoach, href: '/ai', icon: Bot, highlight: true },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full relative">
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

      <div className="px-3 pb-3 shrink-0">
        <div className="h-px bg-border-subtle mb-3" />
        <div
          className={cn(
            'rounded-xl border border-border-subtle bg-surface/40 text-text-tertiary',
            sidebarCollapsed ? 'px-2 py-2 text-center text-[10px]' : 'px-3 py-2.5'
          )}
        >
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-text-muted">
            {sidebarCollapsed ? 'NMU' : versionLabel}
          </p>
        </div>
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
        'hidden lg:flex flex-col h-screen bg-graphite border-r border-border sticky top-0 transition-all duration-300 z-40 overflow-visible',
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
