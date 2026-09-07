/**
 * ui.mjs — Logo del club, íconos de interfaz, íconos de comandos e insignias.
 */
import { C, FURS, svg, rr, el, ci, poly, ln, g, tx, pa, n, circuits, bits, linGrad, radGrad } from './style.mjs';

const IMPACT = "Impact,'Arial Black',Haettenschweiler,sans-serif";

// ===========================================================================
// LOGO
// ===========================================================================

/** Cabeza del gato dentro de un hexágono — marca del club. */
export function logoMark(size = 256) {
  const fur = FURS.binario;
  const hex = (cx, cy, r) => {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return p;
  };
  const body =
    ci(128, 128, 118, 'url(#markGlow)') +
    poly(hex(128, 128, 112), '#08111f') +
    poly(hex(128, 128, 106), 'none', `stroke="${C.cyan}" stroke-width="4" opacity="0.9"`) +
    poly(hex(128, 128, 96), 'none', `stroke="${C.magenta}" stroke-width="2" opacity="0.5"`) +
    circuits(30, 30, 196, 196, C.cyan, 71, 14, 0.22) +
    g('translate(64 62) scale(2.0)',
      poly([[18, 15], [20.5, 1.5], [31, 10]], fur.dark) +
      poly([[20, 13], [21.6, 5], [28.5, 10.5]], C.magenta) +
      poly([[33, 10], [43.5, 1.5], [46, 15]], fur.dark) +
      poly([[35.5, 10.5], [42.4, 5], [44, 13]], C.magenta) +
      rr(15, 8, 34, 28, 12.5, fur.dark) +
      rr(16.5, 9, 31, 26, 11.5, fur.body) +
      pa('M20 16 Q32 10 44 16 L44 12 Q32 6.5 20 12 Z', fur.dark, 'opacity="0.6"') +
      ln(32, 9.5, 32, 7.5, C.cyan, 1.2) + ci(32, 6.5, 2, C.cyan, 'filter="url(#glow)"') +
      el(24.5, 22, 5, 5.6, C.void) + el(24.5, 22, 4.1, 4.7, C.cyan, 'filter="url(#glow)"') +
      el(24.8, 22.4, 1.5, 3.2, C.void) + ci(23, 20.1, 1.3, C.white) +
      el(39.5, 22, 5, 5.6, C.void) + el(39.5, 22, 4.1, 4.7, C.cyan, 'filter="url(#glow)"') +
      el(39.8, 22.4, 1.5, 3.2, C.void) + ci(38, 20.1, 1.3, C.white) +
      el(32, 29, 6.4, 4.4, fur.dark, 'opacity="0.55"') +
      poly([[30.4, 27], [33.6, 27], [32, 29]], C.magenta) +
      pa('M29.4 29.8 Q31 32 32 30.2', 'none', `stroke="${C.void}" stroke-width="1.4" stroke-linecap="round"`) +
      pa('M32 30.2 Q33 32 34.6 29.8', 'none', `stroke="${C.void}" stroke-width="1.4" stroke-linecap="round"`) +
      ln(21, 27, 14, 25, C.cyan, 1) + ln(21, 29.5, 14, 30.5, C.cyan, 1) +
      ln(43, 27, 50, 25, C.cyan, 1) + ln(43, 29.5, 50, 30.5, C.cyan, 1)
    ) +
    tx(128, 222, '01001101', C.cyan, 15, 'opacity="0.55" letter-spacing="3"');
  const out = svg(256, 256, body, radGrad('markGlow', [[0, C.cyan, 0.28], [1, C.cyan, 0]]));
  return size === 256 ? out : out.replace('width="256" height="256"', `width="${size}" height="${size}"`);
}

/** Logo horizontal completo con texto. */
export function logoFull() {
  const mark = logoMark(256)
    .replace(/^<svg[^>]*>/, '').replace('</svg>', '')
    .replace(/<defs>[\s\S]*?<\/defs>/, '');
  const body =
    g('translate(8 12) scale(0.62)', mark) +
    tx(390, 92, 'GATO', C.white, 74, 'letter-spacing="4"', 'middle', IMPACT) +
    tx(390, 92, 'GATO', 'none', 74, `letter-spacing="4" stroke="${C.cyan}" stroke-width="1.5" opacity="0.8"`, 'middle', IMPACT) +
    tx(408, 152, 'BINARIO', C.cyan, 62, 'letter-spacing="8" filter="url(#glow)"', 'middle', IMPACT) +
    rr(238, 108, 300, 3, 1.5, C.magenta, 'opacity="0.8"') +
    tx(400, 182, 'CLUB  DE  PROGRAMACION', C.gray, 17, 'letter-spacing="6"');
  return svg(560, 200, body,
    radGrad('markGlow', [[0, C.cyan, 0.28], [1, C.cyan, 0]]));
}

// ===========================================================================
// ÍCONOS DE INTERFAZ (48x48)
// ===========================================================================
const ICON = (body, defs = '') => svg(48, 48, body, defs);

export function uiIcons() {
  const f = {};
  const ring = (col) => ci(24, 24, 21, 'none', `stroke="${col}" stroke-width="2.5" opacity="0.55"`);

  f['xp.svg'] = ICON(ring(C.cyan) +
    poly([[24, 6], [30, 21], [42, 21], [32, 29], [36, 43], [24, 34], [12, 43], [16, 29], [6, 21], [18, 21]], C.cyan, 'filter="url(#glow)"'));

  f['coin.svg'] = ICON(ci(24, 24, 19, C.orange) + ci(24, 24, 15, C.yellow) + tx(24, 31, '1', '#7a4b00', 20));

  f['star.svg'] = ICON(poly([[24, 5], [30, 19], [45, 20], [33, 30], [37, 44], [24, 36], [11, 44], [15, 30], [3, 20], [18, 19]], C.yellow, 'filter="url(#glow)"'));

  f['heart.svg'] = ICON(pa('M24 42 C6 29 4 18 12 12 C18 7 24 12 24 16 C24 12 30 7 36 12 C44 18 42 29 24 42 Z', C.red, 'filter="url(#glow)"'));

  f['lock.svg'] = ICON(rr(11, 21, 26, 20, 4, C.gray) +
    pa('M16 21 v-5 a8 8 0 0 1 16 0 v5', 'none', `stroke="${C.gray}" stroke-width="4"`) +
    ci(24, 29, 3.4, C.void) + rr(22.6, 30, 2.8, 6, 1.4, C.void));

  f['unlock.svg'] = ICON(rr(11, 21, 26, 20, 4, C.green) +
    pa('M16 21 v-5 a8 8 0 0 1 15 -3', 'none', `stroke="${C.green}" stroke-width="4"`) +
    ci(24, 29, 3.4, C.void) + rr(22.6, 30, 2.8, 6, 1.4, C.void));

  f['key.svg'] = ICON(ci(16, 18, 9, 'none', `stroke="${C.cyan}" stroke-width="4"`) +
    ln(21, 24, 40, 42, C.cyan, 4) + ln(32, 36, 37, 31, C.cyan, 4) + ln(37, 41, 42, 36, C.cyan, 4));

  f['gear.svg'] = ICON((() => {
    let teeth = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      teeth += rr(21, 2, 6, 10, 2, C.cyanSoft, `transform="rotate(${(i * 45)} 24 24)"`);
    }
    return teeth + ci(24, 24, 15, C.cyanSoft) + ci(24, 24, 7, C.deep);
  })());

  f['play.svg'] = ICON(ci(24, 24, 21, C.green, 'opacity="0.18"') +
    poly([[18, 13], [37, 24], [18, 35]], C.green, 'filter="url(#glow)"'));

  f['pause.svg'] = ICON(rr(14, 12, 7, 24, 2, C.yellow) + rr(27, 12, 7, 24, 2, C.yellow));

  f['restart.svg'] = ICON(pa('M38 24 a14 14 0 1 1 -6 -11.5', 'none', `stroke="${C.orange}" stroke-width="4.5" stroke-linecap="round"`) +
    poly([[40, 4], [40, 18], [27, 13]], C.orange));

  f['sound_on.svg'] = ICON(poly([[8, 19], [17, 19], [27, 9], [27, 39], [17, 29], [8, 29]], C.cyan) +
    pa('M32 17 a9 9 0 0 1 0 14', 'none', `stroke="${C.cyan}" stroke-width="3" stroke-linecap="round"`) +
    pa('M37 12 a16 16 0 0 1 0 24', 'none', `stroke="${C.cyan}" stroke-width="3" stroke-linecap="round" opacity="0.7"`));

  f['sound_off.svg'] = ICON(poly([[8, 19], [17, 19], [27, 9], [27, 39], [17, 29], [8, 29]], C.gray) +
    ln(32, 17, 43, 31, C.red, 3.5) + ln(43, 17, 32, 31, C.red, 3.5));

  f['music_on.svg'] = ICON(ci(15, 34, 7, C.magenta) + ci(35, 30, 7, C.magenta) +
    rr(20, 9, 3.5, 26, 1.5, C.magenta) + rr(40, 5, 3.5, 26, 1.5, C.magenta) +
    pa('M20 9 L43.5 5 L43.5 12 L20 16 Z', C.magenta));

  f['music_off.svg'] = ICON(ci(15, 34, 7, C.gray) + ci(35, 30, 7, C.gray) +
    rr(20, 9, 3.5, 26, 1.5, C.gray) + rr(40, 5, 3.5, 26, 1.5, C.gray) +
    ln(8, 8, 42, 42, C.red, 3.5));

  f['fullscreen.svg'] = ICON(
    pa('M6 17 V6 h11', 'none', `stroke="${C.cyanSoft}" stroke-width="4" stroke-linecap="round"`) +
    pa('M42 17 V6 h-11', 'none', `stroke="${C.cyanSoft}" stroke-width="4" stroke-linecap="round"`) +
    pa('M6 31 V42 h11', 'none', `stroke="${C.cyanSoft}" stroke-width="4" stroke-linecap="round"`) +
    pa('M42 31 V42 h-11', 'none', `stroke="${C.cyanSoft}" stroke-width="4" stroke-linecap="round"`));

  f['map.svg'] = ICON(poly([[4, 10], [17, 5], [31, 11], [44, 6], [44, 38], [31, 43], [17, 37], [4, 42]], C.panelUp) +
    ln(17, 5, 17, 37, C.cyan, 2) + ln(31, 11, 31, 43, C.cyan, 2) +
    ci(24, 22, 4, C.magenta, 'filter="url(#glow)"'));

  f['trophy.svg'] = ICON(pa('M14 6 h20 v12 a10 10 0 0 1 -20 0 Z', C.yellow) +
    pa('M14 9 h-7 v4 a7 7 0 0 0 7 6', 'none', `stroke="${C.yellow}" stroke-width="3"`) +
    pa('M34 9 h7 v4 a7 7 0 0 1 -7 6', 'none', `stroke="${C.yellow}" stroke-width="3"`) +
    rr(21, 28, 6, 8, 1, C.orange) + rr(14, 36, 20, 6, 2, C.orange));

  f['bug.svg'] = ICON(el(24, 27, 13, 15, C.magenta) + el(24, 27, 9, 11, C.magDeep, 'opacity="0.5"') +
    ci(24, 12, 7, C.magenta) + ci(21, 11, 2, C.yellow) + ci(27, 11, 2, C.yellow) +
    ln(19, 6, 15, 1, C.magenta, 2.5) + ln(29, 6, 33, 1, C.magenta, 2.5) +
    ln(11, 20, 4, 16, C.magDeep, 3) + ln(11, 28, 4, 30, C.magDeep, 3) + ln(12, 36, 6, 42, C.magDeep, 3) +
    ln(37, 20, 44, 16, C.magDeep, 3) + ln(37, 28, 44, 30, C.magDeep, 3) + ln(36, 36, 42, 42, C.magDeep, 3));

  f['code.svg'] = ICON(rr(3, 8, 42, 32, 4, C.deep) +
    pa('M17 18 L11 24 L17 30', 'none', `stroke="${C.green}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`) +
    pa('M31 18 L37 24 L31 30', 'none', `stroke="${C.green}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"`) +
    ln(27, 16, 21, 32, C.cyan, 3));

  f['blocks.svg'] = ICON(rr(5, 8, 38, 10, 3, C.cyan) + rr(9, 20, 34, 10, 3, C.magenta) + rr(5, 32, 30, 10, 3, C.green));

  f['hacker.svg'] = ICON(rr(4, 10, 40, 28, 4, C.void) +
    tx(14, 24, '&gt;_', C.green, 13, '', 'start') +
    tx(24, 35, '01101', C.green, 8, 'opacity="0.7"') +
    rr(4, 10, 40, 28, 4, 'none', `stroke="${C.green}" stroke-width="2"`));

  f['terminal.svg'] = f['hacker.svg'];

  f['check.svg'] = ICON(ci(24, 24, 20, C.green, 'opacity="0.18"') +
    pa('M13 25 L21 33 L36 15', 'none', `stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"`));

  f['close.svg'] = ICON(ln(12, 12, 36, 36, C.red, 5) + ln(36, 12, 12, 36, C.red, 5));

  f['teacher.svg'] = ICON(rr(4, 8, 40, 28, 3, C.panelUp) + rr(7, 11, 34, 22, 2, C.deep) +
    ln(21, 36, 27, 36, C.panelUp, 4) + rr(14, 40, 20, 4, 2, C.panelUp) +
    ln(13, 18, 30, 18, C.cyan, 2) + ln(13, 24, 24, 24, C.magenta, 2) + ln(13, 30, 27, 30, C.green, 2));

  f['projector.svg'] = ICON(rr(3, 14, 30, 20, 4, C.panelUp) + ci(24, 24, 7, C.cyan, 'filter="url(#glow)"') +
    poly([[33, 18], [46, 10], [46, 38], [33, 30]], C.cyanSoft, 'opacity="0.35"') + ci(9, 19, 2.4, C.green));

  f['team.svg'] = ICON(ci(16, 17, 8, C.cyan) + ci(33, 19, 6.5, C.magenta) +
    pa('M3 42 a13 13 0 0 1 26 0 Z', C.cyan) + pa('M25 42 a11 11 0 0 1 21 0 Z', C.magenta, 'opacity="0.9"'));

  return f;
}

// ===========================================================================
// ÍCONOS DE COMANDOS (para los bloques de programación) — 48x48
// ===========================================================================
export function commandIcons() {
  const f = {};
  const arrow = (rot, col) => g(`rotate(${rot} 24 24)`,
    ln(24, 36, 24, 14, col, 5) +
    poly([[24, 5], [35, 19], [13, 19]], col));

  f['cmd_forward.svg'] = ICON(arrow(0, C.cyan));
  f['cmd_back.svg'] = ICON(arrow(180, C.cyan));
  f['cmd_left.svg'] = ICON(
    pa('M34 40 L34 24 a10 10 0 0 0 -10 -10 L14 14', 'none', `stroke="${C.magenta}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`) +
    poly([[4, 14], [18, 6], [18, 22]], C.magenta));
  f['cmd_right.svg'] = ICON(
    pa('M14 40 L14 24 a10 10 0 0 1 10 -10 L34 14', 'none', `stroke="${C.magenta}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`) +
    poly([[44, 14], [30, 6], [30, 22]], C.magenta));
  f['cmd_jump.svg'] = ICON(
    pa('M7 38 Q24 2 41 38', 'none', `stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 4"`) +
    ci(7, 38, 4.5, C.green) + poly([[41, 38], [33, 30], [45, 28]], C.green));
  f['cmd_grab.svg'] = ICON(
    ci(24, 15, 9, C.yellow) + tx(24, 20, '1', '#7a4b00', 11) +
    pa('M10 42 q14 -14 28 0', 'none', `stroke="${C.yellow}" stroke-width="4.5" stroke-linecap="round"`) +
    ln(24, 26, 24, 34, C.yellow, 3.5, 'stroke-dasharray="2 3"'));
  f['cmd_activate.svg'] = ICON(
    poly([[26, 3], [12, 26], [22, 26], [19, 45], [36, 21], [25, 21]], C.yellow, 'filter="url(#glow)"'));
  f['cmd_wait.svg'] = ICON(ci(24, 24, 18, 'none', `stroke="${C.gray}" stroke-width="4"`) +
    ln(24, 24, 24, 13, C.gray, 4) + ln(24, 24, 32, 28, C.gray, 4));
  f['cmd_if.svg'] = ICON(poly([[24, 4], [44, 24], [24, 44], [4, 24]], C.purple) +
    tx(24, 30, '?', C.white, 22));
  f['cmd_else.svg'] = ICON(poly([[24, 4], [44, 24], [24, 44], [4, 24]], C.purpleDeep) +
    tx(24, 31, ':', C.white, 24));
  f['cmd_repeat.svg'] = ICON(
    pa('M11 24 a13 13 0 1 1 5 10', 'none', `stroke="${C.orange}" stroke-width="5" stroke-linecap="round"`) +
    poly([[6, 12], [20, 12], [11, 25]], C.orange) + tx(30, 30, 'n', C.orange, 15));
  f['cmd_function.svg'] = ICON(rr(4, 12, 40, 24, 5, C.cyanDeep) +
    tx(24, 31, 'f( )', C.white, 16));
  f['cmd_scan.svg'] = ICON(ci(24, 24, 16, 'none', `stroke="${C.green}" stroke-width="3"`) +
    ci(24, 24, 8, 'none', `stroke="${C.green}" stroke-width="2" opacity="0.6"`) +
    ci(24, 24, 3, C.green) + ln(24, 8, 24, 4, C.green, 3) + ln(24, 40, 24, 44, C.green, 3) +
    ln(8, 24, 4, 24, C.green, 3) + ln(40, 24, 44, 24, C.green, 3));
  return f;
}

// ===========================================================================
// INSIGNIAS (128x128)
// ===========================================================================
function badgeBase(col, inner, label) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    pts.push([64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58]);
  }
  const pts2 = pts.map(p => [64 + (p[0] - 64) * 0.86, 64 + (p[1] - 64) * 0.86]);
  return svg(128, 128,
    ci(64, 64, 60, 'url(#bg' + label + ')') +
    poly(pts, '#08111f') +
    poly(pts2, 'none', `stroke="${col}" stroke-width="3.5" opacity="0.95"`) +
    circuits(20, 20, 88, 88, col, 43, 7, 0.2) +
    inner,
    radGrad('bg' + label, [[0, col, 0.3], [1, col, 0]]));
}

export function badgeIcons() {
  const f = {};

  f['badge_first_bug.svg'] = badgeBase(C.magenta,
    g('translate(40 34) scale(1.05)',
      el(24, 27, 13, 15, C.magenta) + ci(24, 12, 7, C.magenta) +
      ci(21, 11, 2, C.yellow) + ci(27, 11, 2, C.yellow) +
      ln(19, 6, 15, 1, C.magenta, 2.5) + ln(29, 6, 33, 1, C.magenta, 2.5) +
      ln(11, 20, 3, 16, C.magDeep, 3) + ln(11, 28, 3, 30, C.magDeep, 3) +
      ln(37, 20, 45, 16, C.magDeep, 3) + ln(37, 28, 45, 30, C.magDeep, 3)) +
    tx(64, 112, 'PRIMER BUG', C.magenta, 11), 'A');

  f['badge_logic.svg'] = badgeBase(C.cyan,
    pa('M64 26 c-20 0 -30 14 -30 26 c0 12 8 20 12 24 l0 8 h36 l0 -8 c4 -4 12 -12 12 -24 c0 -12 -10 -26 -30 -26 z', C.cyan, 'opacity="0.9"') +
    ln(50, 46, 78, 46, C.deep, 3) + ln(50, 56, 78, 56, C.deep, 3) + ln(64, 36, 64, 76, C.deep, 3) +
    tx(64, 116, 'MENTE LOGICA', C.cyan, 10), 'B');

  f['badge_speed.svg'] = badgeBase(C.yellow,
    poly([[74, 22], [44, 66], [62, 66], [52, 106], [86, 56], [66, 56]], C.yellow, 'filter="url(#glow)"') +
    tx(64, 120, 'SPEEDRUNNER', C.yellow, 10), 'C');

  f['badge_team.svg'] = badgeBase(C.green,
    ci(48, 48, 13, C.green) + ci(80, 51, 11, C.greenDeep) +
    pa('M28 88 a20 20 0 0 1 40 0 Z', C.green) + pa('M64 88 a17 17 0 0 1 34 0 Z', C.greenDeep) +
    tx(64, 116, 'COMPANERO', C.green, 11), 'D');

  f['badge_coder.svg'] = badgeBase(C.cyanSoft,
    pa('M50 44 L34 64 L50 84', 'none', `stroke="${C.cyanSoft}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`) +
    pa('M78 44 L94 64 L78 84', 'none', `stroke="${C.cyanSoft}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`) +
    ln(72, 40, 56, 88, C.magenta, 5) +
    tx(64, 116, 'PROGRAMADOR', C.cyanSoft, 10), 'E');

  f['badge_hunter.svg'] = badgeBase(C.orange,
    ci(60, 58, 26, 'none', `stroke="${C.orange}" stroke-width="6"`) +
    ln(79, 77, 98, 96, C.orange, 8) +
    el(60, 58, 9, 11, C.magenta) + ci(56, 55, 2, C.yellow) + ci(64, 55, 2, C.yellow) +
    tx(64, 116, 'BUG HUNTER', C.orange, 11), 'F');

  f['badge_rescue.svg'] = badgeBase(C.cyan,
    g('translate(32 26) scale(1.3)',
      poly([[18, 15], [20.5, 1.5], [31, 10]], FURS.binario.dark) +
      poly([[33, 10], [43.5, 1.5], [46, 15]], FURS.binario.dark) +
      rr(15, 8, 34, 28, 12.5, FURS.binario.dark) +
      rr(16.5, 9, 31, 26, 11.5, FURS.binario.body) +
      el(24.5, 22, 4, 4.6, C.cyan) + el(39.5, 22, 4, 4.6, C.cyan) +
      poly([[30.4, 27], [33.6, 27], [32, 29]], C.magenta)) +
    tx(64, 116, 'RESCATISTA', C.cyan, 11), 'G');

  f['badge_optimizer.svg'] = badgeBase(C.purple,
    pa('M30 90 L50 60 L66 74 L96 34', 'none', `stroke="${C.purple}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"`) +
    poly([[98, 30], [98, 52], [78, 32]], C.purple) +
    tx(64, 114, 'OPTIMIZADOR', C.purple, 11), 'H');

  f['badge_boss.svg'] = badgeBase(C.red,
    rr(34, 40, 60, 46, 20, '#3b1150') +
    ci(52, 62, 9, C.red, 'filter="url(#glow)"') + ci(76, 62, 9, C.red, 'filter="url(#glow)"') +
    ci(52, 62, 3.4, C.void) + ci(76, 62, 3.4, C.void) +
    poly([[38, 44], [30, 20], [52, 38]], '#3b1150') +
    poly([[90, 44], [98, 20], [76, 38]], '#3b1150') +
    pa('M46 76 q18 10 36 0', 'none', `stroke="${C.void}" stroke-width="4"`) +
    tx(64, 106, 'BUG SUPREMO', C.red, 11), 'I');

  return f;
}
