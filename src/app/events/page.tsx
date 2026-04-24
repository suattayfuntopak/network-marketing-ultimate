'use client'

import { useMemo, useState } from 'react'
import type { EventParticipantPickerLabels } from '@/components/events/EventParticipantPicker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { EventInviteSendModal } from '@/components/events/EventInviteSendModal'
import { EventCreateModal } from '@/components/events/EventCreateModal'
import { EventDetailsModal } from '@/components/events/EventDetailsModal'
import type { EventLocationSearchLabels } from '@/components/events/EventLocationSearch'
import type { EventMeetingUrlComboboxLabels } from '@/components/events/EventMeetingUrlCombobox'
import {
  EVENT_TYPE_KEY,
  blankEvent,
  eventPrefillFromDate,
  eventToForm,
  type EventFormShape,
  eventTypeColors,
  formToInput,
  type EventFieldLabels,
} from '@/components/events/eventForm'
import { useAppStore } from '@/store/appStore'
import {
  createEvent as apiCreateEvent,
  deleteEvent as apiDeleteEvent,
  deleteEventAttendees,
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
  const h = useHeadingCase()
  const { currentUser } = useAppStore()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(blankEvent)
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(blankEvent)
  const [returnPath, setReturnPath] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [pendingAttendeeIds, setPendingAttendeeIds] = useState<string[]>([])
  const [savingEvent, setSavingEvent] = useState(false)
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

  const meetingComboboxLabels: EventMeetingUrlComboboxLabels = locale === 'tr'
    ? {
        selectPreset: 'Kayıtlı toplantı linki seç…',
        addNew: 'Yeni toplantı linki ekle…',
        saveNew: 'Kaydet',
        cancelNew: 'Vazgeç',
        namePlaceholder: 'Örn. Zoom — Ekip, Zoom — Müşteriler',
        urlPlaceholder: 'https://zoom.us/j/… veya başka toplantı adresi',
      }
    : {
        selectPreset: 'Choose a saved meeting link…',
        addNew: 'Add new meeting link…',
        saveNew: 'Save',
        cancelNew: 'Cancel',
        namePlaceholder: 'e.g. Zoom — Team, Zoom — Clients',
        urlPlaceholder: 'https://… (Zoom, Meet, etc.)',
      }

  const locationSearchLabels: EventLocationSearchLabels = locale === 'tr'
    ? { searching: 'Aranıyor…', noResults: 'Eşleşen yer bulunamadı.' }
    : { searching: 'Searching…', noResults: 'No matching places.' }

  const trPicker: EventParticipantPickerLabels = {
    searchLabel: 'Kontak ara',
    searchPlaceholder: 'İsim, rol veya konum...',
    selectAll: 'Tümünü Seç',
    clear: 'Temizle',
    empty: 'Eşleşen kontak yok.',
    done: 'Tamam',
    send: 'Gönder',
    peopleCount: (n: number) => (n === 0 ? 'Henüz kimse seçilmedi.' : `${n} kişi seçili.`),
  }

  const enPicker: EventParticipantPickerLabels = {
    searchLabel: 'Search',
    searchPlaceholder: 'Name, role, or location...',
    selectAll: 'Select all',
    clear: 'Clear',
    empty: 'No matching contacts.',
    done: 'Done',
    send: 'Send',
    peopleCount: (n: number) => (n === 0 ? 'No one selected yet.' : `${n} selected.`),
  }

  const labels = locale === 'tr'
    ? {
        details: 'Detaylar',
        invite: 'Kişilere Gönder',
        sendBlockedHint: 'Davet göndermek veya toplu mesaj açmadan önce tüm değişiklikleri (etkinlik alanları + katılımcı listesi) “Değişiklikleri Kaydet” ile kaydedin.',
        sendModal: {
          title: 'Etkinliği Kişilere Gönder',
          description: 'Kayıtlı katılımcılara aynı etkinlik mesajını ilet. İstersen aşağıdaki isimlerin yanındaki “Aç” ile tek tek de gönderebilirsin.',
          sendChannel: 'Gönderim kanalı',
          channelHint: 'WhatsApp ve SMS telefon, e-posta e-posta adresi, Telegram paylaşım penceresi ister.',
          messageLabel: 'Mesaj (yer tutucular: {name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl}, {groupLink})',
          bulkSend: 'Toplu gönder',
          sequentialSend: 'Sırayla aç',
          oneByOne: 'Tek tek aç (liste)',
          openLink: 'Aç',
          advanced: 'Grup linkleri ve şablon',
          groupLinksHint: 'Grup sohbetine yönlendirmek istersen bağlantıları doldur; mesajda {groupLink} kullan.',
          whatsappGroup: 'WhatsApp grup davet linki',
          telegramGroup: 'Telegram grup linki',
          templateLabel: 'Mesaj şablonu',
          saveAsTemplate: 'Metni şablon kaydet',
          historyTitle: 'Son gönderimler',
          noHistory: 'Bu etkinlik için geçmiş yok.',
          selectedCount: 'kişi',
          recipientCount: (n: number) => `Alıcı: ${n} kişi (kaydedilen katılımcı listesi).`,
          cancel: 'Kapat',
          addedToEvent: 'kayıt güncellendi.',
          sentTo: 'gönderim penceresi hazır',
          noCompatibleContacts: 'Bu kanal için uygun telefon, e-posta veya paylaşım yolu yok.',
        },
        delete: 'Etkinliği Sil',
        attendees: 'Katılımcılar',
        attendeesEmpty: 'Henüz katılımcı eklenmedi.',
        manageHint: 'Etkinliği düzenle, davet gönder veya gerekirse akıştan kaldır.',
        openMeeting: 'Toplantıyı Aç',
        openMap: 'Haritada Aç',
        viewContacts: 'Katılımcı Ekle',
        createDescription: 'Yeni bir sunum, egitim veya ekip bulusmasi planla.',
      }
    : {
        details: 'Details',
        invite: 'Notify participants',
        sendBlockedHint: 'Save your changes to the event fields and attendee list with “Save changes” before opening invitations.',
        sendModal: {
          title: 'Send to participants',
          description: 'Send the same invitation message to saved attendees, or use Open next to a name to send one at a time.',
          sendChannel: 'Channel',
          channelHint: 'WhatsApp and SMS need a phone number, email needs an address, Telegram opens a share flow.',
          messageLabel: 'Message (placeholders: {name}, {eventTitle}, {date}, {time}, {location}, {meetingUrl}, {groupLink})',
          bulkSend: 'Bulk send',
          sequentialSend: 'Open in sequence',
          oneByOne: 'Open one by one',
          openLink: 'Open',
          advanced: 'Group links and templates',
          groupLinksHint: 'Optional group invite links; use {groupLink} in the message.',
          whatsappGroup: 'WhatsApp group invite link',
          telegramGroup: 'Telegram group link',
          templateLabel: 'Message template',
          saveAsTemplate: 'Save text as template',
          historyTitle: 'Recent sends',
          noHistory: 'No send history for this event.',
          selectedCount: 'recipients',
          recipientCount: (n: number) => `Recipients: ${n} (saved list).`,
          cancel: 'Close',
          addedToEvent: 'records updated.',
          sentTo: 'delivery window ready',
          noCompatibleContacts: 'No phone, email, or share path for this channel.',
        },
        delete: 'Delete Event',
        attendees: 'Attendees',
        attendeesEmpty: 'No attendees added yet.',
        manageHint: 'Update the event, send invitations, or remove it from the flow.',
        openMeeting: 'Open Meeting',
        openMap: 'Open Map',
        viewContacts: 'Add participants',
        createDescription: 'Plan a new presentation, training, or team session.',
      }

  const attendeesDirty = useMemo(() => {
    if (!activeEvent) return false
    const a = activeEvent.attendees
      .map((x) => x.contactId)
      .sort()
      .join(',')
    const b = [...pendingAttendeeIds].sort().join(',')
    return a !== b
  }, [activeEvent, pendingAttendeeIds])

  const formDirty = useMemo(() => {
    if (!activeEvent) return false
    const e = eventToForm(activeEvent)
    return (
      editForm.title !== e.title
      || editForm.description !== e.description
      || editForm.type !== e.type
      || editForm.startDate !== e.startDate
      || editForm.endDate !== e.endDate
      || editForm.location !== e.location
      || editForm.meetingUrl !== e.meetingUrl
      || editForm.maxAttendees !== e.maxAttendees
      || editForm.status !== e.status
    )
  }, [activeEvent, editForm])

  const sendBlocked = formDirty || attendeesDirty

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
    setPendingAttendeeIds(event.attendees.map((a) => a.contactId))
  }

  function closeDetailsModal() {
    setInviteOpen(false)
    setActiveEventId(null)
    setPendingAttendeeIds([])
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
      setPendingAttendeeIds(created.attendees.map((a) => a.contactId))
    }
  }

  async function saveEvent() {
    if (!activeEvent) return
    setSavingEvent(true)
    const fallback = locale === 'tr' ? 'Yeni Etkinlik' : 'New Event'
    try {
      await updateMutation.mutateAsync({
        id: activeEvent.id,
        input: formToInput(editForm, fallback),
      })

      const existingById = new Map(activeEvent.attendees.map((a) => [a.contactId, a]))
      const toRemove = activeEvent.attendees
        .filter((a) => !pendingAttendeeIds.includes(a.contactId))
        .map((a) => a.contactId)
      if (toRemove.length > 0) {
        await deleteEventAttendees(activeEvent.id, toRemove)
      }
      if (pendingAttendeeIds.length > 0) {
        const entries = pendingAttendeeIds.map((contactId) => {
          const contact = contacts.find((c) => c.id === contactId)
          const old = existingById.get(contactId)
          return {
            contact_id: contactId,
            contact_name: contact?.full_name ?? old?.name ?? (locale === 'tr' ? 'Bilinmiyor' : 'Unknown'),
            rsvp_status: old?.rsvpStatus ?? ('invited' as const),
            follow_up_status: old?.followUpStatus ?? ('pending' as const),
          }
        })
        await attendeesMutation.mutateAsync({ eventId: activeEvent.id, entries })
      }
      navigateBackIfNeeded()
    } finally {
      setSavingEvent(false)
    }
  }

  async function deleteEvent(eventId: string) {
    await deleteMutation.mutateAsync(eventId)
    setInviteOpen(false)
    setActiveEventId(null)
    navigateBackIfNeeded()
  }

  function openSendModal() {
    if (!activeEvent) return
    if (sendBlocked) return
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
          <h1 className="text-2xl font-bold text-text-primary">{h(t.events.title)}</h1>
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
                      variant="secondary"
                      className="border border-secondary/30 bg-secondary/15 text-secondary hover:bg-secondary/20"
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
        locale={locale}
        form={createForm}
        onFormChange={setCreateForm}
        title={t.events.createEvent}
        description={labels.createDescription}
        labels={fieldLabels}
        meetingComboboxLabels={meetingComboboxLabels}
        locationSearchLabels={locationSearchLabels}
        eventTypeLabel={eventTypeLabel}
        onSubmit={createEvent}
        isSubmitting={createMutation.isPending}
        cancelLabel={t.common.cancel}
        submitLabel={t.common.create}
      />

      <EventDetailsModal
        key={activeEventId ?? 'closed'}
        open={Boolean(activeEvent)}
        onClose={closeDetailsModal}
        locale={locale}
        event={activeEvent}
        contacts={contacts}
        form={editForm}
        onFormChange={setEditForm}
        selectedAttendeeIds={pendingAttendeeIds}
        onSelectedAttendeeIdsChange={setPendingAttendeeIds}
        onRequestSend={openSendModal}
        sendBlocked={sendBlocked}
        sendBlockedMessage={labels.sendBlockedHint}
        labels={{
          ...fieldLabels,
          manageHint: labels.manageHint,
          attendees: labels.attendees,
          attendeesEmpty: labels.attendeesEmpty,
          invite: labels.invite,
          openMeeting: labels.openMeeting,
          openMap: labels.openMap,
          viewContacts: labels.viewContacts,
          sendBlockedHint: labels.sendBlockedHint,
          delete: labels.delete,
          cancel: t.common.cancel,
          saveChanges: t.common.saveChanges,
          pickerLabels: locale === 'tr' ? trPicker : enPicker,
          meetingCombobox: meetingComboboxLabels,
          locationSearch: locationSearchLabels,
          stepParticipantsNext: locale === 'tr' ? 'Katılımcı Ekle' : 'Add participants',
          stepParticipantsBack: locale === 'tr' ? 'Geri' : 'Back',
          stepParticipantsHint: locale === 'tr'
            ? 'Katılımcıları düzenleyin, davet gönderin veya toplantıyı açın; bitince “Değişiklikleri Kaydet”e basın.'
            : 'Manage attendees, send invites, or open the meeting; then tap “Save changes”.',
        }}
        eventTypeLabel={eventTypeLabel}
        eventStatusLabel={eventStatusLabel}
        onSave={saveEvent}
        onDelete={deleteEvent}
        isSaving={savingEvent || updateMutation.isPending || attendeesMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <EventInviteSendModal
        key={`${activeEvent?.id ?? 'e'}-${String(inviteOpen)}`}
        open={inviteOpen && Boolean(activeEvent)}
        onClose={() => setInviteOpen(false)}
        event={activeEvent}
        contacts={contacts}
        recipientIds={pendingAttendeeIds}
        locale={locale}
        labels={{
          title: labels.sendModal.title,
          description: labels.sendModal.description,
          sendChannel: labels.sendModal.sendChannel,
          channelHint: labels.sendModal.channelHint,
          messageLabel: labels.sendModal.messageLabel,
          bulkSend: labels.sendModal.bulkSend,
          sequentialSend: labels.sendModal.sequentialSend,
          oneByOne: labels.sendModal.oneByOne,
          openLink: labels.sendModal.openLink,
          advanced: labels.sendModal.advanced,
          groupLinksHint: labels.sendModal.groupLinksHint,
          whatsappGroup: labels.sendModal.whatsappGroup,
          telegramGroup: labels.sendModal.telegramGroup,
          templateLabel: labels.sendModal.templateLabel,
          saveAsTemplate: labels.sendModal.saveAsTemplate,
          historyTitle: labels.sendModal.historyTitle,
          noHistory: labels.sendModal.noHistory,
          selectedCount: labels.sendModal.selectedCount,
          recipientCount: labels.sendModal.recipientCount,
          cancel: labels.sendModal.cancel,
          addedToEvent: labels.sendModal.addedToEvent,
          sentTo: labels.sendModal.sentTo,
          noCompatibleContacts: labels.sendModal.noCompatibleContacts,
        }}
        isSyncing={attendeesMutation.isPending}
        onSyncAttendees={syncInvitedContacts}
      />
    </motion.div>
  )
}
