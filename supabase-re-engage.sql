-- Re-engagement tracking columns
-- Paste into: Supabase Dashboard → SQL Editor → Run

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen       TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS re_engage_sent_at TIMESTAMPTZ;

-- Backfill last_seen for existing rows
UPDATE profiles SET last_seen = updated_at WHERE last_seen IS NULL;
