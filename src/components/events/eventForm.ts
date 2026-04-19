import type { EventInput } from '@/lib/queries'
import type { Event } from '@/types'

export type EventFormShape = {
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

export const eventTypeColors: Record<string, string> = {
  online_presentation: 'bg-primary/15 text-primary',
  home_meeting: 'bg-success/15 text-success',
  team_zoom: 'bg-secondary/15 text-secondary',
  training: 'bg-warning/15 text-warning',
  workshop: 'bg-accent/15 text-accent',
  local: 'bg-emerald-500/15 text-emerald-400',
  regional: 'bg-amber-500/15 text-amber-400',
  global: 'bg-rose-500/15 text-rose-400',
}

export const EVENT_TYPE_KEY: Record<string, string> = {
  online_presentation: 'onlinePresentation',
  home_meeting: 'homeMeeting',
  team_zoom: 'teamZoom',
  training: 'training',
  workshop: 'workshop',
  local: 'local',
  regional: 'regional',
  global: 'global',
}

export const blankEvent: EventFormShape = {
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

export function isoToInputDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 16)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function inputToIso(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

export function buildDateTime(date: string, hours: number, minutes: number) {
  return `${date}T${pad(hours)}:${pad(minutes)}`
}

export function eventPrefillFromDate(date?: string): Partial<EventFormShape> | undefined {
  if (!date) return undefined
  return {
    startDate: buildDateTime(date, 20, 0),
    endDate: buildDateTime(date, 21, 0),
  }
}

export function formToInput(form: EventFormShape, fallbackTitle: string): EventInput {
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

export function eventToForm(event: Event): EventFormShape {
  return {
    title: event.title,
    description: event.description,
    type: event.type,
    startDate: isoToInputDateTime(event.startDate),
    endDate: isoToInputDateTime(event.endDate),
    location: event.location ?? '',
    meetingUrl: event.meetingUrl ?? '',
    maxAttendees: event.maxAttendees ?? 25,
    status: event.status,
  }
}

export interface EventFieldLabels {
  eventName: string
  status: string
  type: string
  start: string
  end: string
  location: string
  meetingUrl: string
  description: string
}
