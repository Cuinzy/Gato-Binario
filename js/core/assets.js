/**
 * assets.js — Catálogo de recursos gráficos y precarga.
 *
 * Todos los sprites son SVG generados por `tools/generate-sprites.mjs`.
 * Si más adelante se reemplazan por PNG/spritesheets propios, basta con
 * cambiar las rutas de este archivo: el resto del juego no se entera.
 */

const P = {
  player: 'assets/sprites/player/',
  enemy: 'assets/sprites/enemies/',
  boss: 'assets/sprites/boss/',
  item: 'assets/sprites/items/',
  obj: 'assets/sprites/objects/',
  env: 'assets/sprites/environment/',
  avatar: 'assets/sprites/avatars/',
  icon: 'assets/icons/',
  badge: 'assets/badges/',
  bg: 'assets/backgrounds/',
};

/** Genera la lista de nombres numerados: seq('bit_', 4) -> ['bit_1',...] */
const seq = (base, n, ext = '.svg') =>
  Array.from({ length: n }, (_, i) => `${base}${i + 1}${ext}`);

// ---------------------------------------------------------------------------
// ANIMACIONES
// ---------------------------------------------------------------------------
/**
 * Cada animación: { files:[rutas], fps, loop }
 * Las del jugador se construyen por variante de pelaje.
 */
export const ANIM = {};

const FURS = ['binario', 'neon', 'matrix', 'solar', 'plasma', 'ghost'];

for (const fur of FURS) {
  const b = `${P.player}cat_${fur}_`;
  ANIM[`cat.${fur}.idle`]   = { files: seq(b + 'idle_', 6), fps: 5, loop: true };
  ANIM[`cat.${fur}.walk`]   = { files: seq(b + 'walk_', 6), fps: 12, loop: true };
  ANIM[`cat.${fur}.jump`]   = { files: seq(b + 'jump_', 3), fps: 8, loop: false };
  ANIM[`cat.${fur}.happy`]  = { files: seq(b + 'happy_', 4), fps: 8, loop: true };
  ANIM[`cat.${fur}.hurt`]   = { files: seq(b + 'hurt_', 3), fps: 8, loop: false };
  ANIM[`cat.${fur}.down`]   = { files: [b + 'down_1.svg'], fps: 1, loop: false };
  ANIM[`cat.${fur}.action`] = { files: seq(b + 'action_', 2), fps: 6, loop: true };
}

Object.assign(ANIM, {
  'bug.idle':      { files: seq(P.enemy + 'bug_idle_', 4), fps: 6, loop: true },
  'bug.angry':     { files: seq(P.enemy + 'bug_angry_', 2), fps: 8, loop: true },
  'bug.hurt':      { files: [P.enemy + 'bug_hurt_1.svg'], fps: 1, loop: false },
  'bugGreen.idle': { files: seq(P.enemy + 'bug_green_idle_', 4), fps: 6, loop: true },
  'robot.idle':    { files: seq(P.enemy + 'robot_idle_', 4), fps: 5, loop: true },
  'robot.move':    { files: seq(P.enemy + 'robot_move_', 4), fps: 10, loop: true },
  'robot.alert':   { files: seq(P.enemy + 'robot_alert_', 2), fps: 8, loop: true },
  'glitch.idle':   { files: seq(P.enemy + 'glitch_', 4), fps: 10, loop: true },
  'virus.idle':    { files: seq(P.enemy + 'virus_', 4), fps: 8, loop: true },

  'bit.spin':      { files: seq(P.item + 'bit_', 4), fps: 8, loop: true },
  'star.idle':     { files: seq(P.item + 'star_', 4), fps: 6, loop: true },
  'key.idle':      { files: [P.item + 'key.svg'], fps: 1, loop: true },
  'chip.idle':     { files: [P.item + 'chip.svg'], fps: 1, loop: true },
  'chipCyan.idle': { files: [P.item + 'chip_cyan.svg'], fps: 1, loop: true },
  'gem.idle':      { files: [P.item + 'gem.svg'], fps: 1, loop: true },

  'server.off':    { files: seq(P.obj + 'server_off_', 2), fps: 3, loop: true },
  'server.on':     { files: seq(P.obj + 'server_on_', 2), fps: 4, loop: true },
  'terminal.idle': { files: seq(P.obj + 'terminal_', 3), fps: 4, loop: true },
  'chest.closed':  { files: [P.obj + 'chest_closed.svg'], fps: 1, loop: true },
  'chest.open':    { files: [P.obj + 'chest_open.svg'], fps: 1, loop: true },
  'door.locked':   { files: [P.obj + 'door_locked.svg'], fps: 1, loop: true },
  'door.open':     { files: [P.obj + 'door_open.svg'], fps: 1, loop: true },
  'portal.idle':   { files: seq(P.obj + 'portal_', 4), fps: 8, loop: true },
  'firewall.idle': { files: seq(P.obj + 'firewall_', 3), fps: 10, loop: true },
  'switch.off':    { files: [P.obj + 'switch_off.svg'], fps: 1, loop: true },
  'switch.on':     { files: [P.obj + 'switch_on.svg'], fps: 1, loop: true },
  'goal.idle':     { files: seq(P.obj + 'goal_', 4), fps: 6, loop: true },
});

// Boss: una animación idle por fase + estados
for (let p = 1; p <= 4; p++) {
  ANIM[`boss.idle${p}`] = { files: seq(`${P.boss}boss_idle_p${p}_`, 4), fps: 4, loop: true };
}
ANIM['boss.attack'] = { files: seq(P.boss + 'boss_attack_', 2), fps: 6, loop: true };
ANIM['boss.hurt'] = { files: seq(P.boss + 'boss_hurt_', 2), fps: 8, loop: false };
ANIM['boss.dead'] = { files: [P.boss + 'boss_defeated_1.svg'], fps: 1, loop: false };

// ---------------------------------------------------------------------------
// TILES DE ESCENARIO (por zona)
// ---------------------------------------------------------------------------
export const TILES = {
  floor: z => [0, 1, 2].map(v => `${P.env}floor_z${z}_${v}.svg`),
  wall: z => `${P.env}wall_z${z}.svg`,
  platform: z => `${P.env}platform_z${z}.svg`,
};

export const PATHS = P;
export const AVATARS = FURS.map(f => ({ id: f, file: `${P.avatar}avatar_${f}.svg` }));

export const ICON = name => `${P.icon}${name}.svg`;
export const BADGE = file => `${P.badge}${file}`;
export const BG = name => `${P.bg}bg_${name}.svg`;

// ---------------------------------------------------------------------------
// CACHÉ DE IMÁGENES
// ---------------------------------------------------------------------------
const cache = new Map();

/** Devuelve (y crea si hace falta) la Image de una ruta. */
export function img(src) {
  let im = cache.get(src);
  if (!im) {
    im = new Image();
    im.src = src;
    cache.set(src, im);
  }
  return im;
}

/** ¿La imagen ya se puede dibujar? */
export const ready = im => im && im.complete && im.naturalWidth > 0;

/**
 * Devuelve el frame actual de una animación según el reloj (ms).
 * `startedAt` permite que animaciones no cíclicas se congelen en el último frame.
 */
export function frame(animName, timeMs, startedAt = 0) {
  const a = ANIM[animName];
  if (!a) return null;
  const elapsed = Math.max(0, timeMs - startedAt);
  let i = Math.floor((elapsed / 1000) * a.fps);
  i = a.loop ? i % a.files.length : Math.min(i, a.files.length - 1);
  return img(a.files[i]);
}

/**
 * Precarga un conjunto de rutas. Devuelve una promesa que resuelve
 * cuando todas terminan (con éxito o error, no bloquea el juego).
 */
export function preload(list, onProgress) {
  let done = 0;
  const total = list.length;
  return Promise.all(list.map(src => new Promise(res => {
    const im = img(src);
    const finish = () => { done++; onProgress?.(done / total, src); res(im); };
    if (ready(im)) return finish();
    im.addEventListener('load', finish, { once: true });
    im.addEventListener('error', finish, { once: true });
  })));
}

/** Lista completa de recursos necesarios para jugar sin parpadeos. */
export function coreAssetList() {
  const list = new Set();
  for (const a of Object.values(ANIM)) a.files.forEach(f => list.add(f));
  for (let z = 0; z < 5; z++) {
    TILES.floor(z).forEach(f => list.add(f));
    list.add(TILES.wall(z));
    list.add(TILES.platform(z));
  }
  AVATARS.forEach(a => list.add(a.file));
  ['xp', 'coin', 'star', 'heart', 'lock', 'unlock', 'key', 'play', 'restart', 'map', 'trophy',
   'bug', 'code', 'blocks', 'hacker', 'check', 'close', 'teacher', 'projector', 'fullscreen',
   'sound_on', 'sound_off', 'music_on', 'music_off', 'team', 'gear',
   'cmd_forward', 'cmd_back', 'cmd_left', 'cmd_right', 'cmd_jump', 'cmd_grab', 'cmd_activate',
   'cmd_wait', 'cmd_if', 'cmd_else', 'cmd_repeat', 'cmd_function', 'cmd_scan']
    .forEach(n => list.add(ICON(n)));
  ['menu', 'map', 'zone1', 'zone2', 'zone3', 'zone4', 'boss'].forEach(b => list.add(BG(b)));
  list.add('assets/logo.svg');
  list.add('assets/logo_mark.svg');
  return Array.from(list);
}
