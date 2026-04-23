import { formatDistanceToNow } from 'date-fns'
import { enUS, tr as trLocale } from 'date-fns/locale'
import type { ContactRow } from '@/lib/queries'
import type { AddContactForm } from '@/components/contacts/contactLabels'

export const validSegments = [
  'all',
  'prospects',
  'customers',
  'team',
  'follow_up',
  'hot',
  'month_added',
  'week_added',
  'today_added',
] as const
export type SegmentKey = (typeof validSegments)[number]

export function createEmptyForm(segment: SegmentKey): AddContactForm {
  return {
    full_name: '',
    nickname: '',
    phone: '',
    whatsapp_username: '',
    email: '',
    telegram_username: '',
    instagram_username: '',
    location: '',
    profession: '',
    relationship_type: '',
    birthday: '',
    family_notes: '',
    temperature_score: 50,
    interest_type: 'unknown',
    source: '',
    pipeline_stage: segment === 'customers'
      ? 'became_customer'
      : segment === 'team'
        ? 'became_member'
        : 'new',
    interests: '',
    pain_points: '',
    goalsComma: '',
    notes: '',
    tagsComma: '',
  }
}

export function isProspectStage(stage: string) {
  return !['became_customer', 'became_member'].includes(stage)
}

export function isFollowUpDue(contact: ContactRow, todayKey: string) {
  return Boolean(contact.next_follow_up_date) && contact.next_follow_up_date!.slice(0, 10) <= todayKey
}

export function formatDate(value: string | null | undefined, locale: 'tr' | 'en') {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string, locale: 'tr' | 'en') {
  return new Date(value).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function localCalendarYmd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function buildContactsHref(
  segment: SegmentKey,
  options?: { contactId?: string; newModal?: boolean; aiOpen?: boolean },
) {
  const params = new URLSearchParams()
  if (segment !== 'all') params.set('segment', segment)
  if (options?.contactId) params.set('contact', options.contactId)
  if (options?.newModal) params.set('new', '1')
  if (options?.aiOpen) params.set('ai', '1')
  const query = params.toString()
  return query ? `/contacts?${query}` : '/contacts'
}

export function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(value)
      value = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(value)
      value = ''
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    value += char
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row)
    }
  }

  return rows
}

const TAG_PASTEL_CLASSES = [
  'bg-fuchsia-500/[0.2] text-text-primary border-fuchsia-400/35',
  'bg-cyan-500/[0.2] text-text-primary border-cyan-400/35',
  'bg-amber-500/[0.2] text-text-primary border-amber-400/35',
  'bg-emerald-500/[0.2] text-text-primary border-emerald-400/35',
  'bg-violet-500/[0.2] text-text-primary border-violet-400/35',
  'bg-sky-500/[0.2] text-text-primary border-sky-400/35',
  'bg-rose-500/[0.2] text-text-primary border-rose-400/35',
]

export function tagSurfaceClass(index: number) {
  return TAG_PASTEL_CLASSES[index % TAG_PASTEL_CLASSES.length]
}

export function lastTouchLabel(iso: string | null | undefined, locale: 'tr' | 'en') {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: locale === 'tr' ? trLocale : enUS,
    })
  } catch {
    return '—'
  }
}
