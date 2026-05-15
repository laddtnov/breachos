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
  SELECT
    CAST(ROW_NUMBER() OVER (
      ORDER BY CAST(COALESCE(NULLIF(stats->'dailyBestTimes'->today->>'time',''),'99999') AS integer) ASC
    ) AS integer)                                                                AS pos,
    p.username                                                                  AS username,
    CAST(COALESCE(NULLIF(stats->'dailyBestTimes'->today->>'time',''),'0') AS integer) AS time_secs,
    COALESCE(stats->'dailyBestTimes'->today->>'difficulty', '')                AS difficulty,
    p.user_id                                                                   AS user_id
  FROM profiles p
  WHERE stats->'dailyBestTimes'->today->>'time' IS NOT NULL
    AND NULLIF(stats->'dailyBestTimes'->today->>'time', '') IS NOT NULL
  ORDER BY time_secs ASC
  LIMIT 10;
$$;
