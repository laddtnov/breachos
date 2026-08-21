// The Play Store build hides the SUPPORT button; the web keeps it.
//
// Google requires digital purchases made inside an Android app to go through
// Play Billing, and a link out to Buy Me A Coffee is exactly the external
// payment path that gets a listing rejected. A TWA cannot use Play Billing
// without the Digital Goods API, so the button comes out of the app rather
// than being reworked.
//
// A TWA is Chrome, not a WebView, so the user agent is indistinguishable from
// the browser and cannot be used to tell them apart. What does identify it is
// the launch referrer: Android sets it to android-app://<package>. That is
// only present on the document the app launched, so the answer is stored — a
// reload inside the app has no referrer and would otherwise put the button
// back.
const STORE_BUILD_KEY = 'breachos_store_build';

function isAndroidAppLaunch(referrer) {
  return typeof referrer === 'string' && referrer.startsWith('android-app://');
}

function isStoreBuild(referrer, stored) {
  return isAndroidAppLaunch(referrer) || stored === '1';
}

function applyStoreBuildRules() {
  let stored = null;
  try {
    stored = localStorage.getItem(STORE_BUILD_KEY);
  } catch {
    // Storage can throw outright in private mode. A web visitor losing the
    // sticky flag only means the referrer check runs again next launch.
  }

  if (!isStoreBuild(document.referrer, stored)) return;

  try {
    localStorage.setItem(STORE_BUILD_KEY, '1');
  } catch { /* see above */ }

  // Removed rather than hidden: nothing else reads these, and leaving a
  // hidden element carrying the payment URL in the app's DOM serves no one.
  document
    .querySelectorAll('#support-btn, .menu-item-support')
    .forEach(el => el.remove());
}
