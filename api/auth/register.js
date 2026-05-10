import { Resend } from 'resend';
import supabase from '../../lib/db.js';
const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(str) {
  const at  = typeof str === 'string' ? str.indexOf('@') : -1;
  const dot = at > 0 ? str.lastIndexOf('.') : -1;
  return at > 0 && dot > at + 1 && dot < str.length - 1 && str.length <= 254;
}

function welcomeEmail(username) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050508;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050508;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#08080f;border:2px solid #00f3ff;border-radius:12px;box-shadow:0 0 30px rgba(0,243,255,0.3);">
        <tr><td style="padding:36px 36px 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:6px;color:rgba(0,243,255,0.5);text-transform:uppercase;">ACCESS GRANTED</p>
          <h1 style="margin:0;font-size:28px;letter-spacing:6px;color:#00f3ff;text-shadow:0 0 20px rgba(0,243,255,0.6);text-transform:uppercase;">BREACH<span style="color:#ff0055;">OS</span></h1>
          <div style="margin:16px auto 0;height:1px;background:linear-gradient(90deg,transparent,#00f3ff,transparent);max-width:300px;"></div>
        </td></tr>
        <tr><td style="padding:20px 36px 0;text-align:center;">
          <p style="margin:0;font-size:12px;letter-spacing:4px;color:#00ff88;text-transform:uppercase;">▶ IDENTITY CONFIRMED ◀</p>
        </td></tr>
        <tr><td style="padding:28px 36px;">
          <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(0,243,255,0.85);letter-spacing:1px;">OPERATIVE ${username},</p>
          <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">Your Netrunner ID has been registered. Your progress — ranks, skins, achievements, collection cards — now syncs automatically across every device you play on.</p>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.9;color:rgba(255,255,255,0.75);">The net remembers everything.</p>
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,243,255,0.3),transparent);margin:0 0 24px;"></div>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="https://breachos.laddtnov.xyz/" target="_blank"
               style="display:inline-block;padding:14px 32px;background:transparent;color:#00f3ff;border:2px solid #00f3ff;border-radius:6px;font-family:'Courier New',monospace;font-size:13px;font-weight:bold;letter-spacing:3px;text-decoration:none;text-transform:uppercase;">
              ▶ BREACH THE SYSTEM
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:0 36px 32px;text-align:center;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(0,243,255,0.2),transparent);margin-bottom:20px;"></div>
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:rgba(0,243,255,0.4);text-transform:uppercase;">The BreachOS Team</p>
          <p style="margin:0;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.2);text-transform:uppercase;">breachos.laddtnov.xyz</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
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
