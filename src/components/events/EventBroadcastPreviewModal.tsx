'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, AtSign, Check, Info, Mail, MessageSquare, Phone, Send, Zap } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ContactRow } from '@/lib/queries'
import type { Event } from '@/types'
import { contactLink, templateMessage, type InviteChannel } from '@/components/events/eventInviteUtils'

const SEND_INTERVAL_MS = 600

const CHANNEL_ICON_URL: Record<InviteChannel, string> = {
  whatsapp: 'https://cdn.simpleicons.org/whatsapp/25D366',
  telegram: 'https://cdn.simpleicons.org/telegram/26A5E4',
  email: 'https://cdn.simpleicons.org/gmail/EA4335',
  sms: '',
}

interface Props {
  open: boolean
  channel: InviteChannel
  event: Event
  contacts: ContactRow[]
  initialContactIds: string[]
  locale: 'tr' | 'en'
  onClose: () => void
  onConfirmed: (sentContactIds: string[]) => Promise<void> | void
}

export function EventBroadcastPreviewModal({
  open,
  channel,
  event,
  contacts,
  initialContactIds,
  locale,
  onClose,
  onConfirmed,
}: Props) {
  const labels = getLabels(locale, channel)

  const eligibleContacts = useMemo(() => {
    const filteredIds = new Set(initialContactIds)
    return contacts
      .filter((contact) => filteredIds.has(contact.id))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US'))
  }, [contacts, initialContactIds, locale])

  const [selectedIds, setSelectedIds] = useState<string[]>(initialContactIds)
  const [messageBody, setMessageBody] = useState(() =>
    templateMessage(defaultTemplate(locale), event, locale, { groupLink: '' }),
  )
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'idle' | 'success' | 'error'; text: string }>({ kind: 'idle', text: '' })

  // Reset on open / channel change so the panel always reflects the latest selection.
  useEffect(() => {
    if (!open) return
    setSelectedIds(initialContactIds)
    setMessageBody(templateMessage(defaultTemplate(locale), event, locale, { groupLink: '' }))
    setIsSending(false)
    setProgress(null)
    setFeedback({ kind: 'idle', text: '' })
  }, [open, channel, event, initialContactIds, locale])

  const reachableContacts = useMemo(() => {
    return eligibleContacts.filter((contact) => isReachable(contact, channel))
  }, [eligibleContacts, channel])

  const selectedReachable = useMemo(() => {
    const set = new Set(selectedIds)
    return reachableContacts.filter((contact) => set.has(contact.id))
  }, [reachableContacts, selectedIds])

  const toggleId = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
  }

  const selectAllReachable = () => {
    setSelectedIds(reachableContacts.map((contact) => contact.id))
  }

  const clearSelection = () => {
    setSelectedIds([])
  }

  async function handleSend() {
    if (selectedReachable.length === 0 || isSending) return

    setIsSending(true)
    setFeedback({ kind: 'idle', text: '' })

    try {
      // Email is the only channel where a single window with BCC reaches everyone in one shot.
      if (channel === 'email') {
        const emails = selectedReachable.map((contact) => contact.email!.trim()).filter(Boolean)
        if (emails.length === 0) {
          setFeedback({ kind: 'error', text: labels.feedbackNoReachable })
          setIsSending(false)
          return
        }
        const first = emails[0]
        const bcc = emails.slice(1).join(',')
        const href = `mailto:${first}${bcc ? `?bcc=${encodeURIComponent(bcc)}` : '?'}${
          bcc ? '&' : ''
        }subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(messageBody)}`
        window.open(href, '_blank', 'noopener,noreferrer')
        await onConfirmed(selectedReachable.map((contact) => contact.id))
        setFeedback({ kind: 'success', text: labels.feedbackSuccess(selectedReachable.length) })
        setIsSending(false)
        return
      }

      // For chat-style channels we open one direct conversation per contact.
      // Browsers throttle popups, so we space them out and keep the message
      // copied to clipboard as a recovery fallback.
      try {
        await navigator.clipboard.writeText(messageBody)
      } catch {
        // Clipboard not available - non fatal.
      }

      setProgress({ done: 0, total: selectedReachable.length })

      for (let index = 0; index < selectedReachable.length; index += 1) {
        const contact = selectedReachable[index]
        const personalMessage = templateMessage(messageBody, event, locale, {
          name: contact.full_name,
          groupLink: '',
        })
        const link = contactLink(contact, event, channel, personalMessage)
        if (link) {
          window.open(link, '_blank', 'noopener,noreferrer')
        }
        setProgress({ done: index + 1, total: selectedReachable.length })
        if (index < selectedReachable.length - 1) {
          await wait(SEND_INTERVAL_MS)
        }
      }

      await onConfirmed(selectedReachable.map((contact) => contact.id))
      setFeedback({ kind: 'success', text: labels.feedbackSuccess(selectedReachable.length) })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] send failed', error)
      setFeedback({ kind: 'error', text: labels.feedbackError })
    } finally {
      setIsSending(false)
      setProgress(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={isSending ? () => undefined : onClose}
      overlayClassName="z-[60]"
      className="max-w-xl"
      title={labels.title}
      description={labels.description}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface/40 px-3 py-2 text-[12px] leading-relaxed text-text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{labels.disclaimer}</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">{labels.messageLabel}</span>
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
              {channelDisplayName(channel)}
            </span>
          </div>
          <textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            rows={5}
            disabled={isSending}
            className="mt-1.5 w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary outline-none focus:border-primary/50 disabled:opacity-60"
          />
          <p className="mt-1 text-[11px] text-text-tertiary">{labels.messageHint}</p>
        </div>

        <div className="rounded-2xl border border-border-subtle">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Check className="h-3.5 w-3.5 text-success" />
              <span>{labels.recipientsTitle}</span>
              <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                {selectedReachable.length}/{eligibleContacts.length}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={selectAllReachable}
                disabled={isSending || reachableContacts.length === 0}
                className="text-[11px] font-medium text-primary transition hover:text-primary-dim disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.selectAll}
              </button>
              <span className="text-text-tertiary">·</span>
              <button
                type="button"
                onClick={clearSelection}
                disabled={isSending || selectedIds.length === 0}
                className="text-[11px] font-medium text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {labels.clear}
              </button>
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto p-1.5">
            {eligibleContacts.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-text-tertiary">{labels.empty}</p>
            )}
            {eligibleContacts.map((contact) => {
              const checked = selectedIds.includes(contact.id)
              const reachable = isReachable(contact, channel)
              return (
                <label
                  key={contact.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition ${
                    checked ? 'bg-primary/5' : 'hover:bg-surface-hover'
                  } ${reachable ? '' : 'opacity-60'}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-border-strong bg-surface accent-primary"
                    checked={checked && reachable}
                    disabled={!reachable || isSending}
                    onChange={() => toggleId(contact.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{contact.full_name}</p>
                    <ContactReachLine contact={contact} channel={channel} labels={labels} />
                  </div>
                  {!reachable && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      {labels.missingChannel}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        {feedback.kind !== 'idle' && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              feedback.kind === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-error/30 bg-error/10 text-error'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {progress && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            <Zap className="h-3.5 w-3.5 animate-pulse" />
            {labels.progress(progress.done, progress.total)}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-[11px] text-text-tertiary">
            {channel !== 'email' ? labels.fallbackHint : labels.emailFallbackHint}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
              {labels.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={selectedReachable.length === 0 || isSending || !messageBody.trim()}
              loading={isSending}
              icon={
                CHANNEL_ICON_URL[channel] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={CHANNEL_ICON_URL[channel]} alt="" className="h-4 w-4" width={16} height={16} />
                ) : (
                  <Send className="h-4 w-4" />
                )
              }
            >
              {labels.sendButton(selectedReachable.length)}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ContactReachLine({
  contact,
  channel,
  labels,
}: {
  contact: ContactRow
  channel: InviteChannel
  labels: ReturnType<typeof getLabels>
}) {
  const phone = contact.phone?.replace(/\s+/g, '') ?? ''
  const email = contact.email?.trim() ?? ''
  const telegramUsername = contact.telegram_username?.trim() ?? ''

  if (channel === 'whatsapp' || channel === 'sms') {
    if (!phone) return <p className="truncate text-[11px] text-text-tertiary">{labels.missingPhone}</p>
    return (
      <p className="flex items-center gap-1 truncate text-[11px] text-text-tertiary">
        <Phone className="h-3 w-3" />
        {phone}
      </p>
    )
  }
  if (channel === 'email') {
    if (!email) return <p className="truncate text-[11px] text-text-tertiary">{labels.missingEmail}</p>
    return (
      <p className="flex items-center gap-1 truncate text-[11px] text-text-tertiary">
        <Mail className="h-3 w-3" />
        {email}
      </p>
    )
  }
  if (channel === 'telegram') {
    if (telegramUsername) {
      return (
        <p className="flex items-center gap-1 truncate text-[11px] text-text-tertiary">
          <AtSign className="h-3 w-3" />
          {telegramUsername.replace(/^@/, '')}
        </p>
      )
    }
    return (
      <p className="flex items-center gap-1 truncate text-[11px] text-text-tertiary">
        <MessageSquare className="h-3 w-3" />
        {labels.telegramFallbackPerson}
      </p>
    )
  }
  return null
}

function isReachable(contact: ContactRow, channel: InviteChannel): boolean {
  const phone = (contact.phone?.replace(/\D/g, '') ?? '').length > 0
  const email = (contact.email?.trim() ?? '').length > 0
  if (channel === 'whatsapp' || channel === 'sms') return phone
  if (channel === 'email') return email
  // For Telegram we don't strictly require a username — Telegram's share dialog
  // can still pre-fill a message via the broader share URL.
  return true
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function defaultTemplate(locale: 'tr' | 'en'): string {
  return locale === 'tr'
    ? 'Merhaba {name}, "{eventTitle}" etkinliğine davetlisin.\nTarih: {date}\nSaat: {time}\nKonum: {location}\nToplantı: {meetingUrl}'
    : 'Hi {name}, you are invited to "{eventTitle}".\nDate: {date}\nTime: {time}\nLocation: {location}\nMeeting: {meetingUrl}'
}

function channelDisplayName(channel: InviteChannel): string {
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'telegram') return 'Telegram'
  if (channel === 'email') return 'Email'
  return 'SMS'
}

function getLabels(locale: 'tr' | 'en', channel: InviteChannel) {
  const isTr = locale === 'tr'
  const channelName = channelDisplayName(channel)

  return {
    title: isTr ? `${channelName} ile gönder` : `Send via ${channelName}`,
    description: isTr
      ? 'Mesajı kontrol et, gerekirse düzenle ve katılımcıları onayla.'
      : 'Review the message, tweak it if needed, and confirm the recipients.',
    disclaimer: isTr
      ? `${channelName}'ın güvenlik kuralları toplu seçicide kişileri otomatik tikleyemiyor. Bunun yerine seçtiğin katılımcılar için her birine özel sohbeti mesaj önceden doldurulmuş şekilde açıyoruz; sen sadece "Gönder" tuşuna basıyorsun.`
      : `${channelName}'s security model prevents us from auto-checking contacts in their picker. Instead we open each selected contact's chat with the message pre-filled — you just hit "Send".`,
    messageLabel: isTr ? 'Mesaj önizlemesi' : 'Message preview',
    messageHint: isTr
      ? '{name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl} placeholder\'ları otomatik doldurulur.'
      : 'Placeholders {name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl} are auto-filled.',
    recipientsTitle: isTr ? 'Katılımcılar' : 'Recipients',
    selectAll: isTr ? 'Hepsini seç' : 'Select all',
    clear: isTr ? 'Temizle' : 'Clear',
    empty: isTr ? 'Bu etkinlikte katılımcı yok.' : 'No participants on this event.',
    missingChannel:
      channel === 'email'
        ? isTr ? 'e-posta yok' : 'no email'
        : channel === 'telegram'
          ? isTr ? 'kullanıcı adı yok' : 'no username'
          : isTr ? 'telefon yok' : 'no phone',
    missingPhone: isTr ? 'telefon kayıtlı değil' : 'no phone on file',
    missingEmail: isTr ? 'e-posta kayıtlı değil' : 'no email on file',
    telegramFallbackPerson: isTr
      ? 'Telegram kullanıcı adı yok — paylaş penceresi açılacak'
      : 'no Telegram username — share dialog will open',
    fallbackHint: isTr
      ? 'Sohbetler 600ms aralıkla sırayla açılır. Tarayıcı engellerse mesaj panoda hazır.'
      : 'Chats open in sequence with a 600ms delay. If the browser blocks tabs, the message stays on your clipboard.',
    emailFallbackHint: isTr
      ? 'Tek e-posta penceresinde ilk alıcı To, diğerleri BCC alanına eklenir.'
      : 'A single email window opens with the first address as To and the rest as BCC.',
    cancel: isTr ? 'Vazgeç' : 'Cancel',
    sendButton: (count: number) =>
      count === 0
        ? isTr ? 'Gönder' : 'Send'
        : isTr ? `Gönder (${count})` : `Send (${count})`,
    feedbackSuccess: (count: number) =>
      isTr
        ? `${count} katılımcı için sohbetler açıldı, etkinlik kaydı güncellendi.`
        : `Opened conversations for ${count} participants and updated the event.`,
    feedbackError: isTr
      ? 'Mesajlar gönderilirken bir sorun oluştu. Lütfen tekrar dene.'
      : 'Something went wrong while broadcasting. Please try again.',
    feedbackNoReachable:
      channel === 'email'
        ? isTr ? 'Seçili kişilerin e-posta adresi yok.' : 'Selected contacts have no email address.'
        : isTr ? 'Seçili kişilerin telefonu yok.' : 'Selected contacts have no phone number.',
    progress: (done: number, total: number) =>
      isTr
        ? `Sohbetler açılıyor… (${done}/${total})`
        : `Opening chats… (${done}/${total})`,
  }
}
