// Concatenates and minifies the stylesheets and scripts into dist/.
//
// The game is vanilla classic scripts that share one global scope and depend on
// load order, so this concatenates in the order tools/assets.json lists rather
// than bundling modules. esbuild is used only as a minifier: in script mode it
// mangles locals and leaves top-level names alone, which matters because the
// markup calls functions like toggleSettingsModal() from inline onclick
// attributes. A regex minifier cannot parse JavaScript safely; that is the one
// job worth a dependency here.
//
// Lives in tools/ rather than build/ because .gitignore ignores build/ —
// putting it there would have shipped a deploy that could not build.
//
// Run by `npm run build`, which Vercel executes on deploy, and by
// tools/verify-page.sh so local verification always tests fresh output.

import { transform } from 'esbuild';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = JSON.parse(await readFile(join(root, 'tools/assets.json'), 'utf8'));

async function concat(files) {
  const parts = [];
  for (const rel of files) {
    const path = join(root, rel);
    try {
      await stat(path);
    } catch {
      // A missing file must stop the build rather than silently ship a page
      // with a stylesheet or script quietly absent from the bundle.
      throw new Error(`tools/assets.json lists ${rel}, which does not exist`);
    }
    parts.push(`/* ${rel} */\n${await readFile(path, 'utf8')}`);
  }
  return parts;
}

async function bundle(files, loader, outFile) {
  const parts = await concat(files);
  // Scripts are joined with a semicolon so a file that ends without one cannot
  // run into the next file's first line.
  const joined = parts.join(loader === 'js' ? ';\n' : '\n');
  const { code, warnings } = await transform(joined, { loader, minify: true });
  for (const w of warnings) console.warn(`[build] ${w.text}`);

  await mkdir(join(root, 'dist'), { recursive: true });
  await writeFile(join(root, outFile), code);
  return { files: files.length, raw: Buffer.byteLength(joined), min: Buffer.byteLength(code) };
}

const kb = n => (n / 1024).toFixed(1) + 'KB';

const css = await bundle(assets.css, 'css', 'dist/app.min.css');
const js  = await bundle(assets.js,  'js',  'dist/app.min.js');

for (const [label, r] of [['css', css], ['js', js]]) {
  const saved = (100 * (1 - r.min / r.raw)).toFixed(0);
  console.log(`${label}: ${r.files} files, ${kb(r.raw)} -> ${kb(r.min)} (-${saved}%)`);
}
console.log(`requests for these assets: ${assets.css.length + assets.js.length} -> 2`);
