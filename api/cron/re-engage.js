import { Resend } from 'resend';
import supabase from '../../lib/db.js';
import { reEngageEmail } from '../../lib/emails.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const INACTIVE_DAYS    = 14;  // send after this many days of inactivity
const RESEND_COOL_DAYS = 30;  // don't re-send within this many days

export default async function handler(req, res) {
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET>
  const secret = req.headers.authorization?.replace('Bearer ', '').trim();
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const inactiveCutoff  = new Date(Date.now() - INACTIVE_DAYS  * 86400000).toISOString();
  const resendCutoff    = new Date(Date.now() - RESEND_COOL_DAYS * 86400000).toISOString();

  // Find profiles inactive for 14+ days and not re-engaged in the last 30 days
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, username, last_seen, re_engage_sent_at')
    .lt('last_seen', inactiveCutoff)
    .or(`re_engage_sent_at.is.null,re_engage_sent_at.lt.${resendCutoff}`);

  if (error) {
    console.error('[RE-ENGAGE] Query failed:', error.message);
    return res.status(500).json({ error: 'Query failed' });
  }

  if (!profiles?.length) {
    return res.status(200).json({ sent: 0, message: 'No inactive users found' });
  }

  // Fetch emails from Supabase auth for matched user IDs
  const { data: { users: authUsers }, error: authError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (authError) {
    console.error('[RE-ENGAGE] Auth listUsers failed:', authError.message);
    return res.status(500).json({ error: 'Auth query failed' });
  }

  const emailMap = Object.fromEntries(authUsers.map(u => [u.id, u.email]));

  let sent = 0;
  const now = new Date().toISOString();

  for (const profile of profiles) {
    const email = emailMap[profile.user_id];
    if (!email) continue;

    const daysMissing = Math.floor(
      (Date.now() - new Date(profile.last_seen).getTime()) / 86400000
    );

    try {
      await resend.emails.send({
        from: 'The BreachOS Team <breachos@laddtnov.xyz>',
        to: email,
        subject: 'SIGNAL LOST — WHERE ARE YOU, AGENT?',
        html: reEngageEmail(profile.username, daysMissing),
      });

      await supabase
        .from('profiles')
        .update({ re_engage_sent_at: now })
        .eq('user_id', profile.user_id);

      sent++;
    } catch (e) {
      console.error(`[RE-ENGAGE] Failed for user ${profile.user_id}:`, e?.message);
    }
  }

  return res.status(200).json({ sent, total: profiles.length });
}
