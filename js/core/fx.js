/**
 * fx.js — Efectos visuales globales: partículas, números flotantes,
 * confeti, destellos, sacudidas y glitch.
 */
import { $, el, rand, randInt, pick } from './utils.js';

const canvas = $('#fx-particles');
const ctx = canvas.getContext('2d');
const floatLayer = $('#fx-float');

let particles = [];
let running = false;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// ---------------------------------------------------------------------------
// PARTÍCULAS
// ---------------------------------------------------------------------------
/**
 * Lanza un estallido de partículas en coordenadas de pantalla.
 * @param {number} x @param {number} y
 * @param {object} o - { count, colors, speed, life, size, gravity, shape }
 */
export function burst(x, y, o = {}) {
  const {
    count = 18,
    colors = ['#22e6ff', '#9df4ff', '#ffffff'],
    speed = 3.4,
    life = 720,
    size = 3.4,
    gravity = 0.06,
    shape = 'square',
    spread = Math.PI * 2,
    dir = 0,
  } = o;
  for (let i = 0; i < count; i++) {
    const a = dir + (Math.random() - 0.5) * spread;
    const v = speed * rand(0.35, 1.25);
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: life * rand(0.6, 1.25),
      born: performance.now(),
      color: pick(colors),
      size: size * rand(0.55, 1.5),
      gravity,
      shape,
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.24, 0.24),
    });
  }
  start();
}

/** Anillo expansivo (impactos, activaciones). */
export function ring(x, y, color = '#22e6ff', maxR = 80, ms = 520) {
  particles.push({ ring: true, x, y, color, maxR, born: performance.now(), life: ms });
  start();
}

/** Estela de chispas siguiendo un punto (recogida de objetos). */
export function sparkle(x, y, color = '#ffd23f') {
  burst(x, y, { count: 12, colors: [color, '#ffffff'], speed: 2.2, life: 520, size: 2.6, gravity: -0.02 });
}

function start() {
  if (running) return;
  running = true;
  requestAnimationFrame(loop);
}

function loop(now) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => now - p.born < p.life);

  for (const p of particles) {
    // `now` viene del inicio del frame y puede ser anterior a `born` si la
    // partícula se creó durante ese mismo frame: hay que acotar t a [0,1]
    // o los radios calculados salen negativos.
    const t = Math.min(1, Math.max(0, (now - p.born) / p.life));
    const alpha = 1 - t;

    if (p.ring) {
      const r = p.maxR * (1 - Math.pow(1 - t, 2));
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * alpha + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, r), 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.992;
    p.rot += p.spin;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const s = p.size * (0.4 + alpha * 0.9);
    if (p.shape === 'circle') {
      ctx.beginPath(); ctx.arc(0, 0, Math.max(0, s), 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-s / 2, -s / 2, s, s);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  if (particles.length) requestAnimationFrame(loop);
  else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

// ---------------------------------------------------------------------------
// NÚMEROS FLOTANTES
// ---------------------------------------------------------------------------
/** Muestra un texto flotante ("+50 XP") en coordenadas de pantalla. */
export function floatText(text, x, y, kind = 'xp') {
  const node = el('div', { class: `float-num ${kind}`, text, style: { left: x + 'px', top: y + 'px' } });
  floatLayer.append(node);
  setTimeout(() => node.remove(), 1300);
}

/** Igual que floatText pero centrado sobre un elemento del DOM. */
export function floatOver(target, text, kind = 'xp') {
  if (!target) return;
  const r = target.getBoundingClientRect();
  floatText(text, r.left + r.width / 2, r.top + r.height * 0.35, kind);
}

// ---------------------------------------------------------------------------
// EFECTOS DE PANTALLA
// ---------------------------------------------------------------------------
export function flash(color = 'rgba(255,255,255,.45)', ms = 420) {
  const node = el('div', { class: 'screen-flash', style: { background: color } });
  document.body.append(node);
  setTimeout(() => node.remove(), ms);
}

export function shake(ms = 340) {
  document.body.classList.add('shaking');
  setTimeout(() => document.body.classList.remove('shaking'), ms);
}

export function glitch(target, ms = 640) {
  const node = target || document.querySelector('.screen.active');
  if (!node) return;
  node.classList.add('glitching');
  setTimeout(() => node.classList.remove('glitching'), ms);
}

/** Lluvia de confeti para la victoria. */
export function confetti(count = 120) {
  const colors = ['#22e6ff', '#ff3fa4', '#4dff9f', '#ffd23f', '#a45cff', '#ff7a3d'];
  for (let i = 0; i < count; i++) {
    const p = el('div', {
      class: 'confetti-piece',
      style: {
        left: rand(0, 100) + 'vw',
        background: pick(colors),
        animationDuration: rand(2.4, 5) + 's',
        animationDelay: rand(0, 1.6) + 's',
        width: randInt(6, 12) + 'px',
        height: randInt(10, 20) + 'px',
      },
    });
    floatLayer.append(p);
    setTimeout(() => p.remove(), 7000);
  }
}

/** Glitch aleatorio ambiental muy ocasional (ambientación). */
export function startAmbientGlitch() {
  setInterval(() => {
    if (Math.random() < 0.14) glitch(null, 380);
  }, 12000);
}
