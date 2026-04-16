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
        Insert: Omit<Database['public']['Tables']['nmu_user_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['nmu_user_profiles']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['nmu_contacts']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['nmu_tasks']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_interactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['nmu_interactions']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['nmu_events']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_event_attendees']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['nmu_event_attendees']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['nmu_notifications']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['nmu_campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['nmu_campaigns']['Insert']>
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
