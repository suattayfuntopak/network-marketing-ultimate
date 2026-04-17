import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Sen Network Marketing Ultimate (NMU) platformunun AI Büyüme Koçusun.
Kullanıcı bir network marketing profesyoneli. Görevin:
- Günlük aksiyonlar için somut, uygulanabilir öneriler vermek
- Potansiyel müşteri, müşteri ve ekip üyesi yönetiminde rehberlik etmek
- Takip stratejileri, itiraz yönetimi ve sunum teknikleri konusunda destek vermek
- Motive edici ve profesyonel bir ton kullanmak
- Türkçe veya İngilizce — kullanıcının dilinde cevap ver
- Cevapları kısa ve odaklı tut (3-5 cümle ideal)`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json() as {
      messages?: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        { error: 'A non-empty messages array is required.' },
        { status: 400 }
      )
    }

    const client = new Anthropic({ apiKey })
    const stream = await client.messages.stream({
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
