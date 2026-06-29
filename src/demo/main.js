import { generate } from '../genome/generator.js';
import { renderFace } from '../render/face.js';
import { createIdle } from '../anim/idle.js';

// Where the single-file build is hosted (used in the "copy embed" snippet).
const BUNDLE_URL = 'https://hironaokato.github.io/2d-light-avatar-maker/dist/avatar-face.js';

let uidCounter = 0;
const uid = () => 'u' + uidCounter++;

const $ = (id) => document.getElementById(id);
const featured = $('featured');
const seedInput = $('seed');
const gender = $('gender');
const genlabel = $('genlabel');
const age = $('age');
const agelabel = $('agelabel');
const bgsat = $('bgsat');
const satlabel = $('satlabel');
const meta = $('meta');
const gallery = $('gallery');

let currentGenome = null;

let currentSvg = '';
let idle = null;
let currentState = 'idle';

function femFromSlider() {
  const v = parseFloat(gender.value);
  return v < 0 ? null : v; // negative sentinel = auto (let generator decide)
}
function ageFromSlider() {
  const v = parseInt(age.value, 10);
  return v <= 16 ? null : v; // 16 = auto sentinel
}

function renderFeatured() {
  const seed = seedInput.value || 'avatar';
  const fem = femFromSlider();
  const ageV = ageFromSlider();
  const sat = parseFloat(bgsat.value);
  const opts = { bgSat: sat };
  if (fem != null) opts.fem = fem;
  if (ageV != null) opts.age = ageV;
  const g = generate(seed, opts);
  currentGenome = g;
  currentSvg = renderFace(g, uid());
  if (idle) idle.destroy();
  featured.innerHTML = currentSvg;
  const svg = featured.querySelector('svg');
  idle = createIdle(svg);
  idle.setState(currentState);
  genlabel.textContent = fem == null ? '自動' : fem >= 0.5 ? '女性寄り' : '男性寄り';
  agelabel.textContent = ageV == null ? '自動' : `${ageV}歳`;
  satlabel.textContent = sat.toFixed(2);
  meta.textContent = `seed="${g.seed}"  fem=${g.fem.toFixed(2)}  age=${g.age}  sat=${sat.toFixed(2)}  hair=${g.hairStyle}`;
}

function tag(g, id) {
  const idAttr = id ? `id="${id}" ` : '';
  return `<avatar-face ${idAttr}seed="${g.seed}" fem="${g.fem.toFixed(2)}" age="${g.age}" bg-sat="${g.bgSat}" state="idle"\n  style="width:160px;height:160px"></avatar-face>`;
}

// minimal embed
function embedSnippet(g) {
  return `<script src="${BUNDLE_URL}"><\/script>\n${tag(g)}`;
}

// embed + how to switch the 4 states at runtime (this is the public API)
function embedStatesSnippet(g) {
  return (
    `<!-- 1) 一度だけ読み込む -->\n` +
    `<script src="${BUNDLE_URL}"><\/script>\n\n` +
    `<!-- 2) アバターを置く -->\n` +
    `${tag(g, 'agent')}\n\n` +
    `<!-- 3) 状態を切り替える（あなたのアプリのロジックから呼ぶ） -->\n` +
    `<script>\n` +
    `  const agent = document.getElementById('agent');\n` +
    `  // agent.state = 'thinking';   // 'idle' | 'talking' | 'thinking' | 'listening'\n` +
    `<\/script>\n\n` +
    `<!-- 動作確認用ボタン（任意・削除可） -->\n` +
    `<div>\n` +
    `  <button onclick="agent.state='idle'">idle<\/button>\n` +
    `  <button onclick="agent.state='talking'">talking<\/button>\n` +
    `  <button onclick="agent.state='thinking'">thinking<\/button>\n` +
    `  <button onclick="agent.state='listening'">listening<\/button>\n` +
    `</div>`
  );
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    $('copied').textContent = label + ' をコピーしました';
  } catch {
    $('copied').textContent = 'コピー失敗（手動で選択してください）';
  }
  setTimeout(() => { $('copied').textContent = ''; }, 2600);
}

const stateBar = $('states');
stateBar.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  currentState = btn.dataset.state;
  stateBar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
  if (idle) idle.setState(currentState);
});

const RANDOM_SEEDS = ['aoi', 'ren', 'mira', 'kai', 'yuna', 'sora', 'taro', 'emi', 'jun', 'hana', 'leo', 'noa', 'rin', 'ken', 'mei', 'yuki'];
function randomSeed() {
  return RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)] + '-' + Math.floor(Math.random() * 100000).toString(36);
}

function renderGallery() {
  const cells = [];
  for (let i = 0; i < 12; i++) {
    const seed = randomSeed();
    const g = generate(seed);
    cells.push(
      `<div class="cell"><div class="art" data-seed="${g.seed}" data-fem="${g.fem}">${renderFace(g, uid())}</div>` +
      `<div class="lbl">${g.seed} · ${g.fem >= 0.5 ? '♀' : '♂'}</div></div>`
    );
  }
  gallery.innerHTML = cells.join('');
  gallery.querySelectorAll('.art').forEach((el) => {
    el.addEventListener('click', () => {
      seedInput.value = el.dataset.seed;
      gender.value = '-0.01';
      renderFeatured();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

seedInput.addEventListener('input', renderFeatured);
gender.addEventListener('input', renderFeatured);
age.addEventListener('input', renderFeatured);
bgsat.addEventListener('input', renderFeatured);
$('copyAnim').addEventListener('click', () => copyText(embedSnippet(currentGenome), 'アニメ版（最小）'));
$('copyStates').addEventListener('click', () => copyText(embedStatesSnippet(currentGenome), 'アニメ版＋状態切替'));
$('copyStatic').addEventListener('click', () => copyText(currentSvg, '静止版のSVG'));
$('randomize').addEventListener('click', () => {
  seedInput.value = randomSeed();
  renderFeatured();
});
$('reroll').addEventListener('click', renderGallery);
$('download').addEventListener('click', () => {
  const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (seedInput.value || 'avatar') + '.svg';
  a.click();
  URL.revokeObjectURL(a.href);
});

renderFeatured();
renderGallery();
