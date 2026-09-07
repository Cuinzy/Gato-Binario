/**
 * app.js — Arranque y pegamento de toda la aplicación.
 */
import { $, $$, el, bus, wait, pick, shuffle } from './core/utils.js';
import { AVATARS, ICON, BADGE, coreAssetList, preload, ANIM } from './core/assets.js';
import { initAudio, resumeAudio, sfx, playMusic, toggleSfx, toggleMusic } from './core/audio.js';
import * as fx from './core/fx.js';
import { state, save, setSetting, hasProfile, rankOf, addXP, grantBadge, BADGES } from './core/storage.js';
import { show, paintBackgrounds, initOverlays, openOverlay, closeOverlay, toggleFullscreen, setProjector } from './ui/screens.js';
import { mountHUD, refreshHUD } from './ui/hud.js';
import { playBoot, initTerminalToggle, startAmbient, term } from './ui/terminal.js';
import { renderMap } from './ui/map.js';
import { renderProfile, renderHow, renderBrief } from './ui/dialogs.js';
import { renderTeacher } from './ui/teacher.js';
import { LEVELS, getLevel } from './game/levels.js';
import { LevelScreen } from './game/level-screen.js';
import { BossFight } from './game/boss.js';

const TEAM_IDEAS = ['ByteCats', 'Null Hunters', 'Ctrl+Cats', 'Bug Destroyers', 'Los Compiladores',
  'Kernel Panic', 'Gatos del Loop', 'Segmentation Fault', 'HelloWorld!', '404 Not Found'];

let levelScreen = null;
let boss = null;

// ===========================================================================
// ARRANQUE
// ===========================================================================
async function main() {
  paintBackgrounds();
  initOverlays();
  initTerminalToggle();
  bindGlobalControls();
  bindNavigation();
  bindRewards();

  if (state.settings.projector) setProjector(true);
  if (state.settings.hacksVisible === false) document.body.classList.add('no-hacks');

  // Precarga en segundo plano mientras corre el arranque
  const pre = preload(coreAssetList());

  await playBoot($('#boot-log'), $('#boot-fill'));
  await pre;
  document.body.classList.remove('booting');

  show('screen-title');
  startTitleCat();
  startAmbient();
  fx.startAmbientGlitch();
  term('sistema listo', 'c');
}

// ===========================================================================
// PANTALLA DE TÍTULO
// ===========================================================================
function startTitleCat() {
  const node = $('#title-cat');
  const files = ANIM[`cat.${state.avatar}.idle`].files;
  let i = 0;
  setInterval(() => {
    node.style.backgroundImage = `url('${files[i % files.length]}')`;
    i++;
  }, 180);
}

// ===========================================================================
// CONTROLES GLOBALES
// ===========================================================================
function bindGlobalControls() {
  // El audio necesita un gesto del usuario para arrancar
  const kick = () => { initAudio(); resumeAudio(); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick);

  $('#btn-start').addEventListener('click', () => {
    resumeAudio(); sfx('click');
    if (hasProfile()) { goMap(); } else { showPlayerScreen(); }
  });

  $('#btn-title-profile').addEventListener('click', () => { renderProfile(); openOverlay('ov-profile'); });
  $('#btn-title-how').addEventListener('click', () => { renderHow(); openOverlay('ov-how'); });

  $('#btn-sfx').addEventListener('click', () => { toggleSfx(); syncAudioIcons(); });
  $('#btn-music').addEventListener('click', () => { toggleMusic(); syncAudioIcons(); });
  bus.on('audio:changed', syncAudioIcons);

  $('#btn-projector').addEventListener('click', () => {
    const on = !document.body.classList.contains('projector');
    setProjector(on); setSetting('projector', on); sfx('click');
  });
  $('#btn-fullscreen').addEventListener('click', () => { toggleFullscreen(); sfx('click'); });
  $('#btn-teacher').addEventListener('click', () => { renderTeacher(); openOverlay('ov-teacher'); });

  $('#btn-vic-map').addEventListener('click', () => goMap());
  $('#btn-vic-profile').addEventListener('click', () => { renderProfile(); openOverlay('ov-profile'); });

  syncAudioIcons();

  // Atajo del organizador: Ctrl+Shift+P abre el panel
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault(); renderTeacher(); openOverlay('ov-teacher');
    }
  });
}

function syncAudioIcons() {
  $('#btn-sfx').firstElementChild.src = ICON(state.settings.sfx ? 'sound_on' : 'sound_off');
  $('#btn-music').firstElementChild.src = ICON(state.settings.music ? 'music_on' : 'music_off');
}

// ===========================================================================
// REGISTRO DE JUGADOR / EQUIPO
// ===========================================================================
function showPlayerScreen() {
  show('screen-player');

  const alias = $('#in-alias');
  const team = $('#in-team');
  alias.value = state.alias || '';
  team.value = state.team || '';

  // Sugerencias de nombre de equipo
  const sug = $('#team-suggest');
  sug.innerHTML = '';
  shuffle(TEAM_IDEAS).slice(0, 5).forEach(name =>
    sug.append(el('button', {
      class: 'chip-sug', text: name,
      onclick: () => { team.value = name; sfx('click'); },
    })));

  // Selección de avatar
  const grid = $('#avatar-grid');
  grid.innerHTML = '';
  const names = { binario: 'Binario', neon: 'Neón', matrix: 'Matrix', solar: 'Solar', plasma: 'Plasma', ghost: 'Fantasma' };
  AVATARS.forEach(a => {
    const opt = el('button', {
      class: 'avatar-opt' + (state.avatar === a.id ? ' sel' : ''),
      dataset: { id: a.id },
      onclick: () => {
        state.avatar = a.id; save(); sfx('click');
        $$('.avatar-opt').forEach(n => n.classList.toggle('sel', n.dataset.id === a.id));
      },
    }, el('img', { src: a.file, alt: names[a.id] }), el('span', { text: names[a.id] }));
    grid.append(opt);
  });

  $('#btn-player-back').onclick = () => { sfx('click'); show('screen-title'); };
  $('#btn-player-go').onclick = () => {
    const a = alias.value.trim();
    const t = team.value.trim();
    if (!a) { alias.focus(); alias.style.borderColor = 'var(--red)'; sfx('error'); return; }
    state.alias = a;
    state.team = t || 'EQUIPO SIN NOMBRE';
    save();
    sfx('success');
    term(`operador ${a} conectado`, 'c');
    term(`equipo: ${state.team}`, 'c');
    goMap();
  };
}

// ===========================================================================
// NAVEGACIÓN
// ===========================================================================
function bindNavigation() {
  bus.on('nav:map', () => goMap());
  bus.on('nav:level', id => goLevel(id));
  bus.on('nav:boss', () => goBoss());
  bus.on('nav:victory', () => goVictory());
  bus.on('nav:reset', () => { show('screen-title'); });
}

function goMap() {
  if (levelScreen) levelScreen.unload();
  if (boss) boss.stop();
  if (!hasProfile()) return showPlayerScreen();
  renderMap();
  refreshHUD();
  show('screen-map');
}

function goLevel(id) {
  const level = getLevel(id);
  if (!level) return;
  if (boss) boss.stop();
  show('screen-level');
  if (!levelScreen) levelScreen = new LevelScreen();
  levelScreen.load(level);
  refreshHUD();
}

function goBoss() {
  if (levelScreen) levelScreen.unload();
  show('screen-boss');
  if (!boss) boss = new BossFight();
  boss.start();
  refreshHUD();
}

function goVictory() {
  if (boss) boss.stop();
  show('screen-victory');
  $('#vic-cat-img').src = `assets/sprites/player/cat_${state.avatar}_happy_2.svg`;
  const zonesDone = Object.values(state.levels).filter(l => l.done && l.stars).length;
  const stars = Object.values(state.levels).reduce((a, l) => a + (l.stars || 0), 0);
  $('#vic-stats').innerHTML = '';
  $('#vic-stats').append(
    vicStat(state.xp, 'XP TOTAL'),
    vicStat(rankOf().name, 'RANGO'),
    vicStat(stars, 'ESTRELLAS'),
    vicStat(state.coins, 'BITS'),
    vicStat(state.badges.length, 'INSIGNIAS'),
    vicStat(state.hacks.length, 'RETOS HACKER'),
  );
  fx.confetti(160);
  playMusic('victory');
}

const vicStat = (v, label) => el('div', { class: 'vic-stat' }, el('b', { text: v }), el('span', { text: label }));

// ===========================================================================
// RECOMPENSAS VISUALES
// ===========================================================================
function bindRewards() {
  bus.on('xp:gain', ({ amount }) => {
    if (!amount) return;
    sfx('xp');
    const hud = document.querySelector('.screen.active .hud-rank') || document.body;
    fx.floatOver(hud, `${amount > 0 ? '+' : ''}${amount} XP`, amount > 0 ? 'xp' : 'bad');
  });

  bus.on('coins:gain', n => {
    if (!n) return;
    const hud = document.querySelector('.screen.active .stat.coin');
    fx.floatOver(hud, `+${n} BITS`, 'coin');
  });

  bus.on('rank:up', rank => {
    sfx('levelup');
    fx.confetti(90);
    fx.flash('rgba(255,210,63,.32)');
    const banner = el('div', { class: 'rankup-banner' },
      el('small', { text: 'NUEVO RANGO' }),
      el('b', { text: `${rank.icon} ${rank.name}` }));
    document.body.append(banner);
    setTimeout(() => banner.remove(), 2900);
    term(`rango alcanzado: ${rank.name}`, 'c');
  });

  bus.on('badge:new', b => {
    sfx('unlock');
    const pop = el('div', { class: 'badge-pop' },
      el('img', { src: BADGE(b.file), alt: '' }),
      el('div', { class: 'bp-txt' },
        el('small', { text: 'INSIGNIA DESBLOQUEADA' }),
        el('b', { text: b.name })));
    document.body.append(pop);
    setTimeout(() => pop.remove(), 3500);
    term(`insignia desbloqueada: ${b.name}`, 'c');
  });

  bus.on('level:complete', ({ id }) => term(`zona ${id} completada`, 'c'));
}

// ===========================================================================
// HUD EN LAS PANTALLAS QUE LO NECESITAN
// ===========================================================================
mountHUD('#topbar-map', { showMap: false });
mountHUD('#topbar-level');
mountHUD('#topbar-boss');

/**
 * Punto de acceso para depuración desde la consola del navegador.
 * Ejemplo:  GB.goLevel('z3')   ·   GB.state.xp
 */
window.GB = {
  get level() { return levelScreen; },
  get boss() { return boss; },
  state, bus, goMap, goLevel, goBoss, goVictory, LEVELS,
};

main();
