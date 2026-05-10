-- BreachOS profiles table
-- Paste into: Supabase Dashboard → SQL Editor → Run

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username   TEXT NOT NULL CHECK (char_length(username) BETWEEN 2 AND 20),
  stats      JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
