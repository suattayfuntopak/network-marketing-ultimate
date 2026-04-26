'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  AtSign,
  Check,
  Clipboard,
  ClipboardCheck,
  Info,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ContactRow } from '@/lib/queries'
import type { Event } from '@/types'
import { contactLink, templateMessage, type InviteChannel } from '@/components/events/eventInviteUtils'

const PERSONAL_INTERVAL_MS = 600
const PERSONAL_HARD_LIMIT = 20

const CHANNEL_ICON_URL: Record<InviteChannel, string> = {
  whatsapp: 'https://cdn.simpleicons.org/whatsapp/25D366',
  telegram: 'https://cdn.simpleicons.org/telegram/26A5E4',
  email: 'https://cdn.simpleicons.org/gmail/EA4335',
  sms: '',
}

type BroadcastMode = 'group' | 'personal'

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
  // Email always behaves as a single window with BCC -- "personal" mode does not apply.
  const personalAvailable = channel !== 'email'

  const eligibleContacts = useMemo(() => {
    const filteredIds = new Set(initialContactIds)
    return contacts
      .filter((contact) => filteredIds.has(contact.id))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US'))
  }, [contacts, initialContactIds, locale])

  const [mode, setMode] = useState<BroadcastMode>('group')
  const [selectedIds, setSelectedIds] = useState<string[]>(initialContactIds)
  const [messageBody, setMessageBody] = useState(() =>
    templateMessage(defaultTemplate(locale, 'group'), event, locale, { groupLink: '' }),
  )
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'idle' | 'success' | 'error' | 'info'; text: string }>({
    kind: 'idle',
    text: '',
  })

  useEffect(() => {
    if (!open) return
    const initialMode: BroadcastMode = personalAvailable ? 'group' : 'group'
    setMode(initialMode)
    setSelectedIds(initialContactIds)
    setMessageBody(templateMessage(defaultTemplate(locale, initialMode), event, locale, { groupLink: '' }))
    setIsSending(false)
    setProgress(null)
    setFeedback({ kind: 'idle', text: '' })
    setCopiedKey(null)
  }, [open, channel, event, initialContactIds, locale, personalAvailable])

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

  function applyMode(nextMode: BroadcastMode) {
    setMode(nextMode)
    setMessageBody(templateMessage(defaultTemplate(locale, nextMode), event, locale, { groupLink: '' }))
    setFeedback({ kind: 'idle', text: '' })
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600)
    } catch {
      // Clipboard not available — silently ignore.
    }
  }

  async function handleGroupSend() {
    if (selectedReachable.length === 0 || isSending) return
    setIsSending(true)
    setFeedback({ kind: 'idle', text: '' })

    try {
      if (channel === 'email') {
        const emails = selectedReachable.map((contact) => contact.email!.trim()).filter(Boolean)
        const first = emails[0]
        const bcc = emails.slice(1).join(',')
        const href = `mailto:${first}${bcc ? `?bcc=${encodeURIComponent(bcc)}` : '?'}${
          bcc ? '&' : ''
        }subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(messageBody)}`
        window.open(href, '_blank', 'noopener,noreferrer')
        await onConfirmed(selectedReachable.map((contact) => contact.id))
        setFeedback({ kind: 'success', text: labels.feedbackEmailSent(selectedReachable.length) })
        return
      }

      if (channel === 'sms') {
        const phones = selectedReachable
          .map((contact) => contact.phone!.replace(/\D/g, ''))
          .filter(Boolean)
        const joined = phones.join(',')
        const href = `smsto:${joined}?body=${encodeURIComponent(messageBody)}`
        try {
          await navigator.clipboard.writeText(messageBody)
        } catch {
          // ignore
        }
        window.open(href, '_blank', 'noopener,noreferrer')
        await onConfirmed(selectedReachable.map((contact) => contact.id))
        setFeedback({ kind: 'success', text: labels.feedbackSmsSent(selectedReachable.length) })
        return
      }

      // WhatsApp / Telegram — open one window with the prefilled message.
      // The user picks the recipients inside the messenger's own multi-select.
      try {
        await navigator.clipboard.writeText(messageBody)
      } catch {
        // ignore
      }

      const shareUrl =
        channel === 'whatsapp'
          ? `https://wa.me/?text=${encodeURIComponent(messageBody)}`
          : `https://t.me/share/url?url=${encodeURIComponent(event.meetingUrl || (typeof window !== 'undefined' ? window.location.href : ''))}&text=${encodeURIComponent(messageBody)}`

      window.open(shareUrl, '_blank', 'noopener,noreferrer')

      await onConfirmed(selectedReachable.map((contact) => contact.id))
      setFeedback({
        kind: 'info',
        text: labels.feedbackGroupOpened(selectedReachable.length, channelDisplayName(channel)),
      })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] group send failed', error)
      setFeedback({ kind: 'error', text: labels.feedbackError })
    } finally {
      setIsSending(false)
    }
  }

  async function handlePersonalSend() {
    if (selectedReachable.length === 0 || isSending) return
    if (selectedReachable.length > PERSONAL_HARD_LIMIT) {
      setFeedback({ kind: 'error', text: labels.feedbackPersonalLimit(PERSONAL_HARD_LIMIT) })
      return
    }

    setIsSending(true)
    setFeedback({ kind: 'idle', text: '' })

    try {
      try {
        await navigator.clipboard.writeText(messageBody)
      } catch {
        // ignore
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
          await wait(PERSONAL_INTERVAL_MS)
        }
      }

      await onConfirmed(selectedReachable.map((contact) => contact.id))
      setFeedback({ kind: 'success', text: labels.feedbackPersonalSent(selectedReachable.length) })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] personal send failed', error)
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
      className="max-w-2xl"
      title={labels.title}
      description={labels.description}
    >
      <div className="space-y-4 p-5">
        {personalAvailable && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-subtle bg-surface/40 p-1">
            <ModeTab
              active={mode === 'group'}
              onClick={() => applyMode('group')}
              title={labels.modeGroupTitle}
              hint={labels.modeGroupHint}
              icon={<Users className="h-3.5 w-3.5" />}
              disabled={isSending}
            />
            <ModeTab
              active={mode === 'personal'}
              onClick={() => applyMode('personal')}
              title={labels.modePersonalTitle}
              hint={labels.modePersonalHint}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              disabled={isSending}
            />
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface/40 px-3 py-2 text-[12px] leading-relaxed text-text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{mode === 'group' ? labels.disclaimerGroup : labels.disclaimerPersonal}</span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">{labels.messageLabel}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(messageBody, 'message')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary transition hover:text-primary-dim"
            >
              {copiedKey === 'message' ? <ClipboardCheck className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
              {copiedKey === 'message' ? labels.copied : labels.copyMessage}
            </button>
          </div>
          <textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            rows={5}
            disabled={isSending}
            className="mt-1.5 w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary outline-none focus:border-primary/50 disabled:opacity-60"
          />
          <p className="mt-1 text-[11px] text-text-tertiary">
            {mode === 'personal' ? labels.messageHintPersonal : labels.messageHintGroup}
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Check className="h-3.5 w-3.5 text-success" />
              <span>{labels.recipientsTitle}</span>
              <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                {selectedReachable.length}/{eligibleContacts.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
              {(channel === 'whatsapp' || channel === 'sms') && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const phones = selectedReachable
                        .map((contact) => contact.phone?.replace(/\D/g, '') ?? '')
                        .filter(Boolean)
                      void copyToClipboard(phones.join(', '), 'phones')
                    }}
                    disabled={selectedReachable.length === 0}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedKey === 'phones' ? <ClipboardCheck className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                    {labels.copyAllPhones}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto p-1.5">
            {eligibleContacts.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-text-tertiary">{labels.empty}</p>
            )}
            {eligibleContacts.map((contact) => {
              const checked = selectedIds.includes(contact.id)
              const reachable = isReachable(contact, channel)
              const phoneRaw = contact.phone?.replace(/\D/g, '') ?? ''
              const showCopy = (channel === 'whatsapp' || channel === 'sms') && phoneRaw
              return (
                <div
                  key={contact.id}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition ${
                    checked && reachable ? 'bg-primary/5' : 'hover:bg-surface-hover'
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
                  {showCopy && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(phoneRaw, `phone-${contact.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2 py-1 text-[10px] font-medium text-text-secondary transition hover:border-primary/40 hover:text-primary"
                    >
                      {copiedKey === `phone-${contact.id}` ? (
                        <ClipboardCheck className="h-3 w-3 text-success" />
                      ) : (
                        <Clipboard className="h-3 w-3" />
                      )}
                      {copiedKey === `phone-${contact.id}` ? labels.copied : labels.copyPhone}
                    </button>
                  )}
                  {!reachable && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      {labels.missingChannel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {feedback.kind !== 'idle' && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              feedback.kind === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : feedback.kind === 'error'
                  ? 'border-error/30 bg-error/10 text-error'
                  : 'border-primary/30 bg-primary/10 text-primary'
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
            {mode === 'personal' ? labels.fooPersonal : labels.fooGroup}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
              {labels.cancel}
            </Button>
            <Button
              type="button"
              onClick={mode === 'personal' ? handlePersonalSend : handleGroupSend}
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
              {mode === 'personal' ? labels.sendPersonalButton(selectedReachable.length) : labels.sendGroupButton(selectedReachable.length)}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ModeTab({
  active,
  onClick,
  title,
  hint,
  icon,
  disabled,
}: {
  active: boolean
  onClick: () => void
  title: string
  hint: string
  icon: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition disabled:opacity-50 ${
        active ? 'bg-primary/15 text-primary shadow-inner' : 'text-text-secondary hover:bg-surface-hover'
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
        {icon}
        {title}
      </span>
      <span className="text-[11px] font-normal leading-tight text-text-tertiary line-clamp-2">{hint}</span>
    </button>
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
  return true
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function defaultTemplate(locale: 'tr' | 'en', mode: BroadcastMode): string {
  if (mode === 'personal') {
    return locale === 'tr'
      ? 'Merhaba {name}, "{eventTitle}" etkinliğine davetlisin.\nTarih: {date}\nSaat: {time}\nKonum: {location}\nToplantı: {meetingUrl}'
      : 'Hi {name}, you are invited to "{eventTitle}".\nDate: {date}\nTime: {time}\nLocation: {location}\nMeeting: {meetingUrl}'
  }
  return locale === 'tr'
    ? 'Merhaba, "{eventTitle}" etkinliğine davetlisin.\nTarih: {date}\nSaat: {time}\nKonum: {location}\nToplantı: {meetingUrl}'
    : 'Hi, you are invited to "{eventTitle}".\nDate: {date}\nTime: {time}\nLocation: {location}\nMeeting: {meetingUrl}'
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

    modeGroupTitle: isTr ? 'Toplu' : 'Group',
    modeGroupHint:
      channel === 'email'
        ? isTr ? 'Tek pencere, BCC ile herkese.' : 'One window, everyone via BCC.'
        : isTr
          ? 'Tek pencere, mesaj dolu — kişileri uygulamadan seç.'
          : 'One window with the message ready — pick contacts in the app.',
    modePersonalTitle: isTr ? 'Kişiselleştirilmiş' : 'Personalised',
    modePersonalHint: isTr
      ? `{name} ile her kişiye ayrı sohbet (en fazla ${PERSONAL_HARD_LIMIT}).`
      : `Separate chat per person with {name} (up to ${PERSONAL_HARD_LIMIT}).`,

    disclaimerGroup:
      channel === 'whatsapp'
        ? isTr
          ? 'WhatsApp dış uygulamalardan toplu otomatik gönderim yapamıyor. Aşağıdaki "Gönder" tuşu WhatsApp\'ı tek pencerede mesaj dolu olarak açar; sen WhatsApp\'ın çoklu seçicisinde kişileri tikleyip tek bir Gönder ile hepsine atarsın. Telefonları kopyalayıp arama kutusuna yapıştırarak hızlandırabilirsin.'
          : "WhatsApp does not allow third-party apps to broadcast automatically. The Send button below opens a single WhatsApp window with the message pre-filled; you pick the recipients in WhatsApp's own multi-select and hit Send once. Use the copy buttons to paste phone numbers into search."
        : channel === 'telegram'
          ? isTr
            ? 'Telegram\'ın paylaş penceresi tek seferde birden çok kişiye/gruba gönderim destekler. Açılan pencerede mesaj dolu gelir, kişileri tiklersin.'
            : "Telegram's share dialog supports forwarding to multiple chats in one shot. The message lands pre-filled — you just tick recipients."
          : channel === 'sms'
            ? isTr
              ? 'Tek mesajlaşma penceresi açılır, seçtiğin tüm numaralar alıcı listesine eklenir, mesaj zaten dolu olur.'
              : 'A single Messages window opens with all selected numbers as recipients and the body pre-filled.'
            : isTr
              ? 'Tek e-posta penceresi açılır: ilk alıcı To, diğerleri BCC olur.'
              : 'A single email window opens with the first recipient as To and the rest as BCC.',

    disclaimerPersonal: isTr
      ? `Her kişi için ayrı bir sohbet 600ms aralıkla açılır ve {name} otomatik doldurulur. Tarayıcı çoklu sekme engelleyebilir; bu yüzden ${PERSONAL_HARD_LIMIT} kişiyle sınırlı.`
      : `One chat opens per person every 600ms with {name} auto-filled. Browsers may block too many tabs, so this mode is capped at ${PERSONAL_HARD_LIMIT}.`,

    messageLabel: isTr ? 'Mesaj önizlemesi' : 'Message preview',
    messageHintGroup: isTr
      ? '{eventTitle}, {date}, {time}, {location}, {meetingUrl} otomatik doldurulur. Bu modda {name} kullanma.'
      : '{eventTitle}, {date}, {time}, {location}, {meetingUrl} are auto-filled. Avoid {name} in this mode.',
    messageHintPersonal: isTr
      ? '{name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl} her kişi için doldurulur.'
      : '{name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl} are filled per recipient.',

    recipientsTitle: isTr ? 'Katılımcılar' : 'Recipients',
    selectAll: isTr ? 'Hepsini seç' : 'Select all',
    clear: isTr ? 'Temizle' : 'Clear',
    copyAllPhones: isTr ? 'Telefonları kopyala' : 'Copy all phones',
    copyPhone: isTr ? 'Telefonu kopyala' : 'Copy phone',
    copyMessage: isTr ? 'Mesajı kopyala' : 'Copy message',
    copied: isTr ? 'Kopyalandı' : 'Copied',
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
      ? 'Telegram kullanıcı adı yok'
      : 'no Telegram username',

    fooGroup: isTr
      ? 'Mesaj panoya kopyalanır, tek bir uygulama penceresi açılır.'
      : 'The message is copied to the clipboard and a single app window opens.',
    fooPersonal: isTr
      ? '600ms aralıklarla her kişi için ayrı sohbet açılır.'
      : 'Opens one chat per person 600ms apart.',

    cancel: isTr ? 'Vazgeç' : 'Cancel',
    sendGroupButton: (count: number) =>
      isTr ? (count === 0 ? 'Aç' : `${channelName}'ı aç (${count})`) : count === 0 ? 'Open' : `Open ${channelName} (${count})`,
    sendPersonalButton: (count: number) =>
      isTr ? (count === 0 ? 'Gönder' : `Tek tek aç (${count})`) : count === 0 ? 'Send' : `Open one-by-one (${count})`,

    feedbackEmailSent: (count: number) =>
      isTr
        ? `${count} alıcılı tek e-posta penceresi açıldı, etkinlik kaydı güncellendi.`
        : `Opened a single email window for ${count} recipients and updated the event.`,
    feedbackSmsSent: (count: number) =>
      isTr
        ? `${count} numara için tek SMS penceresi açıldı; mesaj panoda hazır.`
        : `Opened a single SMS window for ${count} numbers; the message is on your clipboard.`,
    feedbackGroupOpened: (count: number, ch: string) =>
      isTr
        ? `${ch} açıldı; ${count} katılımcının adı bu pencerede listelendi, telefonları kopyalayabilirsin. WhatsApp'ın çoklu seçicisinden gönderdikten sonra bu pencereyi kapatabilirsin.`
        : `${ch} opened. ${count} attendees are listed here; you can copy phones from each row. After sending from the messenger's multi-select, close this window.`,
    feedbackPersonalSent: (count: number) =>
      isTr
        ? `${count} kişi için tek tek sohbet açıldı, etkinlik kaydı güncellendi.`
        : `Opened ${count} individual chats and updated the event.`,
    feedbackError: isTr
      ? 'Bir sorun oluştu. Lütfen tekrar dene.'
      : 'Something went wrong. Please try again.',
    feedbackPersonalLimit: (max: number) =>
      isTr
        ? `Kişiselleştirilmiş gönderimde aynı anda en fazla ${max} kişi açılabilir. Daha fazlası için Toplu modu kullan.`
        : `Personalised mode can open at most ${max} chats at once. Use the Group mode for larger lists.`,

    progress: (done: number, total: number) =>
      isTr ? `Sohbetler açılıyor… (${done}/${total})` : `Opening chats… (${done}/${total})`,
  }
}
