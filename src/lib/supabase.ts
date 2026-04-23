import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isPlaceholderUrl =
  !supabaseUrl || supabaseUrl.includes('BURAYA') || supabaseUrl.includes('your-project')

if (isPlaceholderUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY is missing — auth and data fetches will fail until .env.local is configured.',
  )
}

// Fall back to a well-formed placeholder so import-time construction doesn't throw.
// Actual network calls will still fail loudly, which is the desired behaviour when env is absent.
const resolvedUrl = isPlaceholderUrl ? 'http://localhost:54321' : supabaseUrl!
const resolvedKey = supabaseAnonKey || 'public-anon-key-missing'

export const supabase = createClient<Database>(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
