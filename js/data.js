// ── Character Data ──
const characters = [
  { id: 'netrunner', symbol: '>_',  name: 'NETRUNNER',  color: 'cyan' },
  { id: 'android',   symbol: '[AI]', name: 'ANDROID',   color: 'pink' },
  { id: 'mech',      symbol: '\u2699',   name: 'MECH PILOT', color: 'cyan' },
  { id: 'ghost',     symbol: '\u25CA',   name: 'GHOST',      color: 'pink' },
  { id: 'samurai',   symbol: '\u5200',   name: 'SAMURAI',   color: 'cyan' },
  { id: 'medic',     symbol: '+',   name: 'MEDIC',      color: 'pink' },
  { id: 'sniper',    symbol: '\u25CE',   name: 'SNIPER',    color: 'cyan' },
  { id: 'virus',     symbol: '\u2318',   name: 'VIRUS',     color: 'pink' },
  { id: 'phantom',   symbol: '\u25B3',   name: 'PHANTOM',   color: 'cyan' },
  { id: 'cipher',    symbol: '{}',  name: 'CIPHER',    color: 'pink' },
  { id: 'drone',     symbol: '\u2295',   name: 'DRONE',     color: 'cyan' },
  { id: 'rogue',     symbol: '\u2726',   name: 'ROGUE',     color: 'pink' },
  { id: 'hacker',    symbol: '\u2325',   name: 'HACKER',    color: 'cyan' },
  { id: 'synth',     symbol: '\u266A',   name: 'SYNTH',     color: 'pink' },
  { id: 'blade',     symbol: '\u2694',   name: 'BLADE',     color: 'cyan' },
  { id: 'oracle',    symbol: '\u25C9',   name: 'ORACLE',    color: 'pink' },
  { id: 'wraith',    symbol: '\u2620',   name: 'WRAITH',    color: 'cyan' },
  { id: 'glitch',    symbol: '\u2588',   name: 'GLITCH',    color: 'pink' },
  // #17 \u2014 10 new cyber operatives to boost replayability at Hard/Extreme
  { id: 'viper',    symbol: '\u26a1',   name: 'VIPER',     color: 'cyan' },
  { id: 'hexer',    symbol: '\u2b21',   name: 'HEXER',     color: 'pink' },
  { id: 'pylon',    symbol: '\u2394',   name: 'PYLON',     color: 'cyan' },
  { id: 'scorch',   symbol: '\u235f',   name: 'SCORCH',    color: 'pink' },
  { id: 'vector',   symbol: '\u25c8',   name: 'VECTOR',    color: 'cyan' },
  { id: 'echo',     symbol: '\u233f',   name: 'ECHO',      color: 'pink' },
  { id: 'nexus',    symbol: '\u229e',   name: 'NEXUS',     color: 'cyan' },
  { id: 'breach',   symbol: '\u238a',   name: 'BREACH',    color: 'pink' },
  { id: 'zero',     symbol: '\u2316',   name: 'ZERO',      color: 'cyan' },
  { id: 'hydra',    symbol: '\u23e3',   name: 'HYDRA',     color: 'pink' },
];

// ── Rank System ──
const RANKS = [
  { name: 'ROOKIE',          xp: 0,    skin: 'default' },
  { name: 'AGENT',           xp: 100,  skin: 'hologram' },
  { name: 'SPECIALIST',      xp: 300,  skin: 'corrupted' },
  { name: 'GHOST',           xp: 600,  skin: 'gold' },
  { name: 'NETRUNNER_ELITE', xp: 1000, skin: 'elite' },
];

const DEFAULT_STATS = {
  xp: 0,
  rank: 'ROOKIE',
  gamesPlayed: 0,
  gamesWon: 0,
  bestTimes: { easy: null, medium: null, hard: null, extreme: null },
  winsPerDifficulty: { easy: 0, medium: 0, hard: 0, extreme: 0 },
  bestCombo: 0,
  blitzWins: 0,
  perfectWins: 0,
  totalMatches: 0,
  bestWave: 0,
  bestSurvivalScore: 0,
  dailyLastDate: null,
  dailyStreak: 0,
  dailyCompleted: 0,
  streakFreezes: 0,
  dailyBestTimes: {},
  weeklyLastDate: null,
  weeklyStreak: 0,
  loginLastDate: null,
  loginStreak: 0,
  loginBestStreak: 0,
  activeTheme: 'cyber',
  activeSoundTheme: 'cyber',
  activeSkin: 'default',
  unlockedSkins: ['default'],
  gameHistory: [],
  dailyQuests: null,
};

// ── Shared PRNG (mulberry32) ──
function getTodayString() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function createDailySeed(dateStr) {
  let h = 0;
  for (const char of dateStr) {
    const code = char.codePointAt(0);
    h = Math.trunc(Math.imul(31, h) + code);
  }
  return function () {
    h = Math.trunc(h + 0x6D2B79F5);
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Difficulty Config ──
const difficulties = {
  easy:    { pairs: 3,  gridClass: 'grid-easy',    label: 'EASY',    maxMoves: 10 },
  medium:  { pairs: 8,  gridClass: 'grid-medium',  label: 'MEDIUM',  maxMoves: 30 },
  hard:    { pairs: 12, gridClass: 'grid-hard',    label: 'HARD',    maxMoves: 40 },
  extreme: { pairs: 18, gridClass: 'grid-extreme', label: 'EXTREME', maxMoves: 60, countdown: 60 },
  custom:  { pairs: 6,  gridClass: 'grid-medium',  label: 'CUSTOM',  maxMoves: 20, countdown: 0 },
};

// ── Custom Difficulty Loadout ──
const CUSTOM_DEFAULTS = { pairs: 6, maxMoves: 20, countdown: 0 };

function gridClassForPairs(pairs) {
  if (pairs <= 4)  return 'grid-easy';
  if (pairs <= 8)  return 'grid-medium';
  if (pairs <= 12) return 'grid-hard';
  return 'grid-extreme';
}

function loadCustomLoadout() {
  try {
    return JSON.parse(localStorage.getItem('breachos_custom_loadout')) || { ...CUSTOM_DEFAULTS };
  } catch { return { ...CUSTOM_DEFAULTS }; }
}

function saveCustomLoadout(cfg) {
  localStorage.setItem('breachos_custom_loadout', JSON.stringify(cfg));
}

// ── Blitz Mode Overrides ──
const BLITZ_CONFIG = {
  easy:    { countdown: 15, maxMoves: 999 },
  medium:  { countdown: 35, maxMoves: 999 },
  hard:    { countdown: 50, maxMoves: 999 },
  extreme: { countdown: 30, maxMoves: 999 },
};

// ── Survival Mode Config ──
const SURVIVAL_WAVES = ['easy', 'medium', 'hard', 'extreme'];
const SURVIVAL_CONFIG = {
  startLives: 3,
  // After completing all 4 difficulties, loop with countdown pressure
  loopCountdowns: [0, 60, 45, 30],  // seconds per loop iteration (0 = first loop, no timer)
};
