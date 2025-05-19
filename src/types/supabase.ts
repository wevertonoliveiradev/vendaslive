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
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          id: string
          created_at: string
          sale_date: string
          client_id: string
          instagram: string | null
          notes: string | null
          is_completed: boolean
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          sale_date: string
          client_id: string
          instagram?: string | null
          notes?: string | null
          is_completed?: boolean
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          sale_date?: string
          client_id?: string
          instagram?: string | null
          notes?: string | null
          is_completed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sale_photos: {
        Row: {
          id: string
          created_at: string
          sale_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          sale_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          sale_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_photos_sale_id_fkey"
            columns: ["sale_id"]
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_photos_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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