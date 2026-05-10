-- BreachOS RLS Policies
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- Run AFTER supabase-schema.sql

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- These policies cover direct client access if ever needed.

-- Users can only read their own profile
CREATE POLICY "users_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "users_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "users_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "users_delete_own" ON profiles
  FOR DELETE
  USING (auth.uid() = user_id);
