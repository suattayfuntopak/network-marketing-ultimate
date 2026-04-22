'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { openMessageOnChannel, type MessageSendChannel } from '@/lib/openChannelSend'
import { ChevronDown, MessageSquare, SendHorizontal } from 'lucide-react'

const CHANNELS: readonly {
  id: MessageSendChannel
  iconUrl?: string
}[] = [
  { id: 'whatsapp', iconUrl: 'https://cdn.simpleicons.org/whatsapp/25D366' },
  { id: 'telegram', iconUrl: 'https://cdn.simpleicons.org/telegram/26A5E4' },
  { id: 'email', iconUrl: 'https://cdn.simpleicons.org/gmail/EA4335' },
  { id: 'sms' },
  { id: 'instagram', iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F' },
] as const

type Props = {
  body: string
  label: string
  locale: 'tr' | 'en'
  linkMode: 'strict' | 'loose'
  phone?: string | null
  email?: string | null
  onAfterSend?: (channel: MessageSendChannel) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  className?: string
  buttonClassName?: string
}

function labelFor(channel: MessageSendChannel, locale: 'tr' | 'en') {
  if (channel === 'email') return locale === 'tr' ? 'E-posta' : 'Email'
  if (channel === 'sms') return 'SMS'
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'telegram') return 'Telegram'
  return 'Instagram'
}

function titleFor(
  channel: MessageSendChannel,
  locale: 'tr' | 'en',
  hasPhone: boolean,
  hasEmail: boolean,
  linkMode: 'strict' | 'loose',
): string | undefined {
  if (linkMode === 'loose') {
    if (channel === 'email' && !hasEmail) {
      return locale === 'tr' ? 'Genel e-posta istemcisi açılır' : 'Opens default mail client'
    }
    if (channel === 'instagram') {
      return locale === 'tr' ? 'Metin panoya; Instagram açılır' : 'Text copied; opens Instagram'
    }
    return undefined
  }
  if ((channel === 'whatsapp' || channel === 'sms') && !hasPhone) {
    return locale === 'tr' ? 'Tek kişi ve telefon gerekir' : 'Need a person with phone'
  }
  if (channel === 'email' && !hasEmail) {
    return locale === 'tr' ? 'Genel e-posta istemcisi açılır' : 'Opens default mail client'
  }
  if (channel === 'instagram') {
    return locale === 'tr' ? 'Metin panoya; Instagram açılır' : 'Text copied; opens Instagram'
  }
  return undefined
}

function channelDisabled(
  channel: MessageSendChannel,
  linkMode: 'strict' | 'loose',
  hasPhone: boolean,
): boolean {
  if (linkMode === 'loose') return false
  if (channel === 'whatsapp' || channel === 'sms') return !hasPhone
  return false
}

export function ChannelSendButton({
  body,
  label,
  locale,
  linkMode,
  phone,
  email,
  onAfterSend,
  size = 'md',
  variant = 'primary',
  className,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hasPhone = (phone?.replace(/\D/g, '')?.length ?? 0) > 0
  const hasEmail = Boolean(email?.trim())
  const hasDraft = body.trim().length > 0

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (ch: MessageSendChannel) => {
    if (channelDisabled(ch, linkMode, hasPhone)) return
    openMessageOnChannel(ch, body, { phone, email, linkMode })
    onAfterSend?.(ch)
    setOpen(false)
  }

  return (
    <div className={cn('relative min-w-0 sm:min-w-[10rem] sm:flex-1', className)} ref={wrapRef}>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn('h-9 w-full gap-1', buttonClassName)}
        disabled={!hasDraft}
        onClick={() => setOpen((o) => !o)}
        icon={<SendHorizontal className="h-3.5 w-3.5" />}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
      </Button>
      {open && hasDraft && (
        <ul className="absolute bottom-full z-50 mb-1 w-full min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl sm:left-0 sm:right-auto">
          {CHANNELS.map((c) => {
            const dis = channelDisabled(c.id, linkMode, hasPhone)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  title={titleFor(c.id, locale, hasPhone, hasEmail, linkMode)}
                  disabled={dis}
                  onClick={() => pick(c.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-primary transition enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {c.iconUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={c.iconUrl} alt="" className="h-4 w-4 shrink-0" width={16} height={16} />
                  ) : (
                    <MessageSquare className="h-4 w-4 shrink-0 text-cyan-300" />
                  )}
                  <span>{labelFor(c.id, locale)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
