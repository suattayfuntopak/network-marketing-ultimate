'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'
import { CheckSquare, Mail, MessageCircle, Search, Send, Smartphone, Square, Users } from 'lucide-react'

export type InviteChannel = 'whatsapp' | 'telegram' | 'email' | 'sms'

export interface EventInviteModalLabels {
  inviteTitle: string
  inviteDesc: string
  inviteSearchLabel: string
  inviteSearch: string
  inviteEmpty: string
  inviteSubmit: string
  inviteNow: string
  selectAll: string
  selectEligible: string
  clearSelection: string
  sendChannel: string
  channelHint: string
  selected: string
  selectedCount: string
  sentTo: string
  addedToEvent: string
  noCompatibleContacts: string
  telegramNotice: string
  cancel: string
}

interface Props {
  open: boolean
  onClose: () => void
  event: Event | null
  contacts: ContactRow[]
  locale: 'tr' | 'en'
  labels: EventInviteModalLabels
  isSyncing: boolean
  stageLabel: (contact: ContactRow) => string
  onSyncAttendees: (contactIds: string[], markAsSent: boolean) => Promise<void>
}

function eventMessage(locale: 'tr' | 'en', contactName: string, event: Event) {
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

  return locale === 'tr'
    ? `Merhaba ${contactName}, seni "${event.title}" etkinliğimize davet etmek istiyorum. ${eventDate} tarihinde ${eventTime} arasında ${event.location || 'online'} olarak planlandı. ${event.meetingUrl ? `Katılım linki: ${event.meetingUrl}` : ''}`.trim()
    : `Hi ${contactName}, I'd like to invite you to "${event.title}". It is planned for ${eventDate}, ${eventTime}, at ${event.location || 'online'}. ${event.meetingUrl ? `Join link: ${event.meetingUrl}` : ''}`.trim()
}

function contactLink(contact: ContactRow, event: Event, channel: InviteChannel, locale: 'tr' | 'en') {
  const message = eventMessage(locale, contact.full_name, event)
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
  return `https://t.me/share/url?url=${encodeURIComponent(event.meetingUrl || window.location.href)}&text=${encodedMessage}`
}

function buildBulkAnnouncement(locale: 'tr' | 'en', event: Event) {
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

  return locale === 'tr'
    ? `Duyuru: "${event.title}" etkinliği ${eventDate} tarihinde ${eventTime} saatlerinde ${event.location || 'online'} gerçekleşecek.${event.meetingUrl ? ` Katılım linki: ${event.meetingUrl}` : ''}`
    : `Announcement: "${event.title}" will take place on ${eventDate}, ${eventTime}, at ${event.location || 'online'}.${event.meetingUrl ? ` Join link: ${event.meetingUrl}` : ''}`
}

export function EventInviteModal({
  open,
  onClose,
  event,
  contacts,
  locale,
  labels,
  isSyncing,
  stageLabel,
  onSyncAttendees,
}: Props) {
  const [inviteSearch, setInviteSearch] = useState('')
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])
  const [inviteChannel, setInviteChannel] = useState<InviteChannel>('whatsapp')
  const [inviteFeedback, setInviteFeedback] = useState('')
  const [lastOpenedFor, setLastOpenedFor] = useState<string | null>(null)

  const openToken = open ? event?.id ?? 'open' : null
  if (openToken !== lastOpenedFor) {
    setLastOpenedFor(openToken)
    if (openToken) {
      setInviteSearch('')
      setSelectedInviteIds(event?.attendees.map((attendee) => attendee.contactId) ?? [])
      setInviteFeedback('')
    }
  }

  const inviteableContacts = useMemo(() => {
    const query = inviteSearch.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')

    return contacts
      .filter((contact) => {
        if (!query) return true
        const haystack = [contact.full_name, contact.location, contact.profession, contact.source]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')
        return haystack.includes(query)
      })
      .sort((left, right) => left.full_name.localeCompare(right.full_name))
  }, [contacts, inviteSearch, locale])

  function toggleInvite(contactId: string) {
    setSelectedInviteIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    )
  }

  function selectAllInvites() {
    setSelectedInviteIds(inviteableContacts.map((contact) => contact.id))
  }

  function selectEligibleInvites() {
    if (!event) return
    const eligibleIds = inviteableContacts
      .filter((contact) => Boolean(contactLink(contact, event, inviteChannel, locale)))
      .map((contact) => contact.id)
    setSelectedInviteIds(eligibleIds)
  }

  async function sendInvites(contactIds: string[], closeAfter = false) {
    if (!event || contactIds.length === 0) return

    const selectedContacts = contacts.filter((contact) => contactIds.includes(contact.id))
    const links = selectedContacts
      .map((contact) => ({ contact, link: contactLink(contact, event, inviteChannel, locale) }))
      .filter((entry) => Boolean(entry.link))

    if (links.length === 0) {
      setInviteFeedback(labels.noCompatibleContacts)
      return
    }

    await onSyncAttendees(contactIds, true)

    if (inviteChannel === 'email') {
      const recipients = selectedContacts.map((contact) => contact.email).filter(Boolean)
      if (recipients.length > 0) {
        const first = recipients[0]
        const bcc = recipients.slice(1).join(',')
        const body = encodeURIComponent(buildBulkAnnouncement(locale, event))
        const href = `mailto:${first}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(event.title)}&body=${body}`
        window.open(href, '_blank', 'noopener,noreferrer')
      }
      setInviteFeedback(`${links.length} ${labels.addedToEvent}. ${links.length} ${labels.sentTo}.`)
    } else if (links.length === 1) {
      window.open(links[0].link!, '_blank', 'noopener,noreferrer')
      setInviteFeedback(`${links.length} ${labels.addedToEvent}. ${links.length} ${labels.sentTo}.`)
    } else {
      const announcement = buildBulkAnnouncement(locale, event)
      await navigator.clipboard.writeText(announcement)
      if (inviteChannel === 'whatsapp') {
        window.open('https://web.whatsapp.com/', '_blank', 'noopener,noreferrer')
      } else if (inviteChannel === 'telegram') {
        window.open('https://web.telegram.org/', '_blank', 'noopener,noreferrer')
      } else {
        window.open('sms:', '_blank', 'noopener,noreferrer')
      }
      setInviteFeedback(
        locale === 'tr'
          ? `${links.length} kişi etkinliğe eklendi. Toplu metin panoya kopyalandı; açılan ${inviteChannel === 'telegram' ? 'Telegram' : inviteChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} ekranında tek seferde paylaşabilirsin.`
          : `${links.length} contacts were added. The bulk message was copied to clipboard so you can send it in one pass from ${inviteChannel === 'telegram' ? 'Telegram' : inviteChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`
      )
    }

    if (closeAfter) {
      setSelectedInviteIds([])
    }
  }

  const channelIcon =
    inviteChannel === 'whatsapp'
      ? <MessageCircle className="w-3.5 h-3.5" />
      : inviteChannel === 'telegram'
        ? <Send className="w-3.5 h-3.5" />
        : inviteChannel === 'email'
          ? <Mail className="w-3.5 h-3.5" />
          : <Smartphone className="w-3.5 h-3.5" />

  return (
    <Modal
      open={open && Boolean(event)}
      onClose={onClose}
      title={labels.inviteTitle}
      description={labels.inviteDesc}
    >
      {event && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-3 items-end">
            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-text-secondary">{labels.inviteSearchLabel}</span>
              <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-primary/50">
                <Search className="w-4 h-4 shrink-0 text-text-tertiary" />
                <input
                  value={inviteSearch}
                  onChange={(event) => setInviteSearch(event.target.value)}
                  placeholder={labels.inviteSearch}
                  className="h-full w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                />
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.sendChannel}</span>
              <select
                value={inviteChannel}
                onChange={(event) => {
                  setInviteChannel(event.target.value as InviteChannel)
                  setInviteFeedback('')
                }}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <Button type="button" variant="ghost" size="sm" onClick={selectAllInvites}>
              <CheckSquare className="w-3.5 h-3.5" /> {labels.selectAll}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={selectEligibleInvites}>
              <Users className="w-3.5 h-3.5" /> {labels.selectEligible}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedInviteIds([])}>
              <Square className="w-3.5 h-3.5" /> {labels.clearSelection}
            </Button>
            <span className="text-text-tertiary">{labels.channelHint}</span>
          </div>

          {inviteFeedback && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              {inviteFeedback}
            </div>
          )}

          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {inviteableContacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-text-tertiary">
                {labels.inviteEmpty}
              </div>
            ) : (
              inviteableContacts.map((contact) => {
                const selected = selectedInviteIds.includes(contact.id)
                return (
                  <div
                    key={contact.id}
                    className={cn(
                      'w-full rounded-2xl border p-3 transition-colors',
                      selected ? 'border-primary/40 bg-primary/8' : 'border-border-subtle bg-surface/40 hover:border-border',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => toggleInvite(contact.id)} className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{contact.full_name}</p>
                        <p className="text-xs text-text-tertiary mt-1 truncate">
                          {[contact.profession, contact.location].filter(Boolean).join(' · ') || contact.source}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={selected ? 'primary' : 'default'} size="sm">
                          {selected ? labels.selected : stageLabel(contact)}
                        </Badge>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface/60 text-text-tertiary">
                          {channelIcon}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <p className="text-sm text-text-secondary">
              {selectedInviteIds.length} {labels.selectedCount}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>{labels.cancel}</Button>
              <Button
                type="button"
                disabled={selectedInviteIds.length === 0 || isSyncing}
                onClick={() => sendInvites(selectedInviteIds, true)}
              >
                <Send className="w-3.5 h-3.5" /> {labels.inviteSubmit}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
