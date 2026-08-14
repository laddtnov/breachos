// In-memory sliding-window rate limiter.
// Works per serverless container (warm reuse). Upgrade to @upstash/ratelimit
// + @upstash/redis for distributed limiting across cold-start boundaries.

const windows = new Map();

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

  const timestamps = (windows.get(bucketKey) || []).filter(t => t > cutoff);
  const allowed = timestamps.length < limit;

  if (allowed) {
    timestamps.push(now);
  }

  windows.set(bucketKey, timestamps);

  // Evict stale buckets periodically (every ~100 checks) to bound memory usage
  if (Math.random() < 0.01) {
    for (const [k, ts] of windows.entries()) {
      if (ts.every(t => t <= cutoff)) windows.delete(k);
    }
  }

  const oldest = timestamps[0] || now;
  return {
    allowed,
    remaining: Math.max(0, limit - timestamps.length),
    resetMs: oldest + windowMs,
  };
}
