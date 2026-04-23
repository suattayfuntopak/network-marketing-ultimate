'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useRouter } from 'next/navigation'
import { syncAuthSessionCookies } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { academyLibraryItems, academyObjectionGuides } from '@/data/academyLibrary'
import { fetchContacts, fetchEvents, fetchTasks } from '@/lib/queries'
import type { Event } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import {
  Search, Bell, Bot, Menu, Command, X,
  Flame, TrendingUp, Sun, Moon,
  UserPlus, ListTodo, GitBranch, User, Settings, CalendarDays, GraduationCap, ShieldAlert,
  HelpCircle, MessageSquare, LogOut, ChevronDown
} from 'lucide-react'
import { useTheme } from '@/components/common/ThemeProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'

type SearchResultItem = {
  id: string
  kind: 'contact' | 'task' | 'event' | 'academy' | 'objection' | 'page'
  title: string
  subtitle: string
  route: string
  keywords: string
}

export function Header() {
  const {
    toggleMobileSidebar,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery,
    currentUser, notifications, markAllNotificationsRead, markNotificationRead, unreadCount, setCurrentUser,
  } = useAppStore()
  const { t, locale } = useLanguage()
  const h = useHeadingCase()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchNeedle = searchQuery.trim().toLocaleLowerCase(locale)

  const streak = currentUser?.streak ?? 0
  const momentum = currentUser?.momentumScore ?? 0
  const isTurkish = locale === 'tr'
  const searchButtonLabel = isTurkish ? 'Her şeyi ara' : 'Search everything'
  const searchPlaceholder = isTurkish
    ? 'Kişi, görev, eğitim, itiraz veya etkinlik ara...'
    : 'Search people, tasks, training, objections, or events...'
  const userMenuItems = {
    profile: isTurkish ? 'Profilim' : 'My profile',
    settings: isTurkish ? 'Ayarlar' : 'Settings',
    notifications: isTurkish ? 'Bildirimler' : 'Notifications',
    lightTheme: isTurkish ? 'Açık Tema' : 'Light theme',
    darkTheme: isTurkish ? 'Koyu Tema' : 'Dark theme',
    help: isTurkish ? 'Yardım & Destek' : 'Help & Support',
    feedback: isTurkish ? 'Geri Bildirim Gönder' : 'Send feedback',
    logout: isTurkish ? 'Çıkış Yap' : 'Sign out',
  }

  const { data: searchContacts = [] } = useQuery({
    queryKey: ['search-contacts'],
    queryFn: fetchContacts,
    enabled: searchOpen && Boolean(currentUser),
    staleTime: 30_000,
  })

  const { data: searchTasks = [] } = useQuery({
    queryKey: ['search-tasks'],
    queryFn: fetchTasks,
    enabled: searchOpen && Boolean(currentUser),
    staleTime: 30_000,
  })

  const { data: searchEvents = [] } = useQuery<Event[]>({
    queryKey: ['search-events'],
    queryFn: fetchEvents,
    enabled: searchOpen && Boolean(currentUser),
    staleTime: 30_000,
  })

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const pageItems: SearchResultItem[] = [
      { id: 'page-dashboard', kind: 'page', title: isTurkish ? 'Pano' : 'Dashboard', subtitle: isTurkish ? 'Genel görünüm' : 'Overall view', route: '/dashboard', keywords: 'dashboard pano genel home board' },
      { id: 'page-contacts', kind: 'page', title: isTurkish ? 'Kontaklar' : 'Contacts', subtitle: isTurkish ? 'Kişi ve müşteri kayıtları' : 'People and customer records', route: '/contacts', keywords: 'contacts kontaklar kişi customer müşteri' },
      { id: 'page-tasks', kind: 'page', title: isTurkish ? 'Görevler ve Takipler' : 'Tasks & Follow-ups', subtitle: isTurkish ? 'Bugünkü aksiyonlar' : 'Action list', route: '/tasks', keywords: 'task görev follow up takip aksiyon todo' },
      { id: 'page-events', kind: 'page', title: isTurkish ? 'Etkinlikler' : 'Events', subtitle: isTurkish ? 'Sunumlar ve toplantılar' : 'Meetings and presentations', route: '/events', keywords: 'event etkinlik toplantı zoom webinar sunum presentation' },
      { id: 'page-academy', kind: 'page', title: isTurkish ? 'Akademi' : 'Academy', subtitle: isTurkish ? 'Eğitim kütüphanesi' : 'Learning library', route: '/academy', keywords: 'academy eğitim kurs içerik lesson training script' },
      { id: 'page-motivation', kind: 'page', title: isTurkish ? 'Motivasyon' : 'Motivation', subtitle: isTurkish ? 'YZ ile motive edici mesaj ve gönder' : 'AI motivation drafts and send', route: '/motivation', keywords: 'motivasyon motivasyonel mesaj ekip teşvik ai motivation inspire' },
      { id: 'page-products', kind: 'page', title: isTurkish ? 'Ürün Kataloğu' : 'Product catalog', subtitle: isTurkish ? 'Ürünler ve satış' : 'Products and performance', route: '/products', keywords: 'ürün katalog product catalog stok order sipariş' },
      { id: 'page-team-leader', kind: 'page', title: isTurkish ? 'Takım Lideri' : 'Team leader', subtitle: isTurkish ? 'Lider kontrol merkezi' : 'Leader control center', route: '/team/leader', keywords: 'takım lider leader kontrol lider ekip lideri organization' },
    ]

    const contactItems: SearchResultItem[] = searchContacts.map((contact) => ({
      id: `contact-${contact.id}`,
      kind: 'contact',
      title: contact.full_name,
      subtitle: [contact.profession, contact.location, contact.pipeline_stage].filter(Boolean).join(' • '),
      route: `/contacts?contact=${contact.id}`,
      keywords: [
        contact.full_name,
        contact.nickname,
        contact.email,
        contact.phone,
        contact.profession,
        contact.location,
        contact.pipeline_stage,
        contact.interests,
        ...(contact.tags ?? []),
      ]
        .filter(Boolean)
        .join(' '),
    }))

    const taskItems: SearchResultItem[] = searchTasks.map((task) => ({
      id: `task-${task.id}`,
      kind: 'task',
      title: task.title,
      subtitle: [task.type, task.status, task.priority, task.due_date].filter(Boolean).join(' • '),
      route: '/tasks',
      keywords: [task.title, task.description, task.type, task.status, task.priority, task.due_date].filter(Boolean).join(' '),
    }))

    const eventItems: SearchResultItem[] = searchEvents.map((event) => ({
      id: `event-${event.id}`,
      kind: 'event',
      title: event.title,
      subtitle: [event.type, event.status, event.location, event.startDate].filter(Boolean).join(' • '),
      route: '/events',
      keywords: [event.title, event.description, event.type, event.status, event.location, event.startDate, ...event.attendees.map((attendee) => attendee.name)]
        .filter(Boolean)
        .join(' '),
    }))

    const academyItems: SearchResultItem[] = academyLibraryItems.map((item) => ({
      id: `academy-${item.id}`,
      kind: 'academy',
      title: item.title[locale],
      subtitle: [item.category, item.type, item.level].join(' • '),
      route: '/academy?tab=library',
      keywords: [item.title[locale], item.summary[locale], item.content[locale], item.category, item.type, item.level, ...item.tags]
        .filter(Boolean)
        .join(' '),
    }))

    const objectionItems: SearchResultItem[] = academyObjectionGuides.map((guide) => ({
      id: `objection-${guide.id}`,
      kind: 'objection',
      title: guide.objection[locale],
      subtitle: [guide.category, isTurkish ? 'İtiraz Rehberi' : 'Objection Guide'].join(' • '),
      route: '/academy?tab=objections',
      keywords: [guide.objection[locale], guide.shortResponse[locale], guide.fullResponse[locale], guide.approach[locale], guide.exampleDialog[locale], guide.category, ...guide.tags]
        .filter(Boolean)
        .join(' '),
    }))

    return [...contactItems, ...taskItems, ...eventItems, ...academyItems, ...objectionItems, ...pageItems]
  }, [isTurkish, locale, searchContacts, searchEvents, searchTasks])

  const filteredSearchResults = useMemo(() => {
    if (!searchNeedle) return []
    return searchResults
      .filter((item) => `${item.title} ${item.subtitle} ${item.keywords}`.toLocaleLowerCase(locale).includes(searchNeedle))
      .slice(0, 16)
  }, [locale, searchNeedle, searchResults])

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResultItem['kind'], SearchResultItem[]> = {
      contact: [],
      task: [],
      event: [],
      academy: [],
      objection: [],
      page: [],
    }
    filteredSearchResults.forEach((item) => groups[item.kind].push(item))
    return groups
  }, [filteredSearchResults])

  function openSearchResult(route: string) {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(route)
  }

  function kindLabel(kind: SearchResultItem['kind']) {
    if (kind === 'contact') return isTurkish ? 'Kişiler' : 'People'
    if (kind === 'task') return isTurkish ? 'Görevler & Takipler' : 'Tasks & Follow-ups'
    if (kind === 'event') return isTurkish ? 'Etkinlikler' : 'Events'
    if (kind === 'academy') return isTurkish ? 'Eğitim İçeriği' : 'Training Content'
    if (kind === 'objection') return isTurkish ? 'İtiraz Rehberi' : 'Objection Guides'
    return isTurkish ? 'Sayfalar' : 'Pages'
  }

  function kindIcon(kind: SearchResultItem['kind']) {
    if (kind === 'contact') return User
    if (kind === 'task') return ListTodo
    if (kind === 'event') return CalendarDays
    if (kind === 'academy') return GraduationCap
    if (kind === 'objection') return ShieldAlert
    return Search
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    syncAuthSessionCookies(null)
    setCurrentUser(null)
    router.replace('/auth/login')
  }

  function openFeedback(kind: 'support' | 'feedback') {
    const subject = kind === 'support'
      ? (isTurkish ? 'NMU Yardım Talebi' : 'NMU Support Request')
      : (isTurkish ? 'NMU Geri Bildirim' : 'NMU Feedback')

    const body = kind === 'support'
      ? (isTurkish
        ? 'Merhaba, platform içinde yardıma ihtiyacım olan konu:\n\n'
        : 'Hello, I need help with this in the platform:\n\n')
      : (isTurkish
        ? 'Merhaba, paylaşmak istediğim geri bildirim:\n\n'
        : 'Hello, here is the feedback I would like to share:\n\n')

    window.location.href = `mailto:${kind}@networkmarketingultimate.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-graphite/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6 gap-2">
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
              className="flex items-center justify-center sm:justify-start gap-2 h-9 w-9 sm:w-auto px-0 sm:px-3 rounded-xl bg-surface/60 border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border transition-all text-sm shrink-0"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">{searchButtonLabel}</span>
              <span className="hidden md:inline-flex items-center gap-0.5 ml-4 text-[10px] font-medium bg-surface-hover px-1.5 py-0.5 rounded">
                <Command className="w-2.5 h-2.5" />K
              </span>
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
              className="w-9 h-9 hidden sm:flex items-center justify-center rounded-xl bg-surface/60 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

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
                      className="absolute right-0 top-full mt-2 w-[min(360px,calc(100vw-1rem))] bg-elevated border border-border rounded-2xl shadow-float z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-primary">{h(t.notificationsPage.title)}</h3>
                        <button onClick={() => markAllNotificationsRead()} className="text-xs text-primary hover:text-primary-dim">{h(t.common.markAllRead)}</button>
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
                              onClick={() => {
                                markNotificationRead(notif.id)
                                setNotifOpen(false)
                                router.push(notif.actionUrl ?? '/notifications')
                              }}
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

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-2 py-1.5 text-left transition-all hover:border-border hover:bg-surface-hover min-w-0 shrink-0"
              >
                <Avatar
                  name={currentUser?.name ?? 'NMU'}
                  src={currentUser?.avatar}
                  size="sm"
                />
                <div className="hidden sm:block max-w-[150px]">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {currentUser?.name ?? 'NMU'}
                  </p>
                </div>
                <ChevronDown className={cn('hidden sm:block w-3.5 h-3.5 text-text-tertiary transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      className="absolute right-0 top-full mt-2 w-[min(300px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-elevated shadow-float z-50"
                    >
                      <div className="p-4 border-b border-border">
                        <p className="text-lg font-semibold text-text-primary">{currentUser?.name ?? 'NMU'}</p>
                        <p className="text-sm text-text-tertiary truncate">{currentUser?.email ?? 'support@networkmarketingultimate.app'}</p>
                      </div>

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); router.push('/settings') }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          <User className="w-4 h-4" />
                          {userMenuItems.profile}
                        </button>
                        <button
                          onClick={() => { setUserMenuOpen(false); router.push('/settings') }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          {userMenuItems.settings}
                        </button>
                        <button
                          onClick={() => { setUserMenuOpen(false); router.push('/notifications') }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          <Bell className="w-4 h-4" />
                          {userMenuItems.notifications}
                        </button>
                      </div>

                      <div className="mx-4 h-px bg-border-subtle" />

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setTheme(theme === 'dark' ? 'light' : 'dark')
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          {theme === 'dark' ? userMenuItems.lightTheme : userMenuItems.darkTheme}
                        </button>
                      </div>

                      <div className="mx-4 h-px bg-border-subtle" />

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            openFeedback('support')
                          }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          {userMenuItems.help}
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            openFeedback('feedback')
                          }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {userMenuItems.feedback}
                        </button>
                      </div>

                      <div className="mx-4 h-px bg-border-subtle" />

                      <div className="p-2">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            void handleLogout()
                          }}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {userMenuItems.logout}
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center px-3 pt-[12vh] sm:pt-[15vh]"
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredSearchResults.length > 0) {
                      event.preventDefault()
                      openSearchResult(filteredSearchResults[0].route)
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
                />
                <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                {searchNeedle ? (
                  filteredSearchResults.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm font-medium text-text-primary">
                        {isTurkish ? 'Sonuç bulunamadı' : 'No results found'}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {isTurkish
                          ? 'Farklı bir anahtar kelime deneyin.'
                          : 'Try a different keyword.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {(Object.keys(groupedResults) as SearchResultItem['kind'][]).map((kind) => {
                        if (groupedResults[kind].length === 0) return null
                        const Icon = kindIcon(kind)
                        return (
                          <div key={kind}>
                            <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2 flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5" />
                              {kindLabel(kind)}
                            </p>
                            <div className="space-y-1">
                              {groupedResults[kind].map((result) => (
                                <button
                                  key={result.id}
                                  onClick={() => openSearchResult(result.route)}
                                  className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                                >
                                  <Icon className="w-4 h-4 mt-0.5 text-text-tertiary shrink-0" />
                                  <span className="min-w-0">
                                    <span className="block text-text-primary truncate">{result.title}</span>
                                    <span className="block text-xs text-text-tertiary truncate">{result.subtitle}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                ) : (
                  <>
                    <p className="text-xs text-text-tertiary mb-3">{t.common.quickActions}</p>
                    <div className="space-y-1">
                      {[
                        { label: t.common.addNewProspect, icon: UserPlus, route: '/contacts?segment=prospects&new=1' },
                        { label: t.common.createTask, icon: ListTodo, route: '/tasks' },
                        { label: t.common.startAISession, icon: Bot, route: '/ai' },
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
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
