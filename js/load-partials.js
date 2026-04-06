const ALLOWED_PARTIALS = new Set([
  'partials/rules-modal.html',
  'partials/mobile-menu.html',
  'partials/controls.html',
  'partials/skin-modal.html',
  'partials/dossier-modal.html',
  'partials/theme-modal.html',
  'partials/sound-theme-modal.html',
  'partials/donate-modal.html',
  'partials/achievement-modal.html',
  'partials/collection-modal.html',
  'partials/game-area.html'
]);

function isSafePartialPath(value) {
  if (typeof value !== 'string') return false;

  const path = value.trim();
  if (!path) return false;
  if (!path.startsWith('partials/')) return false;
  if (!path.endsWith('.html')) return false;
  if (path.includes('..')) return false;

  return ALLOWED_PARTIALS.has(path);
}

function stripDangerousNodes(fragment) {
  fragment.querySelectorAll('script').forEach((node) => node.remove());

  fragment.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      if (
        (name === 'href' || name === 'src' || name === 'xlink:href') &&
        (value.startsWith('javascript:') || value.startsWith('data:text/html'))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return fragment;
}

async function loadPartials() {
  const slots = document.querySelectorAll('[data-partial]');

  const fetches = Array.from(slots).map(async (slot) => {
    const partialPath = slot.dataset.partial;

    if (!isSafePartialPath(partialPath)) {
      throw new Error(`[PARTIAL_LOAD_BLOCKED] Invalid partial path: ${partialPath}`);
    }

    const res = await fetch(partialPath, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'partial-loader'
      }
    });

    if (!res.ok) {
      throw new Error(`[PARTIAL_LOAD_FAILED] ${partialPath} -> HTTP ${res.status}`);
    }

    const html = await res.text();

    const template = document.createElement('template');
    template.innerHTML = html;

    const safeFragment = stripDangerousNodes(template.content.cloneNode(true));

    slot.replaceChildren(safeFragment);
  });

  return Promise.all(fetches);
}
