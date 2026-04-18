'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { events } from '@/data/mockData'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import type { Event } from '@/types'
import { Calendar, CheckSquare, Clock, Mail, MapPin, MessageCircle, Plus, Search, Send, Smartphone, Square, Trash2, Users, Video } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const eventTypeColors: Record<string, string> = {
  online_presentation: 'bg-primary/15 text-primary',
  home_meeting: 'bg-success/15 text-success',
  team_zoom: 'bg-secondary/15 text-secondary',
  training: 'bg-warning/15 text-warning',
  workshop: 'bg-accent/15 text-accent',
  local: 'bg-emerald-500/15 text-emerald-400',
  regional: 'bg-amber-500/15 text-amber-400',
  global: 'bg-rose-500/15 text-rose-400',
}

const EVENT_TYPE_KEY: Record<string, string> = {
  online_presentation: 'onlinePresentation',
  home_meeting: 'homeMeeting',
  team_zoom: 'teamZoom',
  training: 'training',
  workshop: 'workshop',
  local: 'local',
  regional: 'regional',
  global: 'global',
}

const blankEvent: Omit<Event, 'id' | 'userId' | 'attendees'> = {
  title: '',
  description: '',
  type: 'online_presentation',
  startDate: '2026-04-20T20:00',
  endDate: '2026-04-20T21:00',
  location: '',
  meetingUrl: '',
  maxAttendees: 25,
  status: 'draft',
}

function toInputDateTime(value: string) {
  return value.slice(0, 16)
}

function buildDateTime(date: string, hours: number, minutes: number) {
  return `${date}T${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`
}

function eventPrefillFromDate(date?: string): Partial<typeof blankEvent> | undefined {
  if (!date) return undefined

  return {
    startDate: buildDateTime(date, 20, 0),
    endDate: buildDateTime(date, 21, 0),
  }
}

const EVENT_STORAGE_VERSION = 3

export default function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const [eventItems, setEventItems] = usePersistentState<Event[]>('nmu-events', events, {
    version: EVENT_STORAGE_VERSION,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(blankEvent)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [editForm, setEditForm] = useState(blankEvent)
  const [returnPath, setReturnPath] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])
  const [inviteChannel, setInviteChannel] = useState<'whatsapp' | 'telegram' | 'email' | 'sms'>('whatsapp')
  const [inviteFeedback, setInviteFeedback] = useState('')

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const labels = locale === 'tr'
    ? {
        details: 'Detaylar',
        invite: 'Kişilere Gönder',
        inviteTitle: 'Etkinliği Kişilere Gönder',
        inviteDesc: 'Seçtiğin kontaklar davetli olarak etkinliğe eklenecek.',
        inviteSearch: 'Kontak ara...',
        inviteEmpty: 'Bu etkinlik için yeni davetli bulunamadı.',
        inviteSubmit: 'Gönder',
        inviteNow: 'Tekli Gönder',
        selectAll: 'Tümünü Seç',
        selectEligible: 'Uygunları Seç',
        clearSelection: 'Temizle',
        sendChannel: 'Gönderim Kanalı',
        channelHint: 'WhatsApp ve SMS telefon, e-posta ise mail adresi ister. Telegram paylaşım ekranı açar.',
        delete: 'Etkinliği Sil',
        attendees: 'Katılımcılar',
        attendeesEmpty: 'Henüz katılımcı eklenmedi.',
        manageHint: 'Etkinliği düzenle, davet gönder veya gerekirse akıştan kaldır.',
        eventName: 'Etkinlik adı',
        status: 'Durum',
        type: 'Tür',
        start: 'Başlangıç',
        end: 'Bitiş',
        location: 'Konum',
        meetingUrl: 'Toplantı linki',
        description: 'Açıklama',
        selected: 'Seçili',
        openMeeting: 'Toplantıyı Aç',
        openMap: 'Haritada Aç',
        viewContacts: 'Kontakları Gör',
        selectedCount: 'seçili',
        sentTo: 'gönderim hazırlandı',
        noCompatibleContacts: 'Seçilen kanala uygun iletişim bilgisi bulunamadı.',
        telegramNotice: 'Telegram bağlantısı paylaşım ekranında açıldı.',
      }
    : {
        details: 'Details',
        invite: 'Send to Contacts',
        inviteTitle: 'Send Event to Contacts',
        inviteDesc: 'Selected contacts will be added as invited attendees.',
        inviteSearch: 'Search contacts...',
        inviteEmpty: 'No additional contacts are available for this event.',
        inviteSubmit: 'Send',
        inviteNow: 'Send Now',
        selectAll: 'Select All',
        selectEligible: 'Select Eligible',
        clearSelection: 'Clear',
        sendChannel: 'Delivery Channel',
        channelHint: 'WhatsApp and SMS need phone numbers, email needs an address, Telegram opens the share flow.',
        delete: 'Delete Event',
        attendees: 'Attendees',
        attendeesEmpty: 'No attendees added yet.',
        manageHint: 'Update the event, send invitations, or remove it from the flow.',
        eventName: 'Event name',
        status: 'Status',
        type: 'Type',
        start: 'Start',
        end: 'End',
        location: 'Location',
        meetingUrl: 'Meeting URL',
        description: 'Description',
        selected: 'Selected',
        openMeeting: 'Open Meeting',
        openMap: 'Open Map',
        viewContacts: 'View Contacts',
        selectedCount: 'selected',
        sentTo: 'delivery prepared',
        noCompatibleContacts: 'No compatible contact info is available for the selected channel.',
        telegramNotice: 'Telegram share flow has been opened.',
      }

  const eventTypeLabel = (type: string) => {
    const key = EVENT_TYPE_KEY[type]
    return key ? (t.events.types as Record<string, string>)[key] ?? type.replace(/_/g, ' ') : type.replace(/_/g, ' ')
  }

  const eventStatusLabel = (status: Event['status']) => {
    const map = locale === 'tr'
      ? {
          draft: 'Taslak',
          published: 'Yayında',
          live: 'Canlı',
          completed: 'Tamamlandı',
          cancelled: 'İptal Edildi',
        }
      : {
          draft: 'Draft',
          published: 'Published',
          live: 'Live',
          completed: 'Completed',
          cancelled: 'Cancelled',
        }
    return map[status]
  }

  function resolveAttendeeName(contactId: string, fallback: string) {
    return contacts.find((contact) => contact.id === contactId)?.full_name ?? fallback
  }

  function openCreateModal(prefill?: Partial<typeof blankEvent>) {
    setCreateForm({ ...blankEvent, ...prefill })
    setCreateOpen(true)
  }

  function navigateBackIfNeeded() {
    if (!returnPath) {
      return
    }

    const nextPath = returnPath
    setReturnPath(null)
    router.push(nextPath)
  }

  function closeCreateModal() {
    setCreateOpen(false)
    navigateBackIfNeeded()
  }

  function openDetails(event: Event) {
    setActiveEvent(event)
    setInviteOpen(false)
    setInviteSearch('')
    setSelectedInviteIds([])
    setEditForm({
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: toInputDateTime(event.startDate),
      endDate: toInputDateTime(event.endDate),
      location: event.location ?? '',
      meetingUrl: event.meetingUrl ?? '',
      maxAttendees: event.maxAttendees ?? 25,
      status: event.status,
    })
  }

  function closeDetailsModal() {
    setInviteOpen(false)
    setActiveEvent(null)
    navigateBackIfNeeded()
  }

  useEffect(() => {
    if (searchParams.get('new') !== '1') {
      return
    }

    const date = searchParams.get('date') ?? undefined
    setReturnPath(searchParams.get('source') === 'calendar' ? '/calendar' : null)
    openCreateModal(eventPrefillFromDate(date))
    router.replace('/events')
  }, [router, searchParams])

  useEffect(() => {
    const eventId = searchParams.get('event')

    if (!eventId) {
      return
    }

    const matchingEvent = eventItems.find((event) => event.id === eventId)

    if (!matchingEvent) {
      router.replace('/events')
      return
    }

    setReturnPath(searchParams.get('source') === 'calendar' ? '/calendar' : null)
    openDetails(matchingEvent)
    router.replace('/events')
  }, [eventItems, router, searchParams])

  function createEvent() {
    const nextEvent: Event = {
      id: `event-${Date.now()}`,
      userId: 'u1',
      attendees: [],
      ...createForm,
      title: createForm.title.trim() || (locale === 'tr' ? 'Yeni Etkinlik' : 'New Event'),
      description: createForm.description.trim(),
    }
    setEventItems((current) => [nextEvent, ...current])
    setCreateOpen(false)
    navigateBackIfNeeded()
  }

  function saveEvent() {
    if (!activeEvent) return

    const nextEvent: Event = {
      ...activeEvent,
      ...editForm,
    }

    setEventItems((current) =>
      current.map((event) => (event.id === activeEvent.id ? nextEvent : event)),
    )
    setActiveEvent(nextEvent)
    navigateBackIfNeeded()
  }

  function deleteEvent(eventId: string) {
    setEventItems((current) => current.filter((event) => event.id !== eventId))
    setInviteOpen(false)
    setActiveEvent(null)
    navigateBackIfNeeded()
  }

  function openInviteModal() {
    if (!activeEvent) return
    setInviteSearch('')
    setSelectedInviteIds([])
    setInviteFeedback('')
    setInviteOpen(true)
  }

  function toggleInvite(contactId: string) {
    setSelectedInviteIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    )
  }

  function eventMessage(contactName: string, event: Event) {
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

  function contactLink(contact: ContactRow, event: Event, channel: typeof inviteChannel) {
    const message = eventMessage(contact.full_name, event)
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

  function syncInvitedContacts(contactIds: string[], markAsSent = false) {
    if (!activeEvent) return activeEvent

    const selectedContacts = contacts.filter((contact) => contactIds.includes(contact.id))
    const attendeeMap = new Map(activeEvent.attendees.map((attendee) => [attendee.contactId, attendee]))

    selectedContacts.forEach((contact) => {
      const existing = attendeeMap.get(contact.id)
      attendeeMap.set(contact.id, {
        contactId: contact.id,
        name: contact.full_name,
        rsvpStatus: existing?.rsvpStatus ?? 'invited',
        followUpStatus: markAsSent ? 'sent' : existing?.followUpStatus ?? 'pending',
      })
    })

    const nextEvent: Event = {
      ...activeEvent,
      attendees: Array.from(attendeeMap.values()),
    }

    setEventItems((current) =>
      current.map((event) => (event.id === activeEvent.id ? nextEvent : event)),
    )
    setActiveEvent(nextEvent)
    return nextEvent
  }

  function sendInvites(contactIds: string[], closeAfter = false) {
    if (!activeEvent || contactIds.length === 0) return

    const selectedContacts = contacts.filter((contact) => contactIds.includes(contact.id))
    const links = selectedContacts
      .map((contact) => ({ contact, link: contactLink(contact, activeEvent, inviteChannel) }))
      .filter((entry) => Boolean(entry.link))

    if (links.length === 0) {
      setInviteFeedback(labels.noCompatibleContacts)
      return
    }

    syncInvitedContacts(contactIds, true)

    if (inviteChannel === 'telegram') {
      window.open(links[0].link!, '_blank', 'noopener,noreferrer')
      setInviteFeedback(labels.telegramNotice)
    } else {
      links.forEach((entry) => {
        window.open(entry.link!, '_blank', 'noopener,noreferrer')
      })
      setInviteFeedback(`${links.length} ${labels.sentTo}`)
    }

    if (closeAfter) {
      setSelectedInviteIds([])
    }
  }

  function selectAllInvites() {
    setSelectedInviteIds(inviteableContacts.map((contact) => contact.id))
  }

  function selectEligibleInvites() {
    if (!activeEvent) return
    const eligibleIds = inviteableContacts
      .filter((contact) => Boolean(contactLink(contact, activeEvent, inviteChannel)))
      .map((contact) => contact.id)

    setSelectedInviteIds(eligibleIds)
  }

  const inviteableContacts = useMemo(() => {
    if (!activeEvent) return []

    const attendeeIds = new Set(activeEvent.attendees.map((attendee) => attendee.contactId))
    const query = inviteSearch.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')

    return contacts
      .filter((contact) => !attendeeIds.has(contact.id))
      .filter((contact) => {
        if (!query) return true
        const haystack = [contact.full_name, contact.location, contact.profession, contact.source]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')
        return haystack.includes(query)
      })
      .sort((left, right) => left.full_name.localeCompare(right.full_name))
  }, [activeEvent, contacts, inviteSearch, locale])

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.events.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.events.subtitle}</p>
        </div>
        <Button type="button" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => openCreateModal()}>
          {t.events.createEvent}
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {eventItems.map((event) => {
          const confirmed = event.attendees.filter((attendee) => attendee.rsvpStatus === 'confirmed' || attendee.rsvpStatus === 'attended').length
          const invited = event.attendees.length
          return (
            <motion.div key={event.id} variants={item}>
              <Card hover onClick={() => openDetails(event)} className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={eventTypeColors[event.type] || 'bg-surface-hover text-text-secondary'} size="md">
                    {eventTypeLabel(event.type)}
                  </Badge>
                  <Badge variant={event.status === 'published' || event.status === 'live' ? 'success' : event.status === 'cancelled' ? 'error' : 'default'} size="sm">
                    {eventStatusLabel(event.status)}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">{event.title}</h3>
                <p className="text-xs text-text-tertiary line-clamp-2 mb-4">{event.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    {new Date(event.startDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                    {new Date(event.startDate).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
                      {event.location}
                    </div>
                  )}
                  {event.meetingUrl && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Video className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-primary">{t.common.virtualMeeting}</span>
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-3 border-t border-border-subtle">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarGroup names={event.attendees.slice(0, 3).map((attendee) => resolveAttendeeName(attendee.contactId, attendee.name))} size="xs" />
                      <span className="text-xs text-text-tertiary truncate">{confirmed}/{invited} {t.common.confirmed}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(eventElement) => {
                        eventElement.stopPropagation()
                        openDetails(event)
                      }}
                    >
                      {labels.details}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}

        <motion.div variants={item}>
          <Card hover onClick={() => openCreateModal()} className="h-full min-h-[280px] flex flex-col items-center justify-center border-dashed border-2 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-text-primary">{t.common.createNewEvent}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{t.common.schedulePresentation}</p>
          </Card>
        </motion.div>
      </div>

      <Modal
        open={createOpen}
        onClose={closeCreateModal}
        title={t.events.createEvent}
        description={locale === 'tr' ? 'Yeni bir sunum, egitim veya ekip bulusmasi planla.' : 'Plan a new presentation, training, or team session.'}
      >
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.eventName}</span>
              <input value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.type}</span>
              <select value={createForm.type} onChange={(event) => setCreateForm((current) => ({ ...current, type: event.target.value as Event['type'] }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50">
                {Object.keys(EVENT_TYPE_KEY).map((type) => (
                  <option key={type} value={type}>{eventTypeLabel(type)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.start}</span>
              <input type="datetime-local" value={createForm.startDate} onChange={(event) => setCreateForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.end}</span>
              <input type="datetime-local" value={createForm.endDate} onChange={(event) => setCreateForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.location}</span>
              <input value={createForm.location ?? ''} onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.meetingUrl}</span>
              <input value={createForm.meetingUrl ?? ''} onChange={(event) => setCreateForm((current) => ({ ...current, meetingUrl: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
          </div>
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-text-secondary">{labels.description}</span>
            <textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal}>{t.common.cancel}</Button>
            <Button type="button" onClick={createEvent}>{t.common.create}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(activeEvent)}
        onClose={closeDetailsModal}
        title={activeEvent?.title}
        description={activeEvent ? labels.manageHint : undefined}
      >
        {activeEvent && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{labels.eventName}</span>
                <input value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{labels.status}</span>
                <select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as Event['status'] }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50">
                  {(['draft', 'published', 'live', 'completed', 'cancelled'] as Event['status'][]).map((status) => (
                    <option key={status} value={status}>{eventStatusLabel(status)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{labels.type}</span>
                <select value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value as Event['type'] }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50">
                  {Object.keys(EVENT_TYPE_KEY).map((type) => (
                    <option key={type} value={type}>{eventTypeLabel(type)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{labels.location}</span>
                <input value={editForm.location ?? ''} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{labels.start}</span>
                <input type="datetime-local" value={editForm.startDate} onChange={(event) => setEditForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">{labels.end}</span>
                <input type="datetime-local" value={editForm.endDate} onChange={(event) => setEditForm((current) => ({ ...current, endDate: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-secondary">{labels.meetingUrl}</span>
                <input value={editForm.meetingUrl ?? ''} onChange={(event) => setEditForm((current) => ({ ...current, meetingUrl: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
              </label>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-text-secondary">{labels.description}</span>
              <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>

            <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <Users className="w-4 h-4 text-primary" />
                  {labels.attendees}
                  <Badge size="sm" variant="default">{activeEvent.attendees.length}</Badge>
                </div>
                <Button type="button" size="sm" variant="outline" icon={<Send className="w-3.5 h-3.5" />} onClick={openInviteModal}>
                  {labels.invite}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeEvent.attendees.length > 0 ? (
                  activeEvent.attendees.map((attendee) => (
                    <Badge key={attendee.contactId} variant={attendee.rsvpStatus === 'confirmed' || attendee.rsvpStatus === 'attended' ? 'success' : 'default'} size="md">
                      {resolveAttendeeName(attendee.contactId, attendee.name)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-text-tertiary">{labels.attendeesEmpty}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeEvent.meetingUrl && (
                <Button type="button" variant="secondary" size="sm" onClick={() => window.open(activeEvent.meetingUrl, '_blank', 'noopener,noreferrer')}>
                  <Video className="w-3.5 h-3.5" /> {labels.openMeeting}
                </Button>
              )}
              {activeEvent.location && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeEvent.location ?? '')}`, '_blank', 'noopener,noreferrer')}
                >
                  <MapPin className="w-3.5 h-3.5" /> {labels.openMap}
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/contacts')}>
                <Users className="w-3.5 h-3.5" /> {labels.viewContacts}
              </Button>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
              <Button type="button" variant="danger" size="sm" onClick={() => deleteEvent(activeEvent.id)}>
                <Trash2 className="w-3.5 h-3.5" /> {labels.delete}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeDetailsModal}>{t.common.cancel}</Button>
                <Button type="button" onClick={saveEvent}>{t.common.saveChanges}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={inviteOpen && Boolean(activeEvent)}
        onClose={() => setInviteOpen(false)}
        title={labels.inviteTitle}
        description={labels.inviteDesc}
      >
        {activeEvent && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={inviteSearch}
                  onChange={(event) => setInviteSearch(event.target.value)}
                  placeholder={labels.inviteSearch}
                  className="w-full h-10 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-text-primary outline-none focus:border-primary/50"
                />
              </div>
              <label className="space-y-1">
                <span className="text-xs font-medium text-text-secondary">{labels.sendChannel}</span>
                <select
                  value={inviteChannel}
                  onChange={(event) => {
                    setInviteChannel(event.target.value as typeof inviteChannel)
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
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => sendInvites([contact.id])}
                            icon={inviteChannel === 'whatsapp'
                              ? <MessageCircle className="w-3.5 h-3.5" />
                              : inviteChannel === 'telegram'
                                ? <Send className="w-3.5 h-3.5" />
                                : inviteChannel === 'email'
                                  ? <Mail className="w-3.5 h-3.5" />
                                  : <Smartphone className="w-3.5 h-3.5" />}
                          >
                            {labels.inviteNow}
                          </Button>
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
                <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>{t.common.cancel}</Button>
                <Button type="button" disabled={selectedInviteIds.length === 0} onClick={() => sendInvites(selectedInviteIds, true)}>
                  <Send className="w-3.5 h-3.5" /> {labels.inviteSubmit}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )

  function stageLabel(contact: ContactRow) {
    if (locale === 'tr') {
      if (contact.pipeline_stage === 'became_customer') return 'Müşteri'
      if (contact.pipeline_stage === 'became_member') return 'Ekip'
      return 'Potansiyel'
    }

    if (contact.pipeline_stage === 'became_customer') return 'Customer'
    if (contact.pipeline_stage === 'became_member') return 'Team'
    return 'Prospect'
  }
}
