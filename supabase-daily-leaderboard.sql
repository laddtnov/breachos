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
  WITH pre AS (
    -- Extract the raw time string once — eliminates all duplicate path references
    SELECT
      p.username,
      p.user_id,
      p.stats,
      NULLIF(p.stats->'dailyBestTimes'->today->>'time', '') AS raw_time
    FROM profiles p
  ),
  entries AS (
    SELECT
      username,
      user_id,
      stats,
      CAST(raw_time AS integer) AS time_secs
    FROM pre
    WHERE raw_time IS NOT NULL
  )
  SELECT
    CAST(ROW_NUMBER() OVER (ORDER BY time_secs ASC) AS integer) AS pos,
    username,
    time_secs,
    COALESCE(stats->'dailyBestTimes'->today->>'difficulty', '')  AS difficulty,
    user_id
  FROM entries
  ORDER BY time_secs ASC
  LIMIT 10;
$$;
