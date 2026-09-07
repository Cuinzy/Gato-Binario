/**
 * renderer.js — Dibuja el mundo en el <canvas>.
 *
 * Mantiene su propio bucle de animación y un pequeño estado de interpolación
 * para que los movimientos del gato y de los enemigos se vean suaves.
 */
import { img, ready, frame, TILES, BG } from '../core/assets.js';
import { clamp, easeInOut, easeOut } from '../core/utils.js';

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.world = null;
    this.fur = 'binario';
    this.raf = null;
    this.time = 0;

    // Estado de animación del jugador
    this.pAnim = 'idle';
    this.pAnimStart = 0;
    this.tween = null;       // { fromX, fromY, toX, toY, start, dur, kind }
    this.flash = null;       // { x, y, color, start, dur }
    this.pops = [];          // efectos de recogida sobre el tablero
    this.shakeUntil = 0;

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
  }

  attach(world, fur = 'binario') {
    this.world = world;
    this.fur = fur;
    this.pAnim = 'idle';
    this.pAnimStart = performance.now();
    this.tween = null;
    this.pops = [];
    this.resize();
    this.start();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
  }

  start() {
    if (this.raf) return;
    const loop = t => { this.time = t; this.draw(t); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }

  resize() {
    const c = this.canvas;
    const r = c.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.vw = r.width;
    this.vh = r.height;
    this.computeLayout();
  }

  computeLayout() {
    if (!this.world) return;
    const pad = 18;
    const cw = (this.vw - pad * 2) / this.world.w;
    const ch = (this.vh - pad * 2) / this.world.h;
    this.cell = Math.floor(Math.min(cw, ch));
    this.ox = Math.round((this.vw - this.cell * this.world.w) / 2);
    this.oy = Math.round((this.vh - this.cell * this.world.h) / 2);
  }

  // -------------------------------------------------------------------------
  // API DE ANIMACIÓN (la usa el controlador del nivel)
  // -------------------------------------------------------------------------
  setAnim(name) {
    if (this.pAnim === name) return;
    this.pAnim = name;
    this.pAnimStart = performance.now();
  }

  /** Interpola el movimiento del gato entre dos casillas. */
  moveTween(from, to, dur, kind = 'walk') {
    this.tween = { fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, start: performance.now(), dur, kind };
  }

  /** Marca visual en una casilla (recogida, activación, choque). */
  pop(x, y, color = '#ffd23f', text = '') {
    this.pops.push({ x, y, color, text, start: performance.now(), dur: 700 });
  }

  shake(ms = 260) { this.shakeUntil = performance.now() + ms; }

  /** Convierte casilla -> píxeles (esquina superior izquierda). */
  cellToPx(x, y) { return { px: this.ox + x * this.cell, py: this.oy + y * this.cell }; }

  /** Centro de una casilla en coordenadas de pantalla (para partículas). */
  cellToScreen(x, y) {
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + this.ox + (x + 0.5) * this.cell, y: r.top + this.oy + (y + 0.5) * this.cell };
  }

  // -------------------------------------------------------------------------
  // DIBUJO
  // -------------------------------------------------------------------------
  draw(t) {
    const { ctx, world } = this;
    if (!world) return;
    if (!this.cell) this.computeLayout();

    ctx.clearRect(0, 0, this.vw, this.vh);
    ctx.save();

    if (t < this.shakeUntil) {
      const k = (this.shakeUntil - t) / 260;
      ctx.translate((Math.random() - 0.5) * 10 * k, (Math.random() - 0.5) * 10 * k);
    }

    this.drawBackground();
    this.drawTiles(t);
    this.drawObjects(t);
    this.drawItems(t);
    this.drawEnemies(t);
    this.drawPlayer(t);
    this.drawPops(t);

    ctx.restore();
  }

  drawBackground() {
    const { ctx } = this;
    const bg = img(BG(this.world.level.bg || 'zone1'));
    if (ready(bg)) {
      // "cover" manteniendo proporción
      const s = Math.max(this.vw / bg.naturalWidth, this.vh / bg.naturalHeight);
      const w = bg.naturalWidth * s, h = bg.naturalHeight * s;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bg, (this.vw - w) / 2, (this.vh - h) / 2, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#050a16';
      ctx.fillRect(0, 0, this.vw, this.vh);
    }
  }

  drawTiles(t) {
    const { ctx, world, cell } = this;
    const z = world.level.theme ?? 0;
    const floors = TILES.floor(z).map(f => img(f));
    const wall = img(TILES.wall(z));

    for (let y = 0; y < world.h; y++) {
      for (let x = 0; x < world.w; x++) {
        const { px, py } = this.cellToPx(x, y);
        const tile = world.tiles[y][x];
        if (tile === 'void') continue;
        if (tile === 'wall') {
          if (ready(wall)) ctx.drawImage(wall, px, py, cell, cell);
          else { ctx.fillStyle = '#1c2751'; ctx.fillRect(px, py, cell, cell); }
        } else {
          const v = (x * 7 + y * 13) % 3;
          const f = floors[v];
          if (ready(f)) ctx.drawImage(f, px, py, cell, cell);
          else { ctx.fillStyle = '#101a33'; ctx.fillRect(px, py, cell, cell); }
        }
      }
    }
  }

  drawObjects(t) {
    const { ctx, world, cell } = this;

    // Decoración fija del nivel (servidores grandes, terminales, portales)
    for (const d of world.level.decor || []) {
      const anim = d.type === 'server' ? 'server.off' : d.type === 'portal' ? 'portal.idle' : 'terminal.idle';
      const im = frame(anim, t);
      if (ready(im)) {
        const s = d.big ? cell * 2.4 : cell;
        const { px, py } = this.cellToPx(d.x, d.y);
        ctx.globalAlpha = d.big ? 0.85 : 1;
        ctx.drawImage(im, px + (cell - s) / 2, py + (cell - s) / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }

    for (const o of world.objects.values()) {
      const { px, py } = this.cellToPx(o.x, o.y);
      let anim = null;
      switch (o.type) {
        case 'server': anim = o.on ? 'server.on' : 'server.off'; break;
        case 'switch': anim = o.on ? 'switch.on' : 'switch.off'; break;
        case 'door': anim = o.on ? 'door.open' : 'door.locked'; break;
        case 'terminal': anim = 'terminal.idle'; break;
        case 'firewall': anim = 'firewall.idle'; break;
        case 'portal': anim = 'portal.idle'; break;
      }
      if (o.type === 'server' && !o.on) {
        const gm = frame('goal.idle', t);
        if (ready(gm)) ctx.drawImage(gm, px, py, cell, cell);
      }
      const im = frame(anim, t);
      if (ready(im)) ctx.drawImage(im, px, py, cell, cell);
    }
  }

  drawItems(t) {
    const { ctx, cell } = this;
    for (const it of this.world.items.values()) {
      const anim = { coin: 'bit.spin', star: 'star.idle', chip: 'chip.idle', key: 'key.idle' }[it.type];
      const im = frame(anim, t);
      if (!ready(im)) continue;
      const { px, py } = this.cellToPx(it.x, it.y);
      const bob = Math.sin(t / 320 + it.x + it.y) * cell * 0.05;
      const s = cell * 0.78;
      ctx.drawImage(im, px + (cell - s) / 2, py + (cell - s) / 2 + bob, s, s);
    }
  }

  drawEnemies(t) {
    const { ctx, cell } = this;
    for (const e of this.world.enemies) {
      const anim = e.type === 'robot' ? 'robot.move' : e.type === 'bug' ? 'bug.idle' : 'virus.idle';
      const im = frame(anim, t);
      if (!ready(im)) continue;
      const { px, py } = this.cellToPx(e.x, e.y);
      const s = cell * 0.94;
      ctx.drawImage(im, px + (cell - s) / 2, py + (cell - s), s, s);
    }
  }

  drawPlayer(t) {
    const { ctx, world, cell } = this;
    let gx = world.player.x, gy = world.player.y, lift = 0;

    if (this.tween) {
      const p = clamp((t - this.tween.start) / this.tween.dur, 0, 1);
      const e = easeInOut(p);
      gx = this.tween.fromX + (this.tween.toX - this.tween.fromX) * e;
      gy = this.tween.fromY + (this.tween.toY - this.tween.fromY) * e;
      if (this.tween.kind === 'jump') lift = Math.sin(p * Math.PI) * cell * 0.55;
      if (p >= 1) this.tween = null;
    }

    const im = frame(`cat.${this.fur}.${this.pAnim}`, t, this.pAnimStart);
    if (!ready(im)) return;

    const s = cell * 1.18;
    const px = this.ox + gx * cell + (cell - s) / 2;
    const py = this.oy + gy * cell + cell - s + cell * 0.06 - lift;

    ctx.save();
    // El gato mira a izquierda o derecha según su orientación
    const facingLeft = world.player.dir === 2;
    if (facingLeft) {
      ctx.translate(px + s / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(px + s / 2), 0);
    }
    ctx.drawImage(im, px, py, s, s);
    ctx.restore();

    // Indicador de orientación (una flechita discreta bajo el gato)
    this.drawDirArrow(gx, gy, world.player.dir);
  }

  drawDirArrow(gx, gy, dir) {
    const { ctx, cell } = this;
    const cx = this.ox + (gx + 0.5) * cell;
    const cy = this.oy + (gy + 0.5) * cell;
    const r = cell * 0.42;
    const ang = [0, Math.PI / 2, Math.PI, -Math.PI / 2][dir];
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(34,230,255,.85)';
    ctx.beginPath();
    ctx.moveTo(cell * 0.10, 0);
    ctx.lineTo(-cell * 0.06, -cell * 0.07);
    ctx.lineTo(-cell * 0.06, cell * 0.07);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawPops(t) {
    const { ctx, cell } = this;
    this.pops = this.pops.filter(p => t - p.start < p.dur);
    for (const p of this.pops) {
      const k = (t - p.start) / p.dur;
      const cx = this.ox + (p.x + 0.5) * cell;
      const cy = this.oy + (p.y + 0.5) * cell;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * (1 - k) + 0.6;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * (0.24 + k * 0.6), 0, Math.PI * 2);
      ctx.stroke();
      if (p.text) {
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = p.color;
        ctx.font = `bold ${Math.round(cell * 0.34)}px 'Orbitron', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, cx, cy - cell * (0.3 + k * 0.5));
      }
      ctx.restore();
    }
  }
}
