import supabase from '../../lib/db.js';
import { checkRateLimit } from '../../lib/ratelimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(req, 'login', 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.ceil((rl.resetMs - Date.now()) / 1000));
    return res.status(429).json({ error: 'Too many login attempts — try again later' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'Invalid credentials' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', data.user.id)
    .single();

  return res.status(200).json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      username: profile?.username || 'NETRUNNER',
    },
  });
}
