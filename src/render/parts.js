// Face parts. Each function is a pure (anchors, style) -> SVG-fragment string.
// Flat-vector aesthetic: solid fills + a few baked shadow shapes, no gradients.

const n = (v) => (Number.isFinite(v) ? Math.round(v * 10) / 10 : 0);

// Catmull-Rom -> cubic bezier through a closed loop of points. Gives smooth,
// natural organic edges (used for hair) without hand-tuning control handles.
function smoothClosed(pts) {
  const N = pts.length;
  let d = `M ${n(pts[0].x)} ${n(pts[0].y)}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(p2.x)} ${n(p2.y)}`;
  }
  return d + ' Z';
}

// Open Catmull-Rom curve through points (no closing). Returns "M .. C .. C ..".
function smoothOpen(pts) {
  const N = pts.length;
  let d = `M ${n(pts[0].x)} ${n(pts[0].y)}`;
  for (let i = 0; i < N - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${n(c1x)} ${n(c1y)} ${n(c2x)} ${n(c2y)} ${n(p2.x)} ${n(p2.y)}`;
  }
  return d;
}

// ---------- silhouette ----------

// One continuous, delicate contour (no segment break at the jaw): cranium ->
// temple -> cheekbone -> soft jaw -> chin, smoothed with Catmull-Rom so the
// cheek/jaw/chin reads as a single beautiful line.
export function headPath(P) {
  const { cx, topY, chinY, H } = P;
  const h = P.head;
  const wY = h.widestY;
  const jd = h.jawDef || 0; // older -> tuck the lower cheek so the jaw stands out
  const lowerCheek = h.cheekHalf * (0.9 - 0.06 * jd); // gentle tuck (avoid a gouged jaw)
  const jawCorner = wY + H * (0.16 + 0.015 * jd);
  const pts = [
    { x: cx, y: topY }, // crown top
    { x: cx + h.cheekHalf * 0.6, y: topY + H * 0.018 }, // crown shoulder
    { x: cx + h.cheekHalf * 0.95, y: topY + H * 0.12 }, // forehead / temple
    { x: cx + h.cheekHalf, y: wY }, // cheekbone (widest)
    { x: cx + lowerCheek, y: jawCorner }, // lower cheek (tucks in with age)
    { x: cx + h.jawHalf, y: h.jawY }, // jaw (no corner — neighbours smooth it)
    { x: cx + h.chinHalf, y: chinY - H * 0.05 }, // chin side
    { x: cx, y: chinY }, // chin tip
    { x: cx - h.chinHalf, y: chinY - H * 0.05 },
    { x: cx - h.jawHalf, y: h.jawY },
    { x: cx - lowerCheek, y: jawCorner },
    { x: cx - h.cheekHalf, y: wY },
    { x: cx - h.cheekHalf * 0.95, y: topY + H * 0.12 },
    { x: cx - h.cheekHalf * 0.6, y: topY + H * 0.018 },
  ];
  return smoothClosed(pts);
}

export function neck(P, s) {
  const ne = P.neck;
  const cx = P.cx;
  const topY = ne.topY;
  const botY = P.view.h;
  const topHalf = ne.halfW;
  const botHalf = ne.halfW * 1.18;
  const d = [
    `M ${n(cx - topHalf)} ${n(topY)}`,
    `C ${n(cx - topHalf)} ${n(topY + 24)} ${n(cx - botHalf)} ${n(botY - 30)} ${n(cx - botHalf)} ${n(botY)}`,
    `L ${n(cx + botHalf)} ${n(botY)}`,
    `C ${n(cx + botHalf)} ${n(botY - 30)} ${n(cx + topHalf)} ${n(topY + 24)} ${n(cx + topHalf)} ${n(topY)}`,
    'Z',
  ].join(' ');
  // under-jaw shadow
  const shadow =
    `<path d="M ${n(cx - topHalf)} ${n(topY)} Q ${n(cx)} ${n(topY + 18)} ${n(cx + topHalf)} ${n(topY)} Q ${n(cx)} ${n(topY - 6)} ${n(cx - topHalf)} ${n(topY)} Z" fill="${s.skinShadow}" opacity="0.55"/>`;
  return `<path d="${d}" fill="${s.skin}"/>${shadow}`;
}

export function shoulders(P, s) {
  const cx = P.cx;
  const botY = P.view.h;
  const topY = botY - 74;
  const half = P.view.w * 0.52;
  const d = [
    `M ${n(cx - half)} ${n(botY)}`,
    `C ${n(cx - half)} ${n(topY + 22)} ${n(cx - half * 0.4)} ${n(topY)} ${n(cx)} ${n(topY)}`,
    `C ${n(cx + half * 0.4)} ${n(topY)} ${n(cx + half)} ${n(topY + 22)} ${n(cx + half)} ${n(botY)}`,
    'Z',
  ].join(' ');
  // collar / neckline shape for a "wearing a top" read
  const ny = P.neck.chinY + 10;
  const collar = `<path d="M ${n(cx - 34)} ${n(topY + 4)} Q ${n(cx)} ${n(ny + 30)} ${n(cx + 34)} ${n(topY + 4)} Q ${n(cx)} ${n(topY + 22)} ${n(cx - 34)} ${n(topY + 4)} Z" fill="${s.collar}"/>`;
  return `<path d="${d}" fill="${s.clothing}"/>${collar}`;
}

// Cell-shade: a soft darker wedge down one side of the face (clipped to head).
export function skinShade(P, s) {
  const cx = P.cx;
  const h = P.head;
  const x0 = cx - h.cheekHalf - 24;
  const d = [
    `M ${n(x0)} ${n(P.topY - 20)}`,
    `L ${n(cx - h.cheekHalf * 0.1)} ${n(P.topY - 20)}`,
    `L ${n(cx - h.cheekHalf * 0.42)} ${n(P.chinY + 60)}`,
    `L ${n(x0)} ${n(P.chinY + 60)}`,
    'Z',
  ].join(' ');
  return `<path d="${d}" fill="${s.skinShadow}" opacity="0.14"/>`;
}

export function beard(P, s) {
  const h = P.head;
  const cx = P.cx;
  const sb = P.ears.bottom - 4; // sideburn top
  const my = P.mouth.y;
  const mw = P.mouth.w;
  const top = my + 13; // beard's central top sits BELOW the mouth -> lips on skin
  // jaw/chin mass with a clean mouth zone scooped out of the upper-centre
  const mass = [
    `M ${n(cx - h.cheekHalf * 0.94)} ${n(sb)}`,
    `C ${n(cx - h.cheekHalf)} ${n(h.jawY)} ${n(cx - h.jawHalf)} ${n(P.chinY - 4)} ${n(cx - h.chinHalf)} ${n(P.chinY + 2)}`,
    `Q ${n(cx)} ${n(P.chinY + 13)} ${n(cx + h.chinHalf)} ${n(P.chinY + 2)}`,
    `C ${n(cx + h.jawHalf)} ${n(P.chinY - 4)} ${n(cx + h.cheekHalf)} ${n(h.jawY)} ${n(cx + h.cheekHalf * 0.94)} ${n(sb)}`,
    `C ${n(cx + h.cheekHalf * 0.64)} ${n(my + 1)} ${n(cx + mw * 0.72)} ${n(top)} ${n(cx + mw * 0.4)} ${n(top + 1)}`,
    `Q ${n(cx)} ${n(top + 5)} ${n(cx - mw * 0.4)} ${n(top + 1)}`,
    `C ${n(cx - mw * 0.72)} ${n(top)} ${n(cx - h.cheekHalf * 0.64)} ${n(my + 1)} ${n(cx - h.cheekHalf * 0.94)} ${n(sb)}`,
    'Z',
  ].join(' ');
  // moustache above the upper lip, dipping under the nose
  const stache = [
    `M ${n(cx - mw * 0.46)} ${n(my - 4)}`,
    `Q ${n(cx - mw * 0.22)} ${n(my - 11)} ${n(cx)} ${n(my - 5)}`,
    `Q ${n(cx + mw * 0.22)} ${n(my - 11)} ${n(cx + mw * 0.46)} ${n(my - 4)}`,
    `Q ${n(cx + mw * 0.28)} ${n(my - 1)} ${n(cx)} ${n(my - 3)}`,
    `Q ${n(cx - mw * 0.28)} ${n(my - 1)} ${n(cx - mw * 0.46)} ${n(my - 4)}`,
    'Z',
  ].join(' ');
  return (
    `<path d="${mass}" fill="${s.hair}"/>` +
    `<path d="${mass}" fill="${s.hairShadow}" opacity="0.2"/>` +
    `<path d="${stache}" fill="${s.hair}"/>`
  );
}

export function glasses(P, s) {
  const E = P.eyes;
  const fr = s.glasses;
  const lw = E.w * 1.5;
  const lh = E.h * 1.7;
  const sw = 3.2;
  const lens = (sign) => {
    const ex = P.cx + sign * E.dx;
    const x = ex - lw / 2;
    const y = E.y - lh / 2;
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(lw)}" height="${n(lh)}" rx="${n(lh * 0.42)}" fill="#ffffff" fill-opacity="0.12" stroke="${fr}" stroke-width="${sw}"/>`;
  };
  const bridge = `<path d="M ${n(P.cx - E.dx + lw / 2 - 1)} ${n(E.y - 2)} Q ${n(P.cx)} ${n(E.y - 6)} ${n(P.cx + E.dx - lw / 2 + 1)} ${n(E.y - 2)}" fill="none" stroke="${fr}" stroke-width="${sw}"/>`;
  const arm = (sign) =>
    `<path d="M ${n(P.cx + sign * (E.dx + lw / 2 - 1))} ${n(E.y - 2)} L ${n(P.cx + sign * (E.dx + lw / 2 + 12))} ${n(E.y - 6)}" fill="none" stroke="${fr}" stroke-width="${sw}" stroke-linecap="round"/>`;
  return lens(-1) + lens(1) + bridge + arm(-1) + arm(1);
}

export function ears(P, s) {
  const e = P.ears;
  const cy = (P.eyes.y + P.nose.y) / 2 + 2;
  const ry = (P.nose.y - P.eyes.y) * 0.5;
  const rx = ry * 0.66;
  const one = (sign) => {
    const x = P.cx + sign * (e.x - rx * 0.45);
    return (
      `<ellipse cx="${n(x)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${s.skin}"/>` +
      `<path d="M ${n(x - sign * rx * 0.2)} ${n(cy - ry * 0.45)} Q ${n(x + sign * rx * 0.35)} ${n(cy)} ${n(x - sign * rx * 0.2)} ${n(cy + ry * 0.45)}" fill="none" stroke="${s.skinShadow}" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>`
    );
  };
  return one(-1) + one(1);
}

// ---------- features ----------

// Dot eyes — deliberately minimal. A single dark dot per eye, no whites/iris.
export function eyes(P, s, uid, opts = {}) {
  const E = P.eyes;
  const rx = E.w * 0.2;
  const ry = E.h * 0.46;
  const one = (sign) => {
    const ex = P.cx + sign * E.dx;
    return `<ellipse cx="${n(ex)}" cy="${n(E.y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${s.eyeDot}"/>`;
  };
  return one(-1) + one(1);
}

export function brows(P, s) {
  const B = P.brows;
  const one = (sign) => {
    const bx = P.cx + sign * B.dx;
    const innerX = bx - sign * B.len / 2;
    const outerX = bx + sign * B.len / 2;
    const by = B.y;
    return (
      `<path d="M ${n(innerX)} ${n(by + B.arch * 0.25)} Q ${n(bx)} ${n(by - B.arch)} ${n(outerX)} ${n(by + B.arch * 0.1)}" ` +
      `fill="none" stroke="${s.brow}" stroke-width="${n(B.thickness)}" stroke-linecap="round"/>`
    );
  };
  return one(-1) + one(1);
}

export function nose(P, s) {
  const N = P.nose;
  const cx = P.cx;
  const col = s.skinShadow;
  const tipY = N.y;
  // Ghibli-style: just a small soft tip mark on one side. Nothing more.
  const tip = `<path d="M ${n(cx + N.w * 0.06)} ${n(tipY - 9)} Q ${n(cx + N.w * 0.34)} ${n(tipY - 1)} ${n(cx + N.w * 0.12)} ${n(tipY + 3)}" fill="none" stroke="${col}" stroke-width="2.6" stroke-linecap="round" opacity="0.5"/>`;
  return tip;
}

export function mouth(P, s, opts = {}) {
  const M = P.mouth;
  const cx = P.cx;
  const my = M.y;
  const w = M.w;
  const full = M.full;
  const cY = my - M.smile - 1; // corners lifted into a smile

  if (opts.open) {
    // friendly open grin: dark interior + white teeth strip along the top
    const ow = w * 0.86;
    const Lx = cx - ow / 2;
    const Rx = cx + ow / 2;
    const depth = 11;
    const mouthD = `M ${n(Lx)} ${n(cY)} Q ${n(cx)} ${n(my - 3)} ${n(Rx)} ${n(cY)} Q ${n(cx)} ${n(my + depth)} ${n(Lx)} ${n(cY)} Z`;
    const teethD = `M ${n(Lx + 2)} ${n(cY)} Q ${n(cx)} ${n(my - 3)} ${n(Rx - 2)} ${n(cY)} Q ${n(cx)} ${n(my + depth * 0.34)} ${n(Lx + 2)} ${n(cY)} Z`;
    return (
      `<path d="${mouthD}" fill="${s.mouthDark}"/>` +
      `<path d="${teethD}" fill="#fbf4ee"/>` +
      `<path d="M ${n(Lx)} ${n(cY)} Q ${n(cx)} ${n(my - 3)} ${n(Rx)} ${n(cY)}" fill="none" stroke="${s.lipShadow}" stroke-width="1.6" stroke-linecap="round"/>`
    );
  }

  const peak = 5 * full;
  const dip = 1.5 * full;
  const lower = 8 * full;
  const Lx = cx - w / 2;
  const Rx = cx + w / 2;
  const d = [
    `M ${n(Lx)} ${n(cY)}`,
    `Q ${n(cx - w * 0.25)} ${n(my - peak)} ${n(cx)} ${n(my - dip)}`,
    `Q ${n(cx + w * 0.25)} ${n(my - peak)} ${n(Rx)} ${n(cY)}`,
    `Q ${n(cx)} ${n(my + lower)} ${n(Lx)} ${n(cY)}`,
    'Z',
  ].join(' ');
  const lipLine = `<path d="M ${n(Lx)} ${n(cY)} Q ${n(cx)} ${n(my + 1.5)} ${n(Rx)} ${n(cY)}" fill="none" stroke="${s.lipShadow}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<path d="${d}" fill="${s.lip}"/>${lipLine}`;
}

export function blush(P, s, opacity = 0.3) {
  const cy = (P.nose.y + P.mouth.y) / 2 - 4;
  const dx = P.eyes.dx + 12;
  const one = (sign) =>
    `<ellipse cx="${n(P.cx + sign * dx)}" cy="${n(cy)}" rx="17" ry="9" fill="${s.blush}" opacity="${opacity}"/>`;
  return one(-1) + one(1);
}

// Age lines — kept VERY light and late so age reads from proportions, not a
// sudden wrinkle pop. No nasolabial folds (they age the face too abruptly).
export function ageLines(P, s, age = 20) {
  if (age < 42) return '';
  const cx = P.cx;
  const E = P.eyes;
  const col = s.skinShadow;
  const t = clamp01((age - 42) / 13); // 42..55
  const stroke = (d, op, w = 1.4) =>
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${n(op)}"/>`;
  let out = '';

  // faint under-eye creases (42+)
  {
    const op = 0.1 + 0.13 * t;
    for (const sign of [-1, 1]) {
      const ex = cx + sign * E.dx;
      const ey = E.y + E.h * 0.55;
      out += stroke(`M ${n(ex - E.w * 0.3)} ${n(ey)} Q ${n(ex)} ${n(ey + 2)} ${n(ex + E.w * 0.3)} ${n(ey)}`, op, 1.3);
    }
  }
  // a single soft forehead line (46+), a second only at the very top of the range
  if (age >= 46) {
    const op = 0.08 + 0.12 * t;
    const fw = P.head.cheekHalf * 0.58;
    const count = age >= 53 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const y = P.brows.y - 15 - i * 11;
      out += stroke(`M ${n(cx - fw)} ${n(y)} Q ${n(cx)} ${n(y - 3)} ${n(cx + fw)} ${n(y)}`, op, 1.5);
    }
  }
  // faint nasolabial folds — only from 50 on, very light
  if (age >= 50) {
    const t2 = clamp01((age - 50) / 8);
    const op = 0.07 + 0.1 * t2;
    for (const sign of [-1, 1]) {
      const x0 = cx + sign * (P.nose.w * 0.45 + 2);
      const y0 = P.nose.y - 1;
      const x1 = cx + sign * (P.mouth.w * 0.5 + 5);
      const y1 = P.mouth.y + 4;
      out += stroke(`M ${n(x0)} ${n(y0)} Q ${n(cx + sign * (P.mouth.w * 0.55 + 9))} ${n((y0 + y1) / 2)} ${n(x1)} ${n(y1)}`, op, 1.8);
    }
  }
  return out;
}

// ---------- hair ----------
// style: 'shortMale' | 'sidePart' | 'bangsStraight' | 'bangsRound'
// returns { back, front }. Front is a smooth cap (crown + framing + fringe);
// back is the length that falls behind the face for longer styles.

// templeDepth / fringeDepth: 0 = at crown (lots of forehead), 1 = down at brows.
const HAIR_PRESETS = {
  shortMale: { sideW: 1.0, templeX: 0.95, templeDepth: 0.62, fringeDepth: 0.34, peak: 0.06, part: 0.25, backLen: 0 },
  sidePart: { sideW: 1.02, templeX: 0.96, templeDepth: 0.66, fringeDepth: 0.5, peak: 0.12, part: 0.6, backLen: 0 },
  buzz: { sideW: 0.97, templeX: 0.94, templeDepth: 0.5, fringeDepth: 0.26, peak: 0.02, part: 0.1, backLen: 0 },
  bangsStraight: { sideW: 1.05, templeX: 1.0, templeDepth: 0.95, fringeDepth: 0.98, peak: 0.0, part: 0, backLen: 0.9 },
  bangsRound: { sideW: 1.05, templeX: 1.0, templeDepth: 0.9, fringeDepth: 0.86, peak: 0.1, part: 0.15, backLen: 0.82 },
  bob: { sideW: 1.06, templeX: 1.02, templeDepth: 0.95, fringeDepth: 0.9, peak: 0.05, part: 0.12, backLen: 0.34 },
  ponytail: { sideW: 1.0, templeX: 0.97, templeDepth: 0.78, fringeDepth: 0.62, peak: 0.12, part: 0.45, backLen: 0, tail: true },
  bun: { sideW: 1.0, templeX: 0.97, templeDepth: 0.78, fringeDepth: 0.6, peak: 0.1, part: 0.3, backLen: 0, bun: true },
};

export function hair(P, s, style, uid = 'a', recede = 0) {
  const h = P.head;
  const cx = P.cx;
  const topY = P.topY;
  const H = P.H;
  const ch = h.cheekHalf;
  const eyesY = P.eyes.y;
  const browY = P.brows.y;
  const col = s.hair;
  const dark = s.hairBack;
  const pr = HAIR_PRESETS[style] || HAIR_PRESETS.shortMale;

  const sW = ch * pr.sideW;
  const tX = ch * pr.templeX;
  const span = browY - topY;
  const lift = recede * span * 0.55; // receding hairline raises the fringe
  const templeY = topY + span * pr.templeDepth - lift * 0.35;
  const fringeY = topY + span * pr.fringeDepth - lift;
  const peakY = fringeY - span * pr.peak - lift * 0.3;
  const partDX = ch * pr.part * 0.45; // sideways sweep for a part

  // Upper outline (left temple -> over the crown -> right temple), smoothed.
  const quiff = style === 'shortMale' || style === 'sidePart' ? H * 0.04 : 0;
  const upper = [
    { x: cx - tX, y: templeY },
    { x: cx - sW, y: topY + H * 0.12 },
    { x: cx - ch * 0.62, y: topY - 12 },
    { x: cx - ch * 0.18, y: topY - 16 - quiff }, // raised front -> a bit of volume
    { x: cx + ch * 0.34, y: topY - 13 },
    { x: cx + sW, y: topY + H * 0.12 },
    { x: cx + tX, y: templeY },
  ];

  // The fringe is built into the SAME path as the cap (not a separate overlay),
  // so cell-shading lands on it uniformly and there are no seams/gaps.
  let capD;
  const isBangs = pr.fringeDepth > 0.78;
  if (isBangs) {
    const lens = [9, 14, 8, 15, 9, 13, 10]; // organic lock depths, right -> left
    const NL = lens.length;
    const xR = cx + tX;
    const xL = cx - tX;
    let d = smoothOpen(upper); // ends at right temple
    let prevX = xR;
    for (let k = 0; k < NL; k++) {
      const t = (k + 1) / NL;
      const nx = xR + (xL - xR) * t;
      const mid = (prevX + nx) / 2;
      const endY = k === NL - 1 ? templeY : fringeY; // last lock meets left temple
      d += ` Q ${n(mid)} ${n(fringeY + lens[k])} ${n(nx)} ${n(endY)}`;
      prevX = nx;
    }
    capD = d + ' Z';
  } else {
    const cap = [
      ...upper,
      { x: cx + ch * 0.52 + partDX, y: fringeY },
      { x: cx + partDX, y: peakY },
      { x: cx - ch * 0.52 + partDX, y: fringeY },
    ];
    capD = smoothClosed(cap);
  }

  // soft sheen near the crown so hair reads as volume, not a flat blob
  const hiPts = [
    { x: cx - ch * 0.42, y: topY + H * 0.05 },
    { x: cx - ch * 0.08, y: topY + 1 },
    { x: cx + ch * 0.16, y: topY + 5 },
    { x: cx - ch * 0.02, y: topY + H * 0.07 },
    { x: cx - ch * 0.28, y: topY + H * 0.085 },
  ];
  // cell-shade via offset crescent: fill shadow, lay the base shifted up-left on
  // top (clipped to the cap) so a soft shadow remains along the lower-right edge.
  const clip = `hair-${uid}`;
  const highlight = `<path d="${smoothClosed(hiPts)}" fill="${s.hairHi}" opacity="0.3"/>`;
  const front =
    `<clipPath id="${clip}"><path d="${capD}"/></clipPath>` +
    `<g clip-path="url(#${clip})">` +
    `<path d="${capD}" fill="${s.hairShadow}"/>` +
    `<path d="${capD}" transform="translate(-9 -11)" fill="${col}"/>` +
    highlight +
    `</g>`;

  let back = '';
  if (pr.backLen > 0) {
    const lenY = P.neck.topY + 70 * pr.backLen;
    const bw = ch * 1.12;
    const pts = [
      { x: cx - tX, y: templeY },
      { x: cx - bw, y: eyesY },
      { x: cx - bw * 0.96, y: lenY },
      { x: cx - ch * 0.7, y: lenY + 14 },
      { x: cx + ch * 0.7, y: lenY + 14 },
      { x: cx + bw * 0.96, y: lenY },
      { x: cx + bw, y: eyesY },
      { x: cx + tX, y: templeY },
      { x: cx + ch * 0.55, y: topY - 6 },
      { x: cx, y: topY - 8 },
      { x: cx - ch * 0.55, y: topY - 6 },
    ];
    back = `<path d="${smoothClosed(pts)}" fill="${dark}"/>`;
  }

  // top bun behind the crown
  if (pr.bun) {
    const bx = cx;
    const by = topY - 6;
    const br = ch * 0.4;
    back +=
      `<ellipse cx="${n(bx)}" cy="${n(by)}" rx="${n(br)}" ry="${n(br * 0.9)}" fill="${dark}"/>` +
      `<ellipse cx="${n(bx - br * 0.3)}" cy="${n(by - br * 0.25)}" rx="${n(br * 0.5)}" ry="${n(br * 0.4)}" fill="${s.hairHi}" opacity="0.3"/>`;
  }

  // a ponytail sweeping down behind one side
  if (pr.tail) {
    const tailPts = [
      { x: cx + ch * 0.5, y: topY + H * 0.04 },
      { x: cx + ch * 1.18, y: eyesY - 6 },
      { x: cx + ch * 1.34, y: P.nose.y },
      { x: cx + ch * 1.2, y: P.neck.topY + 50 },
      { x: cx + ch * 0.86, y: P.neck.topY + 80 },
      { x: cx + ch * 0.72, y: P.neck.topY + 64 },
      { x: cx + ch * 0.94, y: P.nose.y },
      { x: cx + ch * 0.78, y: eyesY },
      { x: cx + ch * 0.4, y: topY + H * 0.12 },
    ];
    const tailD = smoothClosed(tailPts);
    back = `<path d="${tailD}" fill="${col}"/>` + back;
    // a small tie where the tail meets the head
    back += `<ellipse cx="${n(cx + ch * 0.52)}" cy="${n(topY + H * 0.08)}" rx="${n(ch * 0.14)}" ry="${n(ch * 0.1)}" fill="${dark}"/>`;
  }

  return { back, front };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
