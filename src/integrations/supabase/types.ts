export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          employee_id: string
          id: string
          impact: string | null
          title: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          employee_id: string
          id?: string
          impact?: string | null
          title: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          employee_id?: string
          id?: string
          impact?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          external_username: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          external_username?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          external_username?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_responses: {
        Row: {
          answer: string
          assessment_id: string
          category: string | null
          created_at: string
          detected_signals: string[]
          id: string
          question: string
          step: number
        }
        Insert: {
          answer: string
          assessment_id: string
          category?: string | null
          created_at?: string
          detected_signals?: string[]
          id?: string
          question: string
          step?: number
        }
        Update: {
          answer?: string
          assessment_id?: string
          category?: string | null
          created_at?: string
          detected_signals?: string[]
          id?: string
          question?: string
          step?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          completed_at: string | null
          employee_id: string
          id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          employee_id: string
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          employee_id?: string
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          name: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_resumes: {
        Row: {
          created_at: string
          detected_github_username: string | null
          detected_links: string[]
          employee_id: string
          extracted_text: string | null
          file_name: string
          file_path: string
          id: string
        }
        Insert: {
          created_at?: string
          detected_github_username?: string | null
          detected_links?: string[]
          employee_id: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          id?: string
        }
        Update: {
          created_at?: string
          detected_github_username?: string | null
          detected_links?: string[]
          employee_id?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_resumes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          confidence: number
          employee_id: string
          evidence: string | null
          id: string
          last_updated: string
          proficiency: number
          skill_id: string
          source: string
        }
        Insert: {
          confidence?: number
          employee_id: string
          evidence?: string | null
          id?: string
          last_updated?: string
          proficiency?: number
          skill_id: string
          source?: string
        }
        Update: {
          confidence?: number
          employee_id?: string
          evidence?: string | null
          id?: string
          last_updated?: string
          proficiency?: number
          skill_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          id: string
          is_demo: boolean
          job_title: string | null
          joining_date: string | null
          location: string | null
          name: string
          profile_summary: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          job_title?: string | null
          joining_date?: string | null
          location?: string | null
          name: string
          profile_summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          job_title?: string | null
          joining_date?: string | null
          location?: string | null
          name?: string
          profile_summary?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      github_evidence: {
        Row: {
          created_at: string
          detected_tech: string[]
          employee_id: string
          github_username: string
          id: string
          is_private: boolean
          languages: string[]
          last_pushed_at: string | null
          primary_language: string | null
          repo_name: string
          repo_url: string
          stars: number
          summary: string | null
        }
        Insert: {
          created_at?: string
          detected_tech?: string[]
          employee_id: string
          github_username: string
          id?: string
          is_private?: boolean
          languages?: string[]
          last_pushed_at?: string | null
          primary_language?: string | null
          repo_name: string
          repo_url: string
          stars?: number
          summary?: string | null
        }
        Update: {
          created_at?: string
          detected_tech?: string[]
          employee_id?: string
          github_username?: string
          id?: string
          is_private?: boolean
          languages?: string[]
          last_pushed_at?: string | null
          primary_language?: string | null
          repo_name?: string
          repo_url?: string
          stars?: number
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "github_evidence_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_roles: {
        Row: {
          created_at: string
          department: string | null
          description: string | null
          experience_required: number | null
          id: string
          is_demo: boolean
          preferred_skills: string[]
          required_skills: string[]
          title: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          description?: string | null
          experience_required?: number | null
          id?: string
          is_demo?: boolean
          preferred_skills?: string[]
          required_skills?: string[]
          title: string
        }
        Update: {
          created_at?: string
          department?: string | null
          description?: string | null
          experience_required?: number | null
          id?: string
          is_demo?: boolean
          preferred_skills?: string[]
          required_skills?: string[]
          title?: string
        }
        Relationships: []
      }
      learning_records: {
        Row: {
          completion_date: string | null
          course: string
          created_at: string
          employee_id: string
          id: string
          provider: string | null
          skills_gained: string[]
        }
        Insert: {
          completion_date?: string | null
          course: string
          created_at?: string
          employee_id: string
          id?: string
          provider?: string | null
          skills_gained?: string[]
        }
        Update: {
          completion_date?: string | null
          course?: string
          created_at?: string
          employee_id?: string
          id?: string
          provider?: string | null
          skills_gained?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "learning_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          end_date: string | null
          id: string
          outcomes: string | null
          role: string | null
          start_date: string | null
          technologies: string[]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          outcomes?: string | null
          role?: string | null
          start_date?: string | null
          technologies?: string[]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          outcomes?: string | null
          role?: string | null
          start_date?: string | null
          technologies?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          id: string
          reason: string | null
          related_role: string | null
          related_skill: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          id?: string
          reason?: string | null
          related_role?: string | null
          related_skill?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          id?: string
          reason?: string | null
          related_role?: string | null
          related_skill?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      role_skills: {
        Row: {
          id: string
          importance: string
          required_level: number
          role_id: string
          skill_id: string
        }
        Insert: {
          id?: string
          importance?: string
          required_level?: number
          role_id: string
          skill_id: string
        }
        Update: {
          id?: string
          importance?: string
          required_level?: number
          role_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_skills_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "internal_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      talent_insights: {
        Row: {
          capability: string
          confidence: number
          created_at: string
          employee_id: string
          evidence: string[]
          explanation: string | null
          explore: string[]
          id: string
          source: string
        }
        Insert: {
          capability: string
          confidence?: number
          created_at?: string
          employee_id: string
          evidence?: string[]
          explanation?: string | null
          explore?: string[]
          id?: string
          source?: string
        }
        Update: {
          capability?: string
          confidence?: number
          created_at?: string
          employee_id?: string
          evidence?: string[]
          explanation?: string | null
          explore?: string[]
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_insights_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      owns_employee: { Args: { _employee_id: string }; Returns: boolean }
      staff_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "employee" | "hr" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["employee", "hr", "admin"],
    },
  },
} as const
