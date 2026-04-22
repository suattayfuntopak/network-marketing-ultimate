/**
 * Açık URL mantığı: Motivasyon / YZ mesaj "Gönder" menüleri.
 * - strict: kişi telefonu yoksa WhatsApp & SMS tıklanamaz (sadece hedefli gönderim).
 * - loose: telefon yokken genel wa.me/?text= ve sms:?body= (şablon listesi gibi).
 */
export type MessageSendChannel = 'whatsapp' | 'telegram' | 'email' | 'sms' | 'instagram'

export function openMessageOnChannel(
  ch: MessageSendChannel,
  body: string,
  options: {
    phone?: string | null
    email?: string | null
    linkMode: 'strict' | 'loose'
  },
): void {
  const raw = body.trim()
  if (!raw) return
  const t = encodeURIComponent(raw)
  const phone = options.phone?.replace(/\D/g, '') ?? ''
  const email = options.email?.trim() ?? ''
  const { linkMode } = options
  if (ch === 'whatsapp') {
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${t}`, '_blank', 'noopener,noreferrer')
      return
    }
    if (linkMode === 'loose') {
      window.open(`https://wa.me/?text=${t}`, '_blank', 'noopener,noreferrer')
    }
    return
  }
  if (ch === 'telegram') {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${t}`, '_blank', 'noopener,noreferrer')
    return
  }
  if (ch === 'email') {
    const href = email ? `mailto:${email}?body=${t}` : `mailto:?body=${t}`
    window.open(href, '_blank', 'noopener,noreferrer')
    return
  }
  if (ch === 'sms') {
    if (phone) {
      window.open(`sms:${phone}?body=${t}`, '_blank', 'noopener,noreferrer')
      return
    }
    if (linkMode === 'loose') {
      window.open(`sms:?body=${t}`, '_blank', 'noopener,noreferrer')
    }
    return
  }
  if (ch === 'instagram') {
    void navigator.clipboard.writeText(raw)
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  }
}
