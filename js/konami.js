// ── Konami Code Easter Egg ──
// ↑ ↑ ↓ ↓ ← → ← → B A

const KONAMI_SEQUENCE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
];

let konamiIndex = 0;

document.addEventListener('keydown', e => {
  if (e.code === KONAMI_SEQUENCE[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === KONAMI_SEQUENCE.length) {
      konamiIndex = 0;
      activateKonami();
    }
  } else {
    konamiIndex = 0;
  }
});

function activateKonami() {
  // Prevent double activation
  if (document.getElementById('konami-overlay')) return;

  SoundEngine.win();

  checkAchievements({ konamiActivated: true });

  const overlay = document.createElement('div');
  overlay.id = 'konami-overlay';
  overlay.innerHTML = `
    <div class="konami-content">
      <p class="konami-code">&uarr;&uarr;&darr;&darr;&larr;&rarr;&larr;&rarr;BA</p>
      <h2 class="konami-title">ACCESS GRANTED</h2>
      <p class="konami-msg">WELCOME TO THE INNER CIRCLE, OPERATIVE</p>
      <p class="konami-sub">You found the hidden protocol.<br>The network remembers.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  // Auto-dismiss
  setTimeout(() => {
    overlay.classList.add('konami-fade-out');
    setTimeout(() => overlay.remove(), 800);
  }, 4000);

  // Click to dismiss
  overlay.addEventListener('click', () => {
    overlay.classList.add('konami-fade-out');
    setTimeout(() => overlay.remove(), 800);
  });
}
