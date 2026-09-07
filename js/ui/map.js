/**
 * map.js — Mapa de progreso del sistema (zonas + boss).
 */
import { el, $, bus } from '../core/utils.js';
import { ICON, BG, PATHS } from '../core/assets.js';
import { LEVELS, BOSS_NODE } from '../game/levels.js';
import { state, levelRecord } from '../core/storage.js';
import { sfx } from '../core/audio.js';

const ART = {
  z1: 'assets/sprites/objects/server_off_1.svg',
  z2: 'assets/sprites/objects/portal_1.svg',
  z3: 'assets/sprites/enemies/bug_idle_1.svg',
  z4: 'assets/sprites/items/chip.svg',
  boss: 'assets/sprites/boss/boss_idle_p1_1.svg',
};

export function renderMap() {
  const track = $('#map-track');
  if (!track) return;
  track.innerHTML = '';

  const nodes = [...LEVELS, BOSS_NODE];
  nodes.forEach((L, i) => {
    const unlocked = state.unlockedMax >= L.order;
    const rec = state.levels[L.id] || { done: false, stars: 0 };
    const isBoss = L.id === 'boss';

    const node = el('div', {
      class: `map-node ${unlocked ? 'unlocked' : 'locked'} ${rec.done ? 'done' : ''} ${isBoss ? 'boss' : ''}`,
      role: 'button',
      tabindex: unlocked ? '0' : '-1',
    },
      el('div', { class: 'node-art' }, el('img', { src: ART[L.id], alt: '' })),
      el('div', { class: 'node-info' },
        el('span', { class: 'zone-code', text: L.code }),
        el('h3', { text: L.name }),
        el('p', { text: unlocked ? (L.topic ? `Tema: ${L.topic}` : '') : 'Completa la zona anterior para desbloquear.' }),
      ),
      el('div', { class: 'node-side' },
        unlocked
          ? el('div', { class: 'node-stars' },
              [0, 1, 2].map(s => el('img', { src: ICON('star'), class: s < rec.stars ? 'on' : '', alt: '' })))
          : el('img', { src: ICON('lock'), style: { width: '30px' }, alt: 'Bloqueada' }),
        el('span', { class: 'lock-tag', text: unlocked ? (rec.done ? '✔ COMPLETADA' : '▶ DISPONIBLE') : '🔒 MISIÓN BLOQUEADA' }),
      ),
    );

    if (unlocked) {
      const go = () => { sfx('click'); bus.emit(isBoss ? 'nav:boss' : 'nav:level', L.id); };
      node.addEventListener('click', go);
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    } else {
      node.addEventListener('click', () => sfx('error'));
    }

    track.append(node);
    if (i < nodes.length - 1) {
      track.append(el('div', { class: 'map-link' + (state.unlockedMax > L.order ? ' on' : '') }));
    }
  });
}

bus.on('save:changed', () => {
  if (document.getElementById('screen-map')?.classList.contains('active')) renderMap();
});
