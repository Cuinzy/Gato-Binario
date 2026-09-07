/**
 * backgrounds.mjs — Fondos de las zonas (1280x720) dibujados como escenas
 * en capas: degradado, rejilla en perspectiva, siluetas y circuitos.
 */
import { C, svg, rr, el, ci, poly, ln, g, tx, pa, n, circuits, mulberry, bits, linGrad, radGrad } from './style.mjs';

const W = 1280, H = 720;

/** Rejilla en perspectiva tipo "suelo digital". */
function perspectiveGrid(horizon, col, op = 0.35) {
  let out = `<g stroke="${col}" opacity="${op}" fill="none">`;
  for (let i = -14; i <= 14; i++) {
    const x = W / 2 + i * 46;
    out += `<line x1="${n(W / 2 + i * 8)}" y1="${horizon}" x2="${n(x * 2 - W / 2)}" y2="${H}" stroke-width="1.2"/>`;
  }
  for (let i = 1; i <= 14; i++) {
    const t = i / 14;
    const y = horizon + Math.pow(t, 2.2) * (H - horizon);
    out += `<line x1="0" y1="${n(y)}" x2="${W}" y2="${n(y)}" stroke-width="${n(0.6 + t * 1.6)}"/>`;
  }
  return out + '</g>';
}

/** Torres/rascacielos de servidores al fondo. */
function skyline(seed, baseY, col, dark, count = 16, maxH = 260) {
  const rnd = mulberry(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const w = 40 + rnd() * 90;
    const x = (i / count) * (W + 120) - 60 + rnd() * 20;
    const h = 60 + rnd() * maxH;
    out += rr(x, baseY - h, w, h + 10, 3, dark);
    // ventanas encendidas
    const rows = Math.floor(h / 26), cols = Math.max(1, Math.floor(w / 22));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rnd() > 0.62) {
          out += rr(x + 8 + c * 22, baseY - h + 12 + r * 26, 8, 10, 1, col,
            `opacity="${n(0.25 + rnd() * 0.6)}"`);
        }
      }
    }
    if (rnd() > 0.6) {
      out += ln(x + w / 2, baseY - h, x + w / 2, baseY - h - 22, dark, 2);
      out += ci(x + w / 2, baseY - h - 24, 3.5, C.red, 'opacity="0.8"');
    }
  }
  return out;
}

/** Lluvia de código estilo "matrix". */
function codeRain(seed, col, cols = 26, op = 0.28) {
  const rnd = mulberry(seed);
  let out = `<g opacity="${op}" font-family="'Courier New',monospace" font-size="16" fill="${col}">`;
  for (let i = 0; i < cols; i++) {
    const x = (i / cols) * W + rnd() * 20;
    const y0 = rnd() * H;
    const len = 6 + Math.floor(rnd() * 14);
    for (let j = 0; j < len; j++) {
      out += `<text x="${n(x)}" y="${n((y0 + j * 19) % H)}" opacity="${n(1 - j / len)}">${rnd() > 0.5 ? '1' : '0'}</text>`;
    }
  }
  return out + '</g>';
}

/** Nodos de circuito flotantes. */
function floatingNodes(seed, col, count = 26) {
  const rnd = mulberry(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rnd() * W, y = rnd() * H * 0.8;
    const r = 1.5 + rnd() * 3.5;
    out += ci(x, y, r, col, `opacity="${n(0.2 + rnd() * 0.5)}"`);
    if (rnd() > 0.55) out += ci(x, y, r * 3.2, 'none', `stroke="${col}" stroke-width="0.8" opacity="0.18"`);
  }
  return out;
}

// ===========================================================================
// FONDOS POR ZONA
// ===========================================================================

/** Zona 0 / Menú — ciudad de servidores con niebla cian. */
export function bgMenu() {
  const body =
    rr(0, 0, W, H, 0, 'url(#skyMenu)') +
    ci(W * 0.5, 300, 420, 'url(#haloMenu)') +
    codeRain(3, C.cyan, 30, 0.16) +
    skyline(11, 520, C.cyanSoft, '#0a1730', 18, 300) +
    rr(0, 470, W, 90, 0, 'url(#fogMenu)') +
    skyline(29, 620, C.cyan, '#060e1e', 12, 200) +
    perspectiveGrid(600, C.cyan, 0.3) +
    floatingNodes(7, C.cyan, 30) +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('skyMenu', [[0, '#04070f'], [0.45, '#08142c'], [1, '#0b1e3a']]) +
    radGrad('haloMenu', [[0, C.cyan, 0.22], [0.6, C.magenta, 0.08], [1, C.magenta, 0]]) +
    linGrad('fogMenu', [[0, '#0b1e3a', 0], [1, '#0b1e3a', 0.9]]) +
    radGrad('vignette', [[0.55, '#000', 0], [1, '#000', 0.75]]);
  return svg(W, H, body, defs);
}

/** Zona 1 — Arranque del sistema: placa base gigante. */
export function bgZone1() {
  let traces = `<g stroke="${C.cyan}" fill="none" opacity="0.28" stroke-width="2">`;
  const rnd = mulberry(101);
  for (let i = 0; i < 34; i++) {
    let x = rnd() * W, y = rnd() * H;
    let d = `M${n(x)} ${n(y)}`;
    for (let s = 0; s < 4; s++) {
      const horiz = rnd() > 0.5;
      const len = 40 + rnd() * 160;
      if (horiz) x += (rnd() > 0.5 ? len : -len); else y += (rnd() > 0.5 ? len : -len);
      d += ` L${n(x)} ${n(y)}`;
    }
    traces += `<path d="${d}"/><circle cx="${n(x)}" cy="${n(y)}" r="4" fill="${C.cyan}" opacity="0.5"/>`;
  }
  traces += '</g>';
  const body =
    rr(0, 0, W, H, 0, 'url(#sky1)') +
    traces +
    // chips grandes decorativos
    g('translate(120 120)', rr(0, 0, 150, 150, 8, '#0d1730') + rr(10, 10, 130, 130, 6, '#16233f') + tx(75, 85, 'CPU', C.cyan, 26, 'opacity="0.6"')) +
    g('translate(950 420)', rr(0, 0, 190, 130, 8, '#0d1730') + rr(10, 10, 170, 110, 6, '#16233f') + tx(95, 78, 'RAM', C.cyanSoft, 24, 'opacity="0.5"')) +
    floatingNodes(13, C.cyanSoft, 24) +
    ci(W * 0.75, 180, 260, 'url(#halo1)') +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('sky1', [[0, '#050b18'], [1, '#0a1830']]) +
    radGrad('halo1', [[0, C.cyan, 0.16], [1, C.cyan, 0]]) +
    radGrad('vignette', [[0.55, '#000', 0], [1, '#000', 0.72]]);
  return svg(W, H, body, defs);
}

/** Zona 2 — Laberinto de datos: túneles y flujos. */
export function bgZone2() {
  let tunnels = '';
  for (let i = 8; i >= 1; i--) {
    const s = i / 8;
    const w = 1100 * s, h = 640 * s;
    tunnels += rr(W / 2 - w / 2, H / 2 - h / 2, w, h, 24 * s, 'none',
      `stroke="${i % 2 ? C.cyan : C.cyanSoft}" stroke-width="${n(1 + s * 2)}" opacity="${n(0.12 + s * 0.25)}"`);
  }
  const body =
    rr(0, 0, W, H, 0, 'url(#sky2)') +
    ci(W / 2, H / 2, 320, 'url(#halo2)') +
    tunnels +
    codeRain(23, C.cyanSoft, 34, 0.22) +
    floatingNodes(31, C.cyan, 34) +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('sky2', [[0, '#030a14'], [0.5, '#062036'], [1, '#031018']]) +
    radGrad('halo2', [[0, C.cyanSoft, 0.2], [1, C.cyanSoft, 0]]) +
    radGrad('vignette', [[0.5, '#000', 0], [1, '#000', 0.8]]);
  return svg(W, H, body, defs);
}

/** Zona 3 — Fábrica de bugs: maquinaria y neón magenta. */
export function bgZone3() {
  const rnd = mulberry(303);
  let pipes = '';
  for (let i = 0; i < 10; i++) {
    const x = 40 + i * 130 + rnd() * 30;
    const h = 180 + rnd() * 300;
    pipes += rr(x, H - h, 34, h, 10, '#1a0f26');
    pipes += rr(x + 6, H - h + 6, 22, h - 12, 8, '#2a1a35');
    for (let j = 0; j < Math.floor(h / 70); j++) {
      pipes += rr(x - 5, H - h + 30 + j * 70, 44, 12, 4, '#3a2448');
      pipes += ci(x + 17, H - h + 36 + j * 70, 3, C.magenta, 'opacity="0.7"');
    }
  }
  let gears = '';
  for (let i = 0; i < 5; i++) {
    const cx = 140 + i * 260, cy = 130 + rnd() * 90, r = 40 + rnd() * 34;
    let teeth = '';
    for (let t = 0; t < 10; t++) teeth += rr(cx - 6, cy - r - 10, 12, 16, 3, '#2a1a35', `transform="rotate(${t * 36} ${cx} ${cy})"`);
    gears += teeth + ci(cx, cy, r, '#241030') + ci(cx, cy, r * 0.4, '#0d0716') +
      ci(cx, cy, r, 'none', `stroke="${C.magenta}" stroke-width="2" opacity="0.4"`);
  }
  const body =
    rr(0, 0, W, H, 0, 'url(#sky3)') +
    gears +
    pipes +
    ci(W * 0.3, 500, 300, 'url(#halo3)') +
    floatingNodes(37, C.magenta, 22) +
    codeRain(41, C.magenta, 18, 0.14) +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('sky3', [[0, '#0d0512'], [0.6, '#1a0a24'], [1, '#25102f']]) +
    radGrad('halo3', [[0, C.magenta, 0.2], [1, C.magenta, 0]]) +
    radGrad('vignette', [[0.5, '#000', 0], [1, '#000', 0.8]]);
  return svg(W, H, body, defs);
}

/** Zona 4 — Núcleo del sistema: reactor verde. */
export function bgZone4() {
  let rings = '';
  for (let i = 0; i < 7; i++) {
    const r = 90 + i * 62;
    rings += el(W / 2, H / 2, r, r * 0.62, 'none',
      `stroke="${C.green}" stroke-width="${n(3 - i * 0.3)}" opacity="${n(0.4 - i * 0.045)}"`);
  }
  let beams = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    beams += ln(W / 2, H / 2, W / 2 + Math.cos(a) * 700, H / 2 + Math.sin(a) * 430, C.green, 2, 'opacity="0.14"');
  }
  const body =
    rr(0, 0, W, H, 0, 'url(#sky4)') +
    beams + rings +
    ci(W / 2, H / 2, 200, 'url(#core4)') +
    ci(W / 2, H / 2, 74, C.green, 'opacity="0.5" filter="url(#glowBig)"') +
    ci(W / 2, H / 2, 44, '#d8ffe8', 'opacity="0.8"') +
    codeRain(53, C.green, 24, 0.2) +
    floatingNodes(59, C.green, 26) +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('sky4', [[0, '#03120b'], [0.6, '#06251a'], [1, '#020d08']]) +
    radGrad('core4', [[0, C.green, 0.55], [0.5, C.green, 0.16], [1, C.green, 0]]) +
    radGrad('vignette', [[0.45, '#000', 0], [1, '#000', 0.85]]);
  return svg(W, H, body, defs);
}

/** Arena del Boss — rojo/violeta amenazante. */
export function bgBoss() {
  const rnd = mulberry(707);
  let cracks = `<g stroke="${C.red}" fill="none" opacity="0.35">`;
  for (let i = 0; i < 16; i++) {
    let x = rnd() * W, y = H * 0.55 + rnd() * H * 0.45;
    let d = `M${n(x)} ${n(y)}`;
    for (let s = 0; s < 5; s++) {
      x += (rnd() - 0.5) * 130; y += rnd() * 40;
      d += ` L${n(x)} ${n(y)}`;
    }
    cracks += `<path d="${d}" stroke-width="${n(0.8 + rnd() * 2)}"/>`;
  }
  cracks += '</g>';
  const body =
    rr(0, 0, W, H, 0, 'url(#skyB)') +
    ci(W / 2, 250, 400, 'url(#haloB)') +
    skyline(97, 560, C.red, '#12040c', 14, 320) +
    perspectiveGrid(560, C.red, 0.28) +
    cracks +
    codeRain(71, C.red, 22, 0.2) +
    floatingNodes(83, C.magenta, 30) +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('skyB', [[0, '#0a0208'], [0.5, '#1d0518'], [1, '#2a0620']]) +
    radGrad('haloB', [[0, C.red, 0.25], [0.6, C.purple, 0.12], [1, C.purple, 0]]) +
    radGrad('vignette', [[0.45, '#000', 0], [1, '#000', 0.85]]);
  return svg(W, H, body, defs);
}

/** Fondo del mapa de niveles: constelación de circuitos. */
export function bgMap() {
  const body =
    rr(0, 0, W, H, 0, 'url(#skyM)') +
    circuits(0, 0, W, H, C.cyan, 5, 90, 0.16) +
    codeRain(13, C.cyanSoft, 22, 0.12) +
    floatingNodes(17, C.cyan, 40) +
    ci(W * 0.2, H * 0.25, 300, 'url(#haloM1)') +
    ci(W * 0.8, H * 0.75, 340, 'url(#haloM2)') +
    rr(0, 0, W, H, 0, 'url(#vignette)');
  const defs =
    linGrad('skyM', [[0, '#04070f'], [0.5, '#071228'], [1, '#040a16']]) +
    radGrad('haloM1', [[0, C.cyan, 0.16], [1, C.cyan, 0]]) +
    radGrad('haloM2', [[0, C.magenta, 0.14], [1, C.magenta, 0]]) +
    radGrad('vignette', [[0.55, '#000', 0], [1, '#000', 0.7]]);
  return svg(W, H, body, defs);
}

export function backgroundFrames() {
  return {
    'bg_menu.svg': bgMenu(),
    'bg_map.svg': bgMap(),
    'bg_zone1.svg': bgZone1(),
    'bg_zone2.svg': bgZone2(),
    'bg_zone3.svg': bgZone3(),
    'bg_zone4.svg': bgZone4(),
    'bg_boss.svg': bgBoss(),
  };
}
