/**
 * hud.js — Barra superior con identidad, rango, XP, bits, estrellas e insignias.
 * Se pinta en varios contenedores (mapa, nivel, boss) manteniéndolos sincronizados.
 */
import { el, $, $$, bus } from '../core/utils.js';
import { ICON, AVATARS } from '../core/assets.js';
import { state, rankOf, rankProgress } from '../core/storage.js';
import { openOverlay } from './screens.js';
import { renderProfile } from './dialogs.js';

const hosts = [];

/** Registra un contenedor de HUD. */
export function mountHUD(selector, opts = {}) {
  const host = $(selector);
  if (!host) return;
  hosts.push({ host, opts });
  paint(host, opts);
}

export function refreshHUD() {
  hosts.forEach(({ host, opts }) => paint(host, opts));
}

function paint(host, opts) {
  const rp = rankProgress();
  const avatarFile = AVATARS.find(a => a.id === state.avatar)?.file || AVATARS[0].file;

  host.innerHTML = '';
  host.append(
    el('div', { class: 'hud-id' },
      el('img', { src: avatarFile, alt: '' }),
      el('div', { class: 'who' },
        el('div', { class: 'alias', text: state.alias || 'OPERADOR' }),
        el('div', { class: 'team', text: state.team || 'SIN EQUIPO' }),
      ),
    ),
    el('div', { class: 'hud-rank' },
      el('div', { class: 'rank-line' },
        el('span', { class: 'rank-name', text: `${rp.cur.icon} ${rp.cur.name}` }),
        el('span', { class: 'rank-xp', text: rp.next ? `${state.xp} / ${rp.next.xp} XP` : `${state.xp} XP · MÁXIMO` }),
      ),
      el('div', { class: 'xp-track' }, el('div', { class: 'xp-fill', style: { width: Math.round(rp.pct * 100) + '%' } })),
    ),
    el('div', { class: 'hud-stats' },
      stat('coin', ICON('coin'), state.coins),
      stat('star', ICON('star'), state.stars),
      stat('badge', ICON('trophy'), state.badges.length),
    ),
    el('div', { class: 'hud-spacer' }),
    el('div', { class: 'hud-actions' },
      opts.showMap !== false ? el('button', { class: 'btn btn-mini btn-ghost', id: '', text: '🗺 MAPA', onclick: () => bus.emit('nav:map') }) : null,
      el('button', { class: 'btn btn-mini btn-ghost', text: '👤 PERFIL', onclick: () => { renderProfile(); openOverlay('ov-profile'); } }),
    ),
  );
}

function stat(cls, icon, value) {
  return el('div', { class: `stat ${cls}` },
    el('img', { src: icon, alt: '' }),
    el('span', { class: 'v', text: value }),
  );
}

// Repinta automáticamente cuando cambia el guardado
bus.on('save:changed', () => refreshHUD());
