'use client'

import type { ContactRow } from '@/lib/queries'
import { Mail, Phone } from 'lucide-react'
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa'

const iconWrap =
  'group/channel flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface/40 text-text-muted transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]'

export function ContactChannelRow({ contact }: { contact: ContactRow }) {
  const phoneDigits = contact.phone?.replace(/\D/g, '') ?? ''
  const waTarget = contact.whatsapp_username?.replace(/\D/g, '') || phoneDigits
  const tg = contact.telegram_username?.replace(/^@/, '').trim()
  const ig = contact.instagram_username?.replace(/^@/, '').trim()

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      {contact.phone ? (
        <a
          href={`tel:${contact.phone}`}
          className={`${iconWrap} hover:border-slate-300/40 hover:bg-slate-400/10`}
          title="Telefon"
        >
          <Phone className="h-3.5 w-3.5 transition-colors group-hover/channel:text-slate-200" />
        </a>
      ) : null}
      {waTarget ? (
        <a
          href={`https://wa.me/${waTarget}`}
          target="_blank"
          rel="noreferrer"
          className={`${iconWrap} hover:border-emerald-400/40 hover:bg-emerald-500/12`}
          title="WhatsApp"
        >
          <FaWhatsapp className="h-3.5 w-3.5 transition-colors group-hover/channel:text-emerald-300" />
        </a>
      ) : null}
      {contact.email ? (
        <a
          href={`mailto:${contact.email}`}
          className={`${iconWrap} hover:border-violet-400/40 hover:bg-violet-500/12`}
          title="Email"
        >
          <Mail className="h-3.5 w-3.5 transition-colors group-hover/channel:text-violet-300" />
        </a>
      ) : null}
      {tg ? (
        <a
          href={`https://t.me/${tg}`}
          target="_blank"
          rel="noreferrer"
          className={`${iconWrap} hover:border-sky-400/40 hover:bg-sky-500/12`}
          title="Telegram"
        >
          <FaTelegramPlane className="h-3.5 w-3.5 transition-colors group-hover/channel:text-sky-300" />
        </a>
      ) : null}
      {ig ? (
        <a
          href={`https://instagram.com/${ig}`}
          target="_blank"
          rel="noreferrer"
          className={`${iconWrap} hover:border-pink-400/40 hover:bg-pink-500/12`}
          title="Instagram"
        >
          <FaInstagram className="h-3.5 w-3.5 transition-colors group-hover/channel:text-pink-300" />
        </a>
      ) : null}
    </div>
  )
}
