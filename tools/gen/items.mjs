/**
 * items.mjs — Coleccionables (bits, estrellas, llaves, chips) y objetos del
 * escenario (servidor meta, terminales, cofres, puertas, portales, muros).
 * Todo en lienzo 64x64 para encajar con la rejilla del motor.
 */
import { C, svg, rr, el, ci, poly, ln, g, tx, pa, n, circuits, linGrad, radGrad, bits, mulberry } from './style.mjs';

// ===========================================================================
// COLECCIONABLES
// ===========================================================================

/** Moneda "Bit": hexágono giratorio con 0/1. */
export function bitCoin(frame = 0) {
  const squash = [1, 0.62, 0.18, 0.62][frame % 4];
  const label = frame % 4 === 0 ? '1' : frame % 4 === 2 ? '' : '0';
  const hex = (r) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      pts.push([32 + Math.cos(a) * r * squash, 32 + Math.sin(a) * r]);
    }
    return pts;
  };
  const body =
    el(32, 55, 12 * squash + 2, 3, '#000', 'opacity="0.3"') +
    poly(hex(19), C.orange) +
    poly(hex(16), C.yellow) +
    poly(hex(11), '#fff6c9', 'opacity="0.5"') +
    (label ? tx(32, 39, label, '#7a4b00', 20) : rr(30, 18, 4, 28, 2, '#e0a800')) +
    poly(hex(19), 'none', `stroke="${C.white}" stroke-width="1" opacity="0.35"`);
  return svg(64, 64, body, '');
}

/** Estrella de datos (reto/objetivo). */
export function star(frame = 0) {
  const s = [1, 1.08, 1, 0.94][frame % 4];
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = (i % 2 === 0 ? 22 : 9.5) * s;
    pts.push([32 + Math.cos(a) * r, 32 + Math.sin(a) * r]);
  }
  const body =
    ci(32, 32, 26, 'url(#starGlow)') +
    poly(pts, C.orange) +
    poly(pts.map(p => [32 + (p[0] - 32) * 0.82, 32 + (p[1] - 32) * 0.82]), C.yellow) +
    ci(28, 27, 3.2, C.white, 'opacity="0.7"');
  return svg(64, 64, body, radGrad('starGlow', [[0, C.yellow, 0.55], [1, C.yellow, 0]]));
}

/** Llave de acceso. */
export function key() {
  const body =
    ci(22, 24, 12, C.cyanDeep) +
    ci(22, 24, 8.5, C.cyan, 'filter="url(#glow)"') +
    ci(22, 24, 4.2, C.deep) +
    rr(28, 29, 26, 6, 3, C.cyanDeep, 'transform="rotate(35 28 32)"') +
    rr(41, 41, 8, 5, 2, C.cyanDeep, 'transform="rotate(35 41 43)"') +
    rr(46, 47, 8, 5, 2, C.cyanDeep, 'transform="rotate(35 46 49)"') +
    tx(22, 27, '0', C.cyanSoft, 8);
  return svg(64, 64, body);
}

/** Chip / componente del sistema. */
export function chip(col = C.green) {
  let pins = '';
  for (let i = 0; i < 4; i++) {
    const p = 20 + i * 8;
    pins += rr(p, 10, 4, 6, 1, C.gray) + rr(p, 48, 4, 6, 1, C.gray);
    pins += rr(10, p, 6, 4, 1, C.gray) + rr(48, p, 6, 4, 1, C.gray);
  }
  const body =
    pins +
    rr(15, 15, 34, 34, 4, '#0d1730') +
    rr(17, 17, 30, 30, 3, '#16233f') +
    circuits(19, 19, 26, 26, col, 13, 7, 0.85) +
    ci(21, 21, 2, col, 'filter="url(#glow)"') +
    tx(32, 36, 'GB', col, 11);
  return svg(64, 64, body);
}

/** Cristal de datos (coleccionable premium). */
export function dataGem(col = C.purple) {
  const body =
    ci(32, 32, 24, 'url(#gemGlow)') +
    poly([[32, 8], [48, 26], [40, 54], [24, 54], [16, 26]], '#2a1050') +
    poly([[32, 12], [44, 27], [37, 50], [27, 50], [20, 27]], col) +
    poly([[32, 12], [44, 27], [32, 33]], C.white, 'opacity="0.28"') +
    poly([[32, 12], [20, 27], [32, 33]], C.white, 'opacity="0.14"');
  return svg(64, 64, body, radGrad('gemGlow', [[0, col, 0.5], [1, col, 0]]));
}

// ===========================================================================
// OBJETOS DEL ESCENARIO
// ===========================================================================

/** Servidor: meta de los niveles. */
export function server(on = false, frame = 0) {
  const lit = on ? C.green : C.cyan;
  let leds = '';
  const rnd = mulberry(frame + 1);
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const active = on ? true : rnd() > 0.45;
      leds += ci(22 + c * 7, 18 + r * 7, 1.8, active ? lit : C.line,
        active ? 'filter="url(#glow)"' : '');
    }
  }
  const body =
    el(32, 60, 20, 3.5, '#000', 'opacity="0.4"') +
    (on ? ci(32, 34, 30, 'url(#srvGlow)') : '') +
    rr(12, 8, 40, 50, 5, '#0a1226') +
    rr(14, 10, 36, 46, 4, C.panel) +
    rr(16, 12, 32, 42, 3, '#0d1832') +
    leds +
    rr(38, 14, 8, 38, 2, C.void) +
    tx(42, 26, '1', lit, 7) + tx(42, 36, '0', lit, 7) + tx(42, 46, '1', lit, 7) +
    rr(12, 8, 40, 50, 5, 'none', `stroke="${lit}" stroke-width="1.6" opacity="${on ? 1 : 0.5}"`) +
    rr(20, 57, 24, 4, 2, C.panelUp);
  return svg(64, 64, body, radGrad('srvGlow', [[0, C.green, 0.4], [1, C.green, 0]]));
}

/** Terminal / computador con pantalla de código. */
export function terminal(frame = 0) {
  const lines = [bits(6, frame + 1), bits(4, frame + 5), bits(7, frame + 9)];
  const body =
    el(32, 59, 18, 3, '#000', 'opacity="0.35"') +
    rr(26, 44, 12, 8, 2, C.panelUp) +
    rr(18, 50, 28, 5, 2.5, C.line) +
    rr(8, 10, 48, 36, 4, '#0a1226') +
    rr(10.5, 12.5, 43, 31, 3, '#04140f') +
    rr(10.5, 12.5, 43, 5, 0, '#0a2a1f') +
    ci(14, 15, 1.6, C.red) + ci(19, 15, 1.6, C.yellow) + ci(24, 15, 1.6, C.green) +
    tx(20, 26, '&gt;' + lines[0], C.green, 5, 'opacity="0.95"', 'start') +
    tx(20, 32, '&gt;' + lines[1], C.green, 5, 'opacity="0.8"', 'start') +
    tx(20, 38, '&gt;' + lines[2], C.green, 5, 'opacity="0.65"', 'start') +
    rr(8, 10, 48, 36, 4, 'none', `stroke="${C.cyan}" stroke-width="1.4" opacity="0.7"`);
  return svg(64, 64, body);
}

/** Cofre de datos, abierto o cerrado. */
export function chest(open = false) {
  const body = open
    ? el(32, 58, 20, 3.5, '#000', 'opacity="0.4"') +
      ci(32, 30, 26, 'url(#chestGlow)') +
      rr(10, 12, 44, 16, 5, '#4a2c0c', 'transform="rotate(-16 32 28)"') +
      rr(12, 14, 40, 12, 4, '#7a4a14', 'transform="rotate(-16 32 28)"') +
      rr(10, 30, 44, 26, 5, '#4a2c0c') +
      rr(12, 32, 40, 22, 4, '#7a4a14') +
      tx(32, 44, '1010', C.yellow, 9, 'filter="url(#glow)"') +
      poly([[24, 30], [28, 22], [32, 30]], C.yellow, 'opacity="0.75"') +
      poly([[34, 30], [38, 20], [42, 30]], C.cyan, 'opacity="0.75"')
    : el(32, 58, 20, 3.5, '#000', 'opacity="0.4"') +
      rr(10, 18, 44, 38, 5, '#3d2409') +
      rr(12, 20, 40, 34, 4, '#7a4a14') +
      rr(10, 18, 44, 14, 5, '#4a2c0c') +
      rr(12, 20, 40, 11, 4, '#95601c') +
      rr(8, 30, 48, 5, 2, '#3d2409') +
      rr(27, 28, 10, 12, 2, C.yellow) +
      ci(32, 34, 2.4, '#3d2409') +
      circuits(14, 38, 36, 14, C.cyan, 17, 4, 0.4);
  return svg(64, 64, body, radGrad('chestGlow', [[0, C.yellow, 0.45], [1, C.yellow, 0]]));
}

/** Puerta de acceso: bloqueada o abierta. */
export function door(open = false) {
  const col = open ? C.green : C.magenta;
  const body =
    rr(6, 2, 52, 60, 4, '#0a1226') +
    rr(9, 5, 46, 54, 3, C.panel) +
    circuits(11, 8, 42, 48, col, 23, 6, 0.3) +
    (open
      ? rr(12, 8, 18, 48, 2, C.deep) + rr(34, 8, 18, 48, 2, C.deep) +
        rr(30, 8, 4, 48, 0, col, 'opacity="0.55" filter="url(#glow)"')
      : rr(12, 8, 40, 48, 2, C.panelUp) +
        ln(32, 8, 32, 56, C.deep, 2) +
        ci(32, 32, 11, C.deep) + ci(32, 32, 8.5, col, 'filter="url(#glow)"') +
        rr(29, 30, 6, 8, 1.5, C.void) + poly([[29, 30], [35, 30], [32, 24]], C.void)
    ) +
    rr(6, 2, 52, 60, 4, 'none', `stroke="${col}" stroke-width="2" opacity="0.85"`);
  return svg(64, 64, body);
}

/** Portal animado (transición entre zonas). */
export function portal(frame = 0) {
  const t = frame / 4;
  let rings = '';
  for (let i = 0; i < 4; i++) {
    const r = 8 + ((i / 4 + t) % 1) * 22;
    const op = 1 - ((i / 4 + t) % 1);
    rings += el(32, 32, r * 0.62, r, 'none',
      `stroke="${i % 2 ? C.cyan : C.magenta}" stroke-width="2.4" opacity="${n(op * 0.85)}"`);
  }
  const body =
    el(32, 32, 21, 30, 'url(#portalGlow)') +
    el(32, 32, 17, 27, C.void) +
    rings +
    el(32, 32, 17, 27, 'none', `stroke="${C.cyan}" stroke-width="2.6" filter="url(#glow)"`) +
    tx(32, 36, bits(3, frame + 2), C.cyanSoft, 8, 'opacity="0.8"');
  return svg(64, 64, body, radGrad('portalGlow', [[0, C.cyan, 0.5], [0.7, C.magenta, 0.25], [1, C.magenta, 0]]));
}

/** Firewall: obstáculo peligroso animado. */
export function firewall(frame = 0) {
  const rnd = mulberry(frame + 40);
  let flames = '';
  for (let i = 0; i < 6; i++) {
    const x = 8 + i * 9;
    const h = 18 + rnd() * 16;
    flames += pa(`M${x} 56 Q${x + 4.5} ${56 - h} ${x + 9} 56 Z`, i % 2 ? C.orange : C.red, 'opacity="0.9"');
    flames += pa(`M${x + 2} 56 Q${x + 4.5} ${58 - h * 0.6} ${x + 7} 56 Z`, C.yellow, 'opacity="0.85"');
  }
  const body =
    rr(4, 54, 56, 8, 2, '#2a0d0d') +
    flames +
    tx(32, 12, 'FIREWALL', C.red, 7, 'opacity="0.75"');
  return svg(64, 64, body);
}

/** Botón/interruptor del sistema. */
export function switchBtn(on = false) {
  const col = on ? C.green : C.red;
  const body =
    el(32, 56, 18, 3.5, '#000', 'opacity="0.35"') +
    rr(14, 40, 36, 16, 4, '#0a1226') +
    rr(16, 42, 32, 12, 3, C.panel) +
    ci(32, 30, 15, C.deep) +
    ci(32, on ? 30 : 32, 12, col, 'filter="url(#glow)"') +
    ci(32, on ? 27 : 29, 7, C.white, 'opacity="0.25"') +
    tx(32, 51, on ? 'ON' : 'OFF', col, 7);
  return svg(64, 64, body);
}

// ===========================================================================
// TILES DE ESCENARIO
// ===========================================================================

/** Baldosa de piso (variantes 0..2). */
export function floorTile(variant = 0, zone = 0) {
  const zoneCols = [
    { base: '#101a33', top: '#16233f', line: C.cyan },
    { base: '#0f1c2e', top: '#152a3f', line: C.cyanSoft },
    { base: '#1d1226', top: '#2a1a35', line: C.magenta },
    { base: '#0c2118', top: '#123024', line: C.green },
    { base: '#1f1408', top: '#2e1f0c', line: C.orange },
  ];
  const Z = zoneCols[zone % zoneCols.length];
  let deco = '';
  if (variant === 1) deco = circuits(6, 6, 52, 52, Z.line, 5, 5, 0.35);
  if (variant === 2) deco = tx(32, 38, bits(4, 9), Z.line, 8, 'opacity="0.22"');
  const body =
    rr(0, 0, 64, 64, 0, Z.base) +
    rr(2, 2, 60, 60, 3, Z.top) +
    rr(2, 2, 60, 60, 3, 'none', `stroke="${Z.line}" stroke-width="1" opacity="0.28"`) +
    ci(8, 8, 1.6, Z.line, 'opacity="0.5"') + ci(56, 8, 1.6, Z.line, 'opacity="0.5"') +
    ci(8, 56, 1.6, Z.line, 'opacity="0.5"') + ci(56, 56, 1.6, Z.line, 'opacity="0.5"') +
    deco;
  return svg(64, 64, body);
}

/** Bloque de muro. */
export function wallTile(zone = 0) {
  const zoneCols = [
    { base: '#1c2751', top: '#2b3a6b', line: C.cyan },
    { base: '#17304a', top: '#22456b', line: C.cyanSoft },
    { base: '#331c42', top: '#4a2a5e', line: C.magenta },
    { base: '#12402c', top: '#1b5b3f', line: C.green },
    { base: '#3a2610', target: 0, top: '#54371a', line: C.orange },
  ];
  const Z = zoneCols[zone % zoneCols.length];
  const body =
    rr(0, 0, 64, 64, 0, '#080d1c') +
    rr(1.5, 1.5, 61, 61, 5, Z.base) +
    rr(3.5, 3.5, 57, 52, 4, Z.top) +
    circuits(8, 8, 48, 44, Z.line, 29, 6, 0.4) +
    rr(3.5, 3.5, 57, 8, 4, C.white, 'opacity="0.08"') +
    rr(1.5, 1.5, 61, 61, 5, 'none', `stroke="${Z.line}" stroke-width="1.6" opacity="0.55"`) +
    ci(12, 12, 2.2, Z.line, 'opacity="0.7" filter="url(#glow)"') +
    ci(52, 52, 2.2, Z.line, 'opacity="0.5"');
  return svg(64, 64, body);
}

/** Plataforma flotante. */
export function platform(zone = 0) {
  const line = [C.cyan, C.cyanSoft, C.magenta, C.green, C.orange][zone % 5];
  const body =
    rr(2, 20, 60, 22, 6, '#0a1226') +
    rr(4, 22, 56, 16, 5, C.panelUp) +
    rr(4, 22, 56, 5, 5, C.white, 'opacity="0.1"') +
    circuits(8, 25, 48, 12, line, 37, 4, 0.5) +
    rr(2, 20, 60, 22, 6, 'none', `stroke="${line}" stroke-width="1.6" opacity="0.7"`) +
    ci(10, 46, 2, line, 'opacity="0.6" filter="url(#glow)"') +
    ci(54, 46, 2, line, 'opacity="0.6" filter="url(#glow)"');
  return svg(64, 64, body);
}

/** Marca de meta (círculo objetivo en el suelo). */
export function goalMark(frame = 0) {
  const r = 18 + (frame % 4) * 2.5;
  const op = 1 - (frame % 4) * 0.2;
  const body =
    ci(32, 32, 26, 'url(#goalGlow)') +
    ci(32, 32, r, 'none', `stroke="${C.green}" stroke-width="2.4" opacity="${n(op)}"`) +
    ci(32, 32, 12, 'none', `stroke="${C.green}" stroke-width="2" opacity="0.85"`) +
    poly([[32, 22], [38, 32], [32, 42], [26, 32]], C.green, 'opacity="0.85" filter="url(#glow)"');
  return svg(64, 64, body, radGrad('goalGlow', [[0, C.green, 0.35], [1, C.green, 0]]));
}

// ===========================================================================
// CONJUNTOS
// ===========================================================================
export function itemFrames() {
  const f = {};
  for (let i = 0; i < 4; i++) f[`bit_${i + 1}.svg`] = bitCoin(i);
  for (let i = 0; i < 4; i++) f[`star_${i + 1}.svg`] = star(i);
  f['key.svg'] = key();
  f['chip.svg'] = chip(C.green);
  f['chip_cyan.svg'] = chip(C.cyan);
  f['gem.svg'] = dataGem(C.purple);
  f['gem_cyan.svg'] = dataGem(C.cyan);
  return f;
}

export function objectFrames() {
  const f = {};
  f['server_off_1.svg'] = server(false, 0);
  f['server_off_2.svg'] = server(false, 1);
  f['server_on_1.svg'] = server(true, 0);
  f['server_on_2.svg'] = server(true, 1);
  for (let i = 0; i < 3; i++) f[`terminal_${i + 1}.svg`] = terminal(i);
  f['chest_closed.svg'] = chest(false);
  f['chest_open.svg'] = chest(true);
  f['door_locked.svg'] = door(false);
  f['door_open.svg'] = door(true);
  for (let i = 0; i < 4; i++) f[`portal_${i + 1}.svg`] = portal(i);
  for (let i = 0; i < 3; i++) f[`firewall_${i + 1}.svg`] = firewall(i);
  f['switch_off.svg'] = switchBtn(false);
  f['switch_on.svg'] = switchBtn(true);
  for (let i = 0; i < 4; i++) f[`goal_${i + 1}.svg`] = goalMark(i);
  return f;
}

export function environmentFrames() {
  const f = {};
  for (let z = 0; z < 5; z++) {
    for (let v = 0; v < 3; v++) f[`floor_z${z}_${v}.svg`] = floorTile(v, z);
    f[`wall_z${z}.svg`] = wallTile(z);
    f[`platform_z${z}.svg`] = platform(z);
  }
  return f;
}
