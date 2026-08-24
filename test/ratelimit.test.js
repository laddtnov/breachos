// Tests for the shared rate limiter.
//
// It is the only brute-force and email-bomb control in front of the auth
// routes, and every route shares one module-level Map — so the interesting
// cases are the ones where traffic to one bucket affects another.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { checkRateLimit } = require('../lib/ratelimit.js');

// The limiter reads the client address off the request, so each test uses its
// own address to stay independent of the others.
function reqFrom(ip) {
  return { headers: { 'x-forwarded-for': ip }, socket: { remoteAddress: ip } };
}

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

describe('checkRateLimit', () => {
  test('allows up to the limit and refuses the next request', () => {
    const req = reqFrom('10.0.0.1');

    for (let i = 0; i < 3; i += 1) {
      assert.strictEqual(checkRateLimit(req, 'test-basic', 3, HOUR).allowed, true);
    }

    assert.strictEqual(checkRateLimit(req, 'test-basic', 3, HOUR).allowed, false);
  });

  test('counts each bucket separately', () => {
    const req = reqFrom('10.0.0.2');

    checkRateLimit(req, 'test-a', 1, HOUR);
    assert.strictEqual(checkRateLimit(req, 'test-a', 1, HOUR).allowed, false);
    assert.strictEqual(checkRateLimit(req, 'test-b', 1, HOUR).allowed, true);
  });

  test('counts each client address separately', () => {
    checkRateLimit(reqFrom('10.0.0.3'), 'test-ip', 1, HOUR);

    assert.strictEqual(
      checkRateLimit(reqFrom('10.0.0.4'), 'test-ip', 1, HOUR).allowed,
      true
    );
  });

  test('traffic to a short-window bucket does not clear a long-window one', (t) => {
    // Time is faked so the hourly bucket's entries can age past the one-minute
    // window without the test sleeping.
    t.mock.timers.enable({ apis: ['Date'] });

    // The eviction sweep runs on a schedule of its own and used the calling
    // request's window to decide what was stale. /api/sync/save has a
    // one-minute window and is rate limited before its token is checked, so
    // 100 unauthenticated requests to it were enough to wipe every other
    // bucket — including the three-per-hour password reset limit.
    const attacker = reqFrom('10.0.0.5');

    for (let i = 0; i < 3; i += 1) {
      checkRateLimit(attacker, 'test-forgot', 3, HOUR);
    }
    assert.strictEqual(
      checkRateLimit(attacker, 'test-forgot', 3, HOUR).allowed,
      false,
      'precondition: the hourly bucket is exhausted'
    );

    // The forgot-password entries are now 2 minutes old — well inside their
    // 1-hour window, but older than the 1-minute window the flood below uses.
    // The eviction sweep computes its cutoff from the *triggering* call's own
    // windowMs, not the bucket it is inspecting, so a bucket only survives if
    // that unrelated cutoff happens not to reach it.
    t.mock.timers.tick(2 * MINUTE);

    // Enough short-window traffic to trigger the sweep (every 100th call).
    for (let i = 0; i < 300; i += 1) {
      checkRateLimit(reqFrom(`10.1.${i % 250}.1`), 'test-flood', 1000, MINUTE);
    }

    assert.strictEqual(
      checkRateLimit(attacker, 'test-forgot', 3, HOUR).allowed,
      false,
      'the hourly bucket must still be exhausted after the sweep'
    );
  });
});
