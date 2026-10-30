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

  // Look up only the accounts actually matched.
  //
  // This used to call listUsers({ perPage: 1000 }), which fetches a single page
  // of every account in the project to find the handful of addresses the job
  // needs. Two problems: past 1000 accounts anyone outside that first page was
  // silently skipped forever, and the work grew with the user base rather than
  // with the size of the job. Inactive players are a short list by definition.
  const lookups = await Promise.all(
    profiles.map(p => supabase.auth.admin.getUserById(p.user_id)),
  );

  const emailMap = {};
  for (const [i, { data, error: lookupError }] of lookups.entries()) {
    const id = profiles[i].user_id;
    if (lookupError || !data?.user?.email) {
      console.error('[RE-ENGAGE] No address for user:', id, lookupError?.message || 'no email');
      continue;
    }
    emailMap[id] = data.user.email;
  }

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
        from: 'The BreachOS Team <breachos@breachos.app>',
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
