'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventParticipantPicker, type EventParticipantPickerLabels } from '@/components/events/EventParticipantPicker'
import { EVENT_TYPE_KEY, type EventFieldLabels, type EventFormShape } from '@/components/events/eventForm'
import type { Event } from '@/types'
import type { ContactRow } from '@/lib/queries'
import { MapPin, Send, Trash2, UserPlus, Users, Video } from 'lucide-react'

export interface EventDetailsLabels extends EventFieldLabels {
  manageHint: string
  attendees: string
  attendeesEmpty: string
  invite: string
  openMeeting: string
  openMap: string
  viewContacts: string
  sendBlockedHint: string
  delete: string
  cancel: string
  saveChanges: string
  pickerLabels: EventParticipantPickerLabels
}

interface Props {
  open: boolean
  onClose: () => void
  locale: 'tr' | 'en'
  event: Event | null
  contacts: ContactRow[]
  form: EventFormShape
  onFormChange: (updater: (current: EventFormShape) => EventFormShape) => void
  labels: EventDetailsLabels
  eventTypeLabel: (type: string) => string
  eventStatusLabel: (status: Event['status']) => string
  onSave: () => void
  onDelete: (eventId: string) => void
  onRequestSend: () => void
  sendBlocked: boolean
  sendBlockedMessage?: string
  selectedAttendeeIds: string[]
  onSelectedAttendeeIdsChange: (ids: string[]) => void
  isSaving: boolean
  isDeleting: boolean
}

export function EventDetailsModal({
  open,
  onClose,
  locale,
  event,
  contacts,
  form,
  onFormChange,
  labels,
  eventTypeLabel,
  eventStatusLabel,
  onSave,
  onDelete,
  onRequestSend,
  sendBlocked,
  sendBlockedMessage,
  selectedAttendeeIds,
  onSelectedAttendeeIdsChange,
  isSaving,
  isDeleting,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)

  function attendeesSummary(names: string[]) {
    if (names.length <= 4) return names.join(', ')
    const visible = names.slice(0, 4).join(', ')
    return `${visible} + ${names.length - 4} kişi daha`
  }

  function resolveAttendeeName(contactId: string, fallback: string) {
    return contacts.find((contact) => contact.id === contactId)?.full_name ?? fallback
  }

  const attendeeNames = selectedAttendeeIds.map((id) => resolveAttendeeName(id, id))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event?.title}
      description={event ? labels.manageHint : undefined}
    >
      {event && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.eventName}</span>
              <input
                value={form.title}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, title: changeEvent.target.value }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.status}</span>
              <select
                value={form.status}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, status: changeEvent.target.value as Event['status'] }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {(['draft', 'published', 'live', 'completed', 'cancelled'] as Event['status'][]).map((status) => (
                  <option key={status} value={status}>{eventStatusLabel(status)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.type}</span>
              <select
                value={form.type}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, type: changeEvent.target.value as Event['type'] }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              >
                {Object.keys(EVENT_TYPE_KEY).map((type) => (
                  <option key={type} value={type}>{eventTypeLabel(type)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.location}</span>
              <input
                value={form.location}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, location: changeEvent.target.value }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.start}</span>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, startDate: changeEvent.target.value }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">{labels.end}</span>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, endDate: changeEvent.target.value }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-text-secondary">{labels.meetingUrl}</span>
              <input
                value={form.meetingUrl}
                onChange={(changeEvent) => onFormChange((current) => ({ ...current, meetingUrl: changeEvent.target.value }))}
                className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-text-secondary">{labels.description}</span>
            <textarea
              value={form.description}
              onChange={(changeEvent) => onFormChange((current) => ({ ...current, description: changeEvent.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50"
            />
          </label>

          <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Users className="w-4 h-4 text-primary" />
                {labels.attendees}
                <Badge size="sm" variant="default">{selectedAttendeeIds.length}</Badge>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={onRequestSend}
                disabled={sendBlocked}
                title={sendBlocked ? sendBlockedMessage : undefined}
              >
                {labels.invite}
              </Button>
            </div>
            {sendBlocked && (
              <p className="text-[11px] text-warning mb-2">{labels.sendBlockedHint}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {attendeeNames.length > 0 ? (
                <p className="text-sm text-text-secondary">{attendeesSummary(attendeeNames)}</p>
              ) : (
                <p className="text-sm text-text-tertiary">{labels.attendeesEmpty}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {event.meetingUrl && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.open(event.meetingUrl, '_blank', 'noopener,noreferrer')}
              >
                <Video className="w-3.5 h-3.5" /> {labels.openMeeting}
              </Button>
            )}
            {event.location && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location ?? '')}`, '_blank', 'noopener,noreferrer')}
              >
                <MapPin className="w-3.5 h-3.5" /> {labels.openMap}
              </Button>
            )}
            <EventParticipantPicker
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              contacts={contacts}
              selectedIds={selectedAttendeeIds}
              onSelectedIdsChange={onSelectedAttendeeIdsChange}
              locale={locale}
              disabled={false}
              onRequestSend={() => {
                onRequestSend()
              }}
              renderTrigger={(toggle) => (
                <Button type="button" variant="ghost" size="sm" onClick={toggle} icon={<UserPlus className="w-3.5 h-3.5" />}>
                  {labels.viewContacts}
                </Button>
              )}
              labels={labels.pickerLabels}
            />
          </div>

          <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="danger" size="sm" onClick={() => onDelete(event.id)} disabled={isDeleting}>
              <Trash2 className="w-3.5 h-3.5" /> {labels.delete}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>{labels.cancel}</Button>
              <Button type="button" onClick={onSave} disabled={isSaving}>{labels.saveChanges}</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
