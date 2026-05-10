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

  const { error: upsertError } = await supabase.from('profiles').upsert(
    { user_id: user.id, stats, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  if (upsertError) return res.status(500).json({ error: 'Failed to save progress' });

  return res.status(200).json({ success: true });
}
