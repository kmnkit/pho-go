/**
 * Supabase Database Types
 *
 * Generated from database schema. Update this file when schema changes.
 * In production, use `supabase gen types typescript` to auto-generate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Database interface defining all tables, views, and functions
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          preferred_language: 'ja' | 'vi'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          preferred_language?: 'ja' | 'vi'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          preferred_language?: 'ja' | 'vi'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          learned_words: string[]
          current_level: number
          experience_points: number
          streak_days: number
          last_study_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          learned_words?: string[]
          current_level?: number
          experience_points?: number
          streak_days?: number
          last_study_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          learned_words?: string[]
          current_level?: number
          experience_points?: number
          streak_days?: number
          last_study_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_progress_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          duration_minutes: number
          words_practiced: number
          words_learned: number
          quiz_score: number | null
          activity_type: 'flashcard' | 'quiz' | 'learning'
          xp_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date: string
          duration_minutes: number
          words_practiced: number
          words_learned?: number
          quiz_score?: number | null
          activity_type: 'flashcard' | 'quiz' | 'learning'
          xp_earned?: number
          created_at?: string
        }
        Update: Record<string, never> // Study sessions are immutable (no updates allowed)
        Relationships: [
          {
            foreignKeyName: 'study_sessions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Convenience Types
// ============================================================================

/**
 * User table row type
 */
export type User = Database['public']['Tables']['users']['Row']

/**
 * User progress table row type
 */
export type UserProgress = Database['public']['Tables']['user_progress']['Row']

/**
 * Study session table row type
 */
export type StudySession = Database['public']['Tables']['study_sessions']['Row']

/**
 * User insert type (for creating new users)
 */
export type UserInsert = Database['public']['Tables']['users']['Insert']

/**
 * User progress insert type
 */
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert']

/**
 * Study session insert type
 */
export type StudySessionInsert = Database['public']['Tables']['study_sessions']['Insert']

/**
 * User update type
 */
export type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * User progress update type
 */
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update']

/**
 * User statistics returned by get_user_stats function
 */
export interface UserStats {
  total_sessions: number
  total_duration_minutes: number
  total_words_practiced: number
  total_words_learned: number
  total_xp_earned: number
  average_quiz_score: number
  sessions_last_7_days: number
  sessions_last_30_days: number
  flashcard_sessions: number
  quiz_sessions: number
  learning_sessions: number
}
