'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { openMessageOnChannel, type MessageSendChannel } from '@/lib/openChannelSend'
import { ChannelSendRecipientModal, type SendRecipientRow } from '@/components/ai/ChannelSendRecipientModal'
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
  /**
   * When the primary `phone` is empty, strict WhatsApp/SMS can use this list
   * (e.g. motivation “tagged group” or multi-target segments).
   * Rows without digits are ignored.
   */
  phoneOptions?: readonly SendRecipientRow[] | null
  onAfterSend?: (channel: MessageSendChannel) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  className?: string
  buttonClassName?: string
  /** Varsayılan: aşağı (top-full). Sadece alt kenarda taşma varsa `up` kullanın. */
  menuPlacement?: 'up' | 'down'
}

function labelFor(channel: MessageSendChannel, locale: 'tr' | 'en') {
  if (channel === 'email') return locale === 'tr' ? 'E-posta' : 'Email'
  if (channel === 'sms') return 'SMS'
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'telegram') return 'Telegram'
  return 'Instagram'
}

function hasDigits(phone?: string | null) {
  return (phone?.replace(/\D/g, '')?.length ?? 0) > 0
}

function useValidPhoneList(options: readonly SendRecipientRow[] | null | undefined) {
  return useMemo(
    () => (options ?? []).filter((r) => hasDigits(r.phone)),
    [options],
  )
}

function titleFor(
  channel: MessageSendChannel,
  locale: 'tr' | 'en',
  hasEmail: boolean,
  linkMode: 'strict' | 'loose',
  canUsePhone: boolean,
  hasDirectPhone: boolean,
  multiPhonePick: boolean,
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
  if (channel === 'whatsapp' || channel === 'sms') {
    if (!canUsePhone) {
      return locale === 'tr' ? 'Telefonu kayıtlı en az bir kişi gerekir' : 'At least one contact with a phone number is required'
    }
    if (channel === 'whatsapp' && multiPhonePick && !hasDirectPhone) {
      return locale === 'tr' ? 'WhatsApp seçim ekranını açar' : 'Opens WhatsApp chat picker'
    }
    if (multiPhonePick && !hasDirectPhone) {
      return locale === 'tr' ? 'Alıcı listesini açar' : 'Opens recipient picker'
    }
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
  canUsePhone: boolean,
): boolean {
  if (linkMode === 'loose') return false
  if (channel === 'whatsapp' || channel === 'sms') return !canUsePhone
  return false
}

export function ChannelSendButton({
  body,
  label,
  locale,
  linkMode,
  phone,
  email,
  phoneOptions = null,
  onAfterSend,
  size = 'md',
  variant = 'primary',
  className,
  buttonClassName,
  menuPlacement = 'down',
}: Props) {
  const [open, setOpen] = useState(false)
  const [pickerChannel, setPickerChannel] = useState<'whatsapp' | 'sms' | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const hasDirectPhone = hasDigits(phone)
  const phoneList = useValidPhoneList(phoneOptions ?? undefined)
  const canUsePhone = hasDirectPhone || phoneList.length > 0
  const multiPhonePick = !hasDirectPhone && phoneList.length > 1
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
    if (ch === 'whatsapp' || ch === 'sms') {
      if (linkMode === 'strict' && !canUsePhone) return
      if (linkMode === 'strict') {
        if (ch === 'whatsapp' && !hasDirectPhone && phoneList.length > 1) {
          openMessageOnChannel(ch, body, { phone: null, email: null, linkMode: 'loose' })
          onAfterSend?.(ch)
          setOpen(false)
          return
        }
        if (hasDirectPhone) {
          openMessageOnChannel(ch, body, { phone, email, linkMode })
          onAfterSend?.(ch)
          setOpen(false)
          return
        }
        if (phoneList.length === 0) return
        if (phoneList.length === 1) {
          const only = phoneList[0]!
          openMessageOnChannel(ch, body, { phone: only.phone, email: null, linkMode })
          onAfterSend?.(ch)
          setOpen(false)
          return
        }
        setPickerChannel(ch)
        setOpen(false)
        return
      }
    }
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
        <ul
          className={cn(
            'absolute z-50 w-full min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl sm:left-0 sm:right-auto',
            menuPlacement === 'up' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
        >
          {CHANNELS.map((c) => {
            const dis = channelDisabled(c.id, linkMode, canUsePhone)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  title={titleFor(
                    c.id,
                    locale,
                    hasEmail,
                    linkMode,
                    canUsePhone,
                    hasDirectPhone,
                    multiPhonePick && (c.id === 'whatsapp' || c.id === 'sms'),
                  )}
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

      <ChannelSendRecipientModal
        open={Boolean(pickerChannel)}
        onClose={() => setPickerChannel(null)}
        channel={pickerChannel}
        body={body}
        linkMode={linkMode}
        locale={locale}
        recipients={phoneList}
        onAfterSend={pickerChannel ? (ch) => onAfterSend?.(ch) : undefined}
      />
    </div>
  )
}
