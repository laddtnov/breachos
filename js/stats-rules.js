// ── Stats Rules — pure reporting logic, no DOM ──
// Kept free of DOM and browser globals so test/stats.test.js can evaluate it in
// a vm sandbox.

// Mode labels for the Dossier's mission history.
//
// History is saved player data, so it outlives the modes that wrote it. Timed
// mode was built and reverted, but entries recorded as 'timed' remain in saved
// histories and were rendering as "TIMED" — naming a mode the player can no
// longer select. It was a countdown mode, so it reads as its live equivalent.
const GAME_HISTORY_MODE_LABELS = {
  classic:  'CLASSIC',
  blitz:    'BLITZ',
  survival: 'SURVIVAL',
  daily:    'DAILY',
  weekly:   'WEEKLY',
  timed:    'BLITZ', // retired mode
};

function gameHistoryModeLabel(mode) {
  if (!mode) return '—';
  return GAME_HISTORY_MODE_LABELS[mode] ?? String(mode).toUpperCase();
}

// Win rate as a whole percent, clamped to 0–100.
//
// The clamp is not defensive padding: survival used to increment gamesWon per
// wave cleared while gamesPlayed only advanced once per run, so saves already
// exist — locally and synced to Supabase — where wins exceed games played. The
// increment is fixed at the source in survival.js, but those saves stay skewed,
// and a stored 8/7 must not surface as "114%".
function calculateWinRate(won, played) {
  const wins = Number(won) || 0;
  const games = Number(played) || 0;
  if (games <= 0) return 0;
  const rate = Math.round((wins / games) * 100);
  return Math.min(Math.max(rate, 0), 100);
}
