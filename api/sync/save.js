import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  const { stats } = req.body || {};
  if (!stats || typeof stats !== 'object' || Array.isArray(stats))
    return res.status(400).json({ error: 'Invalid stats payload' });

  const now = new Date().toISOString();

  // Core upsert — stats + updated_at only (always required columns)
  const { error: upsertError } = await supabase.from('profiles').upsert(
    { user_id: user.id, stats, updated_at: now },
    { onConflict: 'user_id' }
  );

  if (upsertError) {
    console.error('[SYNC/SAVE] upsert error:', upsertError.message);
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
