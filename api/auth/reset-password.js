import supabase from '../../lib/db.js';
import { checkRateLimit } from '../../lib/ratelimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // This was the only auth route with no limit, and it sets a password.
  const rl = checkRateLimit(req, 'reset-password', 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', Math.ceil((rl.resetMs - Date.now()) / 1000));
    return res.status(429).json({ error: 'Too many reset attempts — try again later' });
  }

  const body        = req.body || {};
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : '';
  const password    = typeof body.password    === 'string' ? body.password           : '';

  if (!accessToken) return res.status(400).json({ error: 'Access token required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  // Verify the recovery token and get the user
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user)
    return res.status(401).json({ error: 'Invalid or expired reset link — request a new one' });

  // getUser() accepts ANY valid access token, not only one minted by a recovery
  // link, so an ordinary session token could set a new password — turning a
  // stolen token into permanent account takeover rather than temporary access.
  //
  // This rejects the case that is definitely wrong (a plain password login)
  // rather than allow-listing the one that is right. Supabase documents `amr`
  // as optional and does not state which method a recovery link produces, so an
  // allow-list would lock every real user out of password reset the moment the
  // string differed. Deny-listing fails open on the unknown and closed on the
  // known: a recovery token passes whatever its method is, a login session
  // does not.
  if (isPasswordLoginToken(accessToken)) {
    return res.status(401).json({ error: 'This link cannot be used to reset a password — request a new one' });
  }

  // Update password via admin API
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password }
  );

  if (updateError) {
    console.error('[RESET] Update error:', updateError.message);
    return res.status(500).json({ error: 'Failed to update password' });
  }

  return res.status(200).json({ success: true });
}

// True only when the token's AMR claim says every authentication step was a
// password login — i.e. this is someone's ordinary session, not a recovery.
// Returns false when the claim is absent or holds anything else, so an
// unrecognised token shape is allowed through rather than breaking reset.
//
// Reads an already signature-verified token: getUser() above validates it
// against Supabase, and this only inspects what kind of token it is. Decoding
// the payload without re-checking the signature is safe here and nowhere else.
function isPasswordLoginToken(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return false;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const methods = Array.isArray(json.amr) ? json.amr : [];
    if (methods.length === 0) return false;
    return methods.every(entry => (entry?.method ?? entry) === 'password');
  } catch {
    return false;
  }
}
