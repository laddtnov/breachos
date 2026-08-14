// ── Daily Quests ──

const QUEST_POOL = [
  { id: 'win2',        label: 'WIN 2 GAMES',              type: 'win_count',      target: 2,                   xp: 30 },
  { id: 'win3',        label: 'WIN 3 GAMES',              type: 'win_count',      target: 3,                   xp: 45 },
  { id: 'combo3',      label: 'GET A 3× COMBO',      type: 'combo_reach',    target: 3,                   xp: 15 },
  { id: 'combo5',      label: 'GET A 5× COMBO',      type: 'combo_reach',    target: 5,                   xp: 25 },
  { id: 'win_hard',    label: 'WIN HARD OR EXTREME',      type: 'win_difficulty', target: ['hard', 'extreme'], xp: 40 },
  { id: 'win_extreme', label: 'WIN EXTREME DIFFICULTY',   type: 'win_difficulty', target: ['extreme'],         xp: 50 },
  { id: 'blitz_win',   label: 'WIN BLITZ MODE',           type: 'win_mode',       target: 'blitz',             xp: 35 },
  { id: 'daily_win',   label: 'COMPLETE DAILY CHALLENGE', type: 'win_mode',       target: 'daily',             xp: 30 },
  { id: 'perfect',     label: 'WIN WITHOUT A MISS',       type: 'perfect_win',    target: 1,                   xp: 50 },
  { id: 'survival3',   label: 'REACH WAVE 3 IN SURVIVAL', type: 'survive_wave',   target: 3,                   xp: 35 },
];

function getTodayQuests() {
  const today = getTodayString();
  const rng = createDailySeed(today);
  const indices = Array.from({ length: QUEST_POOL.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, 3).map(i => QUEST_POOL[i]);
}

function getOrInitQuestState() {
  const today = getTodayString();
  if (playerStats.dailyQuests?.date === today) {
    return playerStats.dailyQuests;
  }
  const quests = getTodayQuests();
  const progress = {};
  for (const q of quests) {
    progress[q.id] = { value: 0, completed: false };
  }
  playerStats.dailyQuests = { date: today, progress };
  saveStats(playerStats);
  return playerStats.dailyQuests;
}

const QUEST_VALUE_HANDLERS = {
  win_count:      (quest, p, event) => event.won ? p.value + 1 : p.value,
  combo_reach:    (quest, p, event) => (event.combo !== undefined && event.combo > p.value) ? event.combo : p.value,
  win_difficulty: (quest, p, event) => (event.won && quest.target.includes(event.difficulty)) ? 1 : p.value,
  win_mode:       (quest, p, event) => (event.won && event.mode === quest.target) ? 1 : p.value,
  perfect_win:    (quest, p, event) => (event.won && event.perfect) ? 1 : p.value,
  survive_wave:   (quest, p, event) => (event.wave !== undefined && event.wave >= quest.target) ? quest.target : p.value,
};

function computeQuestValue(quest, p, event) {
  const handler = QUEST_VALUE_HANDLERS[quest.type];
  return handler ? handler(quest, p, event) : p.value;
}

function awardQuestCompletion(quest) {
  playerStats.xp += quest.xp;
  playerStats.rank = getRankForXP(playerStats.xp).name;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  showQuestComplete(quest);
}

function updateQuestProgress(event) {
  const state = getOrInitQuestState();
  const quests = getTodayQuests();
  let changed = false;

  for (const quest of quests) {
    const p = state.progress[quest.id];
    if (!p || p.completed) continue;

    const newValue = computeQuestValue(quest, p, event);
    if (newValue !== p.value) {
      p.value = newValue;
      changed = true;
    }

    if (!p.completed && p.value >= quest.target) {
      p.completed = true;
      changed = true;
      awardQuestCompletion(quest);
    }
  }

  if (changed) {
    saveStats(playerStats);
    updateRankHUD();
    updateQuestsHUD();
  }
}

function showQuestComplete(quest) {
  const el = document.getElementById('quest-complete-banner');
  if (!el) return;
  const labelEl = el.querySelector('.quest-banner-label');
  const xpEl = el.querySelector('.quest-banner-xp');
  if (labelEl) labelEl.textContent = quest.label;
  if (xpEl) xpEl.textContent = '+' + quest.xp + ' XP';
  el.classList.remove('hidden', 'quest-banner-fade');
  void el.offsetWidth; // NOSONAR — reflow to restart CSS transition
  el.classList.add('quest-banner-visible');
  setTimeout(() => {
    el.classList.add('quest-banner-fade');
    setTimeout(() => {
      el.classList.remove('quest-banner-visible', 'quest-banner-fade');
      el.classList.add('hidden');
    }, 400);
  }, 3000);
}

function toggleQuestsModal() {
  const modal = document.getElementById('quests-modal');
  if (!modal) return;
  if (modal.open) {
    modal.close();
  } else {
    renderQuestsModal();
    modal.showModal();
  }
}

function renderQuestsModal() {
  const state = getOrInitQuestState();
  const quests = getTodayQuests();
  const container = document.getElementById('quests-list');
  if (!container) return;

  const today = getTodayString();
  const dateEl = document.getElementById('quests-date');
  if (dateEl) dateEl.textContent = today;

  container.innerHTML = quests.map(quest => {
    const p = state.progress[quest.id] || { value: 0, completed: false };
    const completed = p.completed;
    const capped = Math.min(p.value, quest.target);
    const pct = Math.round((capped / quest.target) * 100);
    const isNumeric = quest.type === 'win_count' || quest.type === 'combo_reach' || quest.type === 'survive_wave';
    const binaryLabel = completed ? '1/1' : '0/1';
    const progressLabel = isNumeric ? (capped + '/' + quest.target) : binaryLabel;

    return `
      <div class="quest-card${completed ? ' quest-done' : ''}">
        <div class="quest-card-header">
          <span class="quest-label">${quest.label}</span>
          <span class="quest-xp-reward">+${quest.xp} XP</span>
        </div>
        <div class="quest-progress-row">
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="quest-progress-text">${progressLabel}</span>
        </div>
        ${completed ? '<div class="quest-badge">COMPLETE</div>' : ''}
      </div>
    `;
  }).join('');

  const totalEarned = quests.reduce((sum, q) => {
    const p = state.progress[q.id];
    return sum + (p?.completed ? q.xp : 0);
  }, 0);
  const totalAvail = quests.reduce((sum, q) => sum + q.xp, 0);
  const xpEl = document.getElementById('quests-xp-total');
  if (xpEl) xpEl.textContent = totalEarned + ' / ' + totalAvail + ' XP EARNED TODAY';
}

function updateQuestsHUD() {
  const dot = document.getElementById('quests-dot');
  if (!dot) return;
  const state = getOrInitQuestState();
  const quests = getTodayQuests();
  const allDone = quests.every(q => state.progress[q.id]?.completed);
  dot.classList.toggle('hidden', allDone);
}
