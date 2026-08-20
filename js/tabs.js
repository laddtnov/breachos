// ── Shared tab group ──
// The pure half is kept DOM-free so test/tabs.test.js can evaluate it in a vm
// sandbox; initTabGroup below does the wiring.
//
// Implements the ARIA tabs keyboard pattern the leaderboard tabs were missing:
// arrows move between tabs, Home/End jump to the ends, and only the active tab
// sits in the page tab order (roving tabindex).

// Per-tab state for a given active id. Falls back to the first tab when the id
// is unknown — otherwise no tab would carry tabIndex 0 and the group would be
// unreachable by keyboard.
function tabStates(ids, activeId) {
  if (ids.length === 0) return [];
  const active = ids.includes(activeId) ? activeId : ids[0];
  return ids.map(id => ({
    id,
    active: id === active,
    tabIndex: id === active ? 0 : -1,
  }));
}

function nextTabIndex(count, current, key) {
  if (count <= 1) return current;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return current;
  }
}

// Wires one tablist. `container` holds [role=tab] buttons carrying data-tab;
// panels are matched by data-panel within `panelRoot`. onSwitch runs after the
// panel changes, for tabs that need to render on show.
function initTabGroup(container, panelRoot, onSwitch) {
  if (!container || container.dataset.wired) return;
  container.dataset.wired = '1';

  const tabs = () => [...container.querySelectorAll('[role="tab"]')];

  const show = id => {
    const ids = tabs().map(t => t.dataset.tab);
    for (const state of tabStates(ids, id)) {
      const tab = container.querySelector(`[role="tab"][data-tab="${state.id}"]`);
      if (tab) {
        tab.classList.toggle('active', state.active);
        tab.setAttribute('aria-selected', String(state.active));
        tab.tabIndex = state.tabIndex;
      }
      const panel = panelRoot?.querySelector(`[data-panel="${state.id}"]`);
      if (panel) panel.classList.toggle('hidden', !state.active);
    }
    onSwitch?.(id);
  };

  container.addEventListener('click', e => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) show(tab.dataset.tab);
  });

  container.addEventListener('keydown', e => {
    const all = tabs();
    const current = all.indexOf(e.target.closest('[role="tab"]'));
    if (current === -1) return;
    const next = nextTabIndex(all.length, current, e.key);
    if (next === current) return;
    e.preventDefault();
    all[next].focus();
    show(all[next].dataset.tab);
  });

  container.showTab = show;
  show(tabs()[0]?.dataset.tab);
}
