import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let browserSupabaseClient: SupabaseClient<Database> | null = null
let warnedAboutEnv = false

function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPlaceholderUrl =
    !supabaseUrl || supabaseUrl.includes('BURAYA') || supabaseUrl.includes('your-project')

  if ((isPlaceholderUrl || !supabaseAnonKey) && !warnedAboutEnv) {
    console.warn(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY is missing — auth and data fetches will fail until .env.local is configured.',
    )
    warnedAboutEnv = true
  }

  // Keep a well-formed fallback so module evaluation stays build-safe.
  const resolvedUrl = isPlaceholderUrl ? 'http://localhost:54321' : supabaseUrl!
  const resolvedKey = supabaseAnonKey || 'public-anon-key-missing'

  return createClient<Database>(resolvedUrl, resolvedKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

export function getSupabaseBrowserClient() {
  if (!browserSupabaseClient) {
    browserSupabaseClient = createBrowserSupabaseClient()
  }

  return browserSupabaseClient
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
