#!/usr/bin/env bash
# Builds _verify.html — index.html with cache-busted subresource URLs and the
# service worker disabled. Rebuilds dist/ first so what is verified is what the
# current sources produce. Local verification only; _verify.html is gitignored.
#
# The dev server and service worker both cache aggressively enough that editing
# a .js file and reloading does not reliably load the new file. Unique URLs are
# the only thing that defeats both.
set -euo pipefail
cd "$(dirname "$0")/.."

# index.html loads the built bundles, so verification has to test freshly built
# output rather than whatever dist/ happened to contain. esbuild takes well
# under a second, so this stays a fast edit-reload loop.
npm run build --silent
V=$(date +%s)
python3 - "$V" <<'PY'
import sys, pathlib, re
v = sys.argv[1]
s = pathlib.Path('index.html').read_text()
s = re.sub(r'src="((?:js|dist)/[^"?]+)"', lambda m: f'src="{m.group(1)}?v={v}"', s)
s = re.sub(r'href="((?:css|dist)/[^"?]+)"', lambda m: f'href="{m.group(1)}?v={v}"', s)
# Partials are fetched at runtime by load-partials.js, which enforces an
# allowlist of exact paths — a ?v= suffix fails its isSafePartialPath check, so
# cache-busting their URLs would just stop them loading. Inline the files
# directly instead: fresh markup, and the allowlist stays untouched.
def inline(m):
    p = pathlib.Path(m.group(1))
    return p.read_text() if p.exists() else m.group(0)
s = re.sub(r'<div data-partial="(partials/[^"?]+)"></div>', inline, s)
s = s.replace("navigator.serviceWorker.register('./sw.js');", "/* SW disabled for verification */")
pathlib.Path('_verify.html').write_text(s)
PY
echo "_verify.html rebuilt (v=$V)"
