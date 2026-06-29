// Idle animator: schedules the stochastic micro-motions (blinks, and casual
// "looking around" — a small head turn + eye shift) and exposes setState() for
// idle / talking / thinking / listening. Each state biases how often and in
// which direction the avatar glances. Continuous loops (breathing, drift,
// talking mouth) are CSS — see avatar.css.

const rand = (a, b) => a + Math.random() * (b - a);
const STATES = ['idle', 'talking', 'thinking', 'listening'];

// Parallax amplitudes (face-space px). The outline moves least, the face plane
// more, the eyes most — the relative shift is what reads as a head rotation.
const LOOK_AMP = 5; // outline / chin shift
const FACE_AMP = 7; // face plane shift (on top of LOOK_AMP)
const GAZE_AMP = 4; // eye shift (on top of the above)

// Resting eye offset per state (where the gaze settles between glances).
const GAZE_BASE = {
  idle: { x: 0, y: 0 },
  talking: { x: 0, y: 0 },
  thinking: { x: -2, y: -4.5 }, // clearly up & away
  listening: { x: 2.5, y: 0.6 }, // toward the speaker
};

// Head tilt (deg) per state — a strong, distinct cue. Thinking flips side with
// the glance; listening cocks toward the speaker; idle/talking stay upright.
function tiltFor(state, dx) {
  if (state === 'thinking') return dx >= 0 ? 6 : -6;
  if (state === 'listening') return 4;
  return 0;
}

// Glance behaviour per state: interval/hold timing, amplitude, candidate dirs.
// dir = [dx, dy] normalized -1..1.
const LOOK = {
  idle: {
    interval: [2600, 5400], hold: [1000, 2200], amp: 1.0,
    dirs: [[-1, 0.1], [1, 0.1], [-0.8, -0.4], [0.8, -0.4], [0, -0.3], [-0.4, 0.2], [0.4, 0.2]],
  },
  thinking: {
    interval: [3200, 6400], hold: [1800, 3400], amp: 1.0,
    dirs: [[-1, -0.6], [-0.6, -0.9], [0.5, -0.8], [-0.9, -0.3]],
  },
  listening: {
    interval: [1700, 3400], hold: [900, 1700], amp: 0.7,
    dirs: [[0.8, 0], [1, 0.15], [0.4, 0.1], [0.6, -0.2], [0.2, 0.15]],
  },
  talking: {
    interval: [2000, 4000], hold: [700, 1400], amp: 0.5,
    dirs: [[-0.6, 0], [0.6, 0], [0, -0.25], [0, 0.1], [0, 0]],
  },
};

/**
 * @param {SVGElement} root the <svg class="avatar-face"> element
 * @returns {{ setState(s:string):void, destroy():void }}
 */
export function createIdle(root) {
  const eyes = root.querySelector('.av-eyes');
  const gaze = root.querySelector('.av-gaze');
  const face = root.querySelector('.av-face');
  const look = root.querySelector('.av-look');
  const tilt = root.querySelector('.av-tilt');
  const reduce = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = 'idle';
  let alive = true;
  const timers = new Set();
  const after = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  function blinkOnce() {
    if (!alive || !eyes) return;
    eyes.classList.add('av-blink');
    after(() => eyes && eyes.classList.remove('av-blink'), 110);
  }
  function scheduleBlink() {
    const delay = state === 'thinking' ? rand(4200, 7500)
      : state === 'listening' ? rand(1500, 3200)
      : state === 'talking' ? rand(1800, 3600) : rand(2400, 5200);
    after(() => {
      if (!alive) return;
      blinkOnce();
      if (Math.random() < 0.16) after(blinkOnce, 250);
      scheduleBlink();
    }, delay);
  }

  function applyLook(dx, dy) {
    const b = GAZE_BASE[state] || GAZE_BASE.idle;
    // the outline shifts a little (incl. the chin); the face plane shifts more;
    // a slight horizontal squash of the face plane fakes the foreshortening.
    if (look) look.style.transform = `translate(${(dx * LOOK_AMP).toFixed(2)}px, ${(dy * LOOK_AMP * 0.7).toFixed(2)}px)`;
    if (face) {
      const sx = (1 - 0.05 * Math.abs(dx)).toFixed(3);
      face.style.transform = `translate(${(dx * FACE_AMP).toFixed(2)}px, ${(dy * FACE_AMP).toFixed(2)}px) scaleX(${sx})`;
    }
    if (gaze) gaze.style.transform = `translate(${(b.x + dx * GAZE_AMP).toFixed(2)}px, ${(b.y + dy * GAZE_AMP).toFixed(2)}px)`;
    if (tilt) tilt.style.transform = `rotate(${tiltFor(state, dx)}deg)`;
  }
  function scheduleLook() {
    const pat = LOOK[state] || LOOK.idle;
    after(() => {
      if (!alive) return;
      const d = pat.dirs[Math.floor(Math.random() * pat.dirs.length)];
      applyLook(d[0] * pat.amp, d[1] * pat.amp);
      after(() => { if (alive) applyLook(0, 0); }, rand(pat.hold[0], pat.hold[1])); // return to rest
      scheduleLook();
    }, rand(pat.interval[0], pat.interval[1]));
  }

  function setState(next) {
    if (!STATES.includes(next)) next = 'idle';
    state = next;
    for (const st of STATES) root.classList.remove('av-state-' + st);
    root.classList.add('av-state-' + next);
    applyLook(0, 0); // settle to the new state's resting gaze
  }

  setState('idle');
  if (!reduce) {
    scheduleBlink();
    scheduleLook();
  }

  return {
    setState,
    destroy() {
      alive = false;
      for (const t of timers) clearTimeout(t);
      timers.clear();
    },
  };
}
