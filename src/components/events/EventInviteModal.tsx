'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'
import { CheckSquare, History, Link2, Mail, MessageCircle, Search, Send, Smartphone, Square, Users } from 'lucide-react'

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

type InviteHistoryItem = {
  id: string
  eventId: string
  channel: InviteChannel
  contactIds: string[]
  createdAt: string
}

type InviteTemplate = {
  id: string
  name: string
  body: string
}

type EventInviteConfig = {
  eventId: string
  whatsappGroupLink: string
  telegramGroupLink: string
}

function templateMessage(
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
    .replaceAll('{location}', event.location || (locale === 'tr' ? 'online' : 'online'))
    .replaceAll('{meetingUrl}', event.meetingUrl ?? '')
    .replaceAll('{groupLink}', options?.groupLink ?? '')
}

function contactLink(contact: ContactRow, event: Event, channel: InviteChannel, message: string) {
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
  const [activeTemplateId, setActiveTemplateId] = useState('default')
  const [messageBody, setMessageBody] = useState('')
  const [lastOpenedFor, setLastOpenedFor] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = usePersistentState<InviteHistoryItem[]>('nmu-event-invite-history', [], { version: 1 })
  const [eventConfigs, setEventConfigs] = usePersistentState<EventInviteConfig[]>('nmu-event-invite-configs', [], { version: 1 })
  const [customTemplates, setCustomTemplates] = usePersistentState<InviteTemplate[]>('nmu-event-invite-templates', [], { version: 1 })

  const defaultTemplates: InviteTemplate[] = useMemo(
    () => [
      {
        id: 'default',
        name: locale === 'tr' ? 'Standart Davet' : 'Standard Invite',
        body:
          locale === 'tr'
            ? 'Merhaba {name}, "{eventTitle}" etkinliğine davetlisin. Tarih: {date}, Saat: {time}, Konum: {location}. Toplantı: {meetingUrl} Grup: {groupLink}'
            : 'Hi {name}, you are invited to "{eventTitle}". Date: {date}, Time: {time}, Location: {location}. Meeting: {meetingUrl} Group: {groupLink}',
      },
      {
        id: 'short',
        name: locale === 'tr' ? 'Kısa Hatırlatma' : 'Quick Reminder',
        body:
          locale === 'tr'
            ? '"{eventTitle}" hatırlatması: {date} {time}. Link: {meetingUrl}'
            : '"{eventTitle}" reminder: {date} {time}. Link: {meetingUrl}',
      },
    ],
    [locale],
  )
  const allTemplates = useMemo(() => [...defaultTemplates, ...customTemplates], [customTemplates, defaultTemplates])
  const eventConfig = useMemo(
    () => eventConfigs.find((item) => item.eventId === event?.id) ?? null,
    [event?.id, eventConfigs],
  )
  const whatsappGroupLink = eventConfig?.whatsappGroupLink ?? ''
  const telegramGroupLink = eventConfig?.telegramGroupLink ?? ''
  const groupLink = inviteChannel === 'whatsapp' ? whatsappGroupLink : inviteChannel === 'telegram' ? telegramGroupLink : ''

  function updateEventConfig(patch: Partial<EventInviteConfig>) {
    if (!event) return
    setEventConfigs((current) => {
      const existing = current.find((item) => item.eventId === event.id)
      const next: EventInviteConfig = {
        eventId: event.id,
        whatsappGroupLink: existing?.whatsappGroupLink ?? '',
        telegramGroupLink: existing?.telegramGroupLink ?? '',
        ...patch,
      }
      if (!existing) return [next, ...current]
      return current.map((item) => (item.eventId === event.id ? next : item))
    })
  }

  function applyTemplate(templateId: string, channel: InviteChannel) {
    if (!event) return
    const template = allTemplates.find((entry) => entry.id === templateId)
    if (!template) return
    setActiveTemplateId(templateId)
    const link = channel === 'whatsapp' ? whatsappGroupLink : channel === 'telegram' ? telegramGroupLink : ''
    setMessageBody(templateMessage(template.body, event, locale, { groupLink: link }))
  }

  function saveCurrentAsTemplate() {
    if (!messageBody.trim()) return
    const name = window.prompt(locale === 'tr' ? 'Şablon adı' : 'Template name', locale === 'tr' ? 'Özel Şablon' : 'Custom Template')
    if (!name?.trim()) return
    const id = `custom-${Date.now()}`
    const next = { id, name: name.trim(), body: messageBody.trim() }
    setCustomTemplates((current) => [next, ...current].slice(0, 50))
    setActiveTemplateId(id)
  }

  const openToken = open ? event?.id ?? 'open' : null
  if (openToken !== lastOpenedFor) {
    setLastOpenedFor(openToken)
    if (openToken) {
      setInviteSearch('')
      setSelectedInviteIds(event?.attendees.map((attendee) => attendee.contactId) ?? [])
      setInviteFeedback('')
      setActiveTemplateId('default')
      if (event) {
        setMessageBody(templateMessage(defaultTemplates[0].body, event, locale, { groupLink }))
      }
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
      .filter((contact) => {
        const text = templateMessage(messageBody || defaultTemplates[0].body, event, locale, {
          name: contact.full_name,
          groupLink,
        })
        return Boolean(contactLink(contact, event, inviteChannel, text))
      })
      .map((contact) => contact.id)
    setSelectedInviteIds(eligibleIds)
  }

  async function sendInvites(contactIds: string[], closeAfter = false) {
    if (!event || contactIds.length === 0) return

    const selectedContacts = contacts.filter((contact) => contactIds.includes(contact.id))
    const links = selectedContacts
      .map((contact) => {
        const message = templateMessage(messageBody || defaultTemplates[0].body, event, locale, {
          name: contact.full_name,
          groupLink,
        })
        return { contact, link: contactLink(contact, event, inviteChannel, message) }
      })
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
        const body = encodeURIComponent(templateMessage(messageBody || defaultTemplates[0].body, event, locale, { groupLink }))
        const href = `mailto:${first}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(event.title)}&body=${body}`
        window.open(href, '_blank', 'noopener,noreferrer')
      }
      setInviteFeedback(`${links.length} ${labels.addedToEvent}. ${links.length} ${labels.sentTo}.`)
    } else if (links.length === 1) {
      window.open(links[0].link!, '_blank', 'noopener,noreferrer')
      setInviteFeedback(`${links.length} ${labels.addedToEvent}. ${links.length} ${labels.sentTo}.`)
    } else {
      const announcement = templateMessage(messageBody || defaultTemplates[0].body, event, locale, { groupLink })
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

    setHistoryItems((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        eventId: event.id,
        channel: inviteChannel,
        contactIds,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 120))
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
                  const nextChannel = event.target.value as InviteChannel
                  setInviteChannel(nextChannel)
                  setInviteFeedback('')
                  applyTemplate(activeTemplateId, nextChannel)
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-text-secondary">
                {locale === 'tr' ? 'WhatsApp Grup Davet Linki' : 'WhatsApp Group Invite Link'}
              </span>
              <input
                value={whatsappGroupLink}
                onChange={(event) => updateEventConfig({ whatsappGroupLink: event.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-text-secondary">
                {locale === 'tr' ? 'Telegram Grup Davet Linki' : 'Telegram Group Invite Link'}
              </span>
              <input
                value={telegramGroupLink}
                onChange={(event) => updateEventConfig({ telegramGroupLink: event.target.value })}
                placeholder="https://t.me/..."
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={!whatsappGroupLink} onClick={() => window.open(whatsappGroupLink, '_blank', 'noopener,noreferrer')}>
              <Link2 className="w-3.5 h-3.5" /> WhatsApp
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={!telegramGroupLink} onClick={() => window.open(telegramGroupLink, '_blank', 'noopener,noreferrer')}>
              <Link2 className="w-3.5 h-3.5" /> Telegram
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-3 items-end">
            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-text-secondary">
                {locale === 'tr' ? 'Toplu Mesaj Şablonu' : 'Bulk Message Template'}
              </span>
              <select
                value={activeTemplateId}
                onChange={(event) => applyTemplate(event.target.value, inviteChannel)}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {allTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={saveCurrentAsTemplate}>
              {locale === 'tr' ? 'Metni Şablon Olarak Kaydet' : 'Save Text as Template'}
            </Button>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-text-secondary">
              {locale === 'tr'
                ? 'Mesaj ({name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl}, {groupLink})'
                : 'Message ({name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl}, {groupLink})'}
            </span>
            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
            />
          </label>

          {inviteFeedback && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              {inviteFeedback}
            </div>
          )}

          <div className="rounded-xl border border-border-subtle bg-surface/40 p-3">
            <p className="text-xs font-medium text-text-secondary flex items-center gap-1.5 mb-2">
              <History className="w-3.5 h-3.5" />
              {locale === 'tr' ? 'Davet Geçmişi' : 'Invite History'}
            </p>
            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
              {historyItems.filter((item) => item.eventId === event.id).slice(0, 8).map((entry) => (
                <div key={entry.id} className="text-xs text-text-tertiary">
                  {new Date(entry.createdAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} • {entry.channel.toUpperCase()} • {entry.contactIds.length} {labels.selectedCount}
                </div>
              ))}
              {historyItems.filter((item) => item.eventId === event.id).length === 0 && (
                <p className="text-xs text-text-tertiary">
                  {locale === 'tr' ? 'Henüz davet gönderimi yapılmadı.' : 'No invite send yet.'}
                </p>
              )}
            </div>
          </div>

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
