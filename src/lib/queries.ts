// ============================================================
// NMOS — Supabase Query Functions
// ============================================================
import { supabase } from './supabase'
import type { Database } from './database.types'

export type ContactRow = Database['public']['Tables']['nmu_contacts']['Row']
export type TaskRow = Database['public']['Tables']['nmu_tasks']['Row']
export type ProductRow = Database['public']['Tables']['nmu_products']['Row']
export type OrderRow = Database['public']['Tables']['nmu_orders']['Row']

// ─── PRODUCT ──────────────────────────────────────────────────

export async function fetchProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('nmu_products')
    .select('*')
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
    tags: string[]
    reorder_cycle_days: number | null
  }>
): Promise<void> {
  const { error } = await supabase
    .from('nmu_products')
    .update(input)
    .eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('nmu_products')
    .update({ is_active: false })
    .eq('id', id)
  if (error) throw error
}

// ─── CONTACTS ────────────────────────────────────────────────

export async function fetchContacts(): Promise<ContactRow[]> {
  const { data, error } = await supabase
    .from('nmu_contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ContactRow[]
}

export async function addContact(
  userId: string,
  input: {
    full_name: string
    phone?: string
    email?: string
    location?: string
    profession?: string
    temperature?: 'cold' | 'warm' | 'hot' | 'frozen'
    interest_type?: 'product' | 'business' | 'both' | 'unknown'
    source?: string
    notes?: string
    pipeline_stage?: string
  }
): Promise<ContactRow> {
  const { data, error } = await supabase
    .from('nmu_contacts')
    .insert({
      user_id: userId,
      full_name: input.full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      location: input.location ?? null,
      profession: input.profession ?? null,
      temperature: input.temperature ?? 'cold',
      interest_type: input.interest_type ?? 'unknown',
      source: input.source ?? '',
      goals_notes: input.notes ?? null,
      pipeline_stage: input.pipeline_stage ?? 'new',
    })
    .select()
    .single()
  if (error) throw error
  return data as ContactRow
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('nmu_contacts').delete().eq('id', id)
  if (error) throw error
}

export async function updateContactStage(id: string, stage: string): Promise<void> {
  const { error } = await supabase
    .from('nmu_contacts')
    .update({ pipeline_stage: stage })
    .eq('id', id)
  if (error) throw error
}

// ─── TASKS ───────────────────────────────────────────────────

export async function fetchTasks(): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('nmu_tasks')
    .select('*')
    .order('due_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as TaskRow[]
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
  return data as TaskRow
}

export async function completeTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('nmu_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('nmu_tasks').delete().eq('id', id)
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
  const { data, error } = await supabase
    .from('nmu_orders')
    .select('*')
    .eq('contact_id', contactId)
    .order('order_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export async function fetchAllOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from('nmu_orders')
    .select('*')
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
  return data as OrderRow
}

export async function updateOrderStatus(id: string, status: OrderRow['status']): Promise<void> {
  const { error } = await supabase
    .from('nmu_orders')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('nmu_orders')
    .delete()
    .eq('id', id)
  if (error) throw error
}
