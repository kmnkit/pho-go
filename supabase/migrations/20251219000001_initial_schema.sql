-- ============================================================================
-- Initial Schema for Việt Pocket Learning App
-- Migration: 20251219000001_initial_schema.sql
-- Description: Creates users, user_progress, and study_sessions tables with RLS
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Users Table (extends Supabase Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'ja' CHECK (preferred_language IN ('ja', 'vi')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comment to table
COMMENT ON TABLE public.users IS 'User profile information extending Supabase Auth users';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- User Progress Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  learned_words TEXT[] DEFAULT '{}' NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL CHECK (current_level > 0),
  experience_points INTEGER DEFAULT 0 NOT NULL CHECK (experience_points >= 0),
  streak_days INTEGER DEFAULT 0 NOT NULL CHECK (streak_days >= 0),
  last_study_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure one progress record per user
  UNIQUE(user_id)
);

-- Add comment to table
COMMENT ON TABLE public.user_progress IS 'User learning progress including XP, level, and learned words';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS user_progress_last_study_date_idx ON public.user_progress(last_study_date);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Study Sessions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  words_practiced INTEGER NOT NULL CHECK (words_practiced >= 0),
  words_learned INTEGER DEFAULT 0 NOT NULL CHECK (words_learned >= 0),
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('flashcard', 'quiz', 'learning')),
  xp_earned INTEGER DEFAULT 0 NOT NULL CHECK (xp_earned >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comment to table
COMMENT ON TABLE public.study_sessions IS 'Historical record of user study sessions (immutable for audit)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS study_sessions_session_date_idx ON public.study_sessions(session_date);
CREATE INDEX IF NOT EXISTS study_sessions_activity_type_idx ON public.study_sessions(activity_type);

-- Composite index for user-specific date range queries
CREATE INDEX IF NOT EXISTS study_sessions_user_date_idx
  ON public.study_sessions(user_id, session_date DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Users Table Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- User Progress Table Policies
-- ============================================================================

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Study Sessions Table Policies
-- ============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.study_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - sessions are immutable for audit purposes

-- ============================================================================
-- Database Functions
-- ============================================================================

-- Function to get comprehensive user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sessions', COUNT(*),
    'total_duration_minutes', COALESCE(SUM(duration_minutes), 0),
    'total_words_practiced', COALESCE(SUM(words_practiced), 0),
    'total_words_learned', COALESCE(SUM(words_learned), 0),
    'total_xp_earned', COALESCE(SUM(xp_earned), 0),
    'average_quiz_score', COALESCE(AVG(quiz_score), 0),
    'sessions_last_7_days', COUNT(*) FILTER (WHERE session_date >= NOW() - INTERVAL '7 days'),
    'sessions_last_30_days', COUNT(*) FILTER (WHERE session_date >= NOW() - INTERVAL '30 days'),
    'flashcard_sessions', COUNT(*) FILTER (WHERE activity_type = 'flashcard'),
    'quiz_sessions', COUNT(*) FILTER (WHERE activity_type = 'quiz'),
    'learning_sessions', COUNT(*) FILTER (WHERE activity_type = 'learning')
  ) INTO result
  FROM public.study_sessions
  WHERE user_id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION get_user_stats(UUID) IS 'Returns comprehensive statistics for a user';

-- ============================================================================
-- Trigger to auto-create user profile on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ja')
  );

  -- Also create initial user_progress record
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
