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
