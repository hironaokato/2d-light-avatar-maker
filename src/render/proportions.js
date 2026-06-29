// Proportion system — the "rules" that keep faces from looking wrong.
// Anchors follow classic front-view canon (Loomis): eyeline at head midline,
// face ~5 eyes wide, nose midway eyeline->chin, mouth ~1/3 nose->chin, ears
// span brow->nose. Everything is derived from a few high-level ratios so the
// generator can vary a face without breaking the relationships.

export const VIEW = { w: 300, h: 380, cx: 150 };

const DEFAULTS = {
  headHeight: 268,
  topY: 52,

  // silhouette — deformed/rounder: wide head, soft jaw (gentle taper)
  cheekRatio: 0.375, // widest half-width / headHeight
  foreheadRatio: 0.92, // forehead half-width / cheek half-width
  templeRatio: 0.99, // temple half-width / cheek half-width
  widestYRatio: 0.5, // where the head is widest (fraction of headHeight)
  jawRatio: 0.78, // jaw half-width / cheek half-width
  jawYRatio: 0.82, // jaw corner Y (fraction of headHeight)
  chinRatio: 0.36, // chin half-width / cheek half-width
  jawDef: 0, // 0 = soft/young jawline, 1 = more defined (older)

  // features (fractions of headHeight unless noted)
  eyeYRatio: 0.56, // eyeline lowered -> bigger forehead (cute deform)
  eyeW: 42, // eye width (px)
  eyeH: 24, // eye height (px)
  eyeTilt: 0, // deg, + = outer corner up
  eyeGapEyes: 1.35, // gap between eyes, in eye-widths

  browGap: 26, // vertical gap eye-center -> brow
  browThickness: 9,
  browArch: 9,
  browLenRatio: 0.95, // brow length / eye width

  noseYRatio: 0.75, // nose bottom
  noseW: 28,

  mouthYRatio: 0.88, // mouth center
  mouthW: 52,
  lipFull: 1.0, // 1 = neutral
  smile: 5, // corner lift (px)

  neckW: 78,
};

export function computeFace(g = {}) {
  const p = { ...DEFAULTS, ...g };
  const { cx } = VIEW;
  const H = p.headHeight;
  const topY = p.topY;
  const chinY = topY + H;

  const cheekHalf = p.cheekRatio * H;
  const widestY = topY + p.widestYRatio * H;
  const eyeY = topY + p.eyeYRatio * H;
  const noseY = topY + p.noseYRatio * H;
  const mouthY = topY + p.mouthYRatio * H;
  const jawY = topY + p.jawYRatio * H;

  const eyeDX = (p.eyeW * (1 + p.eyeGapEyes)) / 2; // center offset from cx

  return {
    view: VIEW,
    cx,
    topY,
    chinY,
    H,
    head: {
      cheekHalf,
      foreheadHalf: cheekHalf * p.foreheadRatio,
      templeHalf: cheekHalf * p.templeRatio,
      jawHalf: cheekHalf * p.jawRatio,
      chinHalf: cheekHalf * p.chinRatio,
      jawDef: p.jawDef,
      widestY,
      jawY,
    },
    eyes: {
      y: eyeY,
      dx: eyeDX,
      w: p.eyeW,
      h: p.eyeH,
      tilt: p.eyeTilt,
      left: { x: cx - eyeDX },
      right: { x: cx + eyeDX },
    },
    brows: {
      y: eyeY - p.browGap,
      thickness: p.browThickness,
      arch: p.browArch,
      len: p.eyeW * p.browLenRatio,
      dx: eyeDX,
    },
    nose: { y: noseY, w: p.noseW, topY: eyeY + 6 },
    mouth: { y: mouthY, w: p.mouthW, full: p.lipFull, smile: p.smile },
    ears: { top: eyeY - p.browGap, bottom: noseY, x: cheekHalf },
    neck: { halfW: p.neckW / 2, topY: jawY + 8, chinY },
  };
}
