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

function normalizeAttrValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function sanitizeFragment(fragment) {
  fragment.querySelectorAll('script').forEach((node) => node.remove());

  fragment.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = normalizeAttrValue(attr.value);

      if (
        (name === 'href' || name === 'src' || name === 'xlink:href') &&
        (
          value.startsWith('javascript:') ||
          value.startsWith('data:') ||
          value.startsWith('vbscript:')
        )
      ) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (name === 'srcdoc') {
        el.removeAttribute(attr.name);
      }
    }
  });

  return fragment;
}

function parseHtmlToFragment(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const fragment = document.createDocumentFragment();

  for (const node of Array.from(doc.body.childNodes)) {
    fragment.appendChild(node.cloneNode(true));
  }

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
    const fragment = parseHtmlToFragment(html);
    const safeFragment = sanitizeFragment(fragment);

    slot.replaceChildren(safeFragment);
  });

  return Promise.all(fetches);
}
