'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AtSign,
  Check,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  Info,
  Link2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Users,
  Users2,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { ContactRow } from '@/lib/queries'
import type { Event } from '@/types'
import { contactLink, templateMessage, type InviteChannel } from '@/components/events/eventInviteUtils'

type BroadcastMode = 'group' | 'individual'
type EventInviteConfig = { eventId: string; whatsappGroupLink: string; telegramGroupLink: string }

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
  const groupCapable = channel === 'whatsapp' || channel === 'telegram'

  const [eventConfigs, setEventConfigs] = usePersistentState<EventInviteConfig[]>(
    'nmu-event-invite-configs',
    [],
    { version: 1 },
  )
  const eventConfig = useMemo(
    () => eventConfigs.find((entry) => entry.eventId === event.id) ?? null,
    [event.id, eventConfigs],
  )
  const whatsappGroupLink = eventConfig?.whatsappGroupLink ?? ''
  const telegramGroupLink = eventConfig?.telegramGroupLink ?? ''
  const groupLink = channel === 'whatsapp' ? whatsappGroupLink : channel === 'telegram' ? telegramGroupLink : ''

  function updateGroupLink(next: string) {
    setEventConfigs((current) => {
      const existing = current.find((entry) => entry.eventId === event.id)
      const merged: EventInviteConfig = {
        eventId: event.id,
        whatsappGroupLink: existing?.whatsappGroupLink ?? '',
        telegramGroupLink: existing?.telegramGroupLink ?? '',
        ...(channel === 'whatsapp' ? { whatsappGroupLink: next } : {}),
        ...(channel === 'telegram' ? { telegramGroupLink: next } : {}),
      }
      if (!existing) return [merged, ...current]
      return current.map((entry) => (entry.eventId === event.id ? merged : entry))
    })
  }

  const eligibleContacts = useMemo(() => {
    const set = new Set(initialContactIds)
    return contacts
      .filter((contact) => set.has(contact.id))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US'))
  }, [contacts, initialContactIds, locale])

  const [mode, setMode] = useState<BroadcastMode>(groupCapable ? 'group' : 'individual')
  const [messageBody, setMessageBody] = useState(() =>
    templateMessage(defaultTemplate(locale, groupCapable ? 'group' : 'individual'), event, locale, {
      groupLink,
    }),
  )
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'idle' | 'success' | 'error' | 'info'; text: string }>({
    kind: 'idle',
    text: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupAcknowledged, setGroupAcknowledged] = useState(false)

  useEffect(() => {
    if (!open) return
    const initialMode: BroadcastMode = groupCapable ? 'group' : 'individual'
    setMode(initialMode)
    setMessageBody(
      templateMessage(defaultTemplate(locale, initialMode), event, locale, {
        groupLink,
      }),
    )
    setSentIds(new Set())
    setFeedback({ kind: 'idle', text: '' })
    setCopiedKey(null)
    setGroupAcknowledged(false)
    setIsSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channel, event.id])

  function applyMode(nextMode: BroadcastMode) {
    setMode(nextMode)
    setMessageBody(
      templateMessage(defaultTemplate(locale, nextMode), event, locale, {
        groupLink,
      }),
    )
    setFeedback({ kind: 'idle', text: '' })
    setGroupAcknowledged(false)
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

  function rowMessage(contact: ContactRow) {
    return templateMessage(messageBody, event, locale, {
      name: contact.full_name,
      groupLink,
    })
  }

  function openIndividual(contact: ContactRow) {
    const link = contactLink(contact, event, channel, rowMessage(contact))
    if (!link) return
    window.open(link, '_blank', 'noopener,noreferrer')
    setSentIds((current) => {
      const next = new Set(current)
      next.add(contact.id)
      return next
    })
  }

  async function openSingleEmailWindow() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const reachable = eligibleContacts.filter((contact) => (contact.email?.trim() ?? '').length > 0)
      if (reachable.length === 0) {
        setFeedback({ kind: 'error', text: labels.feedbackEmailEmpty })
        return
      }
      const emails = reachable.map((contact) => contact.email!.trim())
      const first = emails[0]
      const bcc = emails.slice(1).join(',')
      const subjectPart = `subject=${encodeURIComponent(event.title)}`
      const bodyPart = `body=${encodeURIComponent(rowMessage(reachable[0]))}`
      const href = `mailto:${first}${bcc ? `?bcc=${encodeURIComponent(bcc)}&${subjectPart}&${bodyPart}` : `?${subjectPart}&${bodyPart}`}`
      window.open(href, '_blank', 'noopener,noreferrer')
      await onConfirmed(reachable.map((contact) => contact.id))
      setFeedback({ kind: 'success', text: labels.feedbackEmail(reachable.length) })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] email send failed', error)
      setFeedback({ kind: 'error', text: labels.feedbackError })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function openSingleSmsWindow() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const reachable = eligibleContacts.filter((contact) => (contact.phone?.replace(/\D/g, '') ?? '').length > 0)
      if (reachable.length === 0) {
        setFeedback({ kind: 'error', text: labels.feedbackSmsEmpty })
        return
      }
      const phones = reachable.map((contact) => contact.phone!.replace(/\D/g, ''))
      const joined = phones.join(',')
      const href = `smsto:${joined}?body=${encodeURIComponent(messageBody)}`
      try {
        await navigator.clipboard.writeText(messageBody)
      } catch {
        // ignore
      }
      window.open(href, '_blank', 'noopener,noreferrer')
      await onConfirmed(reachable.map((contact) => contact.id))
      setFeedback({ kind: 'success', text: labels.feedbackSms(reachable.length) })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] sms send failed', error)
      setFeedback({ kind: 'error', text: labels.feedbackError })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function pushToGroup() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      try {
        await navigator.clipboard.writeText(messageBody)
      } catch {
        // ignore
      }

      if (groupLink) {
        window.open(groupLink, '_blank', 'noopener,noreferrer')
      } else if (channel === 'whatsapp') {
        window.open('https://web.whatsapp.com/', '_blank', 'noopener,noreferrer')
      } else if (channel === 'telegram') {
        window.open('https://web.telegram.org/', '_blank', 'noopener,noreferrer')
      }

      setFeedback({ kind: 'info', text: labels.feedbackGroupOpened(channelDisplayName(channel)) })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] group send failed', error)
      setFeedback({ kind: 'error', text: labels.feedbackError })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function confirmGroupBroadcast() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onConfirmed(eligibleContacts.map((contact) => contact.id))
      setGroupAcknowledged(true)
      setFeedback({ kind: 'success', text: labels.feedbackGroupConfirmed(eligibleContacts.length) })
    } catch (error) {
      console.error('[EventBroadcastPreviewModal] group confirm failed', error)
      setFeedback({ kind: 'error', text: labels.feedbackError })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reachableCount = useMemo(() => {
    if (channel === 'email') return eligibleContacts.filter((c) => (c.email?.trim() ?? '').length > 0).length
    if (channel === 'whatsapp' || channel === 'sms')
      return eligibleContacts.filter((c) => (c.phone?.replace(/\D/g, '') ?? '').length > 0).length
    return eligibleContacts.length
  }, [channel, eligibleContacts])

  return (
    <Modal
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      overlayClassName="z-[60]"
      className="max-w-2xl"
      title={labels.title}
      description={labels.description}
    >
      <div className="space-y-4 p-5">
        {groupCapable && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-subtle bg-surface/40 p-1">
            <ModeTab
              active={mode === 'group'}
              onClick={() => applyMode('group')}
              title={labels.modeGroupTitle}
              hint={labels.modeGroupHint}
              icon={<Users2 className="h-3.5 w-3.5" />}
              disabled={isSubmitting}
            />
            <ModeTab
              active={mode === 'individual'}
              onClick={() => applyMode('individual')}
              title={labels.modeIndividualTitle}
              hint={labels.modeIndividualHint}
              icon={<Users className="h-3.5 w-3.5" />}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface/40 px-3 py-2 text-[12px] leading-relaxed text-text-secondary">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{getDisclaimer(channel, mode, labels)}</span>
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
            disabled={isSubmitting}
            className="mt-1.5 w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary outline-none focus:border-primary/50 disabled:opacity-60"
          />
          <p className="mt-1 text-[11px] text-text-tertiary">
            {mode === 'group' ? labels.messageHintGroup : labels.messageHintIndividual}
          </p>
        </div>

        {mode === 'group' && groupCapable && (
          <GroupModeBlock
            channel={channel}
            groupLink={groupLink}
            onGroupLinkChange={updateGroupLink}
            onPushToGroup={pushToGroup}
            onConfirm={confirmGroupBroadcast}
            isSubmitting={isSubmitting}
            acknowledged={groupAcknowledged}
            labels={labels}
            participantCount={eligibleContacts.length}
          />
        )}

        {mode === 'individual' && (
          <IndividualList
            contacts={eligibleContacts}
            channel={channel}
            sentIds={sentIds}
            onOpen={openIndividual}
            onCopyPhone={(phone) => copyToClipboard(phone, `phone-${phone}`)}
            copiedKey={copiedKey}
            isSubmitting={isSubmitting}
            labels={labels}
          />
        )}

        {!groupCapable && (
          <SingleWindowSummary
            channel={channel}
            contacts={eligibleContacts}
            reachableCount={reachableCount}
            labels={labels}
          />
        )}

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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-[11px] text-text-tertiary">
            {mode === 'group' ? labels.footerGroup : labels.footerIndividual}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {labels.close}
            </Button>

            {mode === 'individual' && channel === 'email' && (
              <Button
                type="button"
                onClick={openSingleEmailWindow}
                loading={isSubmitting}
                disabled={reachableCount === 0}
                icon={<Send className="h-4 w-4" />}
              >
                {labels.openSingleEmail(reachableCount)}
              </Button>
            )}

            {mode === 'individual' && channel === 'sms' && (
              <Button
                type="button"
                onClick={openSingleSmsWindow}
                loading={isSubmitting}
                disabled={reachableCount === 0}
                icon={<Send className="h-4 w-4" />}
              >
                {labels.openSingleSms(reachableCount)}
              </Button>
            )}

            {mode === 'individual' && (channel === 'whatsapp' || channel === 'telegram') && sentIds.size > 0 && (
              <Button
                type="button"
                onClick={async () => {
                  await onConfirmed(Array.from(sentIds))
                  setFeedback({ kind: 'success', text: labels.feedbackIndividualSaved(sentIds.size) })
                }}
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                {labels.markSent(sentIds.size)}
              </Button>
            )}
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

function GroupModeBlock({
  channel,
  groupLink,
  onGroupLinkChange,
  onPushToGroup,
  onConfirm,
  isSubmitting,
  acknowledged,
  labels,
  participantCount,
}: {
  channel: InviteChannel
  groupLink: string
  onGroupLinkChange: (next: string) => void
  onPushToGroup: () => Promise<void>
  onConfirm: () => Promise<void>
  isSubmitting: boolean
  acknowledged: boolean
  labels: ReturnType<typeof getLabels>
  participantCount: number
}) {
  const placeholder = channel === 'whatsapp' ? 'https://chat.whatsapp.com/...' : 'https://t.me/...'

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-2">
        <Users2 className="mt-0.5 h-4 w-4 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{labels.groupSectionTitle}</p>
          <p className="mt-0.5 text-[11px] text-text-secondary">{labels.groupSectionHint(participantCount)}</p>
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] font-medium text-text-secondary">
          {channel === 'whatsapp' ? labels.whatsappGroupLabel : labels.telegramGroupLabel}
        </span>
        <input
          type="url"
          value={groupLink}
          onChange={(event) => onGroupLinkChange(event.target.value)}
          placeholder={placeholder}
          className="mt-1 h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
        />
        <p className="mt-1 text-[11px] text-text-tertiary">{labels.groupLinkHint}</p>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onPushToGroup}
          disabled={isSubmitting}
          icon={<ExternalLink className="h-4 w-4" />}
        >
          {groupLink ? labels.openGroup(channelDisplayName(channel)) : labels.openMessenger(channelDisplayName(channel))}
        </Button>
        {groupLink && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.open(groupLink, '_blank', 'noopener,noreferrer')}
            icon={<Link2 className="h-4 w-4" />}
          >
            {labels.previewGroup}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface/60 p-3 text-[11px] leading-relaxed text-text-secondary">
        <p className="font-medium text-text-primary">{labels.groupSteps}</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>{labels.step1}</li>
          <li>{labels.step2(channelDisplayName(channel))}</li>
          <li>{labels.step3}</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={acknowledged ? 'success' : 'outline'}
          onClick={onConfirm}
          disabled={isSubmitting || acknowledged}
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          {acknowledged ? labels.markedSent : labels.markGroupSent}
        </Button>
        <p className="text-[11px] text-text-tertiary">{labels.markGroupSentHint}</p>
      </div>
    </div>
  )
}

function IndividualList({
  contacts,
  channel,
  sentIds,
  onOpen,
  onCopyPhone,
  copiedKey,
  isSubmitting,
  labels,
}: {
  contacts: ContactRow[]
  channel: InviteChannel
  sentIds: Set<string>
  onOpen: (contact: ContactRow) => void
  onCopyPhone: (phone: string) => void
  copiedKey: string | null
  isSubmitting: boolean
  labels: ReturnType<typeof getLabels>
}) {
  const showsCopyPhone = channel === 'whatsapp' || channel === 'sms'
  return (
    <div className="rounded-2xl border border-border-subtle">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-success" />
          <span>{labels.individualListTitle}</span>
          <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
            {sentIds.size}/{contacts.length}
          </span>
        </div>
      </div>
      <div className="max-h-[280px] overflow-y-auto p-1.5">
        {contacts.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-text-tertiary">{labels.empty}</p>
        )}
        {contacts.map((contact) => {
          const phoneRaw = contact.phone?.replace(/\D/g, '') ?? ''
          const reachable = isReachable(contact, channel)
          const sent = sentIds.has(contact.id)
          return (
            <div
              key={contact.id}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition ${
                sent ? 'bg-success/8' : 'hover:bg-surface-hover'
              } ${reachable ? '' : 'opacity-60'}`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                sent ? 'bg-success/20 text-success' : 'bg-surface text-text-tertiary'
              }`}>
                {sent ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-primary">{contact.full_name}</p>
                <ContactReachLine contact={contact} channel={channel} labels={labels} />
              </div>
              {showsCopyPhone && phoneRaw && (
                <button
                  type="button"
                  onClick={() => onCopyPhone(phoneRaw)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2 py-1 text-[10px] font-medium text-text-secondary transition hover:border-primary/40 hover:text-primary"
                >
                  {copiedKey === `phone-${phoneRaw}` ? (
                    <ClipboardCheck className="h-3 w-3 text-success" />
                  ) : (
                    <Clipboard className="h-3 w-3" />
                  )}
                  {copiedKey === `phone-${phoneRaw}` ? labels.copied : labels.copyPhone}
                </button>
              )}
              <Button
                type="button"
                size="sm"
                variant={sent ? 'ghost' : 'primary'}
                onClick={() => onOpen(contact)}
                disabled={!reachable || isSubmitting}
                icon={<ExternalLink className="h-3.5 w-3.5" />}
              >
                {sent ? labels.openAgain : labels.openContact}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SingleWindowSummary({
  channel,
  contacts,
  reachableCount,
  labels,
}: {
  channel: InviteChannel
  contacts: ContactRow[]
  reachableCount: number
  labels: ReturnType<typeof getLabels>
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border-subtle bg-surface/40 p-3">
      <p className="text-sm font-semibold text-text-primary">
        {channel === 'email' ? labels.singleEmailTitle : labels.singleSmsTitle}
      </p>
      <p className="text-[11px] text-text-secondary">
        {channel === 'email' ? labels.singleEmailHint(reachableCount) : labels.singleSmsHint(reachableCount)}
      </p>
      <div className="max-h-[160px] overflow-y-auto rounded-lg border border-border-subtle bg-card/40 p-2">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between gap-2 px-1.5 py-1 text-xs">
            <span className="truncate text-text-primary">{contact.full_name}</span>
            <ContactReachLine contact={contact} channel={channel} labels={labels} compact />
          </div>
        ))}
      </div>
    </div>
  )
}

function ContactReachLine({
  contact,
  channel,
  labels,
  compact = false,
}: {
  contact: ContactRow
  channel: InviteChannel
  labels: ReturnType<typeof getLabels>
  compact?: boolean
}) {
  const phone = contact.phone?.replace(/\s+/g, '') ?? ''
  const email = contact.email?.trim() ?? ''
  const telegramUsername = contact.telegram_username?.trim() ?? ''
  const cls = compact
    ? 'flex items-center gap-1 truncate text-[10px] text-text-tertiary'
    : 'flex items-center gap-1 truncate text-[11px] text-text-tertiary'

  if (channel === 'whatsapp' || channel === 'sms') {
    if (!phone) return <p className={cls}>{labels.missingPhone}</p>
    return (
      <p className={cls}>
        <Phone className="h-3 w-3" />
        {phone}
      </p>
    )
  }
  if (channel === 'email') {
    if (!email) return <p className={cls}>{labels.missingEmail}</p>
    return (
      <p className={cls}>
        <Mail className="h-3 w-3" />
        {email}
      </p>
    )
  }
  if (channel === 'telegram') {
    if (telegramUsername) {
      return (
        <p className={cls}>
          <AtSign className="h-3 w-3" />
          {telegramUsername.replace(/^@/, '')}
        </p>
      )
    }
    return (
      <p className={cls}>
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

function defaultTemplate(locale: 'tr' | 'en', mode: BroadcastMode): string {
  if (mode === 'individual') {
    return locale === 'tr'
      ? 'Merhaba {name}, "{eventTitle}" etkinliğine davetlisin.\nTarih: {date}\nSaat: {time}\nKonum: {location}\nToplantı: {meetingUrl}'
      : 'Hi {name}, you are invited to "{eventTitle}".\nDate: {date}\nTime: {time}\nLocation: {location}\nMeeting: {meetingUrl}'
  }
  return locale === 'tr'
    ? 'Selam ekip,\n"{eventTitle}" etkinliğine birlikte katılalım.\nTarih: {date}\nSaat: {time}\nKonum: {location}\nToplantı: {meetingUrl}'
    : 'Hi team,\nLet\'s join "{eventTitle}" together.\nDate: {date}\nTime: {time}\nLocation: {location}\nMeeting: {meetingUrl}'
}

function channelDisplayName(channel: InviteChannel): string {
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'telegram') return 'Telegram'
  if (channel === 'email') return 'Email'
  return 'SMS'
}

function getDisclaimer(channel: InviteChannel, mode: BroadcastMode, labels: ReturnType<typeof getLabels>) {
  if (mode === 'group') return labels.disclaimerGroup
  if (channel === 'whatsapp' || channel === 'telegram') return labels.disclaimerIndividualMessenger
  if (channel === 'email') return labels.disclaimerEmail
  return labels.disclaimerSms
}

function getLabels(locale: 'tr' | 'en', channel: InviteChannel) {
  const isTr = locale === 'tr'
  const channelName = channelDisplayName(channel)

  return {
    title: isTr ? `${channelName} ile gönder` : `Send via ${channelName}`,
    description: isTr
      ? 'Mesajını hazırla ve gruba ya da kişilere ulaştır.'
      : 'Prepare your message and reach the group or individuals.',

    modeGroupTitle: isTr ? 'Gruba gönder' : 'Send to group',
    modeGroupHint: isTr
      ? 'Etkinlik için kayıtlı gruba tek mesaj at — herkes anında görür.'
      : 'Post once to your event group — everyone sees it at once.',
    modeIndividualTitle: isTr ? 'Bireysel' : 'Individual',
    modeIndividualHint: isTr
      ? 'Birkaç kişiye özel sohbette atmak için.'
      : 'Send a private message to a few specific people.',

    disclaimerGroup: isTr
      ? 'Mesaj panoya kopyalanır ve grup penceren yeni sekmede açılır. Sen sadece grupta yapıştırıp Gönder\'e bas — bir hamlede yüzlerce kişi okuyabilir.'
      : "The message is copied to your clipboard and your group window opens in a new tab. Just paste and Send — hundreds of people receive it instantly.",
    disclaimerIndividualMessenger:
      channel === 'whatsapp'
        ? isTr
          ? 'Her satırdaki "Aç" butonuna basınca o kişinin WhatsApp sohbeti yeni sekmede açılır, mesaj zaten yazılmış olur. Sen kontrol edip Gönder\'e basarsın.'
          : "Tap Open on a row and that person's WhatsApp chat opens with the message already typed. Review it and hit Send."
        : isTr
          ? 'Her satırdaki "Aç" butonuna basınca o kişinin Telegram sohbeti yeni sekmede açılır.'
          : "Tap Open on a row and that person's Telegram chat opens in a new tab.",
    disclaimerEmail: isTr
      ? 'Tek e-posta penceresi açılır: ilk alıcı To, geri kalanlar BCC olarak eklenir; konu ve gövde dolu gelir.'
      : 'A single email window opens with the first recipient as To and the rest as BCC; subject and body are pre-filled.',
    disclaimerSms: isTr
      ? 'Tek SMS penceresi açılır, seçili numaralar alıcı listesine eklenir, gövde dolu olur.'
      : 'A single SMS window opens with the selected numbers as recipients and the body pre-filled.',

    messageLabel: isTr ? 'Mesaj' : 'Message',
    messageHintGroup: isTr
      ? 'Yer tutucular: {eventTitle}, {date}, {time}, {location}, {meetingUrl}, {groupLink}.'
      : 'Placeholders: {eventTitle}, {date}, {time}, {location}, {meetingUrl}, {groupLink}.',
    messageHintIndividual: isTr
      ? 'Her kişi için {name} otomatik doldurulur.'
      : '{name} is filled per recipient.',
    copyMessage: isTr ? 'Mesajı kopyala' : 'Copy message',
    copyPhone: isTr ? 'Telefonu kopyala' : 'Copy phone',
    copied: isTr ? 'Kopyalandı' : 'Copied',

    groupSectionTitle: isTr ? 'Grup penceresinden tek mesajda gönder' : 'Push once from your group window',
    groupSectionHint: (count: number) =>
      isTr
        ? `${count} katılımcı zaten grupta olduğunu varsayarak çalışır. Linki bir kez yapıştırırsan etkinlik için kalıcı olarak hatırlanır.`
        : `Assumes the ${count} participants are already in your group. Paste the link once and we'll remember it for this event.`,
    whatsappGroupLabel: isTr ? 'WhatsApp grup davet linki' : 'WhatsApp group invite link',
    telegramGroupLabel: isTr ? 'Telegram grup linki' : 'Telegram group link',
    groupLinkHint: isTr
      ? 'Boş bırakırsan WhatsApp/Telegram Web ana sayfası açılır; mesaj her durumda panoda olur.'
      : 'If you leave it empty, WhatsApp/Telegram Web home page opens; the message is on your clipboard either way.',
    openGroup: (ch: string) => (isTr ? `Mesajı kopyala ve ${ch} grubunu aç` : `Copy message & open ${ch} group`),
    openMessenger: (ch: string) => (isTr ? `Mesajı kopyala ve ${ch}\'ı aç` : `Copy message & open ${ch}`),
    previewGroup: isTr ? 'Grubu önizle' : 'Preview group',

    groupSteps: isTr ? 'Sonraki 3 adım:' : 'Three quick steps:',
    step1: isTr ? 'Aşağıdaki butonla mesaj panoya kopyalanır ve grup yeni sekmede açılır.' : 'The button below copies the message and opens the group in a new tab.',
    step2: (ch: string) => (isTr ? `${ch} grubunda mesaj kutusuna yapıştır.` : `Paste it into the ${ch} group composer.`),
    step3: isTr ? 'Bir kez Gönder\'e bas; herkes anında görür.' : 'Hit Send once; everybody receives it instantly.',
    markGroupSent: isTr ? 'Gruba gönderildi olarak işaretle' : 'Mark as sent to group',
    markedSent: isTr ? 'Gönderildi olarak işaretlendi' : 'Marked as sent',
    markGroupSentHint: isTr
      ? 'Bu, katılımcıları "davet gönderildi" durumuna geçirir.'
      : 'This flips participants to the “invited” state in the event.',

    individualListTitle: isTr ? 'Katılımcılar' : 'Participants',
    empty: isTr ? 'Bu etkinlikte katılımcı yok.' : 'No participants on this event.',
    openContact: isTr ? 'Aç' : 'Open',
    openAgain: isTr ? 'Tekrar aç' : 'Open again',
    markSent: (count: number) =>
      isTr ? `${count} kişiyi gönderildi olarak işaretle` : `Mark ${count} as sent`,
    feedbackIndividualSaved: (count: number) =>
      isTr ? `${count} katılımcı gönderildi olarak işaretlendi.` : `${count} participants marked as sent.`,

    singleEmailTitle: isTr ? 'Tek e-posta penceresi' : 'Single email window',
    singleEmailHint: (count: number) =>
      isTr ? `${count} alıcı BCC ile tek pencereye eklenecek.` : `${count} recipients will be added as BCC in a single window.`,
    singleSmsTitle: isTr ? 'Tek SMS penceresi' : 'Single SMS window',
    singleSmsHint: (count: number) =>
      isTr ? `${count} numara tek SMS penceresine alıcı olarak eklenecek.` : `${count} numbers will be added to a single SMS window.`,
    openSingleEmail: (count: number) =>
      isTr ? `Tek pencere aç (${count})` : `Open single window (${count})`,
    openSingleSms: (count: number) =>
      isTr ? `Tek pencere aç (${count})` : `Open single window (${count})`,

    missingPhone: isTr ? 'telefon kayıtlı değil' : 'no phone on file',
    missingEmail: isTr ? 'e-posta kayıtlı değil' : 'no email on file',
    telegramFallbackPerson: isTr ? 'Telegram kullanıcı adı yok' : 'no Telegram username',

    feedbackGroupOpened: (ch: string) =>
      isTr
        ? `Mesaj panoda. ${ch} penceresinde grubu seç ve yapıştırıp Gönder\'e bas. Sonra "Gruba gönderildi olarak işaretle" düğmesine basabilirsin.`
        : `Message is on your clipboard. In ${ch}, pick the group, paste, and hit Send. Then you can mark it as sent.`,
    feedbackGroupConfirmed: (count: number) =>
      isTr ? `${count} katılımcı için davet gönderildi olarak kaydedildi.` : `Marked invitations as sent for ${count} participants.`,
    feedbackEmail: (count: number) =>
      isTr
        ? `${count} alıcı için tek e-posta penceresi açıldı; etkinlik kaydı güncellendi.`
        : `Opened one email window for ${count} recipients; event updated.`,
    feedbackSms: (count: number) =>
      isTr
        ? `${count} numara için tek SMS penceresi açıldı; mesaj panoda hazır.`
        : `Opened one SMS window for ${count} numbers; the message is on your clipboard.`,
    feedbackEmailEmpty: isTr
      ? 'Hiçbir katılımcının e-postası yok.'
      : 'None of the participants have an email address.',
    feedbackSmsEmpty: isTr
      ? 'Hiçbir katılımcının telefonu yok.'
      : 'None of the participants have a phone number.',
    feedbackError: isTr
      ? 'Bir sorun oluştu. Lütfen tekrar dene.'
      : 'Something went wrong. Please try again.',

    footerGroup: isTr ? 'Tek mesaj, herkes anında görür.' : 'One message, everyone sees it at once.',
    footerIndividual: isTr ? 'Her kişiye tek tıkla, sen kontrol edip gönderirsin.' : 'One click per person — you review and send.',
    close: isTr ? 'Kapat' : 'Close',
  }
}
