-- Daily leaderboard function
-- Paste into: Supabase Dashboard → SQL Editor → Run

CREATE OR REPLACE FUNCTION get_daily_leaderboard(today text)
RETURNS TABLE(
  pos        INTEGER,
  username   TEXT,
  time_secs  INTEGER,
  difficulty TEXT,
  user_id    UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH entries AS (
    SELECT
      p.username,
      p.user_id,
      p.stats,
      NULLIF(p.stats->'dailyBestTimes'->today->>'time', '') AS raw_time
    FROM profiles p
    WHERE p.stats->'dailyBestTimes'->today->>'time' IS NOT NULL
      AND NULLIF(p.stats->'dailyBestTimes'->today->>'time', '') IS NOT NULL
  )
  SELECT
    CAST(ROW_NUMBER() OVER (ORDER BY CAST(raw_time AS integer) ASC) AS integer) AS pos,
    username,
    CAST(raw_time AS integer)                                                    AS time_secs,
    COALESCE(stats->'dailyBestTimes'->today->>'difficulty', '')                 AS difficulty,
    user_id
  FROM entries
  ORDER BY CAST(raw_time AS integer) ASC
  LIMIT 10;
$$;
