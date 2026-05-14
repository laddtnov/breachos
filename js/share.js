// ── Share Card ──

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateShareCard() {
  const W = 900, H = 500;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ──
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 520);
  bg.addColorStop(0, '#0d0d1a');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Scanlines ──
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // ── Grid ──
  ctx.strokeStyle = 'rgba(0,243,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 45) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 45) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Outer border ──
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,243,255,0.7)';
  ctx.shadowBlur = 24;
  roundRect(ctx, 12, 12, W - 24, H - 24, 14);
  ctx.stroke();

  // ── Inner border ──
  ctx.strokeStyle = 'rgba(0,243,255,0.18)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  roundRect(ctx, 20, 20, W - 40, H - 40, 12);
  ctx.stroke();

  // ── BREACHOS logo ──
  ctx.font = 'bold 38px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#00f3ff';
  ctx.shadowColor = 'rgba(0,243,255,0.9)';
  ctx.shadowBlur = 20;
  ctx.fillText('BREACH', 50, 74);
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = 'rgba(255,0,85,0.9)';
  ctx.fillText('OS', 50 + ctx.measureText('BREACH').width, 74);
  ctx.shadowBlur = 0;

  // ── Mode + difficulty badge ──
  const mode = (gameState.mode || 'classic').toUpperCase();
  const diff = (gameState.difficulty || 'easy').toUpperCase();
  const diffColors = { EASY: '#00f3ff', MEDIUM: '#ffdc00', HARD: '#ff6600', EXTREME: '#ff0055' };
  const badgeText = (mode === 'CLASSIC' ? '' : mode + ' · ') + diff;
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = diffColors[diff] || '#ff0055';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 10;
  ctx.fillText('[ ' + badgeText + ' ]', W - 50, 74);
  ctx.shadowBlur = 0;

  // ── MISSION COMPLETE ──
  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,243,255,0.5)';
  ctx.shadowBlur = 18;
  ctx.fillText('MISSION COMPLETE', W / 2, 145);
  ctx.shadowBlur = 0;

  // ── Divider ──
  const div = ctx.createLinearGradient(60, 0, W - 60, 0);
  div.addColorStop(0, 'transparent');
  div.addColorStop(0.5, '#00f3ff');
  div.addColorStop(1, 'transparent');
  ctx.strokeStyle = div;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 165); ctx.lineTo(W - 60, 165); ctx.stroke();

  // ── Stats grid (4 stats across) ──
  const moves   = String(gameState.moves);
  const maxMoves = gameState.maxMoves ? '/' + gameState.maxMoves : '';
  const time    = formatTime(gameState.seconds);
  const combo   = gameState.maxCombo + 'x';
  const xp      = document.getElementById('win-xp')?.textContent || '+0 XP';

  const stats = [
    { label: 'MOVES',      value: moves + maxMoves, color: '#00f3ff' },
    { label: 'TIME',       value: time,              color: '#ff0055' },
    { label: 'BEST COMBO', value: combo,             color: '#ffdc00' },
    { label: 'XP EARNED',  value: xp,                color: '#00ff88' },
  ];

  const statW = (W - 100) / 4;
  const statStartX = 50 + statW / 2;
  const statY = 220;

  stats.forEach((s, i) => {
    const x = statStartX + i * statW;

    // Stat box
    ctx.strokeStyle = s.color.replace(')', ', 0.25)').replace('rgb', 'rgba');
    ctx.lineWidth = 1;
    ctx.fillStyle = s.color.replace(')', ', 0.06)').replace('rgb', 'rgba');
    roundRect(ctx, x - statW / 2 + 6, statY - 14, statW - 12, 90, 6);
    ctx.fill();
    ctx.stroke();

    // Value
    ctx.font = 'bold 30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
    ctx.fillText(s.value, x, statY + 28);
    ctx.shadowBlur = 0;

    // Label
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.letterSpacing = '2px';
    ctx.fillText(s.label, x, statY + 56);
  });

  // ── Rank ──
  const rank = playerStats?.rank || 'ROOKIE';
  const rankColors = {
    ROOKIE: '#aaaaaa', AGENT: '#00f3ff', SPECIALIST: '#00ccff',
    GHOST: '#aa44ff', NETRUNNER_ELITE: '#FFD700',
  };
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = rankColors[rank] || '#00f3ff';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.fillText('◈  ' + rank + '  ◈', W / 2, 365);
  ctx.shadowBlur = 0;

  // ── Footer divider ──
  const div2 = ctx.createLinearGradient(60, 0, W - 60, 0);
  div2.addColorStop(0, 'transparent');
  div2.addColorStop(0.5, 'rgba(0,243,255,0.3)');
  div2.addColorStop(1, 'transparent');
  ctx.strokeStyle = div2;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 390); ctx.lineTo(W - 60, 390); ctx.stroke();

  // ── URL ──
  ctx.font = '13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,243,255,0.45)';
  ctx.fillText('breachos.laddtnov.xyz', W / 2, 458);

  return canvas;
}

function shareResult() {
  const canvas = generateShareCard();
  const diff   = (gameState.difficulty || 'easy').toUpperCase();
  const mode   = (gameState.mode || 'classic').toUpperCase();
  const text   = 'Just completed a ' + (mode === 'CLASSIC' ? '' : mode + ' ') +
                 diff + ' mission in ' + formatTime(gameState.seconds) +
                 ' — ' + gameState.maxCombo + 'x combo! Can you beat it? 🎮⚡';

  if (navigator.share && navigator.canShare) {
    canvas.toBlob(blob => {
      const file = new File([blob], 'breachos-result.png', { type: 'image/png' });
      const shareData = { title: 'BreachOS Mission Complete', text, files: [file] };
      if (navigator.canShare(shareData)) {
        navigator.share(shareData).catch(() => downloadShareCard(canvas));
        return;
      }
      downloadShareCard(canvas);
    }, 'image/png');
    return;
  }
  downloadShareCard(canvas);
}

function downloadShareCard(canvas) {
  const link = document.createElement('a');
  link.download = 'breachos-result.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
