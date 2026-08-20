// Tests for the password-reset token-type guard.
//
// The endpoint validates the token against Supabase with getUser(), which
// accepts ANY valid access token — including an ordinary session. This guard is
// what stops a stolen session token being used to set a new password and lock
// the real owner out.
//
// The function is deliberately a deny-list: Supabase documents `amr` as
// optional and does not state which method a recovery link produces, so
// allow-listing "recovery" would lock every real user out of password reset the
// moment that string differed. These tests pin the fail-open direction.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// The handler imports Supabase, so the guard is extracted and evaluated alone.
function loadGuard() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'api', 'auth', 'reset-password.js'), 'utf8',
  );
  const start = src.indexOf('function isPasswordLoginToken');
  assert.ok(start > -1, 'isPasswordLoginToken not found — did it get renamed?');

  const sandbox = { Buffer, JSON, Array, Object, String };
  vm.runInNewContext(src.slice(start), sandbox);
  return sandbox.isPasswordLoginToken;
}

const isPasswordLoginToken = loadGuard();

function tokenWith(payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `header.${body}.signature`;
}

describe('isPasswordLoginToken — rejects an ordinary session', () => {
  test('identifies a plain password login', () => {
    const token = tokenWith({ amr: [{ method: 'password', timestamp: 1 }] });

    assert.strictEqual(isPasswordLoginToken(token), true);
  });

  test('identifies a password login that also passed MFA', () => {
    const token = tokenWith({ amr: [{ method: 'password' }, { method: 'totp' }] });

    // Not every entry is a password, so this is allowed through by the rule —
    // pinned so the behaviour is a decision rather than an accident.
    assert.strictEqual(isPasswordLoginToken(token), false);
  });
});

describe('isPasswordLoginToken — fails open on anything unrecognised', () => {
  test('allows a recovery token through', () => {
    const token = tokenWith({ amr: [{ method: 'recovery', timestamp: 1 }] });

    assert.strictEqual(isPasswordLoginToken(token), false);
  });

  test('allows an otp token through, whatever Supabase names the method', () => {
    const token = tokenWith({ amr: [{ method: 'otp' }] });

    assert.strictEqual(isPasswordLoginToken(token), false);
  });

  test('allows a token with no amr claim at all', () => {
    // The claim is documented as optional. Rejecting here would break reset.
    assert.strictEqual(isPasswordLoginToken(tokenWith({ sub: 'user' })), false);
  });

  test('allows a token with an empty amr array', () => {
    assert.strictEqual(isPasswordLoginToken(tokenWith({ amr: [] })), false);
  });

  test('handles bare string methods as well as objects', () => {
    assert.strictEqual(isPasswordLoginToken(tokenWith({ amr: ['password'] })), true);
    assert.strictEqual(isPasswordLoginToken(tokenWith({ amr: ['recovery'] })), false);
  });
});

describe('isPasswordLoginToken — malformed input', () => {
  test('does not throw on a token with no payload segment', () => {
    assert.strictEqual(isPasswordLoginToken('notatoken'), false);
  });

  test('does not throw on undecodable base64', () => {
    assert.strictEqual(isPasswordLoginToken('header.!!!!.signature'), false);
  });

  test('does not throw on a payload that is not JSON', () => {
    const body = Buffer.from('hello', 'utf8').toString('base64url');

    assert.strictEqual(isPasswordLoginToken(`header.${body}.sig`), false);
  });

  test('does not throw on an empty string', () => {
    assert.strictEqual(isPasswordLoginToken(''), false);
  });
});
