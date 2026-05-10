import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('stats, username')
    .eq('user_id', user.id)
    .single();

  return res.status(200).json({
    stats: profile?.stats || {},
    username: profile?.username || 'NETRUNNER',
  });
}
