import type { InteractionRow, TaskRow } from '@/lib/queries'

export const PIPELINE_STAGE_OPTIONS = [
  'new',
  'contact_planned',
  'first_contact',
  'interested',
  'invited',
  'presentation_sent',
  'presentation_done',
  'followup_pending',
  'objection_handling',
  'ready_to_buy',
  'became_customer',
  'ready_to_join',
  'became_member',
  'nurture_later',
  'dormant',
  'lost',
] as const

export type PipelineStage = (typeof PIPELINE_STAGE_OPTIONS)[number]

export type AddContactForm = {
  full_name: string
  phone: string
  email: string
  location: string
  profession: string
  temperature: 'cold' | 'warm' | 'hot' | 'frozen'
  interest_type: 'unknown' | 'product' | 'business' | 'both'
  source: string
  notes: string
  pipeline_stage: PipelineStage
}

export type InteractionFormValues = {
  type: InteractionRow['type']
  channel: string
  content: string
  outcome?: InteractionRow['outcome']
  date: string
  next_action?: string
  next_follow_up_date?: string
  duration_minutes?: number
}

export type ContactTaskFormValues = {
  title: string
  type: TaskRow['type']
  priority: TaskRow['priority']
  due_date: string
  description?: string
}

export const TASK_TYPE_LABELS: Record<TaskRow['type'], { tr: string; en: string }> = {
  follow_up: { tr: 'Takip', en: 'Follow-up' },
  call: { tr: 'Arama', en: 'Call' },
  meeting: { tr: 'Toplantı', en: 'Meeting' },
  presentation: { tr: 'Sunum', en: 'Presentation' },
  onboarding: { tr: 'Oryantasyon', en: 'Onboarding' },
  training: { tr: 'Eğitim', en: 'Training' },
  custom: { tr: 'Özel', en: 'Custom' },
}

export const TASK_PRIORITY_LABELS: Record<TaskRow['priority'], { tr: string; en: string }> = {
  low: { tr: 'Düşük', en: 'Low' },
  medium: { tr: 'Orta', en: 'Medium' },
  high: { tr: 'Yüksek', en: 'High' },
  urgent: { tr: 'Acil', en: 'Urgent' },
}

export const TASK_PRIORITY_VARIANTS: Record<TaskRow['priority'], 'default' | 'primary' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'primary',
  high: 'warning',
  urgent: 'error',
}

export const INTERACTION_TYPE_LABELS: Record<InteractionRow['type'], { tr: string; en: string }> = {
  call: { tr: 'Arama', en: 'Call' },
  message: { tr: 'Mesaj', en: 'Message' },
  meeting: { tr: 'Toplantı', en: 'Meeting' },
  email: { tr: 'E-posta', en: 'Email' },
  note: { tr: 'Not', en: 'Note' },
  presentation: { tr: 'Sunum', en: 'Presentation' },
  follow_up: { tr: 'Takip', en: 'Follow-up' },
}

export const OUTCOME_VARIANTS: Record<NonNullable<InteractionRow['outcome']>, 'success' | 'default' | 'error' | 'warning'> = {
  positive: 'success',
  neutral: 'default',
  negative: 'error',
  no_response: 'warning',
}

export const OUTCOME_LABELS: Record<NonNullable<InteractionRow['outcome']>, { tr: string; en: string }> = {
  positive: { tr: 'Olumlu', en: 'Positive' },
  neutral: { tr: 'Nötr', en: 'Neutral' },
  negative: { tr: 'Olumsuz', en: 'Negative' },
  no_response: { tr: 'Dönüş Yok', en: 'No Response' },
}

export const INTERACTION_CHANNEL_LABELS: Record<string, { tr: string; en: string }> = {
  whatsapp: { tr: 'WhatsApp', en: 'WhatsApp' },
  telegram: { tr: 'Telegram', en: 'Telegram' },
  sms: { tr: 'SMS', en: 'SMS' },
  email: { tr: 'E-posta', en: 'Email' },
  instagram: { tr: 'Instagram', en: 'Instagram' },
  instagram_dm: { tr: 'Instagram DM', en: 'Instagram DM' },
  facebook: { tr: 'Facebook', en: 'Facebook' },
  linkedin: { tr: 'LinkedIn', en: 'LinkedIn' },
  phone: { tr: 'Telefon', en: 'Phone' },
  in_person: { tr: 'Yüz Yüze', en: 'In Person' },
  video: { tr: 'Video Görüşmesi', en: 'Video Call' },
  zoom: { tr: 'Zoom', en: 'Zoom' },
  other: { tr: 'Diğer', en: 'Other' },
}

export function channelLabel(channel: string | null | undefined, locale: 'tr' | 'en') {
  if (!channel) return ''
  const entry = INTERACTION_CHANNEL_LABELS[channel]
  if (entry) return entry[locale]
  return channel.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function stageMeta(stage: string) {
  const labels: Record<string, { tr: string; en: string; className: string }> = {
    new: { tr: 'Yeni Potansiyel', en: 'New Lead', className: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
    contact_planned: { tr: 'İletişim Planlandı', en: 'Contact Planned', className: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    first_contact: { tr: 'İlk İletişim', en: 'First Contact', className: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
    interested: { tr: 'İlgileniyor', en: 'Interested', className: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
    invited: { tr: 'Davet Edildi', en: 'Invited', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    presentation_sent: { tr: 'Sunum Gönderildi', en: 'Presentation Sent', className: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
    presentation_done: { tr: 'Sunum Yapıldı', en: 'Presentation Done', className: 'bg-orange-400/10 text-orange-200 border-orange-400/20' },
    followup_pending: { tr: 'Takip Ediliyor', en: 'Follow-up Active', className: 'bg-red-500/10 text-red-300 border-red-500/20' },
    objection_handling: { tr: 'İtiraz Yönetimi', en: 'Objection Handling', className: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
    ready_to_buy: { tr: 'Karar Aşamasında', en: 'Decision Stage', className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    became_customer: { tr: 'Müşteri', en: 'Customer', className: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
    ready_to_join: { tr: 'Katılmaya Hazır', en: 'Ready to Join', className: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
    became_member: { tr: 'Ekip Üyesi', en: 'Team Member', className: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
    nurture_later: { tr: 'Sonra İlgilen', en: 'Nurture Later', className: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
    dormant: { tr: 'Pasif', en: 'Dormant', className: 'bg-slate-600/10 text-slate-300 border-slate-600/20' },
    lost: { tr: 'Kaybedildi', en: 'Lost', className: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' },
  }

  return labels[stage] ?? { tr: stage, en: stage, className: 'bg-surface-hover text-text-secondary border-border' }
}
