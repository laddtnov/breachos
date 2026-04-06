// ── Card Collections & Rewards ──

const REWARD_CARDS = [
  {
    id: 'sentinel',
    name: 'SENTINEL',
    symbol: '\u2666',
    color: 'cyan',
    rank: 'ROOKIE',
    desc: 'Standard-issue cyber operative. Every netrunner starts here.',
    rarity: 'COMMON',
  },
  {
    id: 'specter',
    name: 'SPECTER',
    symbol: '\u2623',
    color: 'pink',
    rank: 'AGENT',
    desc: 'Phantom infiltrator. Moves through firewalls unseen.',
    rarity: 'RARE',
  },
  {
    id: 'inferno',
    name: 'INFERNO',
    symbol: '\u2622',
    color: 'pink',
    rank: 'SPECIALIST',
    desc: 'Digital destroyer. Burns through ICE like plasma.',
    rarity: 'EPIC',
  },
  {
    id: 'zero',
    name: 'ZERO',
    symbol: '\u2605',
    color: 'cyan',
    rank: 'GHOST',
    desc: 'The legend no trace can follow. Zero footprint, zero mercy.',
    rarity: 'LEGENDARY',
  },
  {
    id: 'nexus',
    name: 'NEXUS',
    symbol: '\u2756',
    color: 'cyan',
    rank: 'NETRUNNER_ELITE',
    desc: 'The convergence of all paths. Master of the Net.',
    rarity: 'MYTHIC',
  },
  // ── Survival & Daily Reward Cards ──
  {
    id: 'phoenix',
    name: 'PHOENIX',
    symbol: '\u2740',
    color: 'cyan',
    rank: '__SURVIVAL_10',
    desc: 'Reborn in flame. Forged through 10 waves of survival.',
    rarity: 'LEGENDARY',
  },
  {
    id: 'oracle_prime',
    name: 'ORACLE PRIME',
    symbol: '\u2609',
    color: 'pink',
    rank: '__DAILY_30',
    desc: 'Time-locked entity. Manifested after 30 days of devotion.',
    rarity: 'MYTHIC',
  },
];

function isRewardUnlocked(rewardRank) {
  // Survival milestone rewards
  if (rewardRank === '__SURVIVAL_10') return (playerStats.bestWave || 0) >= 10;
  // Daily streak rewards
  if (rewardRank === '__DAILY_30') return (playerStats.dailyStreak || 0) >= 30;

  const rankOrder = RANKS.map(r => r.name);
  const playerRankIdx = rankOrder.indexOf(playerStats.rank);
  const rewardRankIdx = rankOrder.indexOf(rewardRank);
  return playerRankIdx >= rewardRankIdx;
}

function getUnlockedRewardCharacters() {
  return REWARD_CARDS
    .filter(card => isRewardUnlocked(card.rank))
    .map(card => ({ id: card.id, symbol: card.symbol, name: card.name, color: card.color }));
}

function getUnlockedRewardCount() {
  return REWARD_CARDS.filter(card => isRewardUnlocked(card.rank)).length;
}

function toggleCollectionModal() {
  const modal = document.getElementById('collection-modal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) renderCollectionModal();
}

function renderCollectionModal() {
  const grid = document.getElementById('collection-grid');
  const countEl = document.getElementById('collection-count');
  if (!grid) return;

  const unlocked = getUnlockedRewardCount();
  const total = REWARD_CARDS.length;

  if (countEl) {
    countEl.innerHTML = `COLLECTED: <span>${unlocked}</span> / ${total}`;
  }

  grid.innerHTML = REWARD_CARDS.map(card => {
    const cardUnlocked = isRewardUnlocked(card.rank);
    const RANK_LABELS = {
      '__SURVIVAL_10': 'SURVIVE WAVE 10',
      '__DAILY_30': '30-DAY STREAK'
    };
    const lockLabel = RANK_LABELS[card.rank] ?? card.rank;
    return `
      <div class="reward-card reward-card-${card.id} ${cardUnlocked ? 'unlocked' : 'locked'}"
           ${cardUnlocked ? `title="${card.desc}"` : `title="Unlock: ${lockLabel}"`}>
        <span class="reward-symbol">${card.symbol}</span>
        <span class="reward-name">${card.name}</span>
        <span class="reward-rank">${cardUnlocked ? card.rarity : lockLabel}</span>
      </div>
    `;
  }).join('');
}
