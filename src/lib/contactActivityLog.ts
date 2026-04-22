export const CONTACT_ACTIVITY_LOG_CHANNEL = 'system_activity' as const

type ActivityRow = { channel: string; content: string }

export type ContactActivityPayload =
  | { kind: 'tag_added'; tag: string }
  | { kind: 'tag_removed'; tag: string }
  | { kind: 'stage_changed'; from: string; to: string }
  | { kind: 'profile_updated' }
  | { kind: 'order_added'; totalTry: number; itemCount: number }
  | { kind: 'order_status_changed'; from: string; to: string }
  | { kind: 'order_deleted'; totalTry: number }
  | { kind: 'task_added'; title: string }
  | { kind: 'task_completed'; title: string }
  | { kind: 'task_deleted'; title: string }
  | { kind: 'warmth_changed'; previous: number; score: number }

export function serializeContactActivity(payload: ContactActivityPayload): string {
  return JSON.stringify({ v: 1, ...payload })
}

export function parseContactActivity(content: string): ContactActivityPayload | null {
  try {
    const raw = JSON.parse(content) as { v?: number } & ContactActivityPayload
    if (raw?.v !== 1 || !raw.kind) return null
    return raw as ContactActivityPayload
  } catch {
    return null
  }
}

export function isActivityInteraction(row: ActivityRow): boolean {
  return row.channel === CONTACT_ACTIVITY_LOG_CHANNEL
}

type StageLabelFn = (key: string) => { tr: string; en: string }

export function formatActivityInteractionCopy(
  row: ActivityRow,
  locale: 'tr' | 'en',
  stageLabel: StageLabelFn,
): { title: string; detail: string } | null {
  if (!isActivityInteraction(row)) return null
  const payload = parseContactActivity(row.content)
  if (!payload) return null
  const tr = locale === 'tr'

  switch (payload.kind) {
    case 'tag_added':
      return {
        title: tr ? 'Etiket Eklendi' : 'Tag Added',
        detail: tr ? `“${payload.tag}” etiketi eklendi.` : `Added tag “${payload.tag}”.`,
      }
    case 'tag_removed':
      return {
        title: tr ? 'Etiket Kaldırıldı' : 'Tag Removed',
        detail: tr ? `“${payload.tag}” etiketi kaldırıldı.` : `Removed tag “${payload.tag}”.`,
      }
    case 'stage_changed': {
      const fromL = stageLabel(payload.from)[locale]
      const toL = stageLabel(payload.to)[locale]
      return {
        title: tr ? 'Aşama Değiştir' : 'Stage Changed',
        detail: tr ? `${fromL} → ${toL}` : `${fromL} → ${toL}`,
      }
    }
    case 'task_added':
      return {
        title: tr ? 'Takip Eklendi' : 'Follow-up Added',
        detail: tr ? `“${payload.title}”` : `“${payload.title}”`,
      }
    case 'task_completed':
      return {
        title: tr ? 'Takip Tamamlandı' : 'Follow-up Completed',
        detail: tr ? `“${payload.title}”` : `“${payload.title}”`,
      }
    case 'task_deleted':
      return {
        title: tr ? 'Takip Silindi' : 'Follow-up Deleted',
        detail: tr ? `“${payload.title}”` : `“${payload.title}”`,
      }
    case 'profile_updated':
      return {
        title: tr ? 'Kişi Bilgileri Güncellendi' : 'Profile Updated',
        detail: tr ? 'Kişi kartındaki bilgiler güncellendi.' : 'Contact profile information was updated.',
      }
    case 'order_added':
      return {
        title: tr ? 'Sipariş Eklendi' : 'Order Added',
        detail: tr
          ? `${payload.itemCount} ürün kalemi • ₺${payload.totalTry.toLocaleString('tr-TR')}`
          : `${payload.itemCount} line items • TRY ${payload.totalTry.toLocaleString('en-US')}`,
      }
    case 'order_status_changed':
      return {
        title: tr ? 'Sipariş Durumu Güncellendi' : 'Order Status Updated',
        detail: tr ? `${payload.from} → ${payload.to}` : `${payload.from} → ${payload.to}`,
      }
    case 'order_deleted':
      return {
        title: tr ? 'Sipariş Silindi' : 'Order Deleted',
        detail: tr
          ? `Kayıt tutarı: ₺${payload.totalTry.toLocaleString('tr-TR')}`
          : `Removed amount: TRY ${payload.totalTry.toLocaleString('en-US')}`,
      }
    case 'warmth_changed':
      return {
        title: tr ? 'Sıcaklık Güncellendi' : 'Warmth Updated',
        detail: tr ? `${payload.previous} → ${payload.score}` : `${payload.previous} → ${payload.score}`,
      }
    default:
      return null
  }
}
