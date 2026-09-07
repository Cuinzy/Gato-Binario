/**
 * utils.js — Utilidades cortas usadas en todo el proyecto.
 */

/** Selector único. */
export const $ = (sel, root = document) => root.querySelector(sel);
/** Selector múltiple (devuelve Array). */
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Crea un elemento con clases, atributos e hijos en una sola llamada. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** Limita un valor entre min y max. */
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** Interpolación lineal. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Suavizado tipo "ease out cubic". */
export const easeOut = t => 1 - Math.pow(1 - t, 3);
/** Suavizado tipo "ease in-out". */
export const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Promesa que espera `ms` milisegundos. */
export const wait = ms => new Promise(r => setTimeout(r, ms));

/** Entero aleatorio en [a, b]. */
export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
/** Flotante aleatorio en [a, b). */
export const rand = (a, b) => a + Math.random() * (b - a);
/** Elemento aleatorio de un array. */
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/** Barajado Fisher-Yates (devuelve una copia). */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Escapa texto para insertarlo en HTML. */
export const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Bus de eventos mínimo para comunicar módulos sin acoplarlos. */
export const bus = {
  _m: new Map(),
  on(evt, fn) { (this._m.get(evt) || this._m.set(evt, []).get(evt)).push(fn); return () => this.off(evt, fn); },
  off(evt, fn) { const l = this._m.get(evt); if (l) l.splice(l.indexOf(fn), 1); },
  emit(evt, data) { (this._m.get(evt) || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); },
};
