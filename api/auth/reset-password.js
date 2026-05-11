import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body        = req.body || {};
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
  const password    = typeof body.password    === 'string' ? body.password           : '';

  if (!accessToken) return res.status(400).json({ error: 'Access token required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  // Verify the recovery token and get the user
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user)
    return res.status(401).json({ error: 'Invalid or expired reset link — request a new one' });

  // Update password via admin API
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password }
  );

  if (updateError) {
    console.error('[RESET] Update error:', updateError.message);
    return res.status(500).json({ error: 'Failed to update password' });
  }

  return res.status(200).json({ success: true });
}
