/**
 * boss.js — Combate final contra el BUG SUPREMO.
 *
 * Cuatro fases pensadas para resolverse EN EQUIPO y verse bien en proyector:
 *   1. ORDENAR   — colocar las instrucciones en el orden correcto
 *   2. DEPURAR   — encontrar la línea con el bug
 *   3. OPTIMIZAR — convertir una secuencia larga en un ciclo
 *   4. EJECUTAR  — montar el protocolo de purga y lanzarlo
 * Cada fase superada quita el 25% de vida al Bug Supremo.
 */
import { $, $$, el, shuffle, wait, bus } from '../core/utils.js';
import { ICON, ANIM, img, AVATARS } from '../core/assets.js';
import { sfx, playMusic } from '../core/audio.js';
import * as fx from '../core/fx.js';
import { state, addXP, grantBadge, completeLevel, save } from '../core/storage.js';
import { COMMANDS } from './commands.js';
import { showResult } from '../ui/dialogs.js';
import { term } from '../ui/terminal.js';

// ---------------------------------------------------------------------------
// DEFINICIÓN DE LAS FASES
// ---------------------------------------------------------------------------
const PHASES = [
  {
    key: 'orden',
    tag: 'FASE 1 · ORDENAR',
    title: 'Reconstruye la rutina de arranque',
    desc: 'El Bug Supremo desordenó el programa del Gato Binario. Arrastra las instrucciones hasta dejarlas en el orden correcto.',
    goal: 'Objetivo: avanzar 2 casillas, girar a la derecha, avanzar 1, recoger el chip y activar el núcleo.',
    solution: ['avanzar', 'avanzar', 'girarDerecha', 'avanzar', 'recoger', 'activar'],
    xp: 60,
    say: '¿Crees que puedes ordenar mi caos? Adelante, humano.',
  },
  {
    key: 'bug',
    tag: 'FASE 2 · DEPURAR',
    title: 'Encuentra el bug oculto',
    desc: 'Una sola línea impide que el ataque funcione. Haz clic sobre ella.',
    lines: [
      'funcion golpe() {',
      '  avanzar();',
      '  activar();',
      '}',
      'repetir (3) {',
      '  golpe;',
      '}',
    ],
    bugLine: 6,
    explain: 'Faltaban los paréntesis: para USAR una función se escribe golpe(); no golpe;',
    xp: 70,
    say: 'Escondí un error entre tus líneas. Nunca lo encontrarás.',
  },
  {
    key: 'optimizar',
    tag: 'FASE 3 · OPTIMIZAR',
    title: 'Comprime la secuencia',
    desc: 'Esta secuencia de 12 instrucciones tiene que caber en un solo ciclo. Elige cuántas repeticiones y qué instrucciones van dentro.',
    target: ['avanzar', 'avanzar', 'girarDerecha', 'avanzar', 'avanzar', 'girarDerecha',
             'avanzar', 'avanzar', 'girarDerecha', 'avanzar', 'avanzar', 'girarDerecha'],
    xp: 80,
    say: 'Tu código es lento y pesado. Igual que tú.',
  },
  {
    key: 'purga',
    tag: 'FASE 4 · EJECUTAR',
    title: 'Protocolo de purga',
    desc: 'Haz clic en las instrucciones EN ORDEN para montar el protocolo y pulsa EJECUTAR.',
    steps: [
      ['esperar', 'Sincronizar con el núcleo'],
      ['avanzar', 'Acercarse al Bug Supremo'],
      ['avanzar', 'Entrar en su radio'],
      ['recoger', 'Tomar el antivirus'],
      ['girarDerecha', 'Apuntar al núcleo corrupto'],
      ['avanzar', 'Colocar el antivirus'],
      ['activar', 'EJECUTAR LA PURGA'],
    ],
    xp: 90,
    say: 'No… ¡NO! ¡Ese protocolo no debería existir!',
  },
];

const TAUNTS = [
  'Compilas como un principiante.',
  'Cada intento tuyo me alimenta.',
  'Este sistema ya es mío.',
  'Voy a sobrescribir tu memoria.',
  '¿Ese es todo tu algoritmo?',
];

// ---------------------------------------------------------------------------
// CONTROLADOR
// ---------------------------------------------------------------------------
export class BossFight {
  constructor() {
    this.hp = 100;
    this.phase = 0;
    this.animTimer = null;
    this.animName = 'boss.idle1';
    this.animIndex = 0;
    this.busy = false;
  }

  start() {
    this.hp = 100;
    this.phase = 0;
    this.busy = false;
    playMusic('boss');
    term('conexion con el nucleo profundo...', 'e');
    term('BUG SUPREMO: en linea', 'e');
    $('#boss-cat-img').src = `assets/sprites/player/cat_${state.avatar}_idle_1.svg`;
    this.setAnim('boss.idle1');
    this.renderHP();
    this.renderPhases();
    this.say('Llegaste hasta aquí… qué ternura. Yo SOY el error.');
    this.renderPhase();
    this.startAnimLoop();
  }

  stop() {
    if (this.animTimer) clearInterval(this.animTimer);
    this.animTimer = null;
  }

  // --- Animación del boss ---------------------------------------------------
  setAnim(name) {
    this.animName = name;
    this.animIndex = 0;
  }

  startAnimLoop() {
    this.stop();
    this.animTimer = setInterval(() => {
      const a = ANIM[this.animName];
      if (!a) return;
      const src = a.files[this.animIndex % a.files.length];
      this.animIndex++;
      const node = $('#boss-img');
      if (node && !node.src.endsWith(src)) node.src = src;
      if (!a.loop && this.animIndex >= a.files.length) {
        this.setAnim('boss.idle' + Math.min(4, this.phase + 1));
      }
    }, 160);
  }

  // --- Interfaz -------------------------------------------------------------
  say(text) {
    const node = $('#boss-say');
    node.textContent = '';
    let i = 0;
    clearInterval(this._sayT);
    this._sayT = setInterval(() => {
      node.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(this._sayT);
    }, 22);
  }

  renderHP() {
    const pct = Math.max(0, this.hp);
    $('#boss-hp-fill').style.width = pct + '%';
    $('#boss-hp-text').textContent = pct + '%';
  }

  renderPhases() {
    const host = $('#boss-phases');
    host.innerHTML = '';
    PHASES.forEach((p, i) => {
      host.append(el('div', {
        class: 'boss-phase ' + (i < this.phase ? 'done' : i === this.phase ? 'active' : ''),
        text: p.tag.replace('FASE ', 'F'),
      }));
    });
  }

  /** Dibuja la fase actual en el panel derecho. */
  renderPhase() {
    const host = $('#boss-panel');
    host.innerHTML = '';
    const P = PHASES[this.phase];
    if (!P) return;

    host.append(
      el('h3', { text: P.tag }),
      el('h4', { style: { color: 'var(--white)', fontSize: '1.05em' }, text: P.title }),
      el('p', { class: 'phase-desc', text: P.desc }),
    );

    if (P.key === 'orden') this.buildOrderPhase(host, P);
    if (P.key === 'bug') this.buildBugPhase(host, P);
    if (P.key === 'optimizar') this.buildOptimizePhase(host, P);
    if (P.key === 'purga') this.buildPurgePhase(host, P);

    this.say(P.say);
    this.renderPhases();
  }

  // --- FASE 1: ordenar ------------------------------------------------------
  buildOrderPhase(host, P) {
    host.append(el('p', { class: 'phase-desc', style: { color: 'var(--cyan)' }, text: P.goal }));

    let order = shuffle(P.solution);
    // Evita que aparezca ya resuelta
    if (order.join() === P.solution.join()) order = order.reverse();

    const list = el('div', { class: 'order-list' });
    const paint = () => {
      list.innerHTML = '';
      order.forEach((name, i) => {
        const c = COMMANDS[name];
        const row = el('div', { class: 'order-item', draggable: 'true', dataset: { i } },
          el('span', { class: 'grip', text: '⠿' }),
          el('img', { src: ICON(c.icon), alt: '' }),
          el('span', { text: c.label }),
        );
        row.addEventListener('dragstart', e => { this._from = i; row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        row.addEventListener('dragend', () => row.classList.remove('dragging'));
        row.addEventListener('dragover', e => e.preventDefault());
        row.addEventListener('drop', e => {
          e.preventDefault();
          const from = this._from;
          if (from === undefined || from === i) return;
          const [m] = order.splice(from, 1);
          order.splice(i, 0, m);
          this._from = undefined;
          sfx('click');
          paint();
        });
        list.append(row);
      });
    };
    paint();
    host.append(list);

    host.append(el('div', { class: 'panel-actions center' },
      el('button', {
        class: 'btn btn-run', text: '✓ VERIFICAR',
        onclick: () => {
          if (order.join() === P.solution.join()) this.phaseWin(P);
          else this.phaseFail('El orden todavía no es correcto. Léanlo en voz alta paso a paso.');
        },
      })));
  }

  // --- FASE 2: depurar ------------------------------------------------------
  buildBugPhase(host, P) {
    const code = el('div', { class: 'debug-code' });
    P.lines.forEach((line, i) => {
      const n = i + 1;
      const row = el('span', { class: 'dl', text: `${String(n).padStart(2, ' ')} │ ${line}` });
      row.addEventListener('click', () => {
        if (this.busy) return;
        if (n === P.bugLine) {
          row.classList.add('found');
          this.phaseWin(P, P.explain);
        } else {
          row.classList.add('wrong');
          setTimeout(() => row.classList.remove('wrong'), 400);
          this.phaseFail('Esa línea está bien. Sigan buscando.');
        }
      });
      code.append(row);
    });
    host.append(code);
  }

  // --- FASE 3: optimizar ----------------------------------------------------
  buildOptimizePhase(host, P) {
    host.append(el('div', { class: 'debug-code' },
      P.target.map((n, i) => el('span', { class: 'dl', text: `${String(i + 1).padStart(2, ' ')} │ ${n}();` }))));

    const body = [];
    const nInput = el('input', { class: 'num', type: 'number', min: '1', max: '12', value: '2', style: { width: '60px' } });

    const built = el('div', { class: 'order-list' });
    const paint = () => {
      built.innerHTML = '';
      if (!body.length) built.append(el('div', { class: 'phase-desc', text: '(el ciclo está vacío)' }));
      body.forEach((name, i) => {
        const c = COMMANDS[name];
        built.append(el('div', { class: 'order-item' },
          el('img', { src: ICON(c.icon), alt: '' }),
          el('span', { style: { flex: '1' }, text: c.label }),
          el('button', { class: 'del', text: '✕', onclick: () => { body.splice(i, 1); sfx('click'); paint(); } }),
        ));
      });
    };
    paint();

    const palette = el('div', { class: 'palette' },
      ['avanzar', 'girarDerecha', 'girarIzquierda', 'recoger', 'activar'].map(name => {
        const c = COMMANDS[name];
        return el('div', { class: 'block', dataset: { kind: c.kind },
          onclick: () => { if (body.length < 12) { body.push(name); sfx('click'); paint(); } } },
          el('img', { src: ICON(c.icon), alt: '' }), el('span', { text: c.label }));
      }));

    host.append(
      el('h4', { style: { marginTop: '10px' } }, 'CONSTRUYE EL CICLO'),
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' } },
        el('span', { style: { fontFamily: 'var(--font-title)', fontSize: '.8em' }, text: 'REPETIR' }),
        nInput,
        el('span', { style: { fontFamily: 'var(--font-title)', fontSize: '.8em' }, text: 'VECES {' })),
      built,
      el('span', { style: { fontFamily: 'var(--font-title)', fontSize: '.8em' }, text: '}' }),
      palette,
      el('div', { class: 'panel-actions center' },
        el('button', {
          class: 'btn btn-run', text: '✓ COMPILAR',
          onclick: () => {
            const n = Math.max(1, Math.min(12, parseInt(nInput.value, 10) || 1));
            const expanded = [];
            for (let i = 0; i < n; i++) expanded.push(...body);
            if (expanded.join() === P.target.join()) this.phaseWin(P, `Perfecto: 12 instrucciones comprimidas en ${body.length + 1}.`);
            else this.phaseFail('El ciclo expandido todavía no coincide con la secuencia original.');
          },
        })),
    );
  }

  // --- FASE 4: ejecutar -----------------------------------------------------
  buildPurgePhase(host, P) {
    const chosen = [];
    const pool = shuffle(P.steps.map((s, i) => ({ name: s[0], desc: s[1], i })));

    host.append(el('div', { class: 'debug-code' },
      P.steps.map((s, i) => el('span', { class: 'dl', text: `${i + 1}. ${s[1]}` }))));

    const seq = el('div', { class: 'order-list' });
    const poolBox = el('div', { class: 'palette' });
    const runBtn = el('button', { class: 'btn btn-run', text: '▶ EJECUTAR PURGA', disabled: true });

    const paint = () => {
      seq.innerHTML = '';
      if (!chosen.length) seq.append(el('div', { class: 'phase-desc', text: '(protocolo vacío)' }));
      chosen.forEach((c, i) => {
        const cmd = COMMANDS[c.name];
        seq.append(el('div', { class: 'order-item' },
          el('span', { class: 'grip', text: i + 1 }),
          el('img', { src: ICON(cmd.icon), alt: '' }),
          el('span', { text: cmd.label })));
      });
      poolBox.innerHTML = '';
      pool.filter(p => !chosen.includes(p)).forEach(p => {
        const cmd = COMMANDS[p.name];
        poolBox.append(el('div', { class: 'block', dataset: { kind: cmd.kind },
          onclick: () => {
            if (this.busy) return;
            const expected = P.steps[chosen.length][0];
            if (p.name === expected) {
              chosen.push(p);
              sfx('coin');
              paint();
              runBtn.disabled = chosen.length !== P.steps.length;
            } else {
              sfx('error');
              this.bossAttack('Ese paso no va ahí. El Bug Supremo contraataca.');
            }
          } },
          el('img', { src: ICON(cmd.icon), alt: '' }), el('span', { text: cmd.label })));
      });
    };
    paint();

    runBtn.addEventListener('click', () => this.phaseWin(P, 'PURGA EJECUTADA.'));

    host.append(
      el('h4', { style: { marginTop: '10px' } }, 'PROTOCOLO'),
      seq,
      el('h4', { style: { marginTop: '10px' } }, 'INSTRUCCIONES DISPONIBLES'),
      poolBox,
      el('div', { class: 'panel-actions center' }, runBtn),
    );
  }

  // --- Resolución de fases --------------------------------------------------
  async phaseWin(P, extra = '') {
    if (this.busy) return;
    this.busy = true;

    this.setAnim('boss.hurt');
    sfx('boss');
    fx.shake();
    fx.flash('rgba(255,77,94,.3)');
    const art = $('#boss-art') || $('.boss-art');
    const r = art.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2,
      { colors: ['#ff4d5e', '#ffd23f', '#ff3fa4'], count: 46, speed: 6, life: 900 });

    this.hp = Math.max(0, this.hp - 25);
    this.renderHP();
    addXP(P.xp, 'Fase del boss');
    fx.floatText(`+${P.xp} XP`, window.innerWidth / 2, window.innerHeight * 0.4, 'xp');
    term(`fase superada: -25% vida del bug supremo`, 'c');

    this.phase++;
    this.renderPhases();
    this.say(extra || '¡Imposible! Mi código era perfecto…');

    await wait(1500);
    this.busy = false;

    if (this.hp <= 0) return this.defeat();

    // El boss cambia de aspecto según se debilita
    this.setAnim('boss.idle' + Math.min(4, this.phase + 1));
    this.renderPhase();
  }

  phaseFail(msg) {
    sfx('error');
    fx.shake(220);
    this.bossAttack(msg);
  }

  bossAttack(msg) {
    this.setAnim('boss.attack');
    this.say(msg + ' ' + TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
    fx.glitch($('.boss-stage'), 420);
    const cat = $('.boss-cat');
    if (cat) {
      cat.style.transition = 'transform .18s';
      cat.style.transform = 'translateX(-16px) rotate(-8deg)';
      setTimeout(() => { cat.style.transform = ''; }, 320);
    }
    $('#boss-cat-img').src = `assets/sprites/player/cat_${state.avatar}_hurt_1.svg`;
    setTimeout(() => { $('#boss-cat-img').src = `assets/sprites/player/cat_${state.avatar}_idle_1.svg`; }, 900);
    setTimeout(() => this.setAnim('boss.idle' + Math.min(4, this.phase + 1)), 1200);
  }

  // --- Victoria -------------------------------------------------------------
  async defeat() {
    this.setAnim('boss.dead');
    this.say('sistema… restaurándose… no puede ser…');
    term('BUG SUPREMO ELIMINADO', 'c');
    sfx('levelup');
    fx.confetti(180);
    fx.flash('rgba(255,255,255,.6)', 700);
    $('#boss-cat-img').src = `assets/sprites/player/cat_${state.avatar}_happy_2.svg`;

    grantBadge('boss');
    addXP(200, 'Bug Supremo derrotado');
    state.bossBeaten = true;
    completeLevel('boss', { stars: 3, order: 5 });
    save();

    await wait(2200);
    showResult({
      win: true,
      title: 'BUG ELIMINADO',
      stars: 3,
      lines: ['El sistema vuelve a responder.', 'El Gato Binario está libre.'],
      rewards: ['+200 XP', 'INSIGNIA: VERDUGO DEL BUG SUPREMO'],
      buttons: [{ text: 'VER FINAL ▶', cls: 'btn-run', fn: () => bus.emit('nav:victory') }],
    });
  }
}
