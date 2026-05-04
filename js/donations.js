// ── Donations Modal ──

function toggleDonateModal() {
  const modal = document.getElementById('donate-modal');
  if (!modal) return;
  modal.classList.toggle('hidden');
}

function switchDonateTab(tab) {
  document.getElementById('donate-card-panel').classList.toggle('hidden', tab !== 'card');
  document.getElementById('donate-crypto-panel').classList.toggle('hidden', tab !== 'crypto');

  document.querySelectorAll('.donate-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

function copyAddr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const btn = el.nextElementSibling;
  navigator.clipboard.writeText(el.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'COPIED!';
    btn.style.color = '#00ff88';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
    }, 1500);
  });
}

async function sendThankYou() {
  const input  = document.getElementById('thankyou-email');
  const sendBtn = document.querySelector('.donate-send-btn');
  const success = document.getElementById('thankyou-success');
  const error   = document.getElementById('thankyou-error');
  const email   = input?.value.trim();

  const at  = email.indexOf('@');
  const dot = at > 0 ? email.lastIndexOf('.') : -1;
  if (!email || !(at > 0 && dot > at + 1 && dot < email.length - 1 && email.length <= 254)) {
    input?.classList.add('input-error');
    setTimeout(() => input?.classList.remove('input-error'), 800);
    return;
  }

  sendBtn.textContent = 'SENDING...';
  sendBtn.disabled = true;
  success.classList.add('hidden');
  error.classList.add('hidden');

  try {
    const res = await fetch('/api/thank-you', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      input.value = '';
      success.classList.remove('hidden');
      sendBtn.textContent = 'SENT ✔';
    } else {
      throw new Error('server error');
    }
  } catch {
    error.classList.remove('hidden');
    sendBtn.textContent = 'SEND';
    sendBtn.disabled = false;
  }
}
