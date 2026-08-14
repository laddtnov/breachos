import supabase from '../../lib/db.js';
import { checkRateLimit } from '../../lib/ratelimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(req, 'delete-account', 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.ceil((rl.resetMs - Date.now()) / 1000));
    return res.status(429).json({ error: 'Too many requests — try again later' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  await supabase.from('profiles').delete().eq('user_id', user.id);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[DELETE-ACCOUNT] Failed to delete user:', user.id, deleteError.message);
    return res.status(500).json({ error: 'Failed to delete account — please contact support' });
  }

  return res.status(200).json({ success: true });
}
