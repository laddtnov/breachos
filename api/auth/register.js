import { Resend } from 'resend';
import supabase from '../../lib/db.js';
import { welcomeEmail } from '../../lib/emails.js';
import { checkRateLimit } from '../../lib/ratelimit.js';

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(str) {
  const at  = typeof str === 'string' ? str.indexOf('@') : -1;
  const dot = at > 0 ? str.lastIndexOf('.') : -1;
  return at > 0 && dot > at + 1 && dot < str.length - 1 && str.length <= 254;
}


// Reads the three fields out of the body and checks them. Returns either the
// cleaned credentials or the message to reject with, so the handler stays one
// straight line of create-the-account steps.
function readCredentials(body = {}) {
  const email    = typeof body.email    === 'string' ? body.email.trim()    : '';
  const password = typeof body.password === 'string' ? body.password        : '';
  const username = typeof body.username === 'string' ? body.username.trim() : '';

  if (!isValidEmail(email)) return { error: 'Invalid email' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };
  if (username.length < 2 || username.length > 20)
    return { error: 'Username must be 2–20 characters' };
  if (!/^[A-Za-z0-9_\-. ]{2,20}$/.test(username))
    return { error: 'Username may only contain letters, numbers, _, -, . and spaces' };

  return { email, password, username };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(req, 'register', 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.ceil((rl.resetMs - Date.now()) / 1000));
    return res.status(429).json({ error: 'Too many registration attempts — try again later' });
  }

  const { email, password, username, error: invalid } = readCredentials(req.body || {});
  if (invalid) return res.status(400).json({ error: invalid });

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already exists'))
      return res.status(409).json({ error: 'Email already registered' });
    console.error('[REGISTER] Auth error:', authError.message);
    return res.status(400).json({ error: 'Registration failed — please check your details and try again' });
  }

  // The profile row is where every later save writes. If it is missing,
  // /api/sync/save has nothing to update and reports success while storing
  // nothing, so a failure here has to stop registration rather than hand back
  // a working login that can never save. The auth user is removed first so the
  // address is free to register again.
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: authData.user.id,
    username,
    stats: {},
  });

  if (profileError) {
    console.error('[REGISTER] Profile insert failed:', profileError.message);
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    const duplicate = profileError.code === '23505';
    return res.status(duplicate ? 409 : 500).json({
      error: duplicate
        ? 'Username already taken'
        : 'Registration failed — please try again',
    });
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return res.status(500).json({ error: 'Account created but login failed — try logging in manually' });

  try {
    await resend.emails.send({
      from: 'The BreachOS Team <breachos@breachos.app>',
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
