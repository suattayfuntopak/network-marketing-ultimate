'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { User, UserSettings } from '@/types'
import type { Database } from '@/lib/database.types'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { AIPanel } from './AIPanel'

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, setCurrentUser } = useAppStore()
  const [authReady, setAuthReady] = useState(false)

  const isAuthRoute = pathname?.startsWith('/auth')

  useEffect(() => {
    type ProfileRow = Database['public']['Tables']['nmu_user_profiles']['Row']

    async function fetchProfile(userId: string, email: string) {
      const { data } = await supabase
        .from('nmu_user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      let profile = data as ProfileRow | null

      // Trigger henüz çalışmadıysa profili kendimiz oluştur
      if (!profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: upserted } = await (supabase as any)
          .from('nmu_user_profiles')
          .upsert({ id: userId, email, name: email.split('@')[0] }, { onConflict: 'id' })
          .select()
          .single()
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
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? '').finally(() => setAuthReady(true))
      } else {
        setCurrentUser(null)
        setAuthReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? '')
      } else {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setCurrentUser])

  useEffect(() => {
    if (authReady && !currentUser && !isAuthRoute) {
      router.replace('/auth/login')
    }
  }, [authReady, currentUser, isAuthRoute, router])

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
