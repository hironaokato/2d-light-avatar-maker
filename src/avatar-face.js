// <avatar-face> custom element — the portable, drop-in way to use avatars in
// another project. ESM build (uses the source modules directly).
//
//   import 'path/to/src/avatar-face.js';
//   <avatar-face seed="aoi" state="idle"></avatar-face>
//
// Attributes: seed, fem (0..1, optional), state (idle|talking|thinking|listening),
// animated ("false" to render a still). Size via CSS on the element.

import { generate } from './genome/generator.js';
import { renderFace } from './render/face.js';
import { createIdle } from './anim/idle.js';

const CSS_URL = new URL('./anim/avatar.css', import.meta.url).href;
const HOST_CSS = ':host{display:inline-block;width:120px;height:120px;line-height:0}svg{width:100%;height:100%;display:block}';
let uidc = 0;

export class AvatarFace extends HTMLElement {
  static get observedAttributes() { return ['seed', 'fem', 'age', 'bg-sat', 'shape', 'state', 'animated']; }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  disconnectedCallback() { if (this._idle) this._idle.destroy(); }

  attributeChangedCallback(name, _old, val) {
    if (!this.shadowRoot || !this.shadowRoot.firstChild) return;
    if (name === 'state' && this._idle) { this._idle.setState(val || 'idle'); return; }
    this._render();
  }

  set state(v) { this.setAttribute('state', v); }
  get state() { return this.getAttribute('state') || 'idle'; }

  _render() {
    const seed = this.getAttribute('seed') || 'avatar';
    const opts = {};
    const femAttr = this.getAttribute('fem');
    if (femAttr != null && femAttr !== '') opts.fem = parseFloat(femAttr);
    const ageAttr = this.getAttribute('age');
    if (ageAttr != null && ageAttr !== '') opts.age = parseFloat(ageAttr);
    const satAttr = this.getAttribute('bg-sat');
    if (satAttr != null && satAttr !== '') opts.bgSat = parseFloat(satAttr);
    const shapeAttr = this.getAttribute('shape');
    if (shapeAttr) opts.shape = shapeAttr;
    const g = generate(seed, opts);
    const svg = renderFace(g, 'ac' + uidc++);
    if (this._idle) { this._idle.destroy(); this._idle = null; }
    this.shadowRoot.innerHTML = `<link rel="stylesheet" href="${CSS_URL}"><style>${HOST_CSS}</style>${svg}`;
    if (this.getAttribute('animated') !== 'false') {
      this._idle = createIdle(this.shadowRoot.querySelector('svg'));
      this._idle.setState(this.getAttribute('state') || 'idle');
    }
  }
}

if (!customElements.get('avatar-face')) customElements.define('avatar-face', AvatarFace);
