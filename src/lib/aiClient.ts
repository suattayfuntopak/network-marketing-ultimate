'use client'

import { supabase } from './supabase'
import { stripAiMessageQuotes } from './aiMessageText'

export async function postAiChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  options?: { signal?: AbortSignal }
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  return fetch('/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
    signal: options?.signal,
  })
}

const SEN_TOKENS = /\b(sen|sana|seni|senin|sende|senden|sence)\b/i
const SIZ_TOKENS = /\b(siz|size|sizi|sizin|sizde|sizden|sizce)\b/i

function firstAddressStyle(text: string): 'sen' | 'siz' {
  const lowered = text.toLocaleLowerCase('tr-TR')
  const senIndex = lowered.search(/\b(sen|sana|seni|senin|sende|senden|sence)\b/)
  const sizIndex = lowered.search(/\b(siz|size|sizi|sizin|sizde|sizden|sizce)\b/)
  if (senIndex === -1) return 'siz'
  if (sizIndex === -1) return 'sen'
  return senIndex <= sizIndex ? 'sen' : 'siz'
}

export async function enforceTurkishAddressConsistency(input: string): Promise<string> {
  const raw = stripAiMessageQuotes(input.trim())
  if (!raw) return raw
  if (!SEN_TOKENS.test(raw) || !SIZ_TOKENS.test(raw)) return raw

  const target = firstAddressStyle(raw)
  const opposite = target === 'sen' ? 'siz' : 'sen'
  const prompt = [
    'Aşağıdaki metni düzenle.',
    `Metnin hitap biçimi sadece "${target}" olsun.`,
    `Kesin kural: "${opposite}" hitabı ve türevleri hiç geçmesin.`,
    'Anlamı, tonu ve uzunluğu mümkün olduğunca koru. Ek açıklama yazma, sadece düzenlenmiş metni ver.',
    '',
    raw,
  ].join('\n')

  try {
    const response = await postAiChat([{ role: 'user', content: prompt }])
    if (!response.ok) return raw
    const normalized = stripAiMessageQuotes((await response.text()).trim())
    return normalized || raw
  } catch {
    return raw
  }
}

export { stripAiMessageQuotes } from './aiMessageText'
