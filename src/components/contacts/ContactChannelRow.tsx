'use client'

import type { ContactRow } from '@/lib/queries'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { FaInstagram, FaTelegramPlane } from 'react-icons/fa'

const iconWrap =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-text-secondary transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary'

export function ContactChannelRow({ contact }: { contact: ContactRow }) {
  const phoneDigits = contact.phone?.replace(/\D/g, '') ?? ''
  const waTarget = contact.whatsapp_username?.replace(/\D/g, '') || phoneDigits
  const tg = contact.telegram_username?.replace(/^@/, '').trim()
  const ig = contact.instagram_username?.replace(/^@/, '').trim()

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      {contact.phone ? (
        <a href={`tel:${contact.phone}`} className={iconWrap} title="Phone">
          <Phone className="h-3.5 w-3.5" />
        </a>
      ) : null}
      {waTarget ? (
        <a
          href={`https://wa.me/${waTarget}`}
          target="_blank"
          rel="noreferrer"
          className={iconWrap}
          title="WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5 text-emerald-400/90" />
        </a>
      ) : null}
      {contact.email ? (
        <a href={`mailto:${contact.email}`} className={iconWrap} title="Email">
          <Mail className="h-3.5 w-3.5" />
        </a>
      ) : null}
      {tg ? (
        <a href={`https://t.me/${tg}`} target="_blank" rel="noreferrer" className={iconWrap} title="Telegram">
          <FaTelegramPlane className="h-3.5 w-3.5 text-sky-400/90" />
        </a>
      ) : null}
      {ig ? (
        <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer" className={iconWrap} title="Instagram">
          <FaInstagram className="h-3.5 w-3.5 text-pink-400/85" />
        </a>
      ) : null}
    </div>
  )
}
