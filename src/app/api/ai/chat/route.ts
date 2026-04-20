import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Sen Network Marketing Ultimate (NMU) platformunun AI mesaj stratejistisin.
Kullanıcı bir network marketing profesyoneli. Görevin:
- Doğal, gönderilebilir, sonuç odaklı mesajlar ve kısa stratejik öneriler üretmek
- Mesajları asla yapay, aşırı iltifatlı, baskıcı veya aşırı belirsiz yapmamak
- Network marketing bağlamına uygun, modern ve net bir ton kullanmak
- Kullanıcı mesaj varyasyonu isterse sadece istenen çıktıyı vermek; başlık, açıklama, madde veya markdown eklememek
- Türkçe veya İngilizce, kullanıcının dilinde cevap vermek
- Cevapları kısa, temiz ve uygulanabilir tutmak`

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const MAX_TRACKED_USERS = 10_000
const requestTimestamps = new Map<string, number[]>()
let lastCleanupAt = 0

function cleanupRateLimitBuckets(now: number) {
  if (now - lastCleanupAt < RATE_LIMIT_WINDOW_MS) return
  const expirationThreshold = now - RATE_LIMIT_WINDOW_MS * 2

  for (const [userId, timestamps] of requestTimestamps.entries()) {
    const recent = timestamps.filter((ts) => ts > now - RATE_LIMIT_WINDOW_MS)
    if (recent.length > 0 && recent[recent.length - 1] > expirationThreshold) {
      requestTimestamps.set(userId, recent)
      continue
    }
    requestTimestamps.delete(userId)
  }

  // Keep the table bounded in long-lived runtimes.
  if (requestTimestamps.size > MAX_TRACKED_USERS) {
    const overflow = requestTimestamps.size - MAX_TRACKED_USERS
    const oldestBuckets = [...requestTimestamps.entries()]
      .sort((left, right) => (left[1][left[1].length - 1] ?? 0) - (right[1][right[1].length - 1] ?? 0))
      .slice(0, overflow)
    for (const [userId] of oldestBuckets) {
      requestTimestamps.delete(userId)
    }
  }

  lastCleanupAt = now
}

function isRateLimitedLocally(userId: string): boolean {
  const now = Date.now()
  cleanupRateLimitBuckets(now)
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recent = (requestTimestamps.get(userId) ?? []).filter((ts) => ts > windowStart)

  if (recent.length >= RATE_LIMIT_MAX) {
    requestTimestamps.set(userId, recent)
    return true
  }

  recent.push(now)
  requestTimestamps.set(userId, recent)
  return false
}

type AuthSession = {
  userId: string
  accessToken: string
}

async function resolveUserSession(req: NextRequest): Promise<AuthSession | null> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null
  }

  const token = header.slice(7).trim()
  if (!token) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) {
    return null
  }
  return {
    userId: data.user.id,
    accessToken: token,
  }
}

async function isRateLimitedGlobally(session: AuthSession): Promise<boolean | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const db = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  })

  const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const cleanupBeforeIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS * 10).toISOString()

  const { count, error: countError } = await db
    .from('nmu_ai_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.userId)
    .gt('created_at', windowStartIso)

  if (countError) return null
  if ((count ?? 0) >= RATE_LIMIT_MAX) return true

  const { error: insertError } = await db.from('nmu_ai_rate_limits').insert({
    user_id: session.userId,
  })
  if (insertError) return null

  // Best-effort cleanup to keep shared buckets compact.
  void db
    .from('nmu_ai_rate_limits')
    .delete()
    .eq('user_id', session.userId)
    .lt('created_at', cleanupBeforeIso)

  return false
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 503 }
    )
  }

  const session = await resolveUserSession(req)
  if (!session) {
    return Response.json(
      { error: 'Authentication required.' },
      { status: 401 }
    )
  }

  const isGloballyLimited = await isRateLimitedGlobally(session)
  const isLimited = isGloballyLimited ?? isRateLimitedLocally(session.userId)
  if (isLimited) {
    return Response.json(
      { error: 'Rate limit exceeded. Please wait a minute before retrying.' },
      { status: 429 }
    )
  }

  try {
    const body = (await req.json()) as {
      messages?: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        { error: 'A non-empty messages array is required.' },
        { status: 400 }
      )
    }

    const client = new Anthropic({ apiKey })
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: body.messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
      cancel() {
        void stream.finalMessage().catch(() => undefined)
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected AI route failure.'

    return Response.json({ error: message }, { status: 500 })
  }
}
