// ============================================================
// Network Marketing Ultimate (NMU) — Supabase Database Types
// Tablo prefix: nmu_
// Bu dosya Supabase tablo yapısını yansıtır.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface OrderItemJson {
  product_id: string
  product_name: string
  quantity: number
  unit_price_try: number
}

export interface Database {
  public: {
    Tables: {
      // ─── KULLANICI PROFİLİ ───────────────────────────────
      nmu_user_profiles: {
        Row: {
          id: string               // auth.users.id ile eşleşir
          email: string
          name: string
          avatar_url: string | null
          role: 'solo' | 'member' | 'leader' | 'org_leader' | 'admin'
          timezone: string
          language: string
          rank: string | null
          join_date: string
          streak: number
          xp: number
          level: number
          momentum_score: number
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          avatar_url?: string | null
          role?: 'solo' | 'member' | 'leader' | 'org_leader' | 'admin'
          timezone?: string
          language?: string
          rank?: string | null
          join_date?: string
          streak?: number
          xp?: number
          level?: number
          momentum_score?: number
          settings?: Json
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: 'solo' | 'member' | 'leader' | 'org_leader' | 'admin'
          timezone?: string
          language?: string
          rank?: string | null
          join_date?: string
          streak?: number
          xp?: number
          level?: number
          momentum_score?: number
          settings?: Json
        }
        Relationships: []
      }

      // ─── KİŞİLER ─────────────────────────────────────────
      nmu_contacts: {
        Row: {
          id: string
          user_id: string
          full_name: string
          avatar_url: string | null
          email: string | null
          phone: string | null
          location: string | null
          timezone: string | null
          language: string | null
          tags: string[]
          source: string
          status: 'active' | 'inactive' | 'do_not_contact'
          pipeline_stage: string
          interest_type: 'product' | 'business' | 'both' | 'unknown'
          temperature: 'cold' | 'warm' | 'hot' | 'frozen'
          temperature_score: number
          relationship_strength: number
          last_contact_date: string | null
          next_follow_up_date: string | null
          preferred_channel: string
          referred_by: string | null
          birthday: string | null
          profession: string | null
          family_notes: string | null
          goals_notes: string | null
          objection_tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name: string
          avatar_url?: string | null
          email?: string | null
          phone?: string | null
          location?: string | null
          timezone?: string | null
          language?: string | null
          tags?: string[]
          source?: string
          status?: 'active' | 'inactive' | 'do_not_contact'
          pipeline_stage?: string
          interest_type?: 'product' | 'business' | 'both' | 'unknown'
          temperature?: 'cold' | 'warm' | 'hot' | 'frozen'
          temperature_score?: number
          relationship_strength?: number
          last_contact_date?: string | null
          next_follow_up_date?: string | null
          preferred_channel?: string
          referred_by?: string | null
          birthday?: string | null
          profession?: string | null
          family_notes?: string | null
          goals_notes?: string | null
          objection_tags?: string[]
        }
        Update: Partial<Database['public']['Tables']['nmu_contacts']['Insert']>
        Relationships: []
      }

      // ─── GÖREVLER ────────────────────────────────────────
      nmu_tasks: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          title: string
          description: string | null
          type: 'follow_up' | 'call' | 'meeting' | 'presentation' | 'onboarding' | 'training' | 'custom'
          status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          contact_id?: string | null
          title: string
          description?: string | null
          type?: 'follow_up' | 'call' | 'meeting' | 'presentation' | 'onboarding' | 'training' | 'custom'
          status?: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_date: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['nmu_tasks']['Insert']>
        Relationships: []
      }

      // ─── ETKİLEŞİMLER ────────────────────────────────────
      nmu_interactions: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          type: 'call' | 'message' | 'meeting' | 'email' | 'note' | 'presentation' | 'follow_up'
          channel: string
          content: string
          outcome: 'positive' | 'neutral' | 'negative' | 'no_response' | null
          next_action: string | null
          date: string
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          contact_id: string
          user_id: string
          type: 'call' | 'message' | 'meeting' | 'email' | 'note' | 'presentation' | 'follow_up'
          channel?: string
          content: string
          outcome?: 'positive' | 'neutral' | 'negative' | 'no_response' | null
          next_action?: string | null
          date?: string
          duration_minutes?: number | null
        }
        Update: Partial<Database['public']['Tables']['nmu_interactions']['Insert']>
        Relationships: []
      }

      // ─── ETKİNLİKLER ─────────────────────────────────────
      nmu_events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          type: string
          start_date: string
          end_date: string
          location: string | null
          meeting_url: string | null
          max_attendees: number | null
          status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          description?: string
          type?: string
          start_date: string
          end_date: string
          location?: string | null
          meeting_url?: string | null
          max_attendees?: number | null
          status?: 'draft' | 'published' | 'live' | 'completed' | 'cancelled'
        }
        Update: Partial<Database['public']['Tables']['nmu_events']['Insert']>
        Relationships: []
      }

      // ─── ETKİNLİK KATILIMCILARI ──────────────────────────
      nmu_event_attendees: {
        Row: {
          id: string
          event_id: string
          contact_id: string
          contact_name: string
          rsvp_status: 'invited' | 'confirmed' | 'attended' | 'no_show' | 'declined'
          follow_up_status: 'pending' | 'sent' | 'converted' | 'lost'
        }
        Insert: {
          event_id: string
          contact_id: string
          contact_name: string
          rsvp_status?: 'invited' | 'confirmed' | 'attended' | 'no_show' | 'declined'
          follow_up_status?: 'pending' | 'sent' | 'converted' | 'lost'
        }
        Update: Partial<Database['public']['Tables']['nmu_event_attendees']['Insert']>
        Relationships: []
      }

      // ─── BİLDİRİMLER ─────────────────────────────────────
      nmu_notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          action_url: string | null
          is_read: boolean
          priority: 'low' | 'medium' | 'high'
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          title: string
          message: string
          action_url?: string | null
          is_read?: boolean
          priority?: 'low' | 'medium' | 'high'
        }
        Update: Partial<Database['public']['Tables']['nmu_notifications']['Insert']>
        Relationships: []
      }

      // ─── KAMPANYALAR ──────────────────────────────────────
      nmu_campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          description: string
          start_date: string
          end_date: string
          status: 'draft' | 'active' | 'paused' | 'completed'
          metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          type?: string
          description?: string
          start_date: string
          end_date: string
          status?: 'draft' | 'active' | 'paused' | 'completed'
          metrics?: Json
        }
        Update: Partial<Database['public']['Tables']['nmu_campaigns']['Insert']>
        Relationships: []
      }

      // ─── ÜRÜNLER ───────────────────────────────────────────
      nmu_products: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          description: string
          price_try: number
          tags: string[]
          reorder_cycle_days: number | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          category?: string
          description?: string
          price_try?: number
          tags?: string[]
          reorder_cycle_days?: number | null
          image_url?: string | null
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['nmu_products']['Insert']>
        Relationships: []
      }

      // ─── SİPARİŞLER ────────────────────────────────────────
      nmu_orders: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          items: OrderItemJson[]
          total_try: number
          status: 'pending' | 'processing' | 'delivered' | 'cancelled'
          note: string | null
          order_date: string
          next_reorder_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          contact_id: string
          items?: OrderItemJson[]
          total_try?: number
          status?: 'pending' | 'processing' | 'delivered' | 'cancelled'
          note?: string | null
          order_date?: string
          next_reorder_date?: string | null
        }
        Update: Partial<Database['public']['Tables']['nmu_orders']['Insert']>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}

// ─── Kolay kullanım için tip takma adları ─────────────────
export type NMUContact = Database['public']['Tables']['nmu_contacts']['Row']
export type NMUContactInsert = Database['public']['Tables']['nmu_contacts']['Insert']
export type NMUContactUpdate = Database['public']['Tables']['nmu_contacts']['Update']

export type NMUTask = Database['public']['Tables']['nmu_tasks']['Row']
export type NMUTaskInsert = Database['public']['Tables']['nmu_tasks']['Insert']
export type NMUTaskUpdate = Database['public']['Tables']['nmu_tasks']['Update']

export type NMUInteraction = Database['public']['Tables']['nmu_interactions']['Row']
export type NMUInteractionInsert = Database['public']['Tables']['nmu_interactions']['Insert']

export type NMUEvent = Database['public']['Tables']['nmu_events']['Row']
export type NMUNotification = Database['public']['Tables']['nmu_notifications']['Row']
export type NMUUserProfile = Database['public']['Tables']['nmu_user_profiles']['Row']
export type NMUProduct = Database['public']['Tables']['nmu_products']['Row']
export type NMUOrder = Database['public']['Tables']['nmu_orders']['Row']
