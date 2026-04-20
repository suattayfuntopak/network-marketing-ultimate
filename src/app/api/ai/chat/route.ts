import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Sen Network Marketing Ultimate (NMU) platformunun AI mesaj stratejistisin.
Kullanıcı bir network marketing profesyoneli. Görevin:
- Dogal, gonderilebilir, sonuc odakli mesajlar ve kisa stratejik oneriler uretmek
- Mesajlari asla yapay, asiri iltifatli, baskici veya asiri belirsiz yapmamak
- Network marketing baglamina uygun, modern ve net bir ton kullanmak
- Kullanıcı mesaj varyasyonu isterse sadece istenen ciktiyi vermek; baslik, aciklama, madde veya markdown eklememek
- Turkce veya Ingilizce, kullanicinin dilinde cevap vermek
- Cevaplari kisa, temiz ve uygulanabilir tutmak`

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const requestTimestamps = new Map<string, number[]>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
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

async function resolveUserId(req: NextRequest): Promise<string | null> {
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
  return data.user.id
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 503 }
    )
  }

  const userId = await resolveUserId(req)
  if (!userId) {
    return Response.json(
      { error: 'Authentication required.' },
      { status: 401 }
    )
  }

  if (isRateLimited(userId)) {
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
