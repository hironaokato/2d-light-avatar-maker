// Rule-based generator: seed -> genome. Gender presets bias the proportion and
// feature ranges; correlated ranges (hair<->brow, skin-appropriate palettes)
// keep results coherent. These ranges are tuned against the visual harness.

import { makeRng } from './rng.js';
import { SKIN_TONES, HAIR_COLORS, IRIS_COLORS, LIP_COLORS, CLOTHING_COLORS, BG_COLORS } from './palette.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

const GRAY_HAIR = ['#8a8f96', '#b8bcc2', '#caccd0', '#9a9ea6'];

// Gender (fem 0..1) and age (ageT 0..1, ~age 20 -> 50) both bias the ranges.
function proportionsFor(r, fem, ageT) {
  const lerp = (a, b) => a + (b - a) * fem;
  return {
    // age gradient is driven mostly by these continuous proportion shifts:
    headHeight: r.range(250, 264) + 12 * ageT, // skull a little taller (縦長) with age
    jawRatio: lerp(r.range(0.8, 0.86), r.range(0.72, 0.78)),
    chinRatio: lerp(r.range(0.36, 0.44), r.range(0.3, 0.38)),
    cheekRatio: lerp(0.385, 0.365) - 0.014 * ageT, // narrower -> face elongates
    jawYRatio: lerp(0.83, 0.81),
    // jawDef set in generate() — it peaks by ~30, not on the full age ramp
    // eye SIZE and SPACING stay constant across age (only a slight eyeline shift)
    eyeYRatio: 0.56 - 0.03 * ageT,
    eyeW: lerp(r.range(30, 33), r.range(32, 36)),
    eyeH: lerp(r.range(20, 22), r.range(22, 25)),
    eyeGapEyes: lerp(r.range(1.35, 1.5), r.range(1.32, 1.46)),
    eyeTilt: lerp(r.range(0, 2), r.range(2, 5)),
    browThickness: lerp(r.range(9, 11), r.range(6, 8)) + 0.6 * ageT,
    browGap: lerp(r.range(22, 26), r.range(27, 32)) - 1.5 * ageT,
    browArch: lerp(r.range(5, 8), r.range(8, 11)),
    noseW: lerp(r.range(28, 33), r.range(22, 26)) + 3 * ageT, // nose grows with age
    noseYRatio: 0.75 + 0.015 * ageT, // and lengthens slightly
    mouthW: lerp(r.range(50, 56), r.range(46, 52)),
    lipFull: lerp(r.range(0.85, 1.0), r.range(1.15, 1.4)) * (1 - 0.12 * ageT),
    smile: r.range(2, 8),
    neckW: lerp(r.range(84, 92), r.range(66, 74)) + 4 * ageT,
  };
}

export function generate(seed, opts = {}) {
  const r = makeRng(seed);
  // gender: allow forcing, else sample
  const fem = opts.fem != null ? opts.fem : r.weighted([[0.05, 1], [0.18, 1], [0.82, 1], [0.95, 1]]);
  // age in years; current youthful look ~ teens/20s, extends to ~50s
  const age = opts.age != null ? opts.age : Math.round(r.range(18, 52));
  const ageT = clamp01((age - 20) / 30); // 0 at 20, 1 at 50

  const skin = r.pick(SKIN_TONES);
  // graying probability rises with age (men a touch earlier)
  const grayProb = clamp01((age - (fem < 0.5 ? 40 : 44)) / 18) * 0.85;
  const hair = r.bool(grayProb) ? r.pick(GRAY_HAIR) : r.pick(HAIR_COLORS);
  const iris = r.pick(IRIS_COLORS);
  const lip = r.pick(LIP_COLORS);
  const clothing = r.pick(CLOTHING_COLORS);
  const bg = r.pick(BG_COLORS);

  const hairStyle = fem >= 0.5
    ? r.pick(['bangsStraight', 'sidePart', 'bangsRound', 'bob', 'ponytail', 'bun'])
    : r.weighted([['shortMale', 3], ['sidePart', 2], ['buzz', 2], ['bun', 1]]);

  // receding hairline mostly for older men
  const recede = fem < 0.45 ? clamp01((age - 38) / 18) * 0.85 : clamp01((age - 46) / 16) * 0.35;

  const proportions = proportionsFor(r, fem, ageT);
  // jaw definition develops in youth and maxes out by ~30, then stays put
  proportions.jawDef = clamp01((age - 18) / 12);

  return {
    seed: String(seed),
    fem,
    age,
    ageT,
    bgSat: opts.bgSat != null ? opts.bgSat : 0.72, // default slightly desaturated
    proportions,
    colors: { skin, hair, iris, lip, clothing, bg },
    hairStyle,
    recede,
    lashes: fem >= 0.5,
    blush: fem >= 0.5 ? r.bool(0.6 - 0.3 * ageT) : r.bool(0.2 - 0.1 * ageT),
    smileOpen: r.bool(0.4),
    glasses: r.bool(0.3 + 0.15 * ageT), // glasses a bit more common with age
    beard: fem < 0.35 ? r.bool(0.3 + 0.15 * ageT) : false,
  };
}
