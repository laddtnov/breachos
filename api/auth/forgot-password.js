import { Resend } from 'resend';
import supabase from '../../lib/db.js';
import { resetEmail } from '../../lib/emails.js';
import { checkRateLimit } from '../../lib/ratelimit.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rl = checkRateLimit(req, 'forgot', 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.ceil((rl.resetMs - Date.now()) / 1000));
    return res.status(429).json({ error: 'Too many requests — try again later' });
  }

  const body  = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  if (!email) return res.status(400).json({ error: 'Email required' });

  // Generate a recovery link via Supabase admin (no email sent by Supabase)
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: 'https://breachos.laddtnov.xyz/' },
  });

  if (error) {
    // Always return success to prevent email enumeration
    console.error('[FORGOT] generateLink error:', error.message);
    return res.status(200).json({ success: true });
  }

  const resetUrl = data?.properties?.action_link;
  if (!resetUrl) {
    console.error('[FORGOT] No action_link in response');
    return res.status(200).json({ success: true });
  }

  // Send via Resend using our cyberpunk template
  try {
    await resend.emails.send({
      from: 'The BreachOS Team <breachos@laddtnov.xyz>',
      to: email,
      subject: 'SIGNAL LOST — RESET YOUR ACCESS CODE',
      html: resetEmail(resetUrl),
    });
  } catch (e) {
    console.error('[FORGOT] Resend error:', e?.message);
  }

  return res.status(200).json({ success: true });
}
