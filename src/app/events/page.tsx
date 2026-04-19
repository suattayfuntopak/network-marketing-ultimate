'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { EventInviteModal } from '@/components/events/EventInviteModal'
import { useAppStore } from '@/store/appStore'
import {
  createEvent as apiCreateEvent,
  deleteEvent as apiDeleteEvent,
  fetchContacts,
  fetchEvents,
  updateEvent as apiUpdateEvent,
  upsertEventAttendees,
  type ContactRow,
  type EventInput,
} from '@/lib/queries'
import type { Event } from '@/types'
import { Calendar, Clock, MapPin, Plus, Send, Trash2, Users, Video } from 'lucide-react'

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

type EventFormShape = {
  title: string
  description: string
  type: Event['type']
  startDate: string
  endDate: string
  location: string
  meetingUrl: string
  maxAttendees: number
  status: Event['status']
}

const blankEvent: EventFormShape = {
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

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

function isoToInputDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function inputToIso(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function buildDateTime(date: string, hours: number, minutes: number) {
  return `${date}T${pad(hours)}:${pad(minutes)}`
}

function eventPrefillFromDate(date?: string): Partial<EventFormShape> | undefined {
  if (!date) return undefined

  return {
    startDate: buildDateTime(date, 20, 0),
    endDate: buildDateTime(date, 21, 0),
  }
}

function formToInput(form: EventFormShape, fallbackTitle: string): EventInput {
  return {
    title: form.title.trim() || fallbackTitle,
    description: form.description.trim(),
    type: form.type,
    start_date: inputToIso(form.startDate),
    end_date: inputToIso(form.endDate),
    location: form.location.trim() ? form.location.trim() : null,
    meeting_url: form.meetingUrl.trim() ? form.meetingUrl.trim() : null,
    max_attendees: form.maxAttendees || null,
    status: form.status,
  }
}

export default function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(blankEvent)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(blankEvent)
  const [returnPath, setReturnPath] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data: eventItems = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  })

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const activeEvent = useMemo(
    () => eventItems.find((event) => event.id === activeEventId) ?? null,
    [activeEventId, eventItems],
  )

  const invalidateEvents = () => queryClient.invalidateQueries({ queryKey: ['events'] })

  const createMutation = useMutation({
    mutationFn: async (form: EventFormShape) => {
      if (!currentUser) throw new Error('Authentication required.')
      const fallback = locale === 'tr' ? 'Yeni Etkinlik' : 'New Event'
      return apiCreateEvent(currentUser.id, formToInput(form, fallback))
    },
    onSuccess: invalidateEvents,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<EventInput> }) => {
      await apiUpdateEvent(id, input)
    },
    onSuccess: invalidateEvents,
  })

  const deleteMutation = useMutation({
    mutationFn: apiDeleteEvent,
    onSuccess: invalidateEvents,
  })

  const attendeesMutation = useMutation({
    mutationFn: async ({
      eventId,
      entries,
    }: {
      eventId: string
      entries: Parameters<typeof upsertEventAttendees>[1]
    }) => {
      await upsertEventAttendees(eventId, entries)
    },
    onSuccess: invalidateEvents,
  })

  const labels = locale === 'tr'
    ? {
        details: 'Detaylar',
        invite: 'Kişilere Gönder',
        inviteTitle: 'Etkinliği Kişilere Gönder',
        inviteDesc: 'Seçtiğin kontaklar davetli olarak etkinliğe eklenecek.',
        inviteSearchLabel: 'Kontak Ara',
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
        addedToEvent: 'kişi etkinliğe eklendi',
        noCompatibleContacts: 'Seçilen kanala uygun iletişim bilgisi bulunamadı.',
        telegramNotice: 'Telegram bağlantısı paylaşım ekranında açıldı.',
      }
    : {
        details: 'Details',
        invite: 'Send to Contacts',
        inviteTitle: 'Send Event to Contacts',
        inviteDesc: 'Selected contacts will be added as invited attendees.',
        inviteSearchLabel: 'Search Contacts',
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
        addedToEvent: 'contacts added to the event',
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

  function openCreateModal(prefill?: Partial<EventFormShape>) {
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
    setActiveEventId(event.id)
    setInviteOpen(false)
    setEditForm({
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: isoToInputDateTime(event.startDate),
      endDate: isoToInputDateTime(event.endDate),
      location: event.location ?? '',
      meetingUrl: event.meetingUrl ?? '',
      maxAttendees: event.maxAttendees ?? 25,
      status: event.status,
    })
  }

  function closeDetailsModal() {
    setInviteOpen(false)
    setActiveEventId(null)
    navigateBackIfNeeded()
  }

  useEffect(() => {
    if (searchParams.get('new') !== '1') {
      return
    }

    const date = searchParams.get('date') ?? undefined
    setReturnPath(searchParams.get('returnTo'))
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

    setReturnPath(searchParams.get('returnTo'))
    openDetails(matchingEvent)
    router.replace('/events')
  }, [eventItems, router, searchParams])

  async function createEvent() {
    const created = await createMutation.mutateAsync(createForm)
    setCreateOpen(false)
    navigateBackIfNeeded()
    if (created) {
      setActiveEventId(created.id)
      setEditForm({
        title: created.title,
        description: created.description,
        type: created.type,
        startDate: isoToInputDateTime(created.startDate),
        endDate: isoToInputDateTime(created.endDate),
        location: created.location ?? '',
        meetingUrl: created.meetingUrl ?? '',
        maxAttendees: created.maxAttendees ?? 25,
        status: created.status,
      })
    }
  }

  async function saveEvent() {
    if (!activeEvent) return
    const fallback = locale === 'tr' ? 'Yeni Etkinlik' : 'New Event'
    await updateMutation.mutateAsync({
      id: activeEvent.id,
      input: formToInput(editForm, fallback),
    })
    navigateBackIfNeeded()
  }

  async function deleteEvent(eventId: string) {
    await deleteMutation.mutateAsync(eventId)
    setInviteOpen(false)
    setActiveEventId(null)
    navigateBackIfNeeded()
  }

  function openInviteModal() {
    if (!activeEvent) return
    setInviteOpen(true)
  }

  async function syncInvitedContacts(contactIds: string[], markAsSent: boolean) {
    if (!activeEvent) return
    const selectedContacts = contacts.filter((contact) => contactIds.includes(contact.id))
    if (selectedContacts.length === 0) return

    const existingMap = new Map(activeEvent.attendees.map((attendee) => [attendee.contactId, attendee]))
    const entries = selectedContacts.map((contact) => {
      const existing = existingMap.get(contact.id)
      return {
        contact_id: contact.id,
        contact_name: contact.full_name,
        rsvp_status: existing?.rsvpStatus ?? ('invited' as const),
        follow_up_status: markAsSent
          ? ('sent' as const)
          : existing?.followUpStatus ?? ('pending' as const),
      }
    })

    await attendeesMutation.mutateAsync({ eventId: activeEvent.id, entries })
  }

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
              <input value={createForm.location} onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.meetingUrl}</span>
              <input value={createForm.meetingUrl} onChange={(event) => setCreateForm((current) => ({ ...current, meetingUrl: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
            </label>
          </div>
          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-text-secondary">{labels.description}</span>
            <textarea value={createForm.description} onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeCreateModal}>{t.common.cancel}</Button>
            <Button type="button" onClick={createEvent} disabled={createMutation.isPending}>{t.common.create}</Button>
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
                <input value={editForm.location} onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
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
                <input value={editForm.meetingUrl} onChange={(event) => setEditForm((current) => ({ ...current, meetingUrl: event.target.value }))} className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50" />
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
              <Button type="button" variant="danger" size="sm" onClick={() => deleteEvent(activeEvent.id)} disabled={deleteMutation.isPending}>
                <Trash2 className="w-3.5 h-3.5" /> {labels.delete}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeDetailsModal}>{t.common.cancel}</Button>
                <Button type="button" onClick={saveEvent} disabled={updateMutation.isPending}>{t.common.saveChanges}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <EventInviteModal
        open={inviteOpen && Boolean(activeEvent)}
        onClose={() => setInviteOpen(false)}
        event={activeEvent}
        contacts={contacts}
        locale={locale}
        labels={{ ...labels, cancel: t.common.cancel }}
        isSyncing={attendeesMutation.isPending}
        stageLabel={stageLabel}
        onSyncAttendees={syncInvitedContacts}
      />
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
