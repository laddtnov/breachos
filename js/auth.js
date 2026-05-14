// ── Auth & Cross-Device Sync ──

// localStorage entry names (not secrets — just storage identifiers)
const TOKEN_STORE = 'breachos_auth_token';
const USER_STORE  = 'breachos_auth_user';

const authState = {
  token: localStorage.getItem(TOKEN_STORE) || null,
  user:  JSON.parse(localStorage.getItem(USER_STORE) || 'null'),
};

function isLoggedIn() {
  return !!authState.token;
}

function persistAuth(token, user) {
  authState.token = token;
  authState.user  = user;
  localStorage.setItem(TOKEN_STORE, token);
  localStorage.setItem(USER_STORE, JSON.stringify(user));
}

function clearAuth() {
  authState.token = null;
  authState.user  = null;
  localStorage.removeItem(TOKEN_STORE);
  localStorage.removeItem(USER_STORE);
}

// ── Merge: always take the higher value for numeric stats ──
function mergeStats(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const nums = ['xp','gamesPlayed','gamesWon','bestCombo','totalMatches',
                'bestWave','dailyCompleted','blitzWins','perfectWins','dailyStreak'];
  const merged = { ...local };
  for (const key of nums) {
    merged[key] = Math.max(local[key] || 0, remote[key] || 0);
  }
  merged.unlockedAchievements = [
    ...new Set([...(local.unlockedAchievements || []), ...(remote.unlockedAchievements || [])]),
  ];
  merged.unlockedSkins = [
    ...new Set([...(local.unlockedSkins || []), ...(remote.unlockedSkins || [])]),
  ];
  merged.activeSkin       = local.activeSkin;
  merged.activeTheme      = local.activeTheme;
  merged.activeSoundTheme = local.activeSoundTheme;
  return merged;
}

// ── Sync ──
async function syncSave() {
  if (!isLoggedIn()) return;
  const res = await fetch('/api/sync/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState.token}`,
    },
    body: JSON.stringify({ stats: playerStats }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Save failed (${res.status})`);
  }
}

async function syncLoad() {
  if (!isLoggedIn()) return;
  try {
    const res = await fetch('/api/sync/load', {
      headers: { 'Authorization': `Bearer ${authState.token}` },
    });
    if (res.status === 401) { clearAuth(); updateAuthUI(); return; }
    if (!res.ok) throw new Error('Server error');
    const { stats } = await res.json();
    const merged = mergeStats(playerStats, stats);
    playerStats = merged; // reassign the let binding declared in game.js
    saveStats(merged);
    if (typeof updateRankHUD === 'function') updateRankHUD();
    if (typeof refreshLeaderboardIfOpen === 'function') refreshLeaderboardIfOpen();
  } catch (e) {
    console.warn('[SYNC] Load failed', e?.message);
    throw e;
  }
}

// ── API calls ──
async function authRegister(email, password, username) {
  const res  = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  persistAuth(data.token, data.user);
  updateAuthUI();
  return data;
}

async function authLogin(email, password) {
  const res  = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  persistAuth(data.token, data.user);
  updateAuthUI();
  return data;
}

function authLogout() {
  clearAuth();
  updateAuthUI();
}

function handleLogout() {
  authLogout();
  showAuthPanel('loggedout');
  // Auto-close modal after 1.5 s
  setTimeout(() => {
    const modal = document.getElementById('auth-modal');
    if (modal?.open) modal.close();
  }, 1500);
}

// ── Panel navigation ──
const ALL_PANELS = [
  'choose','signup','emailsent','login',
  'forgot','forgotdone','reset','resetsuccess',
  'syncing','loggedin','loggedout',
];

function showAuthPanel(name) {
  ALL_PANELS.forEach(p => {
    document.getElementById('auth-panel-' + p)?.classList.add('hidden');
  });
  document.getElementById('auth-panel-' + name)?.classList.remove('hidden');
}

// ── Recovery token (set when #type=recovery detected in URL) ──
let _recoveryToken = null;

// ── Forgot password handler ──
async function handleForgot() {
  const email = document.getElementById('forgot-email')?.value.trim();
  const btn   = document.getElementById('forgot-btn');
  const err   = document.getElementById('forgot-error');

  if (err) err.textContent = '';
  if (btn) { btn.textContent = 'TRANSMITTING...'; btn.disabled = true; }

  try {
    const res  = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send reset link');
    showAuthPanel('forgotdone');
  } catch (e) {
    if (err) err.textContent = e.message;
  } finally {
    if (btn) { btn.textContent = 'SEND RESET LINK'; btn.disabled = false; }
  }
}

// ── Reset validation helper (reduces cognitive complexity of handler) ──
function _validateReset(password, confirm, err) {
  if (password.length < 8) {
    if (err) err.textContent = 'Password must be at least 8 characters';
    return false;
  }
  if (password !== confirm) {
    if (err) err.textContent = 'Passwords do not match';
    return false;
  }
  if (!_recoveryToken) {
    if (err) err.textContent = 'Invalid session — request a new reset link';
    return false;
  }
  return true;
}

// ── Reset password handler ──
async function handleResetPassword() {
  const password = document.getElementById('reset-password')?.value ?? '';
  const confirm  = document.getElementById('reset-confirm')?.value  ?? '';
  const btn      = document.getElementById('reset-btn');
  const err      = document.getElementById('reset-error');

  if (err) err.textContent = '';
  if (!_validateReset(password, confirm, err)) return;

  if (btn) { btn.textContent = 'UPDATING...'; btn.disabled = true; }

  try {
    const res  = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: _recoveryToken, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update password');

    _recoveryToken = null;
    globalThis.history.replaceState(null, '', globalThis.location.pathname);
    clearAuth();
    updateAuthUI();
    showAuthPanel('resetsuccess');
  } catch (e) {
    if (err) err.textContent = e.message;
  } finally {
    if (btn) { btn.textContent = 'SET NEW PASSWORD'; btn.disabled = false; }
  }
}

// ── Modal open/close ──
function toggleAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  if (modal.open) {
    modal.close();
    return;
  }

  // Show correct starting panel
  if (_recoveryToken) {
    showAuthPanel('reset');
  } else if (isLoggedIn()) {
    // Show account panel so user can see LOG OUT and SYNC NOW
    const usernameEl = document.getElementById('auth-username-display');
    if (usernameEl) usernameEl.textContent = authState.user?.username || 'NETRUNNER';
    showAuthPanel('loggedin');
  } else {
    showAuthPanel('choose');
  }

  const menuDialog = document.getElementById('menu-dialog');
  if (menuDialog?.open) {
    const onMenuClose = () => {
      menuDialog.removeEventListener('close', onMenuClose);
      modal.showModal();
    };
    menuDialog.addEventListener('close', onMenuClose);
    menuDialog.close();
    document.getElementById('menu-btn')?.classList.remove('open');
  } else {
    modal.showModal();
  }
}

// ── Sync status UI helper ──
function _setSyncUI(titleText, msgText, spinning, showRetry) {
  const t = document.getElementById('sync-status-title');
  const m = document.getElementById('sync-status-msg');
  const s = document.getElementById('sync-spinner');
  const r = document.getElementById('sync-retry-btn');
  if (t) t.textContent = titleText;
  if (m) m.textContent = msgText;
  if (s) s.classList.toggle('hidden', !spinning);
  if (r) r.classList.toggle('hidden', !showRetry);
}

// ── Sync with status display ──
async function _runSync() {
  const modal = document.getElementById('auth-modal');
  _setSyncUI('SYNCING...', 'Connecting to the net...', true, false);
  try {
    await syncSave();
    await syncLoad();
    const xp = playerStats?.xp ?? 0;
    _setSyncUI('SYNCED ✔', `${xp} XP saved across all devices.`, false, false);
    setTimeout(() => { if (modal?.open) modal.close(); }, 2000);
  } catch (e) {
    _setSyncUI('SYNC FAILED', e?.message || 'Could not reach the net. Try again.', false, true);
  }
}

async function handleManualSync() {
  showAuthPanel('syncing');
  await _runSync();
}

// ── Register handler ──
async function handleRegister() {
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const username = document.getElementById('reg-username')?.value.trim();
  const btn      = document.getElementById('reg-btn');
  const err      = document.getElementById('reg-error');

  if (err) err.textContent = '';
  if (btn) { btn.textContent = 'CONNECTING...'; btn.disabled = true; }

  try {
    await authRegister(email, password, username);
    // Show "check your email" panel
    showAuthPanel('emailsent');
  } catch (e) {
    if (err) err.textContent = e.message;
    if (btn) { btn.textContent = 'CREATE ACCOUNT'; btn.disabled = false; }
  }
}

// ── Login handler ──
async function handleLogin() {
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const btn      = document.getElementById('login-btn');
  const err      = document.getElementById('login-error');

  if (err) err.textContent = '';
  if (btn) { btn.textContent = 'CONNECTING...'; btn.disabled = true; }

  try {
    await authLogin(email, password);
    // Show username panel briefly, then sync
    const usernameEl = document.getElementById('auth-username-display');
    if (usernameEl) usernameEl.textContent = authState.user?.username || 'NETRUNNER';
    showAuthPanel('syncing');
    await _runSync();
  } catch (e) {
    if (err) err.textContent = e.message;
    if (btn) { btn.textContent = 'CONNECT'; btn.disabled = false; }
  }
}

// ── Sync button label ──
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const label    = loggedIn ? `SYNC: ${authState.user?.username || 'ON'}` : 'SYNC';

  const desktop = document.getElementById('sync-btn');
  if (desktop) {
    desktop.textContent = label;
    desktop.classList.toggle('sync-active', loggedIn);
  }

  const mobile = document.getElementById('sync-btn-mobile');
  if (mobile) {
    mobile.textContent = label;
    mobile.classList.toggle('sync-active', loggedIn);
  }
}

// ── On page load ──
window.addEventListener('load', () => {
  // Detect Supabase password recovery redirect (#type=recovery&access_token=...)
  const hash = new URLSearchParams(globalThis.location.hash.slice(1));
  if (hash.get('type') === 'recovery') {
    _recoveryToken = hash.get('access_token') || null;
    if (_recoveryToken) {
      globalThis.history.replaceState(null, '', globalThis.location.pathname);
      // Open modal to reset panel once partials are ready
      const openReset = () => {
        const modal = document.getElementById('auth-modal');
        if (!modal) { setTimeout(openReset, 100); return; }
        showAuthPanel('reset');
        modal.showModal();
      };
      setTimeout(openReset, 300);
    }
  }

  updateAuthUI();
  if (isLoggedIn()) syncLoad().catch(() => {});
});
