// Visual verification harness.
// Builds a contact sheet of faces and rasterizes it with headless Chrome so the
// developer (and Claude) can eyeball whether the generated faces look right.
//
// Usage: node tools/render.mjs [outDir]

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFace } from '../src/render/face.js';
import { generate } from '../src/genome/generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] || join(__dirname, '..', '.preview');
mkdirSync(outDir, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// --- choose what to show ---
const cells = [];
// explicit gender anchors first
cells.push({ label: 'female (fem=1)', g: generate('anchor-f', { fem: 1 }) });
cells.push({ label: 'male (fem=0)', g: generate('anchor-m', { fem: 0 }) });
cells.push({ label: 'andro (fem=.5)', g: generate('anchor-a', { fem: 0.5 }) });
// forced feature tests
const gl = generate('glass-f', { fem: 0.85 }); gl.glasses = true; gl.smileOpen = true;
cells.push({ label: 'glasses+grin', g: gl });
const bd = generate('beard-m', { fem: 0.05 }); bd.beard = true; bd.glasses = true;
cells.push({ label: 'beard+glasses', g: bd });
const op = generate('grin-m', { fem: 0.1 }); op.smileOpen = true;
cells.push({ label: 'open grin', g: op });
// age progression (same seed, varying age)
for (const age of [20, 30, 45, 55]) {
  cells.push({ label: `F age ${age}`, g: generate('age-f', { fem: 0.92, age }) });
}
for (const age of [20, 30, 45, 55]) {
  cells.push({ label: `M age ${age}`, g: generate('age-m', { fem: 0.08, age }) });
}
// random seeds
for (const seed of ['aoi', 'ren', 'mira', 'kai', 'yuna', 'sora', 'taro', 'emi', 'jun']) {
  const g = generate(seed);
  cells.push({ label: `${seed} (fem=${g.fem})`, g });
}

const cols = 4;
const cellW = 220;
const cellH = 300;
const pad = 16;
const W = cols * cellW + pad * 2;
const rows = Math.ceil(cells.length / cols);
const Hpx = rows * cellH + pad * 2 + 30;

const cellHtml = cells
  .map(
    (c, i) => `
  <div class="cell">
    <div class="art">${renderFace(c.g, 'u' + i)}</div>
    <div class="lbl">${c.label}</div>
  </div>`
  )
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${W}px; background: #eceef2; font: 12px/1.3 -apple-system, sans-serif; padding: ${pad}px; }
  h1 { font-size: 13px; color: #555; margin-bottom: 8px; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, ${cellW}px); }
  .cell { width: ${cellW}px; height: ${cellH}px; padding: 8px; text-align: center; }
  .art svg { width: 200px; height: 200px; display: block; margin: 0 auto; }
  .lbl { margin-top: 6px; color: #444; }
</style></head><body>
  <h1>2D Light Avatar — face contact sheet</h1>
  <div class="grid">${cellHtml}</div>
</body></html>`;

const htmlPath = join(outDir, 'sheet.html');
const pngPath = join(outDir, 'sheet.png');
writeFileSync(htmlPath, html);

execFileSync(
  CHROME,
  [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    `--screenshot=${pngPath}`,
    `--window-size=${W},${Hpx}`,
    `file://${htmlPath}`,
  ],
  { stdio: 'ignore' }
);

console.log('wrote', pngPath);
