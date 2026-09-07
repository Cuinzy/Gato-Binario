/**
 * hacker.js — Ruta HACKER: retos opcionales de cada zona y el mini-juego
 * "encuentra el bug oculto".
 *
 * Los retos no cambian la misión: la amplían. Un principiante puede ignorarlos
 * y un avanzado tiene material de sobra dentro de la misma zona.
 */
import { el, $$ } from '../core/utils.js';
import { sfx } from '../core/audio.js';
import { state, hasHack, markHack, grantBadge } from '../core/storage.js';
import { floatOver, burst } from '../core/fx.js';

export class HackerPanel {
  constructor(host) {
    this.host = host;
    this.level = null;
  }

  setLevel(level) {
    this.level = level;
    this.render();
  }

  render() {
    const L = this.level;
    const host = this.host;
    host.innerHTML = '';
    if (!L) return;

    host.append(el('h4', {}, 'RETOS DE ' + L.code));
    host.append(el('p', { class: 'hack-intro' },
      'Opcionales. No hacen falta para terminar la zona, pero dan XP extra y hacen que el sistema te respete.'));

    for (const h of L.hacks || []) {
      const done = hasHack(`${L.id}:${h.id}`);
      host.append(el('div', { class: 'hack-item' + (done ? ' done' : ''), dataset: { hack: h.id } },
        el('span', { class: 'hk-ico', text: done ? '✅' : h.icon }),
        el('span', { class: 'hk-txt' }, el('b', { text: h.title }), h.desc),
        el('span', { class: 'hk-xp', text: `+${h.xp} XP` }),
      ));
    }

    if (L.debug) this.renderDebug(L);
  }

  /** Mini-juego: localizar la línea con el bug. */
  renderDebug(L) {
    const key = `${L.id}:debug`;
    const solved = hasHack(key);
    const box = el('div', { class: 'hack-extra' });
    box.append(el('h4', {}, '🐛 ' + L.debug.title));
    box.append(el('p', { class: 'hack-intro' },
      solved ? 'Bug neutralizado. ' + L.debug.explain
             : 'Una línea de este código está corrupta. Haz clic en la línea equivocada.'));

    const code = el('div', { class: 'debug-code' });
    L.debug.lines.forEach((line, i) => {
      const n = i + 1;
      const row = el('span', {
        class: 'dl' + (solved && n === L.debug.bugLine ? ' found' : ''),
        text: `${String(n).padStart(2, ' ')} │ ${line}`,
      });
      if (!solved) {
        row.addEventListener('click', () => this.guess(L, n, row, code));
      }
      code.append(row);
    });
    box.append(code);
    this.host.append(box);
  }

  guess(L, n, row, codeBox) {
    if (n === L.debug.bugLine) {
      row.classList.add('found');
      sfx('success');
      const r = row.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#4dff9f', '#22e6ff'], count: 22 });
      floatOver(row, `+${L.debug.xp} XP`, 'good');
      markHack(`${L.id}:debug`, L.debug.xp);
      grantBadge('hunter');
      grantBadge('first_bug');
      $$('.dl', codeBox).forEach(d => d.replaceWith(d.cloneNode(true)));
      this.render();
    } else {
      row.classList.add('wrong');
      sfx('error');
      setTimeout(() => row.classList.remove('wrong'), 420);
    }
  }

  /**
   * Comprueba los retos tras completar la zona.
   * @param {object} ctx - métricas de la partida
   * @returns {Array} retos recién superados
   */
  evaluate(ctx) {
    const L = this.level;
    const won = [];
    for (const h of L.hacks || []) {
      const key = `${L.id}:${h.id}`;
      if (hasHack(key)) continue;
      let ok = false;
      try { ok = h.check(ctx); } catch { ok = false; }
      if (ok) { markHack(key, h.xp); won.push(h); }
    }
    if (won.length) this.render();
    return won;
  }
}
