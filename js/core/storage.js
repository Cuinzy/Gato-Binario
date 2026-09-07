/**
 * storage.js — Estado persistente del jugador/equipo en localStorage.
 *
 * Guarda: alias, equipo, avatar, XP, rango, monedas, estrellas, niveles
 * completados, insignias y retos Hacker resueltos.
 */
import { bus } from './utils.js';

const KEY = 'gatobinario.save.v1';

// ---------------------------------------------------------------------------
// RANGOS
// ---------------------------------------------------------------------------
export const RANKS = [
  { xp: 0,    icon: '🐾', name: 'Gatito Digital' },
  { xp: 100,  icon: '🐱', name: 'Aprendiz Binario' },
  { xp: 250,  icon: '😼', name: 'Cazabugs' },
  { xp: 500,  icon: '🤖', name: 'Hacker Felino' },
  { xp: 800,  icon: '👾', name: 'Maestro Binario' },
  { xp: 1000, icon: '🐱‍💻', name: 'Leyenda del Código' },
];

// ---------------------------------------------------------------------------
// INSIGNIAS
// ---------------------------------------------------------------------------
export const BADGES = {
  first_bug:  { file: 'badge_first_bug.svg',  name: 'Primer Bug',        desc: 'Provocaste tu primer error… y seguiste adelante.' },
  logic:      { file: 'badge_logic.svg',      name: 'Mente Lógica',      desc: 'Resolviste una misión usando condicionales.' },
  speed:      { file: 'badge_speed.svg',      name: 'Speedrunner',       desc: 'Completaste una misión al primer intento.' },
  team:       { file: 'badge_team.svg',       name: 'Compañero de Código', desc: 'Tu equipo completó una misión juntos.' },
  coder:      { file: 'badge_coder.svg',      name: 'Programador',       desc: 'Compilaste código en la Ruta Programador.' },
  hunter:     { file: 'badge_hunter.svg',     name: 'Bug Hunter',        desc: 'Encontraste un bug oculto en el sistema.' },
  rescue:     { file: 'badge_rescue.svg',     name: 'Rescatista Binario', desc: 'Completaste las cuatro zonas del sistema.' },
  optimizer:  { file: 'badge_optimizer.svg',  name: 'Optimizador',       desc: 'Resolviste una misión con el mínimo de instrucciones.' },
  boss:       { file: 'badge_boss.svg',       name: 'Verdugo del Bug Supremo', desc: 'Derrotaste al Bug Supremo.' },
};

// ---------------------------------------------------------------------------
// ESTADO
// ---------------------------------------------------------------------------
const EMPTY = () => ({
  alias: '',
  team: '',
  avatar: 'binario',
  xp: 0,
  coins: 0,
  stars: 0,
  levels: {},          // { levelId: { done:true, stars:0-3, best:nInstrucciones, tries:n } }
  badges: [],          // ids
  hacks: [],           // 'lvl1:opt' ...
  unlockedMax: 1,      // índice máximo de nodo desbloqueado (1 = zona 1)
  bossBeaten: false,
  settings: { sfx: true, music: true, speed: 3, projector: false },
  createdAt: Date.now(),
});

export let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY();
    const parsed = JSON.parse(raw);
    return { ...EMPTY(), ...parsed, settings: { ...EMPTY().settings, ...(parsed.settings || {}) } };
  } catch {
    return EMPTY();
  }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('No se pudo guardar el progreso', e); }
  bus.emit('save:changed', state);
}

/** Reinicia todo el progreso (mantiene nada). */
export function resetAll() {
  state = EMPTY();
  save();
  bus.emit('save:reset', state);
}

/** ¿Ya hay un jugador registrado? */
export const hasProfile = () => Boolean(state.alias);

// ---------------------------------------------------------------------------
// RANGOS Y XP
// ---------------------------------------------------------------------------
export function rankOf(xp = state.xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].xp) idx = i;
  return { ...RANKS[idx], index: idx };
}

/** Progreso [0..1] hacia el siguiente rango, y XP restante. */
export function rankProgress(xp = state.xp) {
  const r = rankOf(xp);
  const next = RANKS[r.index + 1];
  if (!next) return { pct: 1, next: null, remaining: 0, cur: r };
  const span = next.xp - r.xp;
  return { pct: (xp - r.xp) / span, next, remaining: next.xp - xp, cur: r };
}

/** Suma XP y emite eventos (incluye subida de rango). */
export function addXP(amount, reason = '') {
  const before = rankOf().index;
  state.xp = Math.max(0, state.xp + amount);
  const after = rankOf().index;
  save();
  bus.emit('xp:gain', { amount, reason });
  if (after > before) bus.emit('rank:up', rankOf());
  return state.xp;
}

export function addCoins(n) { state.coins += n; save(); bus.emit('coins:gain', n); }
export function addStars(n) { state.stars += n; save(); }

// ---------------------------------------------------------------------------
// INSIGNIAS
// ---------------------------------------------------------------------------
export function grantBadge(id) {
  if (!BADGES[id] || state.badges.includes(id)) return false;
  state.badges.push(id);
  save();
  bus.emit('badge:new', { id, ...BADGES[id] });
  return true;
}
export const hasBadge = id => state.badges.includes(id);

// ---------------------------------------------------------------------------
// NIVELES
// ---------------------------------------------------------------------------
export function levelRecord(id) {
  return state.levels[id] || (state.levels[id] = { done: false, stars: 0, best: null, tries: 0 });
}

export function completeLevel(id, { stars = 1, instructions = null, order = 1 } = {}) {
  const rec = levelRecord(id);
  rec.done = true;
  rec.stars = Math.max(rec.stars, stars);
  if (instructions !== null) rec.best = rec.best === null ? instructions : Math.min(rec.best, instructions);
  state.unlockedMax = Math.max(state.unlockedMax, order + 1);
  save();
  bus.emit('level:complete', { id, rec });
}

export function markTry(id) { levelRecord(id).tries++; save(); }

export function markHack(key, xp = 50) {
  if (state.hacks.includes(key)) return false;
  state.hacks.push(key);
  addXP(xp, 'Reto Hacker');
  save();
  return true;
}
export const hasHack = key => state.hacks.includes(key);

/** Desbloquea manualmente hasta cierto nodo (panel del organizador). */
export function unlockUpTo(order) {
  state.unlockedMax = Math.max(state.unlockedMax, order);
  save();
}

export function setSetting(k, v) { state.settings[k] = v; save(); }
