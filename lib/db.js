import { createClient } from '@supabase/supabase-js';

// Admin client — service role, bypasses RLS. Use only in auth routes and cron.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Public client — anon key, respects RLS. Use for leaderboard and other public reads.
export const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

// Default export kept for backwards compatibility with existing auth/sync/cron imports.
export default supabaseAdmin;
