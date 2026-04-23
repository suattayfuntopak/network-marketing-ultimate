import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/serverSupabase'

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
const MAX_REQUEST_BYTES = 16_384
const MAX_MESSAGES = 12
const MAX_MESSAGE_CHARS = 2_000
const MAX_TOTAL_CHARS = 10_000
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

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function validateMessages(payload: unknown): { ok: true; messages: ChatMessage[] } | { ok: false; error: string; status: number } {
  if (!payload || typeof payload !== 'object' || !('messages' in payload)) {
    return {
      ok: false,
      error: 'A non-empty messages array is required.',
      status: 400,
    }
  }

  const messages = (payload as { messages?: unknown }).messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      ok: false,
      error: 'A non-empty messages array is required.',
      status: 400,
    }
  }

  if (messages.length > MAX_MESSAGES) {
    return {
      ok: false,
      error: `A maximum of ${MAX_MESSAGES} messages is allowed per request.`,
      status: 413,
    }
  }

  let totalChars = 0

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      return {
        ok: false,
        error: 'Each message must include a valid role and text content.',
        status: 400,
      }
    }

    const role = 'role' in message ? message.role : undefined
    const content = 'content' in message ? message.content : undefined

    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return {
        ok: false,
        error: 'Each message must include a valid role and text content.',
        status: 400,
      }
    }

    const trimmed = content.trim()
    if (!trimmed) {
      return {
        ok: false,
        error: 'Message content cannot be empty.',
        status: 400,
      }
    }

    if (trimmed.length > MAX_MESSAGE_CHARS) {
      return {
        ok: false,
        error: `Each message must stay under ${MAX_MESSAGE_CHARS} characters.`,
        status: 413,
      }
    }

    totalChars += trimmed.length
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return {
      ok: false,
      error: `The combined message content must stay under ${MAX_TOTAL_CHARS} characters.`,
      status: 413,
    }
  }

  return {
    ok: true,
    messages: messages.map((message) => ({
      role: (message as ChatMessage).role,
      content: (message as ChatMessage).content.trim(),
    })),
  }
}

async function resolveUserSession(req: NextRequest): Promise<AuthSession | null> {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null
  }

  const token = header.slice(7).trim()
  if (!token) return null

  const client = createServerSupabaseClient(token)
  if (!client) return null

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
  const db = createServerSupabaseClient(session.accessToken)
  if (!db) return null

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
    const requestSize = Number(req.headers.get('content-length') ?? 0)
    if (Number.isFinite(requestSize) && requestSize > MAX_REQUEST_BYTES) {
      return Response.json(
        { error: `Request body must stay under ${MAX_REQUEST_BYTES} bytes.` },
        { status: 413 }
      )
    }

    const body = await req.json()
    const validation = validateMessages(body)
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: validation.status })
    }

    const client = new Anthropic({ apiKey })
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: validation.messages,
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
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected AI route failure.'

    return Response.json({ error: message }, { status: 500 })
  }
}
