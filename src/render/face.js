// Assemble a full face SVG from a genome. Framework-agnostic: returns a string.
// The live runtime wraps this in a <avatar-face> web component later.

import { computeFace } from './proportions.js';
import { mix, shade, tint, desaturate } from '../genome/color.js';
import * as parts from './parts.js';

function buildStyle(c) {
  const skin = c.skin;
  const hair = c.hair;
  return {
    skin,
    skinShadow: shade(skin, 0.2),
    skinTint: tint(skin, 0.18),
    hair,
    hairShadow: shade(hair, 0.3),
    hairBack: shade(hair, 0.16),
    hairHi: tint(hair, 0.32),
    iris: c.iris,
    irisLight: mix(c.iris, '#fff4e0', 0.42), // lower-iris light (Ghibli-ish depth)
    pupil: mix(c.iris, '#1c1414', 0.5),
    sclera: '#f5ede2', // warm off-white
    eyeDot: '#2c2522', // dot eyes — warm near-black
    lashLine: mix(hair, '#2a1d1d', 0.5), // warm dark, never pure black
    lip: mix(c.lip, skin, 0.18),
    lipShadow: shade(mix(c.lip, skin, 0.18), 0.3),
    mouthDark: mix(c.lip, '#3a1d1d', 0.62),
    brow: mix(hair, '#171012', 0.32),
    blush: mix(skin, '#e35d72', 0.55),
    clothing: c.clothing,
    collar: shade(c.clothing, 0.22),
    glasses: '#3a3f47',
    bg: c.bg || '#e6e8ec',
  };
}

/** @param {object} g genome  @param {string} uid unique id for clip scoping */
export function renderFace(g, uid = 'a') {
  const P = computeFace(g.proportions || {});
  const s = buildStyle(g.colors);
  s.bg = desaturate(g.colors.bg || '#e6e8ec', g.bgSat != null ? g.bgSat : 0.72);
  const hairPieces = parts.hair(P, s, g.hairStyle || 'shortMale', uid, g.recede || 0);
  const headD = parts.headPath(P);
  const cir = `cir-${uid}`;

  // Layer hierarchy for a believable turn (parallax = pseudo-rotation):
  //   av-head  : continuous idle drift (CSS)
  //   av-look  : whole head incl. the chin/outline shifts a little (JS)
  //   av-face  : the face plane (features) shifts MORE -> slides across the head
  //   av-gaze  : the eyes shift more still -> they lead the turn
  const head =
    `<g class="av-head"><g class="av-tilt"><g class="av-look">` +
    parts.ears(P, s) +
    hairPieces.back +
    parts.neck(P, s) +
    `<path d="${headD}" fill="${s.skin}"/>` +
    hairPieces.front +
    `<g class="av-face">` +
    parts.blush(P, s, g.blush ? 0.42 : 0.22) +
    parts.ageLines(P, s, g.age != null ? g.age : 20) +
    parts.nose(P, s) +
    `<g class="av-mouth">${parts.mouth(P, s, { open: g.smileOpen })}</g>` +
    (g.beard ? parts.beard(P, s) : '') +
    `<g class="av-gaze"><g class="av-eyes">${parts.eyes(P, s, uid, { lashes: g.lashes })}</g></g>` +
    parts.brows(P, s) +
    (g.glasses ? parts.glasses(P, s) : '') +
    `</g>` +
    `</g></g></g>`;

  // shoulders stay put; the whole bust breathes gently
  const bust = `<g class="av-breathe">${parts.shoulders(P, s)}${head}</g>`;

  // background shape: circle | square | rounded
  const geom = g.shape === 'square'
    ? '<rect x="4" y="4" width="292" height="292"'
    : g.shape === 'rounded'
      ? '<rect x="4" y="4" width="292" height="292" rx="46" ry="46"'
      : '<circle cx="150" cy="150" r="146"';

  return (
    `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" class="avatar-face">\n` +
    `  <clipPath id="${cir}">${geom}/></clipPath>\n` +
    `  ${geom} fill="${s.bg}"/>\n` +
    `  <g clip-path="url(#${cir})"><g transform="translate(28 10) scale(0.82)">${bust}</g></g>\n` +
    `</svg>`
  );
}
