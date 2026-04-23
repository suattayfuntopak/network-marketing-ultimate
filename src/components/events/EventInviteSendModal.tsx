'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { usePersistentState } from '@/hooks/usePersistentState'
import type { ContactRow } from '@/lib/queries'
import { contactLink, templateMessage, type InviteChannel } from '@/components/events/eventInviteUtils'
import type { Event } from '@/types'
import { ExternalLink, History, Link2, Send } from 'lucide-react'

export interface EventInviteSendModalLabels {
  title: string
  description: string
  sendChannel: string
  channelHint: string
  messageLabel: string
  bulkSend: string
  sequentialSend: string
  oneByOne: string
  openLink: string
  cancel: string
  addedToEvent: string
  sentTo: string
  noCompatibleContacts: string
  advanced: string
  groupLinksHint: string
  whatsappGroup: string
  telegramGroup: string
  templateLabel: string
  saveAsTemplate: string
  historyTitle: string
  noHistory: string
  selectedCount: string
  recipientCount: (n: number) => string
}

type InviteHistoryItem = {
  id: string
  eventId: string
  channel: InviteChannel
  contactIds: string[]
  createdAt: string
}

type InviteTemplate = { id: string; name: string; body: string }
type EventInviteConfig = { eventId: string; whatsappGroupLink: string; telegramGroupLink: string }

interface Props {
  open: boolean
  onClose: () => void
  event: Event | null
  contacts: ContactRow[]
  recipientIds: string[]
  locale: 'tr' | 'en'
  labels: EventInviteSendModalLabels
  isSyncing: boolean
  onSyncAttendees: (contactIds: string[], markAsSent: boolean) => Promise<void>
}

function defaultTemplates(locale: 'tr' | 'en'): InviteTemplate[] {
  return [
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
          : 'Reminder: "{eventTitle}" on {date} {time}. Link: {meetingUrl}',
    },
  ]
}

export function EventInviteSendModal({
  open,
  onClose,
  event,
  contacts,
  recipientIds,
  locale,
  labels,
  isSyncing,
  onSyncAttendees,
}: Props) {
  const [inviteChannel, setInviteChannel] = useState<InviteChannel>('whatsapp')
  const [inviteFeedback, setInviteFeedback] = useState('')
  const [activeTemplateId, setActiveTemplateId] = useState('default')
  const [messageBody, setMessageBody] = useState(() =>
    event ? templateMessage(defaultTemplates(locale)[0].body, event, locale, { groupLink: '' }) : '',
  )
  const [historyItems, setHistoryItems] = usePersistentState<InviteHistoryItem[]>('nmu-event-invite-history', [], { version: 1 })
  const [eventConfigs, setEventConfigs] = usePersistentState<EventInviteConfig[]>('nmu-event-invite-configs', [], { version: 1 })
  const [customTemplates, setCustomTemplates] = usePersistentState<InviteTemplate[]>('nmu-event-invite-templates', [], { version: 1 })

  const baseTemplates = useMemo(() => defaultTemplates(locale), [locale])
  const allTemplates = useMemo(() => [...baseTemplates, ...customTemplates], [baseTemplates, customTemplates])

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
    setCustomTemplates((current) => [{ id, name: name.trim(), body: messageBody.trim() }, ...current].slice(0, 50))
    setActiveTemplateId(id)
  }

  const selectedContacts = useMemo(() => {
    return recipientIds
      .map((id) => contacts.find((c) => c.id === id))
      .filter((c): c is ContactRow => Boolean(c))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US'))
  }, [recipientIds, contacts, locale])

  async function sendInvitesMode(mode: 'bulk' | 'sequential') {
    if (!event || selectedContacts.length === 0) return

    const links = selectedContacts
      .map((contact) => {
        const message = templateMessage(messageBody || baseTemplates[0].body, event, locale, {
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

    const resolvedIds = links.map((l) => l.contact.id)
    await onSyncAttendees(resolvedIds, true)

    if (inviteChannel === 'email' && mode === 'bulk') {
      const recipients = selectedContacts.map((c) => c.email).filter(Boolean) as string[]
      if (recipients.length > 0) {
        const first = recipients[0]
        const bcc = recipients.slice(1).join(',')
        const body = encodeURIComponent(
          templateMessage(messageBody || baseTemplates[0].body, event, locale, { groupLink }),
        )
        const href = `mailto:${first}?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(event.title)}&body=${body}`
        window.open(href, '_blank', 'noopener,noreferrer')
      }
      setInviteFeedback(`${links.length} ${labels.addedToEvent} ${links.length} ${labels.sentTo}.`)
    } else if (mode === 'sequential' && links.length === 1) {
      window.open(links[0].link!, '_blank', 'noopener,noreferrer')
      setInviteFeedback(`${links.length} ${labels.addedToEvent} ${links.length} ${labels.sentTo}.`)
    } else if (mode === 'bulk' && links.length === 1) {
      window.open(links[0].link!, '_blank', 'noopener,noreferrer')
      setInviteFeedback(`${links.length} ${labels.addedToEvent} ${links.length} ${labels.sentTo}.`)
    } else if (mode === 'bulk') {
      const announcement = templateMessage(messageBody || baseTemplates[0].body, event, locale, { groupLink })
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
          ? `${links.length} kişi güncellendi. Toplu metin panoya kopyalandı; açılan uygulamada paylaşabilirsin.`
          : `${links.length} contacts updated. Message was copied; paste it in the app that opened.`,
      )
    } else {
      for (let i = 0; i < links.length; i += 1) {
        window.open(links[i].link!, '_blank', 'noopener,noreferrer')
        if (i < links.length - 1) {
          await new Promise((r) => {
            setTimeout(r, 450)
          })
        }
      }
      setInviteFeedback(
        locale === 'tr'
          ? `${links.length} kişi için pencere sırası açıldı.`
          : `Opened a sequence of ${links.length} delivery windows.`,
      )
    }

    setHistoryItems((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        eventId: event.id,
        channel: inviteChannel,
        contactIds: resolvedIds,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 120))
  }

  return (
    <Modal open={open && Boolean(event)} onClose={onClose} title={labels.title} description={labels.description}>
      {event && (
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-sm text-text-secondary">{labels.recipientCount(selectedContacts.length)}</p>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-text-secondary">{labels.sendChannel}</span>
            <select
              value={inviteChannel}
              onChange={(e) => {
                const ch = e.target.value as InviteChannel
                setInviteChannel(ch)
                setInviteFeedback('')
                applyTemplate(activeTemplateId, ch)
              }}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <p className="text-[11px] text-text-tertiary leading-snug">{labels.channelHint}</p>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2 items-end">
            <label className="space-y-1.5 block min-w-0">
              <span className="text-xs font-medium text-text-secondary">{labels.templateLabel}</span>
              <select
                value={activeTemplateId}
                onChange={(e) => applyTemplate(e.target.value, inviteChannel)}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {allTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" variant="outline" size="sm" className="h-10" onClick={saveCurrentAsTemplate}>
              {labels.saveAsTemplate}
            </Button>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-text-secondary">{labels.messageLabel}</span>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
            />
          </label>

          <details className="rounded-xl border border-border-subtle bg-surface/30">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-text-secondary">
              {labels.advanced}
            </summary>
            <div className="p-3 pt-0 space-y-3">
              <p className="text-[11px] text-text-tertiary">{labels.groupLinksHint}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5 block">
                  <span className="text-xs font-medium text-text-secondary">{labels.whatsappGroup}</span>
                  <input
                    value={whatsappGroupLink}
                    onChange={(e) => updateEventConfig({ whatsappGroupLink: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 text-sm"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-xs font-medium text-text-secondary">{labels.telegramGroup}</span>
                  <input
                    value={telegramGroupLink}
                    onChange={(e) => updateEventConfig({ telegramGroupLink: e.target.value })}
                    placeholder="https://t.me/..."
                    className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 text-sm"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!whatsappGroupLink}
                  onClick={() => window.open(whatsappGroupLink, '_blank', 'noopener,noreferrer')}
                >
                  <Link2 className="w-3.5 h-3.5" /> WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!telegramGroupLink}
                  onClick={() => window.open(telegramGroupLink, '_blank', 'noopener,noreferrer')}
                >
                  <Link2 className="w-3.5 h-3.5" /> Telegram
                </Button>
              </div>
            </div>
          </details>

          {inviteFeedback && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">{inviteFeedback}</div>
          )}

          {selectedContacts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">{labels.oneByOne}</p>
              <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 rounded-xl border border-border-subtle p-2">
                {selectedContacts.map((c) => {
                  const message = templateMessage(messageBody || baseTemplates[0].body, event, locale, {
                    name: c.full_name,
                    groupLink,
                  })
                  const link = contactLink(c, event, inviteChannel, message)
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-sm py-1">
                      <span className="truncate min-w-0 text-text-primary">{c.full_name}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-7"
                        disabled={!link}
                        onClick={() => {
                          if (link) window.open(link, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> {labels.openLink}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => sendInvitesMode('bulk')}
              disabled={isSyncing || selectedContacts.length === 0}
              className="flex-1 min-w-[120px]"
            >
              <Send className="w-3.5 h-3.5" />
              {labels.bulkSend}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => sendInvitesMode('sequential')}
              disabled={isSyncing || selectedContacts.length === 0}
              className="flex-1 min-w-[120px]"
            >
              {labels.sequentialSend}
            </Button>
          </div>

          <details className="text-xs text-text-tertiary">
            <summary className="cursor-pointer flex items-center gap-1 font-medium text-text-secondary">
              <History className="w-3.5 h-3.5" />
              {labels.historyTitle}
            </summary>
            <div className="mt-2 space-y-1 max-h-24 overflow-y-auto pl-1">
              {historyItems.filter((h) => h.eventId === event.id).length === 0 && <p>{labels.noHistory}</p>}
              {historyItems
                .filter((h) => h.eventId === event.id)
                .slice(0, 6)
                .map((h) => (
                  <p key={h.id}>
                    {new Date(h.createdAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} · {h.channel} · {h.contactIds.length}{' '}
                    {labels.selectedCount}
                  </p>
                ))}
            </div>
          </details>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              {labels.cancel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
