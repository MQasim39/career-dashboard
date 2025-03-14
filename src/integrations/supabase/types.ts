export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          job_count: number | null
          location: string
          logo_url: string | null
          name: string
          size: string | null
          social_links: Json | null
          website_url: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          job_count?: number | null
          location: string
          logo_url?: string | null
          name: string
          size?: string | null
          social_links?: Json | null
          website_url?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          job_count?: number | null
          location?: string
          logo_url?: string | null
          name?: string
          size?: string | null
          social_links?: Json | null
          website_url?: string | null
        }
        Relationships: []
      }
      featured_jobs: {
        Row: {
          benefits: string[] | null
          company: string
          company_id: string | null
          created_at: string | null
          description: string | null
          experience_level: string | null
          expires_at: string | null
          id: string
          industry: string | null
          is_remote: boolean | null
          job_type: string
          location: string
          posted_at: string | null
          requirements: string[] | null
          salary_range: string
          title: string
        }
        Insert: {
          benefits?: string[] | null
          company: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          industry?: string | null
          is_remote?: boolean | null
          job_type: string
          location: string
          posted_at?: string | null
          requirements?: string[] | null
          salary_range: string
          title: string
        }
        Update: {
          benefits?: string[] | null
          company?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          industry?: string | null
          is_remote?: boolean | null
          job_type?: string
          location?: string
          posted_at?: string | null
          requirements?: string[] | null
          salary_range?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          job_count: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          icon: string
          id?: string
          job_count?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          job_count?: number | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          file_path: string
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          is_selected: boolean | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          file_path: string
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          is_selected?: boolean | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          is_selected?: boolean | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_image_url: string | null
          author_name: string
          author_position: string
          content: string
          created_at: string | null
          id: string
          rating: number | null
        }
        Insert: {
          author_image_url?: string | null
          author_name: string
          author_position: string
          content: string
          created_at?: string | null
          id?: string
          rating?: number | null
        }
        Update: {
          author_image_url?: string | null
          author_name?: string
          author_position?: string
          content?: string
          created_at?: string | null
          id?: string
          rating?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: "candidate" | "employer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
