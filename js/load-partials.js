/**
 * Loads HTML partials into placeholder elements.
 * Each element with [data-partial] gets its content fetched and injected.
 * Returns a promise that resolves when all partials are loaded.
 */
function loadPartials() {
  const slots = document.querySelectorAll('[data-partial]');
  const fetches = Array.from(slots).map(slot =>
    fetch(slot.dataset.partial)
      .then(res => res.text())
      .then(html => { slot.innerHTML = html; })
  );
  return Promise.all(fetches);
}
