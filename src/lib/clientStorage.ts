'use client'

import type { QueuedMessageDraftPreset } from '@/components/ai/AIMessageGeneratorModal'

const AI_MESSAGE_DRAFT_PRESET_KEY = 'nmu-ai-message-draft-preset'
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

export function queueAIMessageDraftPreset(preset: QueuedMessageDraftPreset) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(AI_MESSAGE_DRAFT_PRESET_KEY, JSON.stringify(preset))
  } catch {
    // Ignore unavailable session storage.
  }
}

export function consumeAIMessageDraftPreset() {
  if (typeof window === 'undefined') return null

  try {
    const preset = window.sessionStorage.getItem(AI_MESSAGE_DRAFT_PRESET_KEY)
    if (preset) {
      window.sessionStorage.removeItem(AI_MESSAGE_DRAFT_PRESET_KEY)
    }
    return preset ? (JSON.parse(preset) as QueuedMessageDraftPreset) : null
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
