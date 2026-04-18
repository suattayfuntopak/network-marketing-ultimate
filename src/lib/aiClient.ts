'use client'

import { supabase } from './supabase'

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
