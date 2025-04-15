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
      profiles: {
        Row: {
          id: string
          created_at: string
          first_name: string
          last_name: string
          phone: string
          user_type: 'client' | 'professionnel'
          profession: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          first_name: string
          last_name: string
          phone: string
          user_type: 'client' | 'professionnel'
          profession?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          phone?: string
          user_type?: 'client' | 'professionnel'
          profession?: string | null
          avatar_url?: string | null
        }
      }
      service_requests: {
        Row: {
          id: string
          created_at: string
          client_id: string
          professional_id: string | null
          status: 'pending' | 'accepted' | 'completed' | 'cancelled'
          description: string
          documents: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: string
          professional_id?: string | null
          status?: 'pending' | 'accepted' | 'completed' | 'cancelled'
          description: string
          documents?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          client_id?: string
          professional_id?: string | null
          status?: 'pending' | 'accepted' | 'completed' | 'cancelled'
          description?: string
          documents?: string[] | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 