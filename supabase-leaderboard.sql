-- Leaderboard: fast XP index + RPC function
-- Paste into: Supabase Dashboard → SQL Editor → Run

-- Index for fast numeric XP ordering
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
    CAST(ROW_NUMBER() OVER (
      ORDER BY CAST(NULLIF(stats->>'xp', '') AS integer) DESC NULLS LAST
    ) AS integer)                                        AS pos,
    p.username                                           AS username,
    CAST(COALESCE(NULLIF(stats->>'xp', ''), '0') AS integer) AS xp,
    COALESCE(stats->>'rank', 'ROOKIE')                   AS rank_name,
    p.user_id                                            AS user_id
  FROM profiles p
  WHERE stats->>'xp' IS NOT NULL
    AND NULLIF(stats->>'xp', '') IS NOT NULL
    AND CAST(COALESCE(NULLIF(stats->>'xp', ''), '0') AS integer) > 0
  ORDER BY CAST(COALESCE(NULLIF(stats->>'xp', ''), '0') AS integer) DESC
  LIMIT 10;
$$;
