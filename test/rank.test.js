// Rank curve tests.
// data.js holds RANKS as a top-level const, which a vm sandbox does not expose
// on the context object — so both files are concatenated into one script and
// reached through the function declarations in rank.js, which do get exposed.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRankModule() {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const sandbox = { console, Math, Date, JSON, String, Number, Array, Object, localStorage: undefined };
  vm.runInNewContext(read('js/data.js') + '\n' + read('js/rank.js'), sandbox);
  return sandbox;
}

const r = loadRankModule();

// One win on medium with a decent board is worth roughly this much. The whole
// point of the curve is how many of these it takes to finish it.
const XP_PER_WIN = 150;

// Walks the ladder by asking getRankForXP, so it tests the lookup the game
// actually uses rather than re-reading the table.
function ladder() {
  const seen = [];
  for (let xp = 0; xp <= 200000; xp += 10) {
    const rank = r.getRankForXP(xp);
    if (seen.length === 0 || seen[seen.length - 1].name !== rank.name) {
      seen.push({ name: rank.name, xp: rank.xp });
    }
  }
  return seen;
}

describe('rank curve', () => {
  test('keeps the five original ranks at their original thresholds', () => {
    // Reward cards and skins are gated on these, so moving them would revoke
    // things players have already earned.
    const original = [
      ['ROOKIE', 0], ['AGENT', 100], ['SPECIALIST', 300],
      ['GHOST', 600], ['NETRUNNER_ELITE', 1000],
    ];

    for (const [name, xp] of original) {
      assert.strictEqual(r.getRankForXP(xp).name, name, `${xp} XP should be ${name}`);
    }
  });

  test('does not finish in a single evening', () => {
    // The bug being fixed: the old top rank landed at 1000 XP, about seven wins.
    const top = ladder()[ladder().length - 1];
    const winsToMax = top.xp / XP_PER_WIN;

    assert.ok(winsToMax >= 50, `top rank reachable in ${Math.round(winsToMax)} wins, want >= 50`);
  });

  test('keeps climbing past the old ceiling', () => {
    const beyond = ladder().filter(rank => rank.xp > 1000);

    assert.ok(beyond.length >= 4, `only ${beyond.length} ranks past 1000 XP`);
  });

  test('thresholds strictly increase', () => {
    const xps = ladder().map(rank => rank.xp);

    for (let i = 1; i < xps.length; i++) {
      assert.ok(xps[i] > xps[i - 1], `threshold ${xps[i]} does not exceed ${xps[i - 1]}`);
    }
  });

  test('names are unique', () => {
    const names = ladder().map(rank => rank.name);

    assert.strictEqual(new Set(names).size, names.length);
  });

  test('each step costs more than the one before it', () => {
    // A flat curve makes late ranks feel like filler; each tier should be a
    // bigger commitment than the last.
    const xps = ladder().map(rank => rank.xp);
    const gaps = xps.slice(1).map((xp, i) => xp - xps[i]);

    for (let i = 1; i < gaps.length; i++) {
      assert.ok(gaps[i] >= gaps[i - 1], `gap ${gaps[i]} is smaller than previous gap ${gaps[i - 1]}`);
    }
  });

  test('getNextRank returns null only at the very top', () => {
    const all = ladder();
    const top = all[all.length - 1];

    assert.strictEqual(r.getNextRank(top.name), null);
    assert.notStrictEqual(r.getNextRank('NETRUNNER_ELITE'), null);
  });
});

describe('getUnlockedSkins', () => {
  test('grants no new skin for the ranks added past the old ceiling', () => {
    // The new tiers are progression only — they ship no art, so a player at the
    // top of the ladder owns exactly the skins the old top rank granted.
    const globalThisRef = r;
    globalThisRef.playerStats = { bestWave: 0, dailyStreak: 0, gamesWon: 0, bestCombo: 0, gamesPlayed: 0 };

    const atOldCeiling = Array.from(r.getUnlockedSkins(1000));
    const atNewCeiling = Array.from(r.getUnlockedSkins(999999));

    assert.deepStrictEqual(atNewCeiling, atOldCeiling);
  });
});

// calculateXP decides every XP award in the game, and the leaderboard ranks on
// the total it produces. It had no test at all, so any change to the formula —
// or to one of the bonus ceilings — moved every player's progress silently.
describe('calculateXP', () => {
  test('a loss is worth a flat consolation award', () => {
    assert.strictEqual(r.calculateXP('extreme', 50, 60, 10, false, 9), 5);
  });

  test('a known win returns a known number', () => {
    // medium base 50, 10 of 30 moves used -> floor(20/30*50) = 33 move bonus,
    // 40s -> 50 - 4 = 46 time bonus, 4x combo -> 40. Total 169.
    assert.strictEqual(r.calculateXP('medium', 10, 30, 40, true, 4), 169);
  });

  test('scales with difficulty on an otherwise identical win', () => {
    const args = [10, 30, 40, true, 4];
    const easy    = r.calculateXP('easy', ...args);
    const medium  = r.calculateXP('medium', ...args);
    const hard    = r.calculateXP('hard', ...args);
    const extreme = r.calculateXP('extreme', ...args);

    assert.ok(easy < medium && medium < hard && hard < extreme,
      `${easy} ${medium} ${hard} ${extreme}`);
    assert.strictEqual(extreme - hard, 100);
  });

  test('treats an unknown difficulty as easy rather than awarding nothing', () => {
    assert.strictEqual(
      r.calculateXP('nightmare', 10, 30, 40, true, 4),
      r.calculateXP('easy', 10, 30, 40, true, 4),
    );
  });

  test('never pays a negative bonus for a slow or wasteful win', () => {
    // Every move used and a very long game: both bonuses floor at zero rather
    // than subtracting from the base award.
    assert.strictEqual(r.calculateXP('easy', 30, 30, 9999, true, 0), 20);
  });

  test('pays no combo bonus below a 2x combo', () => {
    const noCombo  = r.calculateXP('hard', 10, 30, 40, true, 0);
    const oneCombo = r.calculateXP('hard', 10, 30, 40, true, 1);
    const twoCombo = r.calculateXP('hard', 10, 30, 40, true, 2);

    assert.strictEqual(noCombo, oneCombo, 'a 1x combo is not a combo');
    assert.strictEqual(twoCombo - noCombo, 20);
  });

  test('defaults the combo to zero when the caller omits it', () => {
    assert.strictEqual(
      r.calculateXP('hard', 10, 30, 40, true),
      r.calculateXP('hard', 10, 30, 40, true, 0),
    );
  });

  test('stays inside the per-save sync allowance for one win', () => {
    // lib/stats-validation.js discards a save claiming more than 50,000 XP. A
    // single award must sit far below that or an honest win looks forged.
    const best = r.calculateXP('extreme', 0, 60, 0, true, 100);

    assert.ok(best < 50_000, `one win awarded ${best}`);
  });
});
