import type { ContactRow } from '@/lib/queries'
import type { Event } from '@/types'

export type InviteChannel = 'whatsapp' | 'telegram' | 'email' | 'sms'

export function templateMessage(
  template: string,
  event: Event,
  locale: 'tr' | 'en',
  options?: { name?: string; groupLink?: string },
) {
  const eventDate = new Date(event.startDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const eventTime = `${new Date(event.startDate).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${new Date(event.endDate).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  return template
    .replaceAll('{name}', options?.name ?? (locale === 'tr' ? 'değerli katılımcı' : 'participant'))
    .replaceAll('{eventTitle}', event.title)
    .replaceAll('{date}', eventDate)
    .replaceAll('{time}', eventTime)
    .replaceAll('{location}', event.location || (locale === 'tr' ? 'çevrimiçi' : 'online'))
    .replaceAll('{meetingUrl}', event.meetingUrl ?? '')
    .replaceAll('{groupLink}', options?.groupLink ?? '')
}

export function contactLink(contact: ContactRow, event: Event, channel: InviteChannel, message: string) {
  const encodedMessage = encodeURIComponent(message)
  const normalizedPhone = contact.phone?.replace(/\D/g, '') ?? ''

  if (channel === 'whatsapp') {
    return normalizedPhone ? `https://wa.me/${normalizedPhone}?text=${encodedMessage}` : null
  }
  if (channel === 'sms') {
    return normalizedPhone ? `sms:${normalizedPhone}?body=${encodedMessage}` : null
  }
  if (channel === 'email') {
    return contact.email
      ? `mailto:${contact.email}?subject=${encodeURIComponent(event.title)}&body=${encodedMessage}`
      : null
  }
  if (typeof window === 'undefined') {
    return `https://t.me/share/url?url=${encodeURIComponent(event.meetingUrl || '')}&text=${encodedMessage}`
  }
  return `https://t.me/share/url?url=${encodeURIComponent(event.meetingUrl || window.location.href)}&text=${encodedMessage}`
}
