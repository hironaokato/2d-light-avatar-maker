// Tiny color utilities. Static SVG output bakes shaded colors in JS;
// the live runtime will mirror these with CSS color-mix() where useful.

/** @param {string} hex #rrggbb */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two hex colors. t=0 -> a, t=1 -> b. */
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

/** Darken toward a warm shadow (not pure black -> avoids muddy flat shading). */
export function shade(hex, amount = 0.12) {
  return mix(hex, '#3a2b2b', amount);
}

/** Lighten toward a soft highlight. */
export function tint(hex, amount = 0.12) {
  return mix(hex, '#fffaf4', amount);
}

/** Reduce saturation toward the colour's own grey. sat=1 keeps it, 0 = grey. */
export function desaturate(hex, sat = 1) {
  const { r, g, b } = hexToRgb(hex);
  const lum = 0.3 * r + 0.59 * g + 0.11 * b;
  const s = Math.max(0, Math.min(1, sat));
  return rgbToHex(lum + (r - lum) * s, lum + (g - lum) * s, lum + (b - lum) * s);
}
