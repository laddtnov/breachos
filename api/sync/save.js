import supabase from '../../lib/db.js';
import { checkRateLimit } from '../../lib/ratelimit.js';
import { sanitizeStats } from '../../lib/stats-validation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // A game takes at least half a minute, so a real player saves once or twice a
  // minute; 20 leaves an order of magnitude of headroom. The limit exists to
  // slow a script looping the endpoint to walk XP up one allowance at a time.
  const rl = checkRateLimit(req, 'sync-save', 20, 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.ceil((rl.resetMs - Date.now()) / 1000));
    return res.status(429).json({ error: 'Too many saves — slow down' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  // What arrives here is whatever the client chose to send, and the leaderboard
  // ranks on the xp inside it — so it is rebuilt field by field before storage.
  // See lib/stats-validation.js.
  const { data: existing } = await supabase
    .from('profiles')
    .select('stats')
    .eq('user_id', user.id)
    .single();

  const { stats, rejected } = sanitizeStats(req.body?.stats, existing?.stats);
  if (!stats) return res.status(400).json({ error: 'Invalid stats payload' });

  if (rejected) {
    // Not an error to the player — an honest client cannot produce this, so it
    // is worth seeing in the logs.
    console.warn('[SYNC/SAVE] XP gain beyond allowance, keeping stored value:', user.id);
  }

  const now = new Date().toISOString();

  // Update existing profile row — profile is always created at registration
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ stats, updated_at: now })
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[SYNC/SAVE] update error:', updateError.message);
    return res.status(500).json({ error: 'Failed to save progress' });
  }

  // Update last_seen separately — fails gracefully if column not yet added
  await supabase.from('profiles')
    .update({ last_seen: now })
    .eq('user_id', user.id)
    .then(({ error }) => {
      if (error) console.warn('[SYNC/SAVE] last_seen update skipped:', error.message);
    });

  return res.status(200).json({ success: true });
}
