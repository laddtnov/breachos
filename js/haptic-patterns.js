// ── Haptic Patterns — pure lookup table, no DOM ──
// Kept free of DOM and browser globals so test/haptics.test.js can evaluate it
// in a vm sandbox. haptics.js holds the navigator.vibrate side.
//
// `standard` reproduces the patterns haptics.js shipped with, so existing
// players feel no change until they pick a different preset.

// Exposed as a function, not a const: these files are evaluated in a vm sandbox
// by the tests, and top-level const bindings are not readable off the context.
function hapticPresetIds() {
  return ['subtle', 'standard', 'intense'];
}

const HAPTIC_PRESET_LABELS = {
  subtle:   'SUBTLE',
  standard: 'STANDARD',
  intense:  'INTENSE',
};

// Combo tiers are ordered low to high; the last entry that the combo count
// reaches wins, so very long combos clamp to the top tier.
const HAPTIC_PRESETS = {
  subtle: {
    flip:  20,
    match: [30, 20, 30],
    error: 60,
    win:   [40, 30, 40, 30, 70],
    lose:  [90, 40, 60],
    combo: [
      { min: 0, pattern: [25, 15, 25] },
      { min: 3, pattern: [30, 15, 30, 15, 30] },
      { min: 5, pattern: [35, 15, 35, 15, 35] },
      { min: 7, pattern: [40, 15, 40, 15, 40, 15, 40] },
    ],
  },
  standard: {
    flip:  50,
    match: [80, 40, 80],
    error: 150,
    win:   [100, 40, 100, 40, 180],
    lose:  [220, 60, 150],
    combo: [
      { min: 0, pattern: [60, 20, 60] },
      { min: 3, pattern: [70, 20, 70, 20, 70] },
      { min: 5, pattern: [80, 25, 80, 25, 80] },
      { min: 7, pattern: [100, 30, 100, 30, 100, 30, 100] },
    ],
  },
  intense: {
    flip:  80,
    match: [130, 50, 130],
    error: 260,
    win:   [160, 60, 160, 60, 300],
    lose:  [340, 90, 240],
    combo: [
      { min: 0, pattern: [100, 30, 100] },
      { min: 3, pattern: [120, 30, 120, 30, 120] },
      { min: 5, pattern: [140, 35, 140, 35, 140] },
      { min: 7, pattern: [170, 40, 170, 40, 170, 40, 170] },
    ],
  },
};

const HAPTIC_DEFAULT_PRESET = 'standard';

function hapticComboPattern(tiers, level = 0) {
  let chosen = tiers[0].pattern;
  for (const tier of tiers) {
    if (level >= tier.min) chosen = tier.pattern;
  }
  return chosen;
}

// Returns a Vibration API argument (number or array of numbers), or null when
// the event is unknown so the caller fires nothing at all.
function hapticPattern(preset, event, comboLevel) {
  const table = HAPTIC_PRESETS[preset] ?? HAPTIC_PRESETS[HAPTIC_DEFAULT_PRESET];
  if (event === 'combo') return hapticComboPattern(table.combo, comboLevel);
  return table[event] ?? null;
}
