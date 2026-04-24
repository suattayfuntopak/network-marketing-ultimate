'use client'

import { Fragment, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventParticipantPicker, type EventParticipantPickerLabels } from '@/components/events/EventParticipantPicker'
import { EventLocationSearch, type EventLocationSearchLabels } from '@/components/events/EventLocationSearch'
import { EventMeetingUrlCombobox, type EventMeetingUrlComboboxLabels } from '@/components/events/EventMeetingUrlCombobox'
import { EVENT_TYPE_KEY, type EventFieldLabels, type EventFormShape } from '@/components/events/eventForm'
import type { Event } from '@/types'
import type { ContactRow } from '@/lib/queries'
import { ArrowRight, ChevronDown, MapPin, Trash2, UserPlus, Users, Video } from 'lucide-react'
import type { InviteChannel } from '@/components/events/eventInviteUtils'

export interface EventDetailsLabels extends EventFieldLabels {
  manageHint: string
  attendees: string
  attendeesEmpty: string
  invite: string
  openMeeting: string
  openMap: string
  viewContacts: string
  sendIntro: string
  delete: string
  cancel: string
  sendNow: string
  pickerLabels: EventParticipantPickerLabels
  meetingCombobox: EventMeetingUrlComboboxLabels
  locationSearch: EventLocationSearchLabels
  stepParticipantsNext: string
  stepParticipantsBack: string
  stepParticipantsHint: string
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
  onProceedSend: (channel: InviteChannel) => void
  onDelete: (eventId: string) => void
  selectedAttendeeIds: string[]
  onSelectedAttendeeIdsChange: (ids: string[]) => void
  isSaving: boolean
  isDeleting: boolean
  initialStep?: 1 | 2
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
  onProceedSend,
  onDelete,
  selectedAttendeeIds,
  onSelectedAttendeeIdsChange,
  isSaving,
  isDeleting,
  initialStep = 1,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(initialStep)
  const [sendMenuOpen, setSendMenuOpen] = useState(false)

  function attendeesSummary(names: string[]) {
    if (names.length <= 4) return names.join(', ')
    const visible = names.slice(0, 4).join(', ')
    return `${visible} + ${names.length - 4} kişi daha`
  }

  function resolveAttendeeName(contactId: string, fallback: string) {
    return contacts.find((contact) => contact.id === contactId)?.full_name ?? fallback
  }

  const attendeeNames = selectedAttendeeIds.map((id) => resolveAttendeeName(id, id))
  const hasPhoneRecipient = selectedAttendeeIds.some((id) => {
    const row = contacts.find((c) => c.id === id)
    return (row?.phone?.replace(/\D/g, '').length ?? 0) > 0
  })

  const sendOptions: Array<{ id: InviteChannel | 'instagram'; label: string; iconUrl?: string; disabled?: boolean }> = [
    { id: 'whatsapp', label: 'WhatsApp', iconUrl: 'https://cdn.simpleicons.org/whatsapp/25D366' },
    { id: 'telegram', label: 'Telegram', iconUrl: 'https://cdn.simpleicons.org/telegram/26A5E4' },
    { id: 'email', label: locale === 'tr' ? 'E-posta' : 'Email', iconUrl: 'https://cdn.simpleicons.org/gmail/EA4335' },
    { id: 'sms', label: 'SMS', disabled: !hasPhoneRecipient },
    { id: 'instagram', label: 'Instagram', iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F', disabled: true },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event?.title}
      description={event ? (step === 1 ? labels.manageHint : labels.stepParticipantsHint) : undefined}
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
              <EventLocationSearch
                value={form.location}
                onChange={(next) => onFormChange((current) => ({ ...current, location: next }))}
                locale={locale}
                labels={labels.locationSearch}
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
              <EventMeetingUrlCombobox
                value={form.meetingUrl}
                onChange={(next) => onFormChange((current) => ({ ...current, meetingUrl: next }))}
                labels={labels.meetingCombobox}
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

          {step === 1 && (
          <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="danger" size="sm" onClick={() => onDelete(event.id)} disabled={isDeleting}>
              <Trash2 className="w-3.5 h-3.5" /> {labels.delete}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>{labels.cancel}</Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {labels.stepParticipantsNext}
              </Button>
            </div>
          </div>
          )}

          {step === 2 && (
          <Fragment>
            <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <Users className="w-4 h-4 text-primary" />
                  {labels.attendees}
                  <Badge size="sm" variant="default">{selectedAttendeeIds.length}</Badge>
                </div>
              </div>
              {labels.sendIntro ? <p className="text-[11px] text-text-tertiary mb-2">{labels.sendIntro}</p> : null}
              <div className="flex flex-wrap gap-2">
                {attendeeNames.length > 0 ? (
                  <p className="text-sm text-text-secondary">{attendeesSummary(attendeeNames)}</p>
                ) : (
                  <p className="text-sm text-text-tertiary">{labels.attendeesEmpty}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.meetingUrl.trim() && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(form.meetingUrl, '_blank', 'noopener,noreferrer')}
                >
                  <Video className="w-3.5 h-3.5" /> {labels.openMeeting}
                </Button>
              )}
              {form.location.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location.trim())}`, '_blank', 'noopener,noreferrer')}
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
                  // picker içindeki gönder butonu bu akışta kullanılmıyor
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
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>{labels.stepParticipantsBack}</Button>
                <Button type="button" variant="ghost" onClick={onClose}>{labels.cancel}</Button>
                <div className="relative">
                  <Button
                    type="button"
                    onClick={() => setSendMenuOpen((v) => !v)}
                    disabled={isSaving}
                    iconRight={<ChevronDown className="w-3.5 h-3.5" />}
                  >
                    {labels.sendNow}
                  </Button>
                  {sendMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-1 w-56 overflow-hidden rounded-3xl border border-border bg-card py-2 shadow-xl z-20">
                      {sendOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={opt.disabled}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text-primary transition enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-text-tertiary/60"
                          onClick={() => {
                            if (opt.disabled || opt.id === 'instagram') return
                            setSendMenuOpen(false)
                            onProceedSend(opt.id as InviteChannel)
                          }}
                        >
                          {opt.iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={opt.iconUrl} alt="" className="h-5 w-5 shrink-0" width={20} height={20} />
                          ) : (
                            <span className="h-5 w-5 shrink-0 rounded border border-cyan-500/60" />
                          )}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Fragment>
          )}
        </div>
      )}
    </Modal>
  )
}
