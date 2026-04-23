import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function getServerSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export function createServerSupabaseClient(accessToken?: string | null) {
  const config = getServerSupabaseConfig()
  if (!config) return null

  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  })
}
