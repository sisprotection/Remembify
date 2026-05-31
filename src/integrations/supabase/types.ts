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
      account_flags: {
        Row: {
          created_at: string
          id: string
          reason: string
          resolved: boolean
          severity: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          resolved?: boolean
          severity?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          resolved?: boolean
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          prompt: string
          response: string | null
          tokens: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          response?: string | null
          tokens?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          response?: string | null
          tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          id: string
          payload: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          payload?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          payload?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      audit_visibility_overrides: {
        Row: {
          hidden: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          hidden?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          hidden?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      cabinet_notes: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_deadlines: {
        Row: {
          category: string
          created_at: string
          due_date: string
          entity_id: string | null
          id: string
          jurisdiction: string
          notes: string | null
          status: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          due_date: string
          entity_id?: string | null
          id?: string
          jurisdiction: string
          notes?: string | null
          status?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          due_date?: string
          entity_id?: string | null
          id?: string
          jurisdiction?: string
          notes?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_deadlines_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          cabinet: Json | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          status: string
          summary: string | null
          type: string
          updated_at: string
        }
        Insert: {
          cabinet?: Json | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          status?: string
          summary?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          cabinet?: Json | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          status?: string
          summary?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_status_pings: {
        Row: {
          created_at: string
          detail: string | null
          entity_id: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          entity_id: string
          id?: string
          status: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          entity_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_status_pings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings_reports: {
        Row: {
          audit_count: number | null
          entity_id: string | null
          id: string
          payload: Json | null
          pulled_at: string
          revenue_cents: number | null
          subs_active: number | null
          tickets_open: number | null
        }
        Insert: {
          audit_count?: number | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
          pulled_at?: string
          revenue_cents?: number | null
          subs_active?: number | null
          tickets_open?: number | null
        }
        Update: {
          audit_count?: number | null
          entity_id?: string | null
          id?: string
          payload?: Json | null
          pulled_at?: string
          revenue_cents?: number | null
          subs_active?: number | null
          tickets_open?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holdings_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings_settings: {
        Row: {
          id: number
          infinity_suspended: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          infinity_suspended?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          infinity_suspended?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          message: string | null
          reminder_id: string | null
          snoozed_until: string | null
          status: string
          title: string
          trigger_kind: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          message?: string | null
          reminder_id?: string | null
          snoozed_until?: string | null
          status?: string
          title: string
          trigger_kind?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          message?: string | null
          reminder_id?: string | null
          snoozed_until?: string | null
          status?: string
          title?: string
          trigger_kind?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_group_members: {
        Row: {
          added_at: string
          group_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
          username_set_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
          username_set_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
          username_set_at?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          active: boolean
          assigned_user_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          custom_sound_url: string | null
          due_at: string | null
          group_id: string | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          notes: string | null
          one_time: boolean | null
          priority: string | null
          radius_m: number | null
          recurrence: string | null
          sound_id: string | null
          title: string
          trigger_type: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          assigned_user_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          custom_sound_url?: string | null
          due_at?: string | null
          group_id?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          one_time?: boolean | null
          priority?: string | null
          radius_m?: number | null
          recurrence?: string | null
          sound_id?: string | null
          title: string
          trigger_type?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          assigned_user_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          custom_sound_url?: string | null
          due_at?: string | null
          group_id?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          notes?: string | null
          one_time?: boolean | null
          priority?: string | null
          radius_m?: number | null
          recurrence?: string | null
          sound_id?: string | null
          title?: string
          trigger_type?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_subscription_id: string | null
          paddle_transaction_id: string | null
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subsidiary_endpoints: {
        Row: {
          created_at: string
          enabled: boolean
          entity_id: string
          export_url: string
          id: string
          last_cursor: string | null
          shared_secret: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          entity_id: string
          export_url: string
          id?: string
          last_cursor?: string | null
          shared_secret: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          entity_id?: string
          export_url?: string
          id?: string
          last_cursor?: string | null
          shared_secret?: string
        }
        Relationships: [
          {
            foreignKeyName: "subsidiary_endpoints_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string
          category: string
          created_at: string
          department: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          category?: string
          created_at?: string
          department?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          category?: string
          created_at?: string
          department?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tc_consents: {
        Row: {
          accepted_at: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          from_staff: boolean
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          from_staff?: boolean
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          from_staff?: boolean
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
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
      user_settings: {
        Row: {
          created_at: string
          dark_mode: boolean
          default_radius_m: number
          default_sound_id: string
          default_trigger: string
          notifications_enabled: boolean
          sound_volume: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dark_mode?: boolean
          default_radius_m?: number
          default_sound_id?: string
          default_trigger?: string
          notifications_enabled?: boolean
          sound_volume?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dark_mode?: boolean
          default_radius_m?: number
          default_sound_id?: string
          default_trigger?: string
          notifications_enabled?: boolean
          sound_volume?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sounds: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          name: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          name: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          name?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      username_change_requests: {
        Row: {
          created_at: string
          id: string
          requested_username: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_username: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_username?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_audit: { Args: { _user_id: string }; Returns: boolean }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cabinet: { Args: { _user_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "pro"
        | "plus"
        | "free"
        | "president"
        | "vice_president"
        | "secretary"
        | "financial_adviser"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: [
        "owner",
        "admin",
        "pro",
        "plus",
        "free",
        "president",
        "vice_president",
        "secretary",
        "financial_adviser",
      ],
    },
  },
} as const
