/**
 * screens.js — Navegación entre pantallas y utilidades de overlay.
 */
import { $, $$, bus } from '../core/utils.js';
import { BG } from '../core/assets.js';
import { sfx, playMusic } from '../core/audio.js';

const MUSIC_BY_SCREEN = {
  'screen-title': 'menu',
  'screen-player': 'menu',
  'screen-map': 'menu',
  'screen-level': 'level',
  'screen-boss': 'boss',
  'screen-victory': 'victory',
};

let current = 'screen-boot';

/** Muestra una pantalla por id y oculta las demás. */
export function show(id) {
  if (current === id) return;
  $$('.screen').forEach(s => s.classList.remove('active', 'anim-in'));
  const node = document.getElementById(id);
  if (!node) return;
  node.classList.add('active', 'anim-in');
  current = id;
  const track = MUSIC_BY_SCREEN[id];
  if (track) playMusic(track);
  bus.emit('screen:change', id);
}

export const currentScreen = () => current;

/** Aplica los fondos generados a los contenedores `.title-bg`. */
export function paintBackgrounds() {
  $$('.title-bg').forEach(node => {
    const name = node.dataset.bg;
    if (name) node.style.backgroundImage = `url('${BG(name)}')`;
  });
}

// ---------------------------------------------------------------------------
// OVERLAYS
// ---------------------------------------------------------------------------
export function openOverlay(id) {
  const ov = document.getElementById(id);
  if (!ov) return;
  ov.hidden = false;
  sfx('click');
}

export function closeOverlay(id) {
  const ov = document.getElementById(id);
  if (ov) ov.hidden = true;
}

export function initOverlays() {
  $$('[data-close]').forEach(btn =>
    btn.addEventListener('click', () => closeOverlay(btn.dataset.close)));
  $$('.overlay').forEach(ov => ov.addEventListener('click', e => {
    if (e.target === ov && !ov.classList.contains('no-dismiss')) ov.hidden = true;
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.overlay:not([hidden])').forEach(o => { if (!o.classList.contains('no-dismiss')) o.hidden = true; });
  });
}

// ---------------------------------------------------------------------------
// PANTALLA COMPLETA Y MODO PROYECTOR
// ---------------------------------------------------------------------------
export function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

export function setProjector(on) {
  document.body.classList.toggle('projector', on);
  window.dispatchEvent(new Event('resize'));
}
