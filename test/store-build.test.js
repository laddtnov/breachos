const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// js/store-build.js touches the DOM in applyStoreBuildRules, but the decision
// of whether this is the Play Store build is pure and is what matters — it
// decides whether an external payment link is shown inside an Android app,
// which is a listing-rejection risk if it gets it wrong.
const source = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'store-build.js'),
  'utf8'
);
const context = { document: { referrer: '' }, localStorage: null };
vm.runInNewContext(source, context);
const { isAndroidAppLaunch, isStoreBuild } = context;

describe('isAndroidAppLaunch', () => {
  test('recognises the referrer Android sets when a TWA launches', () => {
    assert.strictEqual(
      isAndroidAppLaunch('android-app://xyz.laddtnov.breachos'),
      true
    );
  });

  test('treats an empty referrer as a plain web visit', () => {
    assert.strictEqual(isAndroidAppLaunch(''), false);
  });

  test('treats an ordinary http referrer as a plain web visit', () => {
    assert.strictEqual(isAndroidAppLaunch('https://google.com/'), false);
  });

  test('does not match a scheme that merely contains the prefix', () => {
    assert.strictEqual(
      isAndroidAppLaunch('https://evil.test/?r=android-app://x'),
      false
    );
  });

  test('handles a missing referrer rather than throwing', () => {
    assert.strictEqual(isAndroidAppLaunch(undefined), false);
  });
});

describe('isStoreBuild', () => {
  test('is true on the launch document of the Android app', () => {
    assert.strictEqual(isStoreBuild('android-app://xyz.laddtnov.breachos', null), true);
  });

  test('stays true on a reload, where the referrer is gone', () => {
    // The referrer only survives the launch navigation. Without the stored
    // flag a reload inside the app would put the SUPPORT button back.
    assert.strictEqual(isStoreBuild('', '1'), true);
  });

  test('is false for a web visit with nothing stored', () => {
    assert.strictEqual(isStoreBuild('', null), false);
  });

  test('ignores a stored value that is not the flag', () => {
    assert.strictEqual(isStoreBuild('', '0'), false);
  });
});
