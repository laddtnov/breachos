import { Resend } from 'resend';
import supabase from '../../lib/db.js';
import { welcomeEmail } from '../../lib/emails.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(str) {
  const at  = typeof str === 'string' ? str.indexOf('@') : -1;
  const dot = at > 0 ? str.lastIndexOf('.') : -1;
  return at > 0 && dot > at + 1 && dot < str.length - 1 && str.length <= 254;
}


export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, username } = req.body || {};

  if (!isValidEmail(email))
    return res.status(400).json({ error: 'Invalid email' });
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!username || username.length < 2 || username.length > 20)
    return res.status(400).json({ error: 'Username must be 2–20 characters' });

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists'))
      return res.status(409).json({ error: 'Email already registered' });
    return res.status(400).json({ error: authError.message });
  }

  await supabase.from('profiles').insert({
    user_id: authData.user.id,
    username,
    stats: {},
  });

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return res.status(500).json({ error: 'Account created but login failed — try logging in manually' });

  try {
    await resend.emails.send({
      from: 'The BreachOS Team <breachos@laddtnov.xyz>',
      to: email,
      subject: 'ACCESS GRANTED — WELCOME TO BREACH OS',
      html: welcomeEmail(username),
    });
  } catch (e) {
    console.error('[Resend] Welcome email failed:', e?.message);
  }

  return res.status(200).json({
    token: signInData.session.access_token,
    user: { id: authData.user.id, email, username },
  });
}
