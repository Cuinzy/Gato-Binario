/**
 * dialogs.js — Contenido de los overlays: perfil, briefing de zona,
 * ayuda "¿cómo se juega?" y pantalla de resultado de misión.
 */
import { el, $, esc } from '../core/utils.js';
import { ICON, BADGE, AVATARS } from '../core/assets.js';
import { state, BADGES, rankProgress, RANKS } from '../core/storage.js';
import { openOverlay, closeOverlay } from './screens.js';
import { sfx } from '../core/audio.js';

// ---------------------------------------------------------------------------
// PERFIL
// ---------------------------------------------------------------------------
export function renderProfile() {
  const host = $('#profile-body');
  const rp = rankProgress();
  const avatar = AVATARS.find(a => a.id === state.avatar)?.file || AVATARS[0].file;
  const zonesDone = Object.values(state.levels).filter(l => l.done).length;

  host.innerHTML = '';
  host.append(
    el('div', { class: 'profile-head' },
      el('img', { class: 'pf-avatar', src: avatar, alt: '' }),
      el('div', {},
        el('h2', { text: state.alias || 'OPERADOR' }),
        el('div', { class: 'pf-team', text: '🐾 ' + (state.team || 'SIN EQUIPO') }),
        el('div', { class: 'pf-rank', text: `${rp.cur.icon} ${rp.cur.name}` }),
        el('div', { class: 'xp-track', style: { marginTop: '6px', width: '220px' } },
          el('div', { class: 'xp-fill', style: { width: Math.round(rp.pct * 100) + '%' } })),
        el('small', { style: { color: 'var(--gray)', fontFamily: 'var(--font-mono)' },
          text: rp.next ? `Faltan ${rp.remaining} XP para ${rp.next.name}` : 'Rango máximo alcanzado' }),
      ),
    ),
    el('div', { class: 'pf-grid' },
      cell(state.xp, 'XP TOTAL'),
      cell(state.coins, 'BITS'),
      cell(state.stars, 'ESTRELLAS'),
      cell(`${zonesDone}/4`, 'ZONAS'),
      cell(state.hacks.length, 'RETOS HACKER'),
      cell(state.badges.length + '/' + Object.keys(BADGES).length, 'INSIGNIAS'),
    ),
    el('h3', { class: 'sub-title' }, 'INSIGNIAS'),
    el('div', { class: 'badge-grid' },
      Object.entries(BADGES).map(([id, b]) =>
        el('div', { class: 'badge-cell ' + (state.badges.includes(id) ? 'owned' : 'locked'), title: b.desc },
          el('img', { src: BADGE(b.file), alt: b.name }),
          el('span', { text: b.name })))),
    el('h3', { class: 'sub-title' }, 'RANGOS'),
    el('div', { class: 'pf-grid' },
      RANKS.map(r => el('div', { class: 'pf-cell', style: state.xp >= r.xp ? { borderColor: 'var(--yellow)' } : {} },
        el('b', { text: r.icon }), el('span', { text: `${r.name} · ${r.xp} XP` })))),
  );
}

const cell = (v, label) => el('div', { class: 'pf-cell' }, el('b', { text: v }), el('span', { text: label }));

// ---------------------------------------------------------------------------
// BRIEFING DE ZONA
// ---------------------------------------------------------------------------
export function renderBrief(level) {
  const host = $('#brief-body');
  host.innerHTML = '';
  host.append(
    el('div', { class: 'brief-head' },
      el('img', { src: 'assets/logo_mark.svg', alt: '' }),
      el('div', {},
        el('span', { class: 'zone-code', text: level.code }),
        el('h2', { text: level.name }),
      ),
    ),
    el('div', { class: 'brief-body' },
      level.intro.map(p => el('p', { text: p })),
      el('h4', { class: 'sub-title' }, 'OBJETIVO'),
      el('p', { html: level.win === 'switches'
        ? 'Repara <b>todos los nodos</b> del núcleo con <span class="inline-code">activar()</span>.'
        : 'Llega al <b>servidor</b> y ejecútalo con <span class="inline-code">activar()</span>.' }),
      el('h4', { class: 'sub-title' }, 'TRES FORMAS DE RESOLVERLO'),
      el('div', { class: 'route-help' },
        el('div', { class: 'rh-exp' }, el('h4', {}, 'EXPLORADOR'), el('p', {}, 'Arrastra bloques. Sin escribir una sola línea de código.')),
        el('div', { class: 'rh-prog' }, el('h4', {}, 'PROGRAMADOR'), el('p', {}, 'Escribe GatoScript y compílalo a bloques.')),
        el('div', { class: 'rh-hack' }, el('h4', {}, 'HACKER'), el('p', {}, 'Retos extra: menos instrucciones, bugs ocultos, optimizaciones.')),
      ),
      el('h4', { class: 'sub-title' }, 'ESTRELLAS'),
      el('ul', {},
        el('li', {}, '★ Completar la zona.'),
        el('li', {}, '★★ Recoger todos los coleccionables.'),
        el('li', {}, `★★★ Usar ${level.optimal} instrucciones o menos.`),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// AYUDA GENERAL
// ---------------------------------------------------------------------------
export function renderHow() {
  const host = $('#how-body');
  host.innerHTML = '';
  host.append(
    el('h2', { class: 'panel-title' }, '¿CÓMO SE JUEGA?'),
    el('div', { class: 'brief-body' },
      el('p', {}, 'El Gato Binario quedó atrapado dentro de un sistema corrompido por bugs. Ustedes son el equipo de rescate.'),
      el('h4', { class: 'sub-title' }, '1. CONSTRUYAN EL PROGRAMA'),
      el('p', { html: 'El gato <b>no se mueve solo</b>: hace exactamente lo que ustedes le indiquen, en orden. Añadan instrucciones a la <span class="inline-code">SECUENCIA DE EJECUCIÓN</span> (clic en un bloque o arrástrenlo).' }),
      el('h4', { class: 'sub-title' }, '2. EJECUTEN'),
      el('p', { html: 'Pulsen <span class="inline-code">▶ EJECUTAR</span>. El gato realizará cada instrucción. Si algo sale distinto, aparecerá <b>BUG DETECTADO</b>: corrijan y vuelvan a intentarlo. Equivocarse no cuesta nada.' }),
      el('h4', { class: 'sub-title' }, '3. ELIJAN SU RUTA'),
      el('div', { class: 'route-help' },
        el('div', { class: 'rh-exp' }, el('h4', {}, 'EXPLORADOR'), el('p', {}, 'Bloques visuales. Nunca programaste: empieza aquí.')),
        el('div', { class: 'rh-prog' }, el('h4', {}, 'PROGRAMADOR'), el('p', {}, 'Escribe código real y compílalo. Ya conoces lo básico.')),
        el('div', { class: 'rh-hack' }, el('h4', {}, 'HACKER'), el('p', {}, 'Retos secretos y optimización. Quieres romper el sistema.')),
      ),
      el('p', { style: { marginTop: '14px' }, html: '<b>Importante:</b> las tres rutas juegan la MISMA misión. Un equipo puede tener las tres a la vez y ayudarse.' }),
      el('h4', { class: 'sub-title' }, 'ATAJOS'),
      el('ul', {},
        el('li', { html: '<span class="inline-code">Ctrl + Enter</span> compila el código.' }),
        el('li', { html: '<span class="inline-code">Esc</span> cierra las ventanas.' }),
        el('li', { html: 'El botón <b>PRESENTACIÓN / PROYECTOR</b> agranda todo para verlo de lejos.' }),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// RESULTADO DE MISIÓN
// ---------------------------------------------------------------------------
/**
 * @param {object} o - { win, title, lines, stars, rewards, buttons:[{text,cls,fn}] }
 */
export function showResult(o) {
  const card = $('#ov-result .result-card');
  const host = $('#result-body');
  card.className = 'ov-card result-card ' + (o.win ? 'win' : 'fail');
  host.innerHTML = '';

  host.append(el('h2', { text: o.title }));

  if (o.stars !== undefined) {
    host.append(el('div', { class: 'result-stars' },
      [0, 1, 2].map(i => el('img', {
        src: ICON('star'), alt: '',
        class: i < o.stars ? 'on' : '',
        style: { animationDelay: (0.15 + i * 0.22) + 's' },
      }))));
  }

  if (o.lines?.length) {
    host.append(el('div', { class: 'result-lines' }, o.lines.map(l => el('div', { html: l }))));
  }

  if (o.rewards?.length) {
    host.append(el('div', { class: 'result-rewards' },
      o.rewards.map((r, i) => el('div', { class: 'reward-pill', text: r, style: { animationDelay: (i * 0.1) + 's' } }))));
  }

  host.append(el('div', { class: 'panel-actions center' },
    (o.buttons || []).map(b => el('button', {
      class: 'btn ' + (b.cls || ''),
      text: b.text,
      onclick: () => { sfx('click'); closeOverlay('ov-result'); b.fn?.(); },
    }))));

  openOverlay('ov-result');
}
