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
      job_matches: {
        Row: {
          created_at: string
          id: string
          job_id: string
          match_score: number
          resume_id: string
          skills_matched: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          match_score: number
          resume_id: string
          skills_matched?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          resume_id?: string
          skills_matched?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraped_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      parsed_resumes: {
        Row: {
          created_at: string
          education: Json | null
          experience: Json | null
          full_text: string | null
          id: string
          personal_info: Json | null
          resume_id: string
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: Json | null
          experience?: Json | null
          full_text?: string | null
          id?: string
          personal_info?: Json | null
          resume_id: string
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: Json | null
          experience?: Json | null
          full_text?: string | null
          id?: string
          personal_info?: Json | null
          resume_id?: string
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_resumes_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: true
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
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
      scraped_jobs: {
        Row: {
          company: string
          created_at: string
          description: string | null
          id: string
          job_type: string | null
          location: string | null
          requirements: string[] | null
          salary_range: string | null
          skills_required: string[] | null
          source: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          skills_required?: string[] | null
          source: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          skills_required?: string[] | null
          source?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      scraping_configurations: {
        Row: {
          created_at: string
          filters: Json | null
          frequency: string | null
          id: string
          is_active: boolean | null
          job_types: string[] | null
          keywords: string[] | null
          last_run: string | null
          locations: string[] | null
          name: string
          source: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          job_types?: string[] | null
          keywords?: string[] | null
          last_run?: string | null
          locations?: string[] | null
          name: string
          source: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          job_types?: string[] | null
          keywords?: string[] | null
          last_run?: string | null
          locations?: string[] | null
          name?: string
          source?: string
          updated_at?: string
          user_id?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["candidate", "employer"],
    },
  },
} as const
