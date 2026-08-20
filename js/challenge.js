// ── Friend Challenges ──
// "Beat my score on THIS board." The link carries the board seed, the
// difficulty and the result to beat, so there is nothing to store and no
// backend involved. Pure logic lives in js/challenge-rules.js.

const CHALLENGE_PARAM = 'c';

// A challenge board is deliberately plain: no trap card and no glitch event,
// even on hard and extreme. Those are drawn with secureRandomInt rather than
// the seeded RNG, so leaving them in would hand the two players different
// games and make the comparison meaningless.
function startChallengeGame(challenge) {
  const config = difficulties[challenge.difficulty];

  gameState.mode = 'classic';
  gameState.difficulty = challenge.difficulty;

  rulesModal?.close();
  document.getElementById('back-to-game-btn')?.classList.add('hidden');

  resetRoundState({ pairs: config.pairs, maxMoves: config.maxMoves, countdown: 0 });
  clearModeChrome();              // this clears gameState.challenge, so set it after
  gameState.challenge = challenge;
  gameState.boardSeed = challenge.seed;

  resetHud({
    label: 'CHALLENGE ' + config.label,
    moveLimitText: '/' + config.maxMoves,
    countdown: 0,
  });
  particles.innerHTML = '';

  buildBoard({
    pairs: config.pairs,
    gridClass: config.gridClass,
    rng: createDailySeed(challengeSeedKey(challenge.seed)),
  });

  showChallengeBanner(challenge);
  updateRankHUD();
}

function showChallengeBanner(challenge) {
  const banner = document.getElementById('challenge-banner');
  if (!banner) return;
  document.getElementById('challenge-target-moves').textContent = challenge.moves;
  document.getElementById('challenge-target-time').textContent = formatTime(challenge.seconds);
  banner.classList.remove('hidden');
}

// Reads ?c= on load. Returns true when a challenge was started, so the boot
// sequence knows to skip the normal opening game.
function initChallengeFromUrl() {
  const params = new URLSearchParams(globalThis.location.search);
  const challenge = decodeChallenge(params.get(CHALLENGE_PARAM));
  if (!challenge) return false;

  // Drop the parameter once it has been read. Without this a reload replays
  // the challenge instead of the player's own game, and the link lingers in
  // the address bar long after the run is over.
  const url = new URL(globalThis.location.href);
  url.searchParams.delete(CHALLENGE_PARAM);
  globalThis.history.replaceState({}, '', url);

  startChallengeGame(challenge);
  return true;
}

function challengeLinkFor({ seed, difficulty, moves, seconds }) {
  const url = new URL(globalThis.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(CHALLENGE_PARAM, encodeChallenge({ seed, difficulty, moves, seconds }));
  return url.toString();
}

// Fired from the win overlay. Shares the board just cleared, with the result
// to beat baked in.
async function shareChallenge() {
  const btn = document.getElementById('challenge-btn');
  const link = challengeLinkFor({
    seed: gameState.boardSeed,
    difficulty: gameState.difficulty,
    moves: gameState.moves,
    seconds: gameState.seconds,
  });
  const text = `Beat my ${gameState.moves} moves on this BreachOS board.`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'BreachOS Challenge', text, url: link });
      return;
    } catch {
      // Cancelled or unavailable — fall through to the clipboard.
    }
  }

  try {
    await navigator.clipboard.writeText(link);
    flashChallengeButton(btn, 'LINK COPIED');
  } catch {
    flashChallengeButton(btn, 'COPY FAILED');
  }
}

function flashChallengeButton(btn, message) {
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = message;
  setTimeout(() => { btn.textContent = original; }, 2000);
}

// Called from winGame(). Decides what the win overlay says about the challenge
// and whether the "challenge a friend" button is offered at all.
function updateChallengeWinUI() {
  const resultEl = document.getElementById('win-challenge');
  const btn = document.getElementById('challenge-btn');
  const mine = { moves: gameState.moves, seconds: gameState.seconds };

  // Only classic runs are challengeable: blitz and the dated modes have their
  // own timers and boards, so a move-count comparison would not be like for like.
  const canChallenge = gameState.mode === 'classic' && Number.isInteger(gameState.boardSeed);
  btn?.classList.toggle('hidden', !canChallenge);

  if (!resultEl) return;
  if (!gameState.challenge) {
    resultEl.classList.add('hidden');
    return;
  }

  const target = gameState.challenge;
  const beaten = challengeBeaten(mine, target);
  // Name the metric that actually decided it. On a move tie the result turns
  // on time, and reporting "24 → 24 MOVES" would read as a bug.
  const tiedOnMoves = mine.moves === target.moves;

  let message;
  if (beaten && tiedOnMoves) {
    message = `CHALLENGE BEATEN ON TIME — ${formatTime(target.seconds)} → ${formatTime(mine.seconds)}`;
  } else if (beaten) {
    message = `CHALLENGE BEATEN — ${target.moves} → ${mine.moves} MOVES`;
  } else if (tiedOnMoves) {
    message = `CHALLENGE HELD — ${formatTime(target.seconds)} TO BEAT ON TIME`;
  } else {
    message = `CHALLENGE HELD — ${target.moves} MOVES TO BEAT`;
  }
  resultEl.textContent = message;
  resultEl.classList.toggle('challenge-won', beaten);
  resultEl.classList.remove('hidden');
}
