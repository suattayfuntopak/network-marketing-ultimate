'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EVENT_TYPE_KEY, type EventFieldLabels, type EventFormShape } from '@/components/events/eventForm'
import type { Event } from '@/types'
import type { ContactRow } from '@/lib/queries'
import { MapPin, Send, Trash2, Users, Video } from 'lucide-react'

export interface EventDetailsLabels extends EventFieldLabels {
  manageHint: string
  attendees: string
  attendeesEmpty: string
  invite: string
  openMeeting: string
  openMap: string
  viewContacts: string
  delete: string
  cancel: string
  saveChanges: string
}

interface Props {
  open: boolean
  onClose: () => void
  event: Event | null
  contacts: ContactRow[]
  form: EventFormShape
  onFormChange: (updater: (current: EventFormShape) => EventFormShape) => void
  labels: EventDetailsLabels
  eventTypeLabel: (type: string) => string
  eventStatusLabel: (status: Event['status']) => string
  onSave: () => void
  onDelete: (eventId: string) => void
  onOpenInvite: () => void
  onOpenContacts: () => void
  isSaving: boolean
  isDeleting: boolean
}

export function EventDetailsModal({
  open,
  onClose,
  event,
  contacts,
  form,
  onFormChange,
  labels,
  eventTypeLabel,
  eventStatusLabel,
  onSave,
  onDelete,
  onOpenInvite,
  onOpenContacts,
  isSaving,
  isDeleting,
}: Props) {
  function attendeesSummary(names: string[]) {
    if (names.length <= 4) return names.join(', ')
    const visible = names.slice(0, 4).join(', ')
    return `${visible} + ${names.length - 4} kişi daha`
  }

  function resolveAttendeeName(contactId: string, fallback: string) {
    return contacts.find((contact) => contact.id === contactId)?.full_name ?? fallback
  }

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
                <Badge size="sm" variant="default">{event.attendees.length}</Badge>
              </div>
              <Button type="button" size="sm" variant="outline" icon={<Send className="w-3.5 h-3.5" />} onClick={onOpenInvite}>
                {labels.invite}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {event.attendees.length > 0 ? (
                <p className="text-sm text-text-secondary">
                  {attendeesSummary(event.attendees.map((attendee) => resolveAttendeeName(attendee.contactId, attendee.name)))}
                </p>
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
            <Button type="button" variant="ghost" size="sm" onClick={onOpenContacts}>
              <Users className="w-3.5 h-3.5" /> {labels.viewContacts}
            </Button>
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
