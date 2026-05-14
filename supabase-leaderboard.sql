-- Leaderboard: fast XP index + RPC function
-- Paste into: Supabase Dashboard → SQL Editor → Run

-- Index for fast numeric XP ordering (CAST avoids :: parser restriction)
CREATE INDEX IF NOT EXISTS idx_profiles_xp
  ON profiles (CAST(stats->>'xp' AS integer) DESC);

-- Leaderboard function (returns top 10 by XP)
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE(
  pos       INTEGER,
  username  TEXT,
  xp        INTEGER,
  rank_name TEXT,
  user_id   UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY CAST(stats->>'xp' AS integer) DESC)::integer AS pos,
    username,
    CAST(stats->>'xp' AS integer)                                            AS xp,
    COALESCE(stats->>'rank', 'ROOKIE')                                       AS rank_name,
    user_id
  FROM profiles
  WHERE CAST(stats->>'xp' AS integer) > 0
  ORDER BY xp DESC
  LIMIT 10;
$$;
