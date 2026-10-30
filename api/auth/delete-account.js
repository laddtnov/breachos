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

  // Two deletes across two systems with no transaction between them, so one of
  // them can fail with the other already done. The profile goes first and now
  // aborts on failure: nothing has been destroyed at that point, so the player
  // can simply press delete again.
  //
  // Deleting the login first would make the opposite failure the likely one —
  // the login gone, the stats row left behind with its username still on the
  // leaderboard, and no way for that player to retry because they can no longer
  // sign in. For a page that promises a hard delete, leaving the data is the
  // worse half to drop.
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', user.id);

  if (profileError) {
    console.error('[DELETE-ACCOUNT] Profile delete failed:', user.id, profileError.message);
    return res.status(500).json({ error: 'Failed to delete account — please try again' });
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    // The stats are already gone and cannot come back, so this is logged loudly
    // enough to find: the account still exists and needs removing by hand.
    console.error('[DELETE-ACCOUNT] Profile deleted but user remains — needs manual cleanup:',
      user.id, deleteError.message);
    return res.status(500).json({ error: 'Failed to delete account — please contact support' });
  }

  return res.status(200).json({ success: true });
}
