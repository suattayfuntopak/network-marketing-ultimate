// ============================================================
// NMOS — Supabase Query Functions
// ============================================================
import { supabase } from './supabase'
import type { Database } from './database.types'
import type { Event, EventAttendee } from '@/types'
import { CONTACT_ACTIVITY_LOG_CHANNEL, serializeContactActivity } from './contactActivityLog'
import type { ContactActivityPayload } from './contactActivityLog'

export type ContactRow = Database['public']['Tables']['nmu_contacts']['Row']
export type CustomerRegistryRow = Database['public']['Tables']['nmu_customers']['Row']
export type TaskRow = Database['public']['Tables']['nmu_tasks']['Row']
export type InteractionRow = Database['public']['Tables']['nmu_interactions']['Row']
export type ProductRow = Database['public']['Tables']['nmu_products']['Row']
export type OrderRow = Database['public']['Tables']['nmu_orders']['Row']
export type EventRow = Database['public']['Tables']['nmu_events']['Row']
export type EventAttendeeRow = Database['public']['Tables']['nmu_event_attendees']['Row']
export type UserProfileRow = Database['public']['Tables']['nmu_user_profiles']['Row']
export type AiRateLimitRow = Database['public']['Tables']['nmu_ai_rate_limits']['Row']

async function requireSessionUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  const userId = session?.user?.id
  if (!userId) {
    throw new Error('User session not found.')
  }

  return userId
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String(error.code) : ''
  const message = 'message' in error ? String(error.message) : ''
  return code === '42P01' || message.toLowerCase().includes('nmu_customers')
}

async function syncCustomerRegistry(userId: string, contactId: string, stage: string | null | undefined): Promise<void> {
  try {
    if (stage === 'became_customer') {
      const { error } = await supabase
        .from('nmu_customers')
        .upsert(
          {
            user_id: userId,
            contact_id: contactId,
            is_active: true,
            became_customer_at: new Date().toISOString(),
            left_customer_at: null,
          },
          { onConflict: 'user_id,contact_id' },
        )
      if (error) throw error
      return
    }

    const { error } = await supabase
      .from('nmu_customers')
      .update({
        is_active: false,
        left_customer_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('contact_id', contactId)
      .eq('is_active', true)
    if (error) throw error
  } catch (error) {
    // Backward compatibility: workspace may still use only nmu_contacts stage.
    if (isMissingRelationError(error)) return
    throw error
  }
}

function normalizeTaskStatus(task: TaskRow): TaskRow {
  if (task.status === 'completed' || task.status === 'skipped') {
    return task
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueDate = new Date(task.due_date)
  dueDate.setHours(0, 0, 0, 0)

  if (dueDate < today) {
    return { ...task, status: 'overdue' }
  }

  return task
}

// ─── PRODUCT ──────────────────────────────────────────────────

export async function fetchProducts(): Promise<ProductRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProductRow[]
}

export async function addProduct(
  userId: string,
  input: {
    name: string
    category: string
    description: string
    price_try: number
    image_url?: string | null
    tags?: string[]
    reorder_cycle_days?: number
  }
): Promise<ProductRow> {
  const { data, error } = await supabase
    .from('nmu_products')
    .insert({
      user_id: userId,
      name: input.name,
      category: input.category,
      description: input.description,
      price_try: input.price_try,
      image_url: input.image_url ?? null,
      tags: input.tags ?? [],
      reorder_cycle_days: input.reorder_cycle_days ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as ProductRow
}

export async function updateProduct(
  id: string,
  input: Partial<{
    name: string
    category: string
    description: string
    price_try: number
    image_url: string | null
    tags: string[]
    reorder_cycle_days: number | null
  }>
): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_products')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteProduct(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_products')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

// ─── CONTACTS ────────────────────────────────────────────────

export async function fetchContacts(): Promise<ContactRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ContactRow[]
}

export async function fetchCustomerContactIds(): Promise<string[] | null> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_customers')
    .select('contact_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('became_customer_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }

  return (data ?? []).map((row) => row.contact_id)
}

function clampTemperatureScore(value: number) {
  if (Number.isNaN(value)) return 50
  return Math.min(100, Math.max(0, Math.round(value)))
}

function temperatureToDefaultScore(temperature: ContactRow['temperature']) {
  switch (temperature) {
    case 'frozen':
      return 12
    case 'cold':
      return 32
    case 'warm':
      return 56
    case 'hot':
      return 88
    default:
      return 40
  }
}

/** Maps 0–100 slider to legacy temperature enum for filters and badges. */
export function temperatureFromScore(score: number): ContactRow['temperature'] {
  const s = clampTemperatureScore(score)
  if (s <= 20) return 'frozen'
  if (s <= 40) return 'cold'
  if (s <= 65) return 'warm'
  return 'hot'
}

function normalizeSocialHandle(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.replace(/^@+/, '')
}

function normalizeBirthday(value: string | null | undefined) {
  const v = value?.trim()
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  return null
}

export type AddContactInput = {
  full_name: string
  phone?: string | null
  email?: string | null
  location?: string | null
  profession?: string | null
  nickname?: string | null
  telegram_username?: string | null
  instagram_username?: string | null
  whatsapp_username?: string | null
  interests?: string | null
  pain_points?: string | null
  relationship_type?: string | null
  birthday?: string | null
  family_notes?: string | null
  goals_notes?: string | null
  tags?: string[] | null
  temperature?: ContactRow['temperature'] | null
  temperature_score?: number | null
  interest_type?: ContactRow['interest_type']
  source?: string | null
  pipeline_stage?: string | null
}

function contactFieldsFromAddInput(input: AddContactInput) {
  const explicitTemperature = input.temperature ?? undefined
  const hasScore = typeof input.temperature_score === 'number' && !Number.isNaN(input.temperature_score)
  const score = hasScore
    ? clampTemperatureScore(input.temperature_score!)
    : temperatureToDefaultScore((explicitTemperature ?? 'cold') as ContactRow['temperature'])
  const temperature = explicitTemperature ?? temperatureFromScore(score)

  const tags = input.tags?.filter(Boolean) ?? []

  return {
    full_name: input.full_name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    location: input.location?.trim() || null,
    profession: input.profession?.trim() || null,
    nickname: input.nickname?.trim() || null,
    telegram_username: normalizeSocialHandle(input.telegram_username),
    instagram_username: normalizeSocialHandle(input.instagram_username),
    whatsapp_username: normalizeSocialHandle(input.whatsapp_username),
    interests: input.interests?.trim() || null,
    pain_points: input.pain_points?.trim() || null,
    relationship_type: input.relationship_type?.trim() || null,
    birthday: normalizeBirthday(input.birthday ?? undefined),
    family_notes: input.family_notes?.trim() || null,
    goals_notes: input.goals_notes?.trim() || null,
    tags,
    temperature,
    temperature_score: score,
    interest_type: input.interest_type ?? 'unknown',
    source: (input.source?.trim() ?? '') || '',
    pipeline_stage: input.pipeline_stage ?? 'new',
  }
}

export async function addContact(userId: string, input: AddContactInput): Promise<ContactRow> {
  const { data, error } = await supabase
    .from('nmu_contacts')
    .insert({
      user_id: userId,
      ...contactFieldsFromAddInput(input),
    })
    .select()
    .single()
  if (error) throw error
  await syncCustomerRegistry(userId, data.id, data.pipeline_stage)
  return data as ContactRow
}

export async function updateContactRecord(id: string, input: AddContactInput): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_contacts')
    .update(contactFieldsFromAddInput(input))
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
  await syncCustomerRegistry(userId, id, input.pipeline_stage ?? null)
  await addContactActivityLog(userId, id, { kind: 'profile_updated' })
}

export async function patchContact(id: string, patch: Database['public']['Tables']['nmu_contacts']['Update']): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase.from('nmu_contacts').update(patch).eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export async function deleteContact(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function updateContactStage(id: string, stage: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_contacts')
    .update({ pipeline_stage: stage })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
  await syncCustomerRegistry(userId, id, stage)
}

export async function updateContactTemperature(
  id: string,
  temperature: 'cold' | 'warm' | 'hot' | 'frozen'
): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_contacts')
    .update({ temperature })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function fetchAllInteractions(): Promise<InteractionRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as InteractionRow[]
}

export async function fetchInteractionsByContact(contactId: string): Promise<InteractionRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as InteractionRow[]
}

export async function updateInteraction(
  id: string,
  input: Partial<{
    content: string
    outcome: InteractionRow['outcome'] | null
    next_action: string | null
  }>
): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_interactions')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteInteraction(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_interactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteInteractionsByContact(contactId: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_interactions')
    .delete()
    .eq('contact_id', contactId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function addContactActivityLog(
  userId: string,
  contactId: string,
  payload: ContactActivityPayload,
): Promise<void> {
  await addInteraction(
    userId,
    {
      contact_id: contactId,
      type: 'note',
      channel: CONTACT_ACTIVITY_LOG_CHANNEL,
      content: serializeContactActivity(payload),
      date: new Date().toISOString(),
    },
    { skipContactTouch: true },
  )
}

export async function addInteraction(
  userId: string,
  input: {
    contact_id: string
    type: InteractionRow['type']
    channel?: string
    content: string
    outcome?: InteractionRow['outcome']
    next_action?: string
    date?: string
    duration_minutes?: number
    next_follow_up_date?: string
  },
  options?: { skipContactTouch?: boolean },
): Promise<InteractionRow> {
  const interactionDate = input.date ?? new Date().toISOString()

  const { data, error } = await supabase
    .from('nmu_interactions')
    .insert({
      user_id: userId,
      contact_id: input.contact_id,
      type: input.type,
      channel: input.channel ?? 'manual',
      content: input.content,
      outcome: input.outcome ?? null,
      next_action: input.next_action ?? null,
      date: interactionDate,
      duration_minutes: input.duration_minutes ?? null,
    })
    .select()
    .single()

  if (error) throw error

  if (!options?.skipContactTouch) {
    const contactUpdate: Database['public']['Tables']['nmu_contacts']['Update'] = {
      last_contact_date: interactionDate,
    }

    if (input.next_follow_up_date !== undefined) {
      contactUpdate.next_follow_up_date = input.next_follow_up_date || null
    }

    const { error: contactError } = await supabase
      .from('nmu_contacts')
      .update(contactUpdate)
      .eq('id', input.contact_id)
      .eq('user_id', userId)

    if (contactError) throw contactError
  }

  return data as InteractionRow
}

// ─── TASKS ───────────────────────────────────────────────────

export async function fetchTasks(): Promise<TaskRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return ((data ?? []) as TaskRow[]).map(normalizeTaskStatus)
}

export async function fetchTasksByContact(contactId: string): Promise<TaskRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return ((data ?? []) as TaskRow[]).map(normalizeTaskStatus)
}

export async function addTask(
  userId: string,
  input: {
    title: string
    type: TaskRow['type']
    priority: TaskRow['priority']
    due_date: string
    description?: string
    contact_id?: string
  }
): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('nmu_tasks')
    .insert({
      user_id: userId,
      title: input.title,
      type: input.type,
      priority: input.priority,
      due_date: input.due_date,
      description: input.description ?? null,
      contact_id: input.contact_id ?? null,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  const inserted = data as TaskRow

  if (input.contact_id) {
    await addContactActivityLog(userId, input.contact_id, {
      kind: 'task_added',
      title: input.title,
    })
  }

  return inserted
}

export async function completeTask(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function setTaskStatus(
  id: string,
  status: TaskRow['status']
): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_tasks')
    .update({
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function updateTask(
  id: string,
  input: Partial<{
    title: string
    type: TaskRow['type']
    priority: TaskRow['priority']
    due_date: string
    description: string | null
    contact_id: string | null
    status: TaskRow['status']
  }>
): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_tasks')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

// ─── ORDERS ───────────────────────────────────────────────────

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price_try: number
}

export async function fetchOrdersByContact(contactId: string): Promise<OrderRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_orders')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('order_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function fetchAllOrders(): Promise<OrderRow[]> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_orders')
    .select('*')
    .eq('user_id', userId)
    .order('order_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function addOrder(
  userId: string,
  input: {
    contact_id: string
    items: OrderItem[]
    total_try: number
    status?: OrderRow['status']
    note?: string
    order_date?: string
    next_reorder_date?: string
  }
): Promise<OrderRow> {
  const { data, error } = await supabase
    .from('nmu_orders')
    .insert({
      user_id: userId,
      contact_id: input.contact_id,
      items: input.items,
      total_try: input.total_try,
      status: input.status ?? 'pending',
      note: input.note ?? null,
      order_date: input.order_date ?? new Date().toISOString().split('T')[0],
      next_reorder_date: input.next_reorder_date ?? null,
    })
    .select()
    .single()
  if (error) throw error
  await addContactActivityLog(userId, input.contact_id, {
    kind: 'order_added',
    totalTry: input.total_try,
    itemCount: input.items.length,
  })
  return data as OrderRow
}

export async function updateOrderStatus(id: string, status: OrderRow['status']): Promise<void> {
  const userId = await requireSessionUserId()
  const { data: existing, error: existingError } = await supabase
    .from('nmu_orders')
    .select('contact_id,status')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (existingError) throw existingError

  const { error } = await supabase
    .from('nmu_orders')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error

  if (existing.status !== status) {
    await addContactActivityLog(userId, existing.contact_id, {
      kind: 'order_status_changed',
      from: existing.status,
      to: status,
    })
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { data: existing, error: existingError } = await supabase
    .from('nmu_orders')
    .select('contact_id,total_try')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (existingError) throw existingError

  const { error } = await supabase
    .from('nmu_orders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error

  await addContactActivityLog(userId, existing.contact_id, {
    kind: 'order_deleted',
    totalTry: Number(existing.total_try) || 0,
  })
}

// ─── EVENTS ───────────────────────────────────────────────────

export type EventInput = {
  title: string
  description: string
  type: Event['type']
  start_date: string
  end_date: string
  location?: string | null
  meeting_url?: string | null
  max_attendees?: number | null
  status: Event['status']
}

function mapAttendeeRow(row: EventAttendeeRow): EventAttendee {
  return {
    contactId: row.contact_id,
    name: row.contact_name,
    rsvpStatus: row.rsvp_status,
    followUpStatus: row.follow_up_status,
  }
}

function mapEventRow(row: EventRow, attendees: EventAttendeeRow[]): Event {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    type: row.type as Event['type'],
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location ?? undefined,
    meetingUrl: row.meeting_url ?? undefined,
    maxAttendees: row.max_attendees ?? undefined,
    status: row.status,
    attendees: attendees
      .filter((attendee) => attendee.event_id === row.id)
      .map(mapAttendeeRow),
  }
}

export async function fetchEvents(): Promise<Event[]> {
  const userId = await requireSessionUserId()
  const { data: eventRows, error: eventsError } = await supabase
    .from('nmu_events')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
  if (eventsError) throw eventsError

  const rows = (eventRows ?? []) as EventRow[]
  if (rows.length === 0) return []

  const eventIds = rows.map((row) => row.id)
  const { data: attendeeRows, error: attendeesError } = await supabase
    .from('nmu_event_attendees')
    .select('*')
    .in('event_id', eventIds)
  if (attendeesError) throw attendeesError

  const attendees = (attendeeRows ?? []) as EventAttendeeRow[]
  return rows.map((row) => mapEventRow(row, attendees))
}

export async function createEvent(userId: string, input: EventInput): Promise<Event> {
  const { data, error } = await supabase
    .from('nmu_events')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      type: input.type,
      start_date: input.start_date,
      end_date: input.end_date,
      location: input.location ?? null,
      meeting_url: input.meeting_url ?? null,
      max_attendees: input.max_attendees ?? null,
      status: input.status,
    })
    .select()
    .single()
  if (error) throw error
  return mapEventRow(data as EventRow, [])
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>
): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_events')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function deleteEvent(id: string): Promise<void> {
  const userId = await requireSessionUserId()
  const { error } = await supabase
    .from('nmu_events')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function upsertEventAttendees(
  eventId: string,
  entries: {
    contact_id: string
    contact_name: string
    rsvp_status?: EventAttendeeRow['rsvp_status']
    follow_up_status?: EventAttendeeRow['follow_up_status']
  }[]
): Promise<void> {
  if (entries.length === 0) return
  const payload = entries.map((entry) => ({
    event_id: eventId,
    contact_id: entry.contact_id,
    contact_name: entry.contact_name,
    rsvp_status: entry.rsvp_status ?? 'invited',
    follow_up_status: entry.follow_up_status ?? 'pending',
  }))
  const { error } = await supabase
    .from('nmu_event_attendees')
    .upsert(payload, { onConflict: 'event_id,contact_id' })
  if (error) throw error
}

export async function deleteEventAttendees(eventId: string, contactIds: string[]): Promise<void> {
  if (contactIds.length === 0) return
  const userId = await requireSessionUserId()
  const { error: eventError } = await supabase
    .from('nmu_events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .single()
  if (eventError) throw eventError

  const { error } = await supabase
    .from('nmu_event_attendees')
    .delete()
    .eq('event_id', eventId)
    .in('contact_id', contactIds)
  if (error) throw error
}

// ─── USER PROFILE / AI USAGE / CUSTOMERS ──────────────────────

export async function fetchUserProfile(): Promise<UserProfileRow | null> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    if (isMissingRelationError(error)) return null
    throw error
  }
  return (data as UserProfileRow | null) ?? null
}

const AI_DAILY_LIMIT = 50

export interface AiRateLimitSummary {
  used: number
  limit: number
  remaining: number
  lastUsedAt: string | null
}

function aiDayWindow(reference: Date = new Date()) {
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export async function fetchAiRateLimitsToday(): Promise<AiRateLimitSummary> {
  const userId = await requireSessionUserId()
  const { startISO, endISO } = aiDayWindow()
  const { data, error } = await supabase
    .from('nmu_ai_rate_limits')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: false })
  if (error) {
    if (isMissingRelationError(error)) {
      return { used: 0, limit: AI_DAILY_LIMIT, remaining: AI_DAILY_LIMIT, lastUsedAt: null }
    }
    throw error
  }
  const rows = (data ?? []) as Array<Pick<AiRateLimitRow, 'id' | 'created_at'>>
  const used = rows.length
  return {
    used,
    limit: AI_DAILY_LIMIT,
    remaining: Math.max(0, AI_DAILY_LIMIT - used),
    lastUsedAt: rows[0]?.created_at ?? null,
  }
}

export interface AiUsagePoint {
  date: string
  count: number
}

export async function fetchAiUsageSeries(days = 14): Promise<AiUsagePoint[]> {
  const userId = await requireSessionUserId()
  const safeDays = Math.max(1, Math.floor(days))
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (safeDays - 1))
  const { data, error } = await supabase
    .from('nmu_ai_rate_limits')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: true })
  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }
  const rows = (data ?? []) as Array<Pick<AiRateLimitRow, 'created_at'>>
  const buckets = new Map<string, number>()
  for (let i = 0; i < safeDays; i += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    const key = day.toISOString().slice(0, 10)
    buckets.set(key, 0)
  }
  for (const row of rows) {
    const key = row.created_at.slice(0, 10)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, count]) => ({ date, count }))
}

export interface ActiveCustomersSummary {
  total: number
  newLast30: number
  customerIds: string[]
}

export async function fetchActiveCustomers(): Promise<ActiveCustomersSummary> {
  const userId = await requireSessionUserId()
  const { data, error } = await supabase
    .from('nmu_customers')
    .select('contact_id, became_customer_at, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) {
    if (isMissingRelationError(error)) return { total: 0, newLast30: 0, customerIds: [] }
    throw error
  }
  const rows = (data ?? []) as Array<Pick<CustomerRegistryRow, 'contact_id' | 'became_customer_at' | 'is_active'>>
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  let newLast30 = 0
  const customerIds: string[] = []
  for (const row of rows) {
    customerIds.push(row.contact_id)
    if (row.became_customer_at && new Date(row.became_customer_at).getTime() >= cutoff) {
      newLast30 += 1
    }
  }
  return { total: rows.length, newLast30, customerIds }
}

export interface ProductPerformanceItem {
  productId: string | null
  name: string
  units: number
  revenue: number
  reorderCycleDays: number | null
}

interface OrderItemSummary {
  product_id?: string | null
  product_name?: string | null
  name?: string | null
  quantity?: number | null
  unit_price_try?: number | null
  total_try?: number | null
  price_try?: number | null
  unitPrice?: number | null
}

export async function fetchProductPerformance(limit = 10): Promise<ProductPerformanceItem[]> {
  const [orders, products] = await Promise.all([fetchAllOrders(), fetchProducts()])
  const productMap = new Map<string, ProductRow>()
  for (const product of products) {
    productMap.set(product.id, product)
  }
  const aggregate = new Map<string, ProductPerformanceItem>()
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const items = Array.isArray(order.items) ? (order.items as OrderItemSummary[]) : []
    for (const raw of items) {
      const productId = raw.product_id ?? null
      const product = productId ? productMap.get(productId) ?? null : null
      const key = productId ?? `name:${(raw.product_name ?? raw.name ?? 'unknown').toLowerCase()}`
      const name = product?.name ?? raw.product_name ?? raw.name ?? 'Unknown product'
      const quantity = Number(raw.quantity ?? 0) || 0
      const unitPrice = Number(raw.unit_price_try ?? raw.price_try ?? raw.unitPrice ?? 0) || 0
      const lineRevenue = Number(raw.total_try ?? quantity * unitPrice) || 0
      const existing = aggregate.get(key)
      if (existing) {
        existing.units += quantity
        existing.revenue += lineRevenue
      } else {
        aggregate.set(key, {
          productId,
          name,
          units: quantity,
          revenue: lineRevenue,
          reorderCycleDays: product?.reorder_cycle_days ?? null,
        })
      }
    }
  }
  return Array.from(aggregate.values())
    .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
    .slice(0, Math.max(1, limit))
}

// ─── WAITLIST (LANDING) ──────────────────────────────────

const WAITLIST_EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export type WaitlistResult =
  | { status: 'ok' }
  | { status: 'duplicate' }
  | { status: 'invalid' }
  | { status: 'error'; message?: string }

export async function submitWaitlistEmail(input: {
  email: string
  source?: string
  locale?: string | null
}): Promise<WaitlistResult> {
  const trimmed = (input.email ?? '').trim()
  if (!trimmed || trimmed.length < 4 || trimmed.length > 320 || !WAITLIST_EMAIL_REGEX.test(trimmed)) {
    return { status: 'invalid' }
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 320) : null

  const { error } = await supabase
    .from('nmu_waitlist')
    .insert({
      email: trimmed,
      source: input.source ?? 'landing-pricing',
      locale: input.locale ?? null,
      user_agent: userAgent,
    })

  if (!error) return { status: 'ok' }

  const code = 'code' in error ? String(error.code) : ''
  if (code === '23505') {
    return { status: 'duplicate' }
  }
  if (isMissingRelationError(error)) {
    return { status: 'error', message: 'waitlist-table-missing' }
  }
  return { status: 'error', message: error.message }
}

export type { ContactActivityPayload } from './contactActivityLog'
