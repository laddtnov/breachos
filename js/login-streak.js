// ── Daily Login Streak ──
// Counts consecutive days the player opened the game, independent of the daily
// challenge streak (which only advances on a daily-challenge clear).

const LOGIN_STREAK_XP_PER_DAY = 5;
const LOGIN_STREAK_CAP = 30;

function _shiftDateString(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// Pure streak transition. `counted` is false when today was already recorded,
// so the caller knows not to award the bonus twice in one day.
function computeLoginStreak(lastLoginDate, today, currentStreak, freezes) {
  if (lastLoginDate === today) {
    return { streak: currentStreak, freezes, freezeUsed: false, counted: false };
  }
  if (!lastLoginDate) {
    return { streak: 1, freezes, freezeUsed: false, counted: true };
  }
  if (lastLoginDate === _shiftDateString(today, -1)) {
    return { streak: (currentStreak || 0) + 1, freezes, freezeUsed: false, counted: true };
  }
  if ((freezes || 0) > 0) {
    return { streak: (currentStreak || 0) + 1, freezes: freezes - 1, freezeUsed: true, counted: true };
  }
  return { streak: 1, freezes, freezeUsed: false, counted: true };
}

// Day 1 earns nothing — the bonus rewards returning, not arriving. Capped so a
// long streak cannot award unbounded XP.
function getLoginStreakBonus(streak) {
  if (streak <= 1) return 0;
  return Math.min(streak, LOGIN_STREAK_CAP) * LOGIN_STREAK_XP_PER_DAY;
}

// Runs once per page load, before the first game starts.
function processLoginStreak() {
  const today = getTodayString();
  const result = computeLoginStreak(
    playerStats.loginLastDate,
    today,
    playerStats.loginStreak,
    playerStats.streakFreezes
  );

  if (!result.counted) {
    updateLoginStreakHUD();
    return;
  }

  const bonus = getLoginStreakBonus(result.streak);
  playerStats.loginStreak = result.streak;
  playerStats.loginLastDate = today;
  playerStats.streakFreezes = result.freezes;
  playerStats.loginBestStreak = Math.max(playerStats.loginBestStreak || 0, result.streak);

  if (bonus > 0) {
    playerStats.xp += bonus;
    playerStats.rank = getRankForXP(playerStats.xp).name;
    playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  }

  saveStats(playerStats);
  updateRankHUD();
  updateLoginStreakHUD();

  if (bonus > 0) showLoginStreakBanner(result.streak, bonus, result.freezeUsed);
}

function updateLoginStreakHUD() {
  const el = document.getElementById('login-streak-value');
  if (el) el.textContent = playerStats.loginStreak || 0;

  // `|| 0` matters: a bare `undefined <= 1` is false, which would show the HUD
  // item for a player who has never logged in.
  const item = document.getElementById('login-streak-item');
  if (item) item.classList.toggle('hidden', (playerStats.loginStreak || 0) <= 1);
}

function showLoginStreakBanner(streak, bonus, freezeUsed) {
  const el = document.getElementById('login-streak-banner');
  if (!el) return;

  const daysEl = el.querySelector('.login-streak-days');
  const xpEl = el.querySelector('.login-streak-xp');
  const noteEl = el.querySelector('.login-streak-note');

  if (daysEl) daysEl.textContent = streak + ' DAY STREAK';
  if (xpEl) xpEl.textContent = '+' + bonus + ' XP';
  if (noteEl) noteEl.textContent = freezeUsed ? '❄ freeze used — streak saved' : 'WELCOME BACK, NETRUNNER';

  el.classList.remove('hidden');
  srAnnounce(`Login streak ${streak} days. Bonus ${bonus} XP.`);

  setTimeout(() => el.classList.add('login-streak-fade'), 3200);
  setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('login-streak-fade');
  }, 3700);
}
