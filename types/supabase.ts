Need to install the following packages:
supabase@2.20.12
Ok to proceed? (y) 

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          user_type: string | null
          profession: string | null
          created_at: string
          updated_at: string
          services: Json | null
          description: string | null
          normalized_last_name: string | null
          verified: boolean | null
          location: string | null
          postal_code: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          user_type?: string | null
          profession?: string | null
          created_at?: string
          updated_at?: string
          services?: Json | null
          description?: string | null
          normalized_last_name?: string | null
          verified?: boolean | null
          location?: string | null
          postal_code?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          user_type?: string | null
          profession?: string | null
          created_at?: string
          updated_at?: string
          services?: Json | null
          description?: string | null
          normalized_last_name?: string | null
          verified?: boolean | null
          location?: string | null
          postal_code?: string | null
        }
      }
      // ... rest of the types
    }
  }
} 