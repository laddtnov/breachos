// Tests for the service worker's decision about what it will cache.
//
// Reported from a real console: "Failed to execute 'put' on 'Cache': Request
// scheme 'chrome-extension' is unsupported". The worker handled every GET,
// including the chrome-extension:// requests browser extensions send through
// the page, and cache.put() rejects outright on schemes it does not support.
//
// The file registers event listeners at the top level, so the predicate is
// extracted and evaluated on its own rather than importing the worker.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ORIGIN = 'https://breachos.laddtnov.xyz';

function loadIsCacheable() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const start = src.indexOf('function isCacheable');
  assert.ok(start > -1, 'isCacheable not found — did it get renamed?');
  const end = src.indexOf('\n}', start) + 2;

  const sandbox = { URL, globalThis: { location: { origin: ORIGIN } } };
  vm.runInNewContext(src.slice(start, end), sandbox);
  return sandbox.isCacheable;
}

const isCacheable = loadIsCacheable();
const req = (url, method = 'GET') => ({ url, method });

describe('isCacheable — what the worker should cache', () => {
  test('caches a same-origin script', () => {
    assert.strictEqual(isCacheable(req(`${ORIGIN}/js/game.js`)), true);
  });

  test('caches a same-origin stylesheet', () => {
    assert.strictEqual(isCacheable(req(`${ORIGIN}/css/base.css`)), true);
  });

  test('caches a partial', () => {
    assert.strictEqual(isCacheable(req(`${ORIGIN}/partials/game-area.html`)), true);
  });

  test('caches the page itself', () => {
    assert.strictEqual(isCacheable(req(`${ORIGIN}/`)), true);
  });

  test('caches a page opened from a Friend Challenge link', () => {
    assert.strictEqual(isCacheable(req(`${ORIGIN}/?c=16mnord-1-o-1b`)), true);
  });
});

describe('isCacheable — the reported crash', () => {
  test('refuses a chrome-extension request', () => {
    // cache.put() throws on this scheme. The extension request must never
    // reach the worker's cache at all.
    assert.strictEqual(isCacheable(req('chrome-extension://abcdef/inject.js')), false);
  });

  test('refuses other unsupported schemes', () => {
    for (const url of ['moz-extension://x/y.js', 'data:text/plain,hi', 'blob:https://x/y']) {
      assert.strictEqual(isCacheable(req(url)), false, url);
    }
  });
});

describe('isCacheable — cross-origin and API', () => {
  test('refuses a third-party script', () => {
    assert.strictEqual(isCacheable(req('https://vercel.live/_next-live/feedback/feedback.js')), false);
  });

  test('refuses same-origin API responses', () => {
    // These are per-user and authenticated; storing them in the static asset
    // cache would leave one player's stats on disk for the next person.
    assert.strictEqual(isCacheable(req(`${ORIGIN}/api/sync/load`)), false);
    assert.strictEqual(isCacheable(req(`${ORIGIN}/api/leaderboard/get`)), false);
  });

  test('does not mistake a path merely containing api for an API route', () => {
    assert.strictEqual(isCacheable(req(`${ORIGIN}/js/rapid.js`)), true);
  });
});

describe('isCacheable — non-GET', () => {
  test('refuses POST, PUT and DELETE', () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'HEAD']) {
      assert.strictEqual(isCacheable(req(`${ORIGIN}/index.html`, method)), false, method);
    }
  });
});
