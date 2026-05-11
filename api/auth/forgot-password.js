import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body  = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) return res.status(400).json({ error: 'Email required' });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://breachos.laddtnov.xyz/',
  });

  // Always return success — prevents email enumeration attacks
  if (error) console.error('[FORGOT] Reset email error:', error.message);

  return res.status(200).json({ success: true });
}
