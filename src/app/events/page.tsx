'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { EventInviteModal } from '@/components/events/EventInviteModal'
import { EventCreateModal } from '@/components/events/EventCreateModal'
import { EventDetailsModal } from '@/components/events/EventDetailsModal'
import {
  EVENT_TYPE_KEY,
  blankEvent,
  eventPrefillFromDate,
  eventToForm,
  eventTypeColors,
  formToInput,
  type EventFieldLabels,
  type EventFormShape,
} from '@/components/events/eventForm'
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
import { Calendar, Clock, MapPin, Plus, Video } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

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
  const [processedParamsToken, setProcessedParamsToken] = useState<string | null>(null)

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

  const fieldLabels: EventFieldLabels = locale === 'tr'
    ? {
        eventName: 'Etkinlik adı',
        status: 'Durum',
        type: 'Tür',
        start: 'Başlangıç',
        end: 'Bitiş',
        location: 'Konum',
        meetingUrl: 'Toplantı linki',
        description: 'Açıklama',
      }
    : {
        eventName: 'Event name',
        status: 'Status',
        type: 'Type',
        start: 'Start',
        end: 'End',
        location: 'Location',
        meetingUrl: 'Meeting URL',
        description: 'Description',
      }

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
        selected: 'Seçili',
        openMeeting: 'Toplantıyı Aç',
        openMap: 'Haritada Aç',
        viewContacts: 'Kontakları Gör',
        selectedCount: 'seçili',
        sentTo: 'gönderim hazırlandı',
        addedToEvent: 'kişi etkinliğe eklendi',
        noCompatibleContacts: 'Seçilen kanala uygun iletişim bilgisi bulunamadı.',
        telegramNotice: 'Telegram bağlantısı paylaşım ekranında açıldı.',
        createDescription: 'Yeni bir sunum, egitim veya ekip bulusmasi planla.',
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
        selected: 'Selected',
        openMeeting: 'Open Meeting',
        openMap: 'Open Map',
        viewContacts: 'View Contacts',
        selectedCount: 'selected',
        sentTo: 'delivery prepared',
        addedToEvent: 'contacts added to the event',
        noCompatibleContacts: 'No compatible contact info is available for the selected channel.',
        telegramNotice: 'Telegram share flow has been opened.',
        createDescription: 'Plan a new presentation, training, or team session.',
      }

  const eventTypeLabel = (type: string) => {
    const key = EVENT_TYPE_KEY[type]
    const mapped = key ? (t.events.types as Record<string, string>)[key] : null
    if (mapped) return mapped
    return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
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
    setEditForm(eventToForm(event))
  }

  function closeDetailsModal() {
    setInviteOpen(false)
    setActiveEventId(null)
    navigateBackIfNeeded()
  }

  const newFlag = searchParams.get('new')
  const dateParam = searchParams.get('date')
  const eventIdParam = searchParams.get('event')
  const returnToParam = searchParams.get('returnTo')
  const paramsToken = `${newFlag ?? ''}|${dateParam ?? ''}|${eventIdParam ?? ''}|${returnToParam ?? ''}`

  if (paramsToken !== processedParamsToken) {
    setProcessedParamsToken(paramsToken)

    if (newFlag === '1') {
      setReturnPath(returnToParam)
      openCreateModal(eventPrefillFromDate(dateParam ?? undefined))
      router.replace('/events')
    } else if (eventIdParam) {
      const matchingEvent = eventItems.find((event) => event.id === eventIdParam)
      if (matchingEvent) {
        setReturnPath(returnToParam)
        openDetails(matchingEvent)
      }
      router.replace('/events')
    }
  }

  async function createEvent() {
    const created = await createMutation.mutateAsync(createForm)
    setCreateOpen(false)
    navigateBackIfNeeded()
    if (created) {
      setActiveEventId(created.id)
      setEditForm(eventToForm(created))
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

      <EventCreateModal
        open={createOpen}
        onClose={closeCreateModal}
        form={createForm}
        onFormChange={setCreateForm}
        title={t.events.createEvent}
        description={labels.createDescription}
        labels={fieldLabels}
        eventTypeLabel={eventTypeLabel}
        onSubmit={createEvent}
        isSubmitting={createMutation.isPending}
        cancelLabel={t.common.cancel}
        submitLabel={t.common.create}
      />

      <EventDetailsModal
        open={Boolean(activeEvent)}
        onClose={closeDetailsModal}
        event={activeEvent}
        contacts={contacts}
        form={editForm}
        onFormChange={setEditForm}
        labels={{
          ...fieldLabels,
          manageHint: labels.manageHint,
          attendees: labels.attendees,
          attendeesEmpty: labels.attendeesEmpty,
          invite: labels.invite,
          openMeeting: labels.openMeeting,
          openMap: labels.openMap,
          viewContacts: labels.viewContacts,
          delete: labels.delete,
          cancel: t.common.cancel,
          saveChanges: t.common.saveChanges,
        }}
        eventTypeLabel={eventTypeLabel}
        eventStatusLabel={eventStatusLabel}
        onSave={saveEvent}
        onDelete={deleteEvent}
        onOpenInvite={openInviteModal}
        onOpenContacts={() => router.push('/contacts')}
        isSaving={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

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
}
