'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventLocationSearch, type EventLocationSearchLabels } from '@/components/events/EventLocationSearch'
import { EventMeetingUrlCombobox, type EventMeetingUrlComboboxLabels } from '@/components/events/EventMeetingUrlCombobox'
import { EVENT_TYPE_KEY, type EventFieldLabels, type EventFormShape } from '@/components/events/eventForm'
import type { Event } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  locale: 'tr' | 'en'
  form: EventFormShape
  onFormChange: (updater: (current: EventFormShape) => EventFormShape) => void
  title: string
  description: string
  labels: EventFieldLabels
  meetingComboboxLabels: EventMeetingUrlComboboxLabels
  locationSearchLabels: EventLocationSearchLabels
  eventTypeLabel: (type: string) => string
  onSubmit: () => void
  isSubmitting: boolean
  cancelLabel: string
  submitLabel: string
}

export function EventCreateModal({
  open,
  onClose,
  locale,
  form,
  onFormChange,
  title,
  description,
  labels,
  meetingComboboxLabels,
  locationSearchLabels,
  eventTypeLabel,
  onSubmit,
  isSubmitting,
  cancelLabel,
  submitLabel,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{labels.eventName}</span>
            <input
              value={form.title}
              onChange={(event) => onFormChange((current) => ({ ...current, title: event.target.value }))}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{labels.type}</span>
            <select
              value={form.type}
              onChange={(event) => onFormChange((current) => ({ ...current, type: event.target.value as Event['type'] }))}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
            >
              {Object.keys(EVENT_TYPE_KEY).map((type) => (
                <option key={type} value={type}>{eventTypeLabel(type)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{labels.start}</span>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(event) => onFormChange((current) => ({ ...current, startDate: event.target.value }))}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{labels.end}</span>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(event) => onFormChange((current) => ({ ...current, endDate: event.target.value }))}
              className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{labels.location}</span>
            <EventLocationSearch
              value={form.location}
              onChange={(next) => onFormChange((current) => ({ ...current, location: next }))}
              locale={locale}
              labels={locationSearchLabels}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-text-secondary">{labels.meetingUrl}</span>
            <EventMeetingUrlCombobox
              value={form.meetingUrl}
              onChange={(next) => onFormChange((current) => ({ ...current, meetingUrl: next }))}
              labels={meetingComboboxLabels}
            />
          </label>
        </div>
        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-text-secondary">{labels.description}</span>
          <textarea
            value={form.description}
            onChange={(event) => onFormChange((current) => ({ ...current, description: event.target.value }))}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm text-text-primary outline-none focus:border-primary/50"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>{submitLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
