// Pure-logic tests for the shared tab group.
// js/tabs.js is DOM-free so it can be evaluated in a vm sandbox.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGlobals(relPath) {
  const src = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const sandbox = { console, Math, Date, JSON, String, Number, Array, Object };
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

const t = loadGlobals('js/tabs.js');

const IDS = ['skins', 'themes', 'sounds'];

describe('tabStates', () => {
  test('marks exactly one tab active', () => {
    const states = t.tabStates(IDS, 'themes');
    const active = states.filter(s => s.active);

    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, 'themes');
  });

  test('returns one state per tab, in order', () => {
    const states = t.tabStates(IDS, 'skins');

    assert.deepStrictEqual(Array.from(states).map(s => s.id), ['skins', 'themes', 'sounds']);
  });

  test('gives the active tab a roving tabindex of 0 and the rest -1', () => {
    // The ARIA tabs pattern: only the active tab is in the tab order, arrows
    // move between them.
    const states = t.tabStates(IDS, 'sounds');
    const byId = Object.fromEntries(Array.from(states).map(s => [s.id, s.tabIndex]));

    assert.strictEqual(byId.sounds, 0);
    assert.strictEqual(byId.skins, -1);
    assert.strictEqual(byId.themes, -1);
  });

  test('falls back to the first tab when the active id is unknown', () => {
    // Leaving no tab with tabIndex 0 would make the group unreachable by keyboard.
    const states = t.tabStates(IDS, 'nonsense');

    assert.strictEqual(states[0].active, true);
    assert.strictEqual(states[0].tabIndex, 0);
  });

  test('falls back to the first tab when no active id is given', () => {
    const states = t.tabStates(IDS);

    assert.strictEqual(states[0].active, true);
  });

  test('handles an empty tab list without throwing', () => {
    assert.deepStrictEqual(Array.from(t.tabStates([], 'x')), []);
  });
});

describe('nextTabIndex', () => {
  test('moves right', () => {
    assert.strictEqual(t.nextTabIndex(3, 0, 'ArrowRight'), 1);
  });

  test('wraps from the last tab back to the first', () => {
    assert.strictEqual(t.nextTabIndex(3, 2, 'ArrowRight'), 0);
  });

  test('moves left', () => {
    assert.strictEqual(t.nextTabIndex(3, 2, 'ArrowLeft'), 1);
  });

  test('wraps from the first tab back to the last', () => {
    assert.strictEqual(t.nextTabIndex(3, 0, 'ArrowLeft'), 2);
  });

  test('treats down and up like right and left', () => {
    assert.strictEqual(t.nextTabIndex(3, 0, 'ArrowDown'), 1);
    assert.strictEqual(t.nextTabIndex(3, 0, 'ArrowUp'), 2);
  });

  test('jumps to the first tab on Home and the last on End', () => {
    assert.strictEqual(t.nextTabIndex(3, 2, 'Home'), 0);
    assert.strictEqual(t.nextTabIndex(3, 0, 'End'), 2);
  });

  test('leaves the index alone for an unrelated key', () => {
    assert.strictEqual(t.nextTabIndex(3, 1, 'a'), 1);
  });

  test('stays put when there are no tabs', () => {
    assert.strictEqual(t.nextTabIndex(0, 0, 'ArrowRight'), 0);
  });

  test('stays put with a single tab rather than dividing by nothing', () => {
    assert.strictEqual(t.nextTabIndex(1, 0, 'ArrowRight'), 0);
    assert.strictEqual(t.nextTabIndex(1, 0, 'ArrowLeft'), 0);
  });
});
