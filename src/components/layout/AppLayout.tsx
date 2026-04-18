'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { deriveNotifications } from '@/lib/coach'
import { readNotificationReadIds } from '@/lib/clientStorage'
import { fetchAllOrders, fetchContacts, fetchTasks } from '@/lib/queries'
import { useAppStore } from '@/store/appStore'
import type { User, UserSettings } from '@/types'
import type { Database } from '@/lib/database.types'
import { useLanguage } from '@/components/common/LanguageProvider'
import { syncAuthSessionCookie } from '@/lib/auth'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AIPanel } from './AIPanel'

const EMPTY_CONTACTS = [] as Awaited<ReturnType<typeof fetchContacts>>
const EMPTY_TASKS = [] as Awaited<ReturnType<typeof fetchTasks>>
const EMPTY_ORDERS = [] as Awaited<ReturnType<typeof fetchAllOrders>>

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale } = useLanguage()
  const currentUser = useAppStore((state) => state.currentUser)
  const setCurrentUser = useAppStore((state) => state.setCurrentUser)
  const setNotifications = useAppStore((state) => state.setNotifications)
  const [authReady, setAuthReady] = useState(false)

  const isAuthRoute = pathname?.startsWith('/auth') || pathname === '/'

  const notificationsEnabled = authReady && Boolean(currentUser) && !isAuthRoute

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    enabled: notificationsEnabled,
    staleTime: 30_000,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    enabled: notificationsEnabled,
    staleTime: 30_000,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
    enabled: notificationsEnabled,
    staleTime: 30_000,
  })

  const contacts = contactsData ?? EMPTY_CONTACTS
  const tasks = tasksData ?? EMPTY_TASKS
  const orders = ordersData ?? EMPTY_ORDERS

  useEffect(() => {
    type ProfileRow = Database['public']['Tables']['nmu_user_profiles']['Row']

    async function fetchProfile(userId: string, email: string) {
      const { data, error } = await supabase
        .from('nmu_user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      let profile = data as ProfileRow | null

      // Trigger henüz çalışmadıysa profili kendimiz oluştur
      if (!profile) {
        const { data: upserted, error: upsertError } = await supabase
          .from('nmu_user_profiles')
          .upsert({ id: userId, email, name: email.split('@')[0] }, { onConflict: 'id' })
          .select()
          .single()
        if (upsertError) {
          throw upsertError
        }
        profile = upserted as ProfileRow | null
      }

      if (profile) {
        setCurrentUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar_url ?? undefined,
          role: profile.role as User['role'],
          timezone: profile.timezone,
          language: profile.language,
          rank: profile.rank ?? undefined,
          joinDate: profile.join_date,
          streak: profile.streak,
          xp: profile.xp,
          level: profile.level,
          momentumScore: profile.momentum_score,
          settings: profile.settings as unknown as UserSettings,
        })
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncAuthSessionCookie(Boolean(session?.user))

      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? '')
          .catch(() => {
            setCurrentUser(null)
            syncAuthSessionCookie(false)
          })
          .finally(() => setAuthReady(true))
      } else {
        setCurrentUser(null)
        syncAuthSessionCookie(false)
        setAuthReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAuthSessionCookie(Boolean(session?.user))

      if (session?.user) {
        void fetchProfile(session.user.id, session.user.email ?? '')
          .catch(() => {
            setCurrentUser(null)
            syncAuthSessionCookie(false)
          })
      } else {
        setCurrentUser(null)
        syncAuthSessionCookie(false)
      }

      setAuthReady(true)
    })

    return () => subscription.unsubscribe()
  }, [setCurrentUser])

  useEffect(() => {
    if (authReady && !currentUser && !isAuthRoute) {
      router.replace('/auth/login')
    }
  }, [authReady, currentUser, isAuthRoute, router])

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([])
      return
    }

    const readIds = new Set(readNotificationReadIds())
    const notifications = deriveNotifications(contacts, tasks, orders, currentUser, locale).map((notification) => ({
      ...notification,
      isRead: readIds.has(notification.id) ? true : notification.isRead,
    }))

    setNotifications(notifications)
  }, [contacts, currentUser, locale, notificationsEnabled, orders, setNotifications, tasks])

  // Auth sayfaları — sidebar/header olmadan render et
  if (isAuthRoute) {
    return <>{children}</>
  }

  // Session kontrol ediliyor
  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-obsidian">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-text-tertiary">Network Marketing Ultimate Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Giriş yapılmamış — yönlendirme gerçekleşiyor
  if (!currentUser) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-obsidian">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
      <AIPanel />
    </div>
  )
}
