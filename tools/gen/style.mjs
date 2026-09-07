/**
 * style.mjs — Paleta, utilidades y "primitivas" SVG compartidas por todos
 * los generadores de sprites de Gato Binario.
 *
 * Todos los sprites se generan como SVG autocontenidos (sin dependencias
 * externas) para poder cargarlos en <img> y dibujarlos en Canvas.
 */

// ---------------------------------------------------------------------------
// PALETA OFICIAL DEL CLUB
// ---------------------------------------------------------------------------
export const C = {
  void:      '#05070f', // negro azulado profundo
  deep:      '#0a1024',
  panel:     '#121a35',
  panelUp:   '#1c2751',
  line:      '#2b3a6b',

  cyan:      '#22e6ff',
  cyanDeep:  '#0a8fb5',
  cyanSoft:  '#9df4ff',

  magenta:   '#ff3fa4',
  magDeep:   '#a31560',

  green:     '#4dff9f',
  greenDeep: '#12a35c',

  yellow:    '#ffd23f',
  orange:    '#ff7a3d',
  red:       '#ff4d5e',
  purple:    '#a45cff',
  purpleDeep:'#5a25a8',

  white:     '#eaf6ff',
  gray:      '#7a89b8',
};

// Colores de pelaje para las variantes de avatar
export const FURS = {
  binario:  { body: '#1c2751', dark: '#121a35', trim: C.cyan,    ear: C.magenta },
  neon:     { body: '#2a1046', dark: '#1a0a2e', trim: C.magenta, ear: C.cyan    },
  matrix:   { body: '#0e2b1e', dark: '#081a12', trim: C.green,   ear: C.yellow  },
  solar:    { body: '#3a2208', dark: '#241405', trim: C.yellow,  ear: C.orange  },
  plasma:   { body: '#2b0f1c', dark: '#1a0812', trim: C.red,     ear: C.orange  },
  ghost:    { body: '#243357', dark: '#18233d', trim: C.white,   ear: C.cyanSoft},
};

// ---------------------------------------------------------------------------
// HELPERS SVG
// ---------------------------------------------------------------------------

/** Envuelve contenido en un documento SVG completo. */
export function svg(w, h, body, extraDefs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
  <feGaussianBlur stdDeviation="1.6" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<filter id="glowBig" x="-80%" y="-80%" width="260%" height="260%">
  <feGaussianBlur stdDeviation="3.4" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
${extraDefs}
</defs>
${body}
</svg>`;
}

/** Rectángulo redondeado. */
export const rr = (x, y, w, h, r, fill, extra = '') =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="${fill}" ${extra}/>`;

/** Elipse. */
export const el = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" ${extra}/>`;

/** Círculo. */
export const ci = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" ${extra}/>`;

/** Path genérico. */
export const pa = (d, fill = 'none', extra = '') =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;

/** Polígono a partir de pares [x,y]. */
export const poly = (pts, fill, extra = '') =>
  `<polygon points="${pts.map(p => `${n(p[0])},${n(p[1])}`).join(' ')}" fill="${fill}" ${extra}/>`;

/** Línea. */
export const ln = (x1, y1, x2, y2, stroke, w = 1, extra = '') =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${n(w)}" stroke-linecap="round" ${extra}/>`;

/** Grupo con transform. */
export const g = (transform, content, extra = '') =>
  `<g transform="${transform}" ${extra}>${content}</g>`;

/** Texto monoespaciado (para chips, paneles "01", etc.).
 *  `anchor` y `font` son parametros explicitos para evitar atributos duplicados. */
export const tx = (x, y, str, fill, size = 6, extra = '', anchor = 'middle', font = "'Courier New',monospace") =>
  `<text x="${n(x)}" y="${n(y)}" fill="${fill}" font-family="${font}" font-size="${n(size)}" font-weight="bold" text-anchor="${anchor}" ${extra}>${str}</text>`;

/** Redondea números para mantener los SVG compactos. */
export function n(v) {
  return Math.round(v * 100) / 100;
}

/** Interpola linealmente. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Genera un patrón de circuitos decorativo dentro de un rect. */
export function circuits(x, y, w, h, color, seed = 1, density = 5, op = 0.5) {
  const rnd = mulberry(seed);
  let out = `<g opacity="${op}" stroke="${color}" stroke-width="0.8" fill="none" stroke-linecap="round">`;
  for (let i = 0; i < density; i++) {
    const sx = x + rnd() * w;
    const sy = y + rnd() * h;
    const len = 3 + rnd() * (w * 0.35);
    const horiz = rnd() > 0.5;
    const ex = horiz ? Math.min(x + w, sx + len) : sx;
    const ey = horiz ? sy : Math.min(y + h, sy + len);
    const mx = horiz ? ex : sx + (rnd() > 0.5 ? 4 : -4);
    const my = horiz ? ey + (rnd() > 0.5 ? 4 : -4) : ey;
    out += `<path d="M${n(sx)} ${n(sy)} L${n(ex)} ${n(ey)} L${n(mx)} ${n(my)}"/>`;
    out += `<circle cx="${n(mx)}" cy="${n(my)}" r="1" fill="${color}" stroke="none"/>`;
  }
  return out + '</g>';
}

/** PRNG determinista para que los sprites sean reproducibles. */
export function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cadena binaria decorativa determinista. */
export function bits(len, seed = 7) {
  const rnd = mulberry(seed);
  let s = '';
  for (let i = 0; i < len; i++) s += rnd() > 0.5 ? '1' : '0';
  return s;
}

/** Gradiente lineal reutilizable. */
export function linGrad(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] ?? 1}"/>`).join('')
  }</linearGradient>`;
}

/** Gradiente radial reutilizable. */
export function radGrad(id, stops, cx = 0.5, cy = 0.5, r = 0.5) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${
    stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}" stop-opacity="${s[2] ?? 1}"/>`).join('')
  }</radialGradient>`;
}
