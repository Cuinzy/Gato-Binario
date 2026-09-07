/**
 * level-screen.js — Controlador de la pantalla de nivel.
 *
 * Une el mundo, el renderizador, las tres rutas (bloques, código, hacker)
 * y el ciclo de ejecución del programa.
 */
import { $, $$, el, wait, bus, clamp } from '../core/utils.js';
import { ICON } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import * as fx from '../core/fx.js';
import { state, setSetting, addXP, addCoins, addStars, completeLevel, markTry, grantBadge, levelRecord } from '../core/storage.js';
import { World, runProgram } from './world.js';
import { GameRenderer } from './renderer.js';
import { BlockEditor } from './blocks.js';
import { CodePanel } from './codepanel.js';
import { HackerPanel } from './hacker.js';
import { countNodes, usesType, countCmd, toCode } from './commands.js';
import { term } from '../ui/terminal.js';
import { renderBrief, showResult } from '../ui/dialogs.js';
import { openOverlay, show } from '../ui/screens.js';

const SPEEDS = [0, 720, 540, 390, 270, 170]; // índice 1..5

export class LevelScreen {
  constructor() {
    this.canvas = $('#game-canvas');
    this.renderer = new GameRenderer(this.canvas);
    this.level = null;
    this.world = null;
    this.running = false;
    this.abort = false;
    this.stats = null;

    this.blocks = new BlockEditor({
      palette: $('#palette'),
      sequence: $('#sequence'),
      count: $('#seq-count'),
      onChange: p => this.onProgramChange(p),
    });

    this.code = new CodePanel({
      editor: $('#code-editor'),
      msg: $('#code-msg'),
      refBox: $('#code-ref'),
      applyBtn: $('#btn-code-apply'),
      fromBtn: $('#btn-code-from'),
      getProgram: () => this.blocks.getProgram(),
      setProgram: p => this.blocks.setProgram(p),
      onCompile: () => grantBadge('coder'),
    });

    this.hacker = new HackerPanel($('#hacker-box'));

    this.bindUI();
  }

  bindUI() {
    $('#btn-run').addEventListener('click', () => this.run());
    $('#btn-stop').addEventListener('click', () => { this.abort = true; });
    $('#btn-reset').addEventListener('click', () => this.resetRun(true));
    $('#btn-clear').addEventListener('click', () => this.blocks.clear());
    $('#btn-undo').addEventListener('click', () => this.blocks.undo());
    $('#btn-brief').addEventListener('click', () => { renderBrief(this.level); openOverlay('ov-brief'); });
    $('#btn-map-back').addEventListener('click', () => bus.emit('nav:map'));

    const speed = $('#in-speed');
    speed.value = state.settings.speed;
    speed.addEventListener('input', () => setSetting('speed', +speed.value));

    $$('.route-tab').forEach(tab => tab.addEventListener('click', () => {
      $$('.route-tab').forEach(t => t.classList.remove('active'));
      $$('.route-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $('#pane-' + tab.dataset.route).classList.add('active');
      sfx('click');
      if (tab.dataset.route === 'programador') this.code.syncFrom(this.blocks.getProgram());
    }));
  }

  // -------------------------------------------------------------------------
  // CARGA DE NIVEL
  // -------------------------------------------------------------------------
  load(level) {
    this.level = level;
    this.world = new World(level);
    this.abort = false;
    this.running = false;

    $('#lv-tag').textContent = level.code;
    $('#lv-name').textContent = level.name;

    this.blocks.setLevel(level);
    $('#code-editor').value = '';
    this.code.setLevel(level);
    this.hacker.setLevel(level);

    // Empezar siempre en la ruta Explorador
    $$('.route-tab').forEach(t => t.classList.toggle('active', t.dataset.route === 'explorador'));
    $$('.route-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-explorador'));

    this.renderer.attach(this.world, state.avatar);
    this.updateCounters();
    this.showDialog(level.dialogs?.start, 5200);
    term(`cargando ${level.code.toLowerCase()}...`, 'c');
    term(`objetivo: ${level.topic.toLowerCase()}`, '');

    // Briefing automático la primera vez que se entra a la zona
    if (!levelRecord(level.id).tries) {
      renderBrief(level);
      openOverlay('ov-brief');
    }
    requestAnimationFrame(() => this.renderer.resize());
  }

  unload() {
    this.abort = true;
    this.renderer.stop();
  }

  onProgramChange() {
    this.updateCounters();
  }

  // -------------------------------------------------------------------------
  // CONTADORES
  // -------------------------------------------------------------------------
  updateCounters() {
    const host = $('#lv-counters');
    const w = this.world;
    if (!host || !w) return;
    const nodes = countNodes(this.blocks.getProgram());
    const items = [];

    const coinsTotal = w.totalOf('coin');
    if (coinsTotal) items.push(counter(ICON('coin'), `${w.collected.coin}/${coinsTotal}`, 'BITS', w.collected.coin === coinsTotal));

    const chipsTotal = w.totalOf('chip');
    if (chipsTotal) items.push(counter(ICON('cmd_function'), `${w.collected.chip}/${chipsTotal}`, 'CHIPS', w.collected.chip === chipsTotal));

    const starsTotal = w.totalOf('star');
    if (starsTotal) items.push(counter(ICON('star'), `${w.collected.star}/${starsTotal}`, 'ESTRELLA', w.collected.star === starsTotal));

    if (this.level.win === 'switches') {
      items.push(counter(ICON('cmd_activate'), `${w.switchesOn()}/${w.switchesTotal()}`, 'NODOS', w.switchesOn() === w.switchesTotal()));
    }

    items.push(counter(ICON('code'), `${nodes}`, `INSTR. (meta ≤${this.level.optimal})`, nodes > 0 && nodes <= this.level.optimal));

    host.innerHTML = '';
    items.forEach(i => host.append(i));
  }

  showDialog(text, ms = 4200) {
    const b = $('#dialog-bubble');
    if (!text) { b.hidden = true; return; }
    b.textContent = text;
    b.hidden = false;
    clearTimeout(this._dlgT);
    this._dlgT = setTimeout(() => { b.hidden = true; }, ms);
  }

  overlayMsg(text, kind = 'info', ms = 1400) {
    const ov = $('#stage-overlay');
    ov.innerHTML = '';
    ov.append(el('div', { class: 'ov-msg', text }));
    ov.className = 'stage-overlay show ' + kind;
    clearTimeout(this._ovT);
    this._ovT = setTimeout(() => { ov.className = 'stage-overlay ' + kind; }, ms);
  }

  // -------------------------------------------------------------------------
  // EJECUCIÓN
  // -------------------------------------------------------------------------
  resetRun(manual = false) {
    this.abort = true;
    this.world.reset();
    this.renderer.attach(this.world, state.avatar);
    this.renderer.setAnim('idle');
    this.blocks.clearHighlight();
    this.blocks.clearErrors();
    this.updateCounters();
    if (manual) { sfx('click'); term('estado del nivel reiniciado', 'w'); }
  }

  async run() {
    if (this.running) return;
    const program = this.blocks.getProgram();
    if (!countNodes(program)) {
      this.overlayMsg('SECUENCIA VACÍA', 'bad');
      this.showDialog('Añade instrucciones antes de ejecutar.');
      sfx('error');
      return;
    }

    this.running = true;
    this.abort = false;
    $('#btn-run').hidden = true;
    $('#btn-stop').hidden = false;
    this.blocks.setLocked(true);
    this.blocks.clearErrors();
    this.world.reset();
    this.renderer.attach(this.world, state.avatar);
    this.updateCounters();
    markTry(this.level.id);
    term('ejecutando algoritmo...', 'c');
    this.overlayMsg('EJECUTANDO…', 'info', 900);

    const nodes = countNodes(program);
    let stepsRun = 0;
    let bumped = false;
    let lastEvent = null;

    try {
      for (const step of runProgram(program, this.world)) {
        if (this.abort) break;
        this.blocks.highlight(step.path);
        const ev = this.world.perform(step.action);
        lastEvent = ev;
        stepsRun++;
        await this.animate(ev, step);
        if (!ev.ok) { bumped = true; this.blocks.markError(step.path); break; }
        if (this.world.finished) break;
      }
    } catch (e) {
      this.overlayMsg('SISTEMA SOBRECARGADO', 'bad', 2200);
      this.showDialog(e.message, 5200);
      sfx('error');
      bumped = true;
    }

    this.blocks.clearHighlight();
    this.blocks.setLocked(false);
    $('#btn-run').hidden = false;
    $('#btn-stop').hidden = true;
    this.running = false;
    this.updateCounters();

    if (this.abort) { term('ejecucion detenida por el usuario', 'w'); return; }

    if (this.world.finished) {
      await this.onWin({ nodes, stepsRun, program });
    } else if (bumped) {
      this.onFail(lastEvent);
    } else {
      this.onIncomplete();
    }
  }

  /** Traduce un evento del mundo a animación + efectos. */
  async animate(ev, step) {
    const dur = SPEEDS[clamp(+state.settings.speed || 3, 1, 5)];
    const R = this.renderer;

    switch (ev.type) {
      case 'move':
        R.setAnim('walk');
        R.moveTween(ev.from, ev.at, dur * 0.9);
        sfx('step');
        await wait(dur);
        R.setAnim('idle');
        break;

      case 'jump':
        R.setAnim('jump');
        R.moveTween(ev.from, ev.at, dur * 1.1, 'jump');
        sfx('jump');
        await wait(dur * 1.15);
        R.setAnim('idle');
        break;

      case 'turn':
        R.setAnim('idle');
        sfx('click');
        await wait(dur * 0.55);
        break;

      case 'pickup': {
        R.setAnim('action');
        const p = R.cellToScreen(ev.at.x, ev.at.y);
        const label = { coin: '+1 BIT', star: '+1 ★', chip: '+1 CHIP', key: '+1 LLAVE' }[ev.item.type] || '+1';
        fx.sparkle(p.x, p.y, ev.item.type === 'star' ? '#ffd23f' : '#22e6ff');
        fx.floatText(label, p.x, p.y, ev.item.type === 'star' ? 'star' : 'coin');
        R.pop(ev.at.x, ev.at.y, '#ffd23f');
        sfx('coin');
        this.updateCounters();
        await wait(dur * 0.75);
        R.setAnim('idle');
        break;
      }

      case 'activate': {
        R.setAnim('action');
        const p = R.cellToScreen(ev.at.x, ev.at.y);
        fx.ring(p.x, p.y, '#4dff9f', 110, 620);
        fx.burst(p.x, p.y, { colors: ['#4dff9f', '#22e6ff', '#ffffff'], count: 26, speed: 4 });
        R.pop(ev.at.x, ev.at.y, '#4dff9f', 'ON');
        sfx('unlock');
        term(ev.obj.type === 'server' ? 'servidor reactivado' : 'nodo reparado', 'c');
        this.updateCounters();
        await wait(dur * 0.9);
        R.setAnim('idle');
        break;
      }

      case 'wait':
        R.setAnim('idle');
        await wait(dur * 0.75);
        break;

      case 'bump':
      case 'hit': {
        R.setAnim('hurt');
        R.shake(320);
        fx.shake();
        fx.glitch($('.stage-frame'), 520);
        const p = R.cellToScreen(ev.at?.x ?? this.world.player.x, ev.at?.y ?? this.world.player.y);
        fx.burst(p.x, p.y, { colors: ['#ff4d5e', '#ff3fa4', '#ffd23f'], count: 26, speed: 4.2 });
        sfx(ev.type === 'hit' ? 'hit' : 'error');
        this.overlayMsg('BUG DETECTADO', 'bad', 1600);
        await wait(dur * 1.2);
        break;
      }

      default:
        if (ev.soft) this.showDialog(ev.soft, 2200);
        R.setAnim('idle');
        await wait(dur * 0.5);
    }
  }

  // -------------------------------------------------------------------------
  // RESULTADOS
  // -------------------------------------------------------------------------
  onFail(ev) {
    grantBadge('first_bug');
    this.renderer.setAnim('hurt');
    const msg = ev?.msg || 'Algo salió diferente a lo esperado.';
    term('bug detectado: ' + msg.toLowerCase(), 'e');
    showResult({
      win: false,
      title: 'BUG DETECTADO',
      lines: [
        msg,
        '<b>DEPURANDO…</b> revisa tu secuencia y vuelve a intentarlo.',
        'Equivocarse no resta nada: forma parte de programar.',
      ],
      buttons: [
        { text: '↻ REINTENTAR', cls: 'btn-run', fn: () => this.resetRun() },
        { text: '📡 VER BRIEFING', cls: 'btn-ghost', fn: () => { renderBrief(this.level); openOverlay('ov-brief'); } },
      ],
    });
  }

  onIncomplete() {
    term('programa terminado sin alcanzar el objetivo', 'w');
    this.overlayMsg('PROGRAMA FINALIZADO', 'info', 1600);
    showResult({
      win: false,
      title: 'PROGRAMA INCOMPLETO',
      lines: [
        'El programa terminó, pero el objetivo sigue pendiente.',
        this.level.win === 'switches'
          ? 'Recuerda reparar <b>los cuatro nodos</b> con <span class="inline-code">activar()</span>.'
          : 'Recuerda llegar al servidor y usar <span class="inline-code">activar()</span> encima de él.',
      ],
      buttons: [{ text: '↻ SEGUIR INTENTANDO', cls: 'btn-run', fn: () => this.resetRun() }],
    });
  }

  async onWin({ nodes, program }) {
    const L = this.level;
    const w = this.world;
    const rec = levelRecord(L.id);
    const firstTime = !rec.done;

    this.renderer.setAnim('happy');
    this.overlayMsg('COMPILACIÓN EXITOSA', 'good', 2000);
    sfx('success');
    fx.confetti(70);
    fx.flash('rgba(77,255,159,.28)');
    term('compilacion exitosa', 'c');
    term('mision completada', 'c');

    // --- Estrellas ---
    const collectiblesTotal = w.totalOf('coin') + w.totalOf('chip');
    const collected = w.collected.coin + w.collected.chip;
    const allItems = collectiblesTotal === 0 || collected === collectiblesTotal;
    const efficient = nodes <= L.optimal;
    const stars = 1 + (allItems ? 1 : 0) + (efficient ? 1 : 0);

    // --- Recompensas ---
    const rewards = [];
    let xp = 0;
    if (firstTime) { xp += 100; rewards.push('+100 XP MISIÓN'); }
    else { xp += 20; rewards.push('+20 XP REINTENTO'); }
    if (efficient) { xp += 40; rewards.push('+40 XP SOLUCIÓN EFICIENTE'); grantBadge('optimizer'); }
    if (state.team) { xp += 25; rewards.push('+25 XP BONUS DE EQUIPO'); grantBadge('team'); }
    if (w.collected.coin) { addCoins(w.collected.coin); rewards.push(`+${w.collected.coin} BITS`); }
    if (w.collected.star) { addStars(w.collected.star); rewards.push(`+${w.collected.star} ★`); }

    // --- Retos Hacker ---
    const hackCtx = {
      nodes,
      turns: countCmd(program, 'girarIzquierda') + countCmd(program, 'girarDerecha'),
      usedIf: usesType(program, 'if'),
      usedRepeat: usesType(program, 'repeat'),
      usedDefun: usesType(program, 'defun'),
      coinsLeft: w.remaining('coin'),
      chipsLeft: w.remaining('chip'),
      starsTaken: w.collected.star,
      steps: w.tick,
    };
    const hacks = this.hacker.evaluate(hackCtx);
    hacks.forEach(h => rewards.push(`+${h.xp} XP · ${h.title.toUpperCase()}`));

    // --- Insignias ---
    if (hackCtx.usedIf) grantBadge('logic');
    if (rec.tries <= 1) grantBadge('speed');

    addXP(xp, 'Misión completada');
    completeLevel(L.id, { stars, instructions: nodes, order: L.order });

    const doneAll = ['z1', 'z2', 'z3', 'z4'].every(id => state.levels[id]?.done);
    if (doneAll) grantBadge('rescue');

    await wait(700);

    showResult({
      win: true,
      title: 'MISIÓN COMPLETADA',
      stars,
      lines: [
        `Instrucciones usadas: <b>${nodes}</b> (meta ≤ ${L.optimal})`,
        `Pasos ejecutados: <b>${w.tick}</b>`,
        allItems ? 'Recogiste <b>todo</b> lo que había en la zona.' : 'Quedaron coleccionables en la zona.',
      ],
      rewards,
      buttons: [
        { text: '🗺 CONTINUAR', cls: 'btn-run', fn: () => bus.emit('nav:map') },
        { text: '↻ MEJORAR SOLUCIÓN', cls: 'btn-ghost', fn: () => this.resetRun() },
      ],
    });
  }
}

function counter(icon, value, label, done) {
  return el('div', { class: 'counter' + (done ? ' done' : '') },
    el('img', { src: icon, alt: '' }),
    el('b', { text: value }),
    el('span', { text: label }),
  );
}
