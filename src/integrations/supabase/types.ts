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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          accepts_anonymous_donations: boolean | null
          beneficiaries_count: number | null
          category: string
          completed_at: string | null
          created_at: string | null
          currency: string | null
          deadline_type: string | null
          description: string
          end_date: string | null
          featured_image_url: string | null
          fund_usage_description: string | null
          goal_amount: number
          id: string
          images: string[] | null
          impact_description: string | null
          is_featured: boolean | null
          is_urgent: boolean | null
          minimum_donation: number | null
          organization_id: string | null
          published_at: string | null
          raised_amount: number | null
          shares_count: number | null
          short_description: string | null
          slug: string
          start_date: string | null
          status: string | null
          subcategory: string | null
          suggested_amounts: number[] | null
          supporters_count: number | null
          target_audience: string | null
          title: string
          updated_at: string | null
          updates: Json | null
          videos: string[] | null
          views_count: number | null
        }
        Insert: {
          accepts_anonymous_donations?: boolean | null
          beneficiaries_count?: number | null
          category: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          deadline_type?: string | null
          description: string
          end_date?: string | null
          featured_image_url?: string | null
          fund_usage_description?: string | null
          goal_amount: number
          id?: string
          images?: string[] | null
          impact_description?: string | null
          is_featured?: boolean | null
          is_urgent?: boolean | null
          minimum_donation?: number | null
          organization_id?: string | null
          published_at?: string | null
          raised_amount?: number | null
          shares_count?: number | null
          short_description?: string | null
          slug: string
          start_date?: string | null
          status?: string | null
          subcategory?: string | null
          suggested_amounts?: number[] | null
          supporters_count?: number | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
          updates?: Json | null
          videos?: string[] | null
          views_count?: number | null
        }
        Update: {
          accepts_anonymous_donations?: boolean | null
          beneficiaries_count?: number | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          deadline_type?: string | null
          description?: string
          end_date?: string | null
          featured_image_url?: string | null
          fund_usage_description?: string | null
          goal_amount?: number
          id?: string
          images?: string[] | null
          impact_description?: string | null
          is_featured?: boolean | null
          is_urgent?: boolean | null
          minimum_donation?: number | null
          organization_id?: string | null
          published_at?: string | null
          raised_amount?: number | null
          shares_count?: number | null
          short_description?: string | null
          slug?: string
          start_date?: string | null
          status?: string | null
          subcategory?: string | null
          suggested_amounts?: number[] | null
          supporters_count?: number | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
          updates?: Json | null
          videos?: string[] | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_receipts: {
        Row: {
          created_at: string | null
          donation_id: string
          id: string
          receipt_number: string
          receipt_url: string | null
          sent_at: string | null
          tax_deductible_amount: number
        }
        Insert: {
          created_at?: string | null
          donation_id: string
          id?: string
          receipt_number: string
          receipt_url?: string | null
          sent_at?: string | null
          tax_deductible_amount: number
        }
        Update: {
          created_at?: string | null
          donation_id?: string
          id?: string
          receipt_number?: string
          receipt_url?: string | null
          sent_at?: string | null
          tax_deductible_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "donation_receipts_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string | null
          currency: string
          donor_email: string
          donor_name: string
          donor_phone: string | null
          frequency: string | null
          id: string
          is_anonymous: boolean | null
          is_recurring: boolean | null
          message: string | null
          organization_id: string | null
          payment_intent_id: string
          payment_method_id: string | null
          payment_status: string
          processed_at: string | null
          target_id: string | null
          target_name: string
          target_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string
          donor_email: string
          donor_name: string
          donor_phone?: string | null
          frequency?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          message?: string | null
          organization_id?: string | null
          payment_intent_id: string
          payment_method_id?: string | null
          payment_status?: string
          processed_at?: string | null
          target_id?: string | null
          target_name: string
          target_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string
          donor_email?: string
          donor_name?: string
          donor_phone?: string | null
          frequency?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          message?: string | null
          organization_id?: string | null
          payment_intent_id?: string
          payment_method_id?: string | null
          payment_status?: string
          processed_at?: string | null
          target_id?: string | null
          target_name?: string
          target_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accepts_direct_donations: boolean | null
          active_campaigns_count: number | null
          address: string | null
          banner_url: string | null
          beneficiaries_served: number | null
          category: string
          city: string | null
          country: string | null
          created_at: string | null
          description: string
          email: string
          founded_year: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          mission_statement: string | null
          name: string
          phone: string | null
          postal_code: string | null
          registration_number: string
          slug: string
          social_media: Json | null
          state: string | null
          subcategories: string[] | null
          tax_id: string | null
          total_raised: number | null
          updated_at: string | null
          user_id: string | null
          verification_documents: Json | null
          verification_status: string | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          accepts_direct_donations?: boolean | null
          active_campaigns_count?: number | null
          address?: string | null
          banner_url?: string | null
          beneficiaries_served?: number | null
          category: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          description: string
          email: string
          founded_year?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          mission_statement?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          registration_number: string
          slug: string
          social_media?: Json | null
          state?: string | null
          subcategories?: string[] | null
          tax_id?: string | null
          total_raised?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          accepts_direct_donations?: boolean | null
          active_campaigns_count?: number | null
          address?: string | null
          banner_url?: string | null
          beneficiaries_served?: number | null
          category?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string
          email?: string
          founded_year?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          mission_statement?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          registration_number?: string
          slug?: string
          social_media?: Json | null
          state?: string | null
          subcategories?: string[] | null
          tax_id?: string | null
          total_raised?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          bank_account_last4: string | null
          bank_account_type: string | null
          bank_name: string | null
          billing_address: Json | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_funding: string | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          nickname: string | null
          provider: string
          provider_payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string | null
          verification_data: Json | null
        }
        Insert: {
          bank_account_last4?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          billing_address?: Json | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_funding?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          nickname?: string | null
          provider?: string
          provider_payment_method_id: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
        }
        Update: {
          bank_account_last4?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          billing_address?: Json | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_funding?: string | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          nickname?: string | null
          provider?: string
          provider_payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          verification_data?: Json | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          canceled_at: string | null
          created_at: string | null
          currency: string
          customer_email: string
          customer_name: string
          donation_id: string
          frequency: string
          id: string
          next_payment_date: string | null
          status: string
          subscription_id: string
          target_id: string | null
          target_name: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          canceled_at?: string | null
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_name: string
          donation_id: string
          frequency: string
          id?: string
          next_payment_date?: string | null
          status?: string
          subscription_id: string
          target_id?: string | null
          target_name: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          canceled_at?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_name?: string
          donation_id?: string
          frequency?: string
          id?: string
          next_payment_date?: string | null
          status?: string
          subscription_id?: string
          target_id?: string | null
          target_name?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          email_notifications: boolean | null
          full_name: string
          id: string
          location: string | null
          organization_category: string | null
          organization_description: string | null
          organization_logo_url: string | null
          organization_name: string | null
          phone_number: string | null
          privacy_settings: Json | null
          profile_picture_url: string | null
          push_notifications: boolean | null
          registration_number: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tax_id: string | null
          updated_at: string | null
          user_type: string
          verification_documents: Json | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name: string
          id: string
          location?: string | null
          organization_category?: string | null
          organization_description?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
          phone_number?: string | null
          privacy_settings?: Json | null
          profile_picture_url?: string | null
          push_notifications?: boolean | null
          registration_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tax_id?: string | null
          updated_at?: string | null
          user_type: string
          verification_documents?: Json | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string
          id?: string
          location?: string | null
          organization_category?: string | null
          organization_description?: string | null
          organization_logo_url?: string | null
          organization_name?: string | null
          phone_number?: string | null
          privacy_settings?: Json | null
          profile_picture_url?: string | null
          push_notifications?: boolean | null
          registration_number?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tax_id?: string | null
          updated_at?: string | null
          user_type?: string
          verification_documents?: Json | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_organization: {
        Args: { org_id: string }
        Returns: undefined
      }
      generate_receipt_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_target_id: string
          p_target_type: string
        }
        Returns: undefined
      }
      reject_organization: {
        Args: { org_id: string; rejection_reason?: string }
        Returns: undefined
      }
      suspend_organization: {
        Args: { org_id: string; suspension_reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "user" | "admin" | "super_admin"
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
      user_role: ["user", "admin", "super_admin"],
    },
  },
} as const
