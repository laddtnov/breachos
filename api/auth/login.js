import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
