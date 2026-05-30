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
          earned_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coach_usage: {
        Row: {
          count: number
          date: string
          user_id: string
        }
        Insert: {
          count?: number
          date: string
          user_id: string
        }
        Update: {
          count?: number
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_puzzles: {
        Row: {
          created_at: string
          date: string
          puzzle_id: string
        }
        Insert: {
          created_at?: string
          date: string
          puzzle_id: string
        }
        Update: {
          created_at?: string
          date?: string
          puzzle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_puzzles_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_results: {
        Row: {
          created_at: string
          date: string
          hints_used: number
          id: string
          mistakes: number
          score: number
          time_seconds: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          hints_used?: number
          id?: string
          mistakes?: number
          score: number
          time_seconds: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          hints_used?: number
          id?: string
          mistakes?: number
          score?: number
          time_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          completed: boolean
          finished_at: string | null
          hints_used: number
          id: string
          mistakes: number
          puzzle_id: string
          started_at: string
          state: Json
          time_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          finished_at?: string | null
          hints_used?: number
          id?: string
          mistakes?: number
          puzzle_id: string
          started_at?: string
          state: Json
          time_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          finished_at?: string | null
          hints_used?: number
          id?: string
          mistakes?: number
          puzzle_id?: string
          started_at?: string
          state?: Json
          time_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_group: string | null
          avatar: string | null
          city: string | null
          created_at: string
          display_name: string
          id: string
          is_pro: boolean
          last_daily_date: string | null
          stickers: Json
          streak_days: number
          theme: string
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          avatar?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_pro?: boolean
          last_daily_date?: string | null
          stickers?: Json
          streak_days?: number
          theme?: string
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          avatar?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_pro?: boolean
          last_daily_date?: string | null
          stickers?: Json
          streak_days?: number
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      puzzles: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["puzzle_difficulty"]
          given: Json
          id: string
          seed: string
          size: Database["public"]["Enums"]["puzzle_size"]
          solution: Json
        }
        Insert: {
          created_at?: string
          difficulty: Database["public"]["Enums"]["puzzle_difficulty"]
          given: Json
          id?: string
          seed: string
          size: Database["public"]["Enums"]["puzzle_size"]
          solution: Json
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["puzzle_difficulty"]
          given?: Json
          id?: string
          seed?: string
          size?: Database["public"]["Enums"]["puzzle_size"]
          solution?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "user" | "admin"
      puzzle_difficulty: "easy" | "medium" | "hard"
      puzzle_size: "4" | "6" | "9"
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
      app_role: ["user", "admin"],
      puzzle_difficulty: ["easy", "medium", "hard"],
      puzzle_size: ["4", "6", "9"],
    },
  },
} as const
