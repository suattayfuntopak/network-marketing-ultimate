'use client'

const AI_PENDING_PROMPT_KEY = 'nmu-ai-pending-prompt'
const NOTIFICATION_READ_IDS_KEY = 'nmu-notification-read-ids'

export function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota and parsing issues in degraded environments.
  }
}

export function queueCoachPrompt(prompt: string) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(AI_PENDING_PROMPT_KEY, prompt)
  } catch {
    // Ignore unavailable session storage.
  }
}

export function consumeCoachPrompt() {
  if (typeof window === 'undefined') return null

  try {
    const prompt = window.sessionStorage.getItem(AI_PENDING_PROMPT_KEY)
    if (prompt) {
      window.sessionStorage.removeItem(AI_PENDING_PROMPT_KEY)
    }
    return prompt
  } catch {
    return null
  }
}

export function readNotificationReadIds() {
  return readStoredValue<string[]>(NOTIFICATION_READ_IDS_KEY, [])
}

export function markNotificationReadId(notificationId: string) {
  const current = new Set(readNotificationReadIds())
  current.add(notificationId)
  writeStoredValue(NOTIFICATION_READ_IDS_KEY, Array.from(current))
}

export function markAllNotificationReadIds(notificationIds: string[]) {
  writeStoredValue(NOTIFICATION_READ_IDS_KEY, Array.from(new Set(notificationIds)))
}
