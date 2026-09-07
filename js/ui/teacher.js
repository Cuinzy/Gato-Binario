/**
 * teacher.js — Panel del docente / organizador del club.
 * Sin contraseña: se usa localmente durante la reunión.
 */
import { el, $, bus } from '../core/utils.js';
import { state, addXP, unlockUpTo, resetAll, setSetting, save, grantBadge } from '../core/storage.js';
import { LEVELS } from '../game/levels.js';
import { toggleSfx, toggleMusic, sfx } from '../core/audio.js';
import { toggleFullscreen, setProjector, closeOverlay } from './screens.js';
import { refreshHUD } from './hud.js';
import { term } from './terminal.js';
import * as fx from '../core/fx.js';

export function renderTeacher() {
  const host = $('#teacher-body');
  host.innerHTML = '';

  host.append(el('p', { class: 'panel-sub' },
    'Controles rápidos para dirigir la sesión. Los cambios se guardan al instante.'));

  const grid = el('div', { class: 'teach-grid' });

  // --- Navegación de niveles ---
  grid.append(box('IR A UNA ZONA', [
    ...LEVELS.map(L => btn(L.code, () => { closeOverlay('ov-teacher'); bus.emit('nav:level', L.id); })),
    btn('BOSS', () => { closeOverlay('ov-teacher'); bus.emit('nav:boss'); }, 'btn-warn'),
    btn('MAPA', () => { closeOverlay('ov-teacher'); bus.emit('nav:map'); }, 'btn-ghost'),
  ]));

  // --- Desbloqueos ---
  grid.append(box('DESBLOQUEAR', [
    btn('SIGUIENTE ZONA', () => { unlockUpTo(state.unlockedMax + 1); toast('Zona desbloqueada'); }),
    btn('TODAS LAS ZONAS', () => { unlockUpTo(5); toast('Todo el mapa desbloqueado'); }),
    btn('BOSS FINAL', () => { unlockUpTo(5); toast('Bug Supremo disponible'); }),
  ]));

  // --- XP ---
  grid.append(box('EXPERIENCIA', [
    btn('+20 XP AYUDA', () => { addXP(20, 'Ayudar a un compañero'); toast('+20 XP · Ayudar a un compañero'); }),
    btn('+25 XP EQUIPO', () => { addXP(25, 'Bonus de equipo'); toast('+25 XP · Bonus de equipo'); }),
    btn('+100 XP', () => { addXP(100, 'Ajuste del organizador'); toast('+100 XP'); }),
    btn('−100 XP', () => { addXP(-100); toast('−100 XP'); }, 'btn-ghost'),
  ]));

  // --- Retos hacker ---
  const hackOn = state.settings.hacksVisible !== false;
  grid.append(box('RETOS HACKER', [
    btn(hackOn ? 'DESACTIVAR' : 'ACTIVAR', () => {
      setSetting('hacksVisible', !hackOn);
      document.body.classList.toggle('no-hacks', hackOn);
      // Si la ruta Hacker estaba abierta, volvemos a la ruta Explorador
      if (hackOn && document.querySelector('.route-tab[data-route="hacker"].active')) {
        document.querySelector('.route-tab[data-route="explorador"]').click();
      }
      renderTeacher();
      toast(hackOn ? 'Retos Hacker ocultos' : 'Retos Hacker visibles');
    }, hackOn ? 'btn-ghost' : ''),
    btn('LIMPIAR RETOS', () => { state.hacks = []; save(); toast('Retos Hacker reiniciados'); }, 'btn-ghost'),
  ]));

  // --- Presentación ---
  grid.append(box('PRESENTACIÓN', [
    btn('PROYECTOR', () => {
      const on = !document.body.classList.contains('projector');
      setProjector(on); setSetting('projector', on);
      toast(on ? 'Modo proyector activado' : 'Modo proyector desactivado');
    }),
    btn('PANTALLA COMPLETA', toggleFullscreen),
  ]));

  // --- Audio ---
  grid.append(box('AUDIO', [
    btn(state.settings.sfx ? '🔊 SONIDO ON' : '🔇 SONIDO OFF', () => { toggleSfx(); renderTeacher(); bus.emit('audio:changed'); }),
    btn(state.settings.music ? '🎵 MÚSICA ON' : '🎵 MÚSICA OFF', () => { toggleMusic(); renderTeacher(); bus.emit('audio:changed'); }),
  ]));

  // --- Partida ---
  grid.append(box('PARTIDA', [
    btn('REINICIAR BOSS', () => { delete state.levels.boss; state.bossBeaten = false; save(); toast('Boss reiniciado'); }, 'btn-ghost'),
    btn('REINICIAR PROGRESO', () => {
      if (confirm('¿Borrar TODO el progreso del equipo? Esta acción no se puede deshacer.')) {
        resetAll();
        toast('Progreso borrado');
        closeOverlay('ov-teacher');
        bus.emit('nav:reset');
      }
    }, 'btn-warn'),
  ]));

  host.append(grid);
  host.append(el('div', { class: 'teach-note' },
    `Equipo: ${state.team || '—'} · Alias: ${state.alias || '—'} · XP: ${state.xp} · Bits: ${state.coins} · Insignias: ${state.badges.length}`));
  host.append(el('div', { class: 'teach-note' },
    'Sugerencia: proyecta la zona y deja que cada equipo dicte las instrucciones en voz alta antes de ejecutar.'));
}

function box(title, children) {
  return el('div', { class: 'teach-box' }, el('h4', {}, title), el('div', { class: 'row' }, children));
}

function btn(text, fn, cls = '') {
  return el('button', { class: `btn btn-mini ${cls}`, text, onclick: () => { sfx('click'); fn(); refreshHUD(); } });
}

function toast(msg) {
  term(msg.toLowerCase(), 'c');
  const host = $('#toasts');
  const node = el('div', { class: 'toast good', text: msg });
  host.append(node);
  setTimeout(() => node.remove(), 3000);
}
