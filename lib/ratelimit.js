// In-memory sliding-window rate limiter.
// Works per serverless container (warm reuse). Upgrade to @upstash/ratelimit
// + @upstash/redis for distributed limiting across cold-start boundaries.

const windows = new Map();
let callCount = 0;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (typeof forwarded === 'string' ? forwarded.split(',')[0] : null)
    || req.socket?.remoteAddress
    || 'unknown';
}

/**
 * @param {object} req - Vercel request
 * @param {string} key - rate limit bucket identifier (e.g. 'login', 'register')
 * @param {number} limit - max requests allowed in the window
 * @param {number} windowMs - sliding window duration in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
export function checkRateLimit(req, key, limit, windowMs) {
  const ip = getClientIp(req);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = windows.get(bucketKey);
  const timestamps = (bucket?.timestamps || []).filter(t => t > cutoff);
  const allowed = timestamps.length < limit;

  if (allowed) {
    timestamps.push(now);
  }

  // windowMs is stored per bucket rather than assumed global: routes use
  // different windows (login is 15 minutes, forgot-password is 1 hour), and
  // the eviction sweep below needs each bucket's own window, not whichever
  // call happens to trigger the sweep.
  windows.set(bucketKey, { timestamps, windowMs });

  // Evict stale buckets every 100 calls to bound memory usage. Previously
  // this reused the triggering call's own cutoff for every bucket in the
  // map, so a short-window flood (e.g. sync-save, 1 minute) could evict a
  // long-window bucket's real timestamps (e.g. forgot-password, 1 hour) as
  // soon as they aged past the flood's shorter window — silently resetting
  // an attacker's hourly quota mid-attack.
  callCount += 1;
  if (callCount % 100 === 0) {
    for (const [k, entry] of windows.entries()) {
      const ownCutoff = now - entry.windowMs;
      if (entry.timestamps.every(t => t <= ownCutoff)) windows.delete(k);
    }
  }

  const oldest = timestamps[0] || now;
  return {
    allowed,
    remaining: Math.max(0, limit - timestamps.length),
    resetMs: oldest + windowMs,
  };
}
