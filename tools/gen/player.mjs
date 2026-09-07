/**
 * player.mjs — Generador del sprite del Gato Binario y sus animaciones.
 *
 * El gato es un "robo-gato" de vista frontal 3/4: se puede voltear
 * horizontalmente en el canvas para mirar a izquierda o derecha.
 * Lienzo: 64x64.
 */
import { C, FURS, svg, rr, el, ci, poly, ln, g, tx, pa, n, circuits, bits } from './style.mjs';

// ---------------------------------------------------------------------------
// OJOS
// ---------------------------------------------------------------------------
function eye(cx, cy, mode, trim) {
  switch (mode) {
    case 'blink':
      return ln(cx - 4, cy, cx + 4, cy, trim, 2);
    case 'happy':
      return pa(`M${cx - 4.5} ${cy + 2} Q${cx} ${cy - 4.5} ${cx + 4.5} ${cy + 2}`, 'none',
        `stroke="${trim}" stroke-width="2.2" stroke-linecap="round" filter="url(#glow)"`);
    case 'x':
      return ln(cx - 3.6, cy - 3.6, cx + 3.6, cy + 3.6, C.red, 2.4) +
             ln(cx + 3.6, cy - 3.6, cx - 3.6, cy + 3.6, C.red, 2.4);
    case 'dizzy':
      return pa(`M${cx - 4} ${cy} a4,4 0 1,1 4,4 a2.4,2.4 0 1,0 -2.4,-2.4`, 'none',
        `stroke="${C.yellow}" stroke-width="1.6" stroke-linecap="round"`);
    case 'wide':
      return el(cx, cy, 5.6, 6.2, C.void) +
             el(cx, cy, 4.6, 5.2, trim, 'filter="url(#glow)"') +
             ci(cx, cy, 2.6, C.void) +
             ci(cx - 1.6, cy - 2, 1.5, C.white);
    default: // open
      return el(cx, cy, 5, 5.6, C.void) +
             el(cx, cy, 4.1, 4.7, trim, 'filter="url(#glow)"') +
             el(cx + 0.3, cy + 0.4, 1.5, 3.2, C.void) +
             ci(cx - 1.5, cy - 1.9, 1.3, C.white, 'opacity="0.95"');
  }
}

// ---------------------------------------------------------------------------
// COLA — curva controlada por `sway` (-1 .. 1)
// ---------------------------------------------------------------------------
function tail(sway, fur) {
  const bx = 44, by = 46;
  const cx1 = 54 + sway * 3, cy1 = 46 - sway * 2;
  const ex = 56 + sway * 2, ey = 28 - sway * 6;
  const d = `M${bx} ${by} C${cx1} ${cy1} ${ex + 5} ${ey + 8} ${ex} ${ey}`;
  return pa(d, 'none', `stroke="${fur.dark}" stroke-width="6" stroke-linecap="round"`) +
         pa(d, 'none', `stroke="${fur.body}" stroke-width="4" stroke-linecap="round"`) +
         ci(ex, ey, 2.6, fur.trim, 'filter="url(#glow)"');
}

// ---------------------------------------------------------------------------
// CUERPO COMPLETO
// ---------------------------------------------------------------------------
export function cat(opts = {}) {
  const {
    fur = FURS.binario,
    bob = 0,            // desplazamiento vertical del torso
    legL = 0, legR = 0, // desplazamiento vertical de cada pata
    sway = 0,           // balanceo de la cola
    eyes = 'open',
    arms = 'side',      // side | up | front | one
    lean = 0,           // rotación en grados
    ears = 0,           // twitch de orejas
    mouth = 'smile',    // smile | open | flat | fang
    extras = '',        // decoración añadida (chispas, glitch...)
    shadow = true,
    screen = '01',      // texto del panel del pecho
  } = opts;

  const B = bob;

  // --- Patas traseras (al fondo, más oscuras) ---
  const backLegs =
    rr(17.5, 48 + B, 7, 8, 3.2, fur.dark) +
    rr(39.5, 48 + B, 7, 8, 3.2, fur.dark);

  // --- Patas delanteras ---
  const frontLegs =
    rr(21, 49 + B + legL, 9, 8, 3.4, fur.body) +
    rr(20.5, 53.5 + B + legL, 10, 3.5, 1.8, fur.dark) +
    rr(34, 49 + B + legR, 9, 8, 3.4, fur.body) +
    rr(33.5, 53.5 + B + legR, 10, 3.5, 1.8, fur.dark);

  // --- Torso ---
  const torso =
    rr(18, 31 + B, 28, 22, 10, fur.dark) +
    rr(19.5, 32 + B, 25, 20, 9, fur.body) +
    circuits(20, 33 + B, 24, 18, fur.trim, 3, 4, 0.35) +
    rr(25, 36 + B, 14, 12, 3, C.void) +
    rr(26, 37 + B, 12, 10, 2.2, '#0d2233') +
    tx(32, 44.6 + B, screen, fur.trim, 7, 'filter="url(#glow)"');

  // --- Brazos ---
  let armsSvg;
  if (arms === 'up') {
    armsSvg =
      rr(11.5, 26 + B, 6, 13, 3, fur.body, 'transform="rotate(-28 14.5 39)"') +
      rr(46.5, 26 + B, 6, 13, 3, fur.body, 'transform="rotate(28 49.5 39)"');
  } else if (arms === 'front') {
    armsSvg =
      rr(14, 36 + B, 6, 12, 3, fur.body, 'transform="rotate(18 17 42)"') +
      rr(44, 36 + B, 6, 12, 3, fur.body, 'transform="rotate(-18 47 42)"');
  } else if (arms === 'one') {
    armsSvg =
      rr(14, 35 + B, 6, 13, 3, fur.body) +
      rr(46.5, 26 + B, 6, 13, 3, fur.body, 'transform="rotate(28 49.5 39)"');
  } else {
    armsSvg =
      rr(14, 35 + B, 6, 13, 3, fur.body) +
      rr(44, 35 + B, 6, 13, 3, fur.body);
  }

  // --- Orejas ---
  const earsSvg =
    poly([[18, 15 - ears], [20.5, 1.5 - ears * 2], [31, 10]], fur.dark) +
    poly([[20, 13 - ears], [21.6, 5 - ears * 2], [28.5, 10.5]], fur.ear, 'opacity="0.9"') +
    poly([[33, 10], [43.5, 1.5 + ears * 2], [46, 15 + ears]], fur.dark) +
    poly([[35.5, 10.5], [42.4, 5 + ears * 2], [44, 13 + ears]], fur.ear, 'opacity="0.9"');

  // --- Boca ---
  const my = 0.4 * B;
  let mouthSvg;
  if (mouth === 'open') {
    mouthSvg = el(32, 31.5 + my, 3.4, 3, C.magDeep) + el(32, 32.6 + my, 2, 1.4, C.magenta);
  } else if (mouth === 'flat') {
    mouthSvg = ln(29.5, 31 + my, 34.5, 31 + my, C.void, 1.4);
  } else if (mouth === 'fang') {
    mouthSvg = pa(`M28.5 ${29.6 + my} Q32 ${33.4 + my} 35.5 ${29.6 + my}`, 'none',
      `stroke="${C.void}" stroke-width="1.5" stroke-linecap="round"`) +
      poly([[30, 31.6 + my], [31.4, 31.6 + my], [30.7, 33.8 + my]], C.white);
  } else {
    mouthSvg =
      pa(`M29.4 ${29.8 + my} Q31 ${32 + my} 32 ${30.2 + my}`, 'none',
        `stroke="${C.void}" stroke-width="1.3" stroke-linecap="round"`) +
      pa(`M32 ${30.2 + my} Q33 ${32 + my} 34.6 ${29.8 + my}`, 'none',
        `stroke="${C.void}" stroke-width="1.3" stroke-linecap="round"`);
  }

  // --- Cabeza (se mueve un poco menos que el torso) ---
  const head = g(`translate(0 ${n(my)})`,
    earsSvg +
    rr(15, 8, 34, 28, 12.5, fur.dark) +
    rr(16.5, 9, 31, 26, 11.5, fur.body) +
    pa('M20 16 Q32 10 44 16 L44 12 Q32 6.5 20 12 Z', fur.dark, 'opacity="0.6"') +
    ln(32, 9.5, 32, 7.5, fur.trim, 1.2) +
    ci(32, 6.5, 1.9, fur.trim, 'filter="url(#glow)"') +
    eye(24.5, 22, eyes, fur.trim) +
    eye(39.5, 22, eyes, fur.trim) +
    el(32, 29, 6.4, 4.4, fur.dark, 'opacity="0.55"') +
    poly([[30.4, 27], [33.6, 27], [32, 29]], C.magenta) +
    mouthSvg +
    ln(21, 27, 15.5, 25.5, fur.trim, 0.9, 'opacity="0.75"') +
    ln(21, 29.5, 15.5, 30, fur.trim, 0.9, 'opacity="0.75"') +
    ln(43, 27, 48.5, 25.5, fur.trim, 0.9, 'opacity="0.75"') +
    ln(43, 29.5, 48.5, 30, fur.trim, 0.9, 'opacity="0.75"')
  );

  const body =
    (shadow ? el(32, 59.5, 15 - Math.abs(bob) * 0.5, 3, '#000', 'opacity="0.35"') : '') +
    tail(sway, fur) +
    backLegs +
    frontLegs +
    torso +
    armsSvg +
    head +
    extras;

  return svg(64, 64, lean ? g(`rotate(${lean} 32 44)`, body) : body);
}

/** Destello de 8 puntas usado en las animaciones de celebración. */
function spark(x, y, s, col) {
  return poly(
    [[x, y - s], [x + s * 0.32, y - s * 0.32], [x + s, y], [x + s * 0.32, y + s * 0.32],
     [x, y + s], [x - s * 0.32, y + s * 0.32], [x - s, y], [x - s * 0.32, y - s * 0.32]],
    col, 'filter="url(#glow)"');
}

// ---------------------------------------------------------------------------
// CONJUNTO COMPLETO DE ANIMACIONES DEL JUGADOR
// ---------------------------------------------------------------------------
export function playerFrames(fur = FURS.binario, prefix = 'cat') {
  const files = {};

  // IDLE — respiración + parpadeo + cola (6 frames)
  const idle = [
    { bob: 0, sway: 0, eyes: 'open', ears: 0 },
    { bob: -0.6, sway: 0.35, eyes: 'open', ears: 0.3 },
    { bob: -1, sway: 0.6, eyes: 'open', ears: 0 },
    { bob: -0.6, sway: 0.2, eyes: 'blink', ears: 0 },
    { bob: 0, sway: -0.3, eyes: 'open', ears: 0.3 },
    { bob: 0.3, sway: -0.6, eyes: 'open', ears: 0 },
  ];
  idle.forEach((o, i) => { files[`${prefix}_idle_${i + 1}.svg`] = cat({ fur, ...o }); });

  // WALK — ciclo de caminata (6 frames)
  const walk = [
    { bob: -1, legL: 0, legR: 2, sway: 0.8, lean: 2 },
    { bob: 0, legL: -1, legR: 2.5, sway: 0.4, lean: 1 },
    { bob: 0.6, legL: -2, legR: 0, sway: 0, lean: 0 },
    { bob: -1, legL: 2, legR: 0, sway: -0.8, lean: -2 },
    { bob: 0, legL: 2.5, legR: -1, sway: -0.4, lean: -1 },
    { bob: 0.6, legL: 0, legR: -2, sway: 0, lean: 0 },
  ];
  walk.forEach((o, i) => {
    files[`${prefix}_walk_${i + 1}.svg`] = cat({ fur, eyes: 'open', ...o });
  });

  // JUMP — impulso / aire / aterrizaje
  files[`${prefix}_jump_1.svg`] = cat({ fur, bob: 2, legL: -3, legR: -3, arms: 'front', eyes: 'wide', sway: -0.4 });
  files[`${prefix}_jump_2.svg`] = cat({ fur, bob: -4, legL: -4, legR: -4, arms: 'up', eyes: 'wide', sway: 0.9, shadow: false });
  files[`${prefix}_jump_3.svg`] = cat({ fur, bob: -1, legL: 1, legR: 1, arms: 'front', eyes: 'open', sway: 0.3 });

  // HAPPY — celebración (4 frames)
  files[`${prefix}_happy_1.svg`] = cat({ fur, bob: -2, arms: 'up', eyes: 'happy', mouth: 'open', sway: 1, legL: -1, legR: -1, extras: spark(9, 14, 3.4, C.yellow) + spark(55, 18, 2.6, C.cyan) });
  files[`${prefix}_happy_2.svg`] = cat({ fur, bob: -5, arms: 'up', eyes: 'happy', mouth: 'open', sway: -1, legL: -3, legR: -3, shadow: false, extras: spark(11, 10, 2.6, C.magenta) + spark(53, 13, 3.4, C.yellow) + spark(32, 2, 2.2, C.green) });
  files[`${prefix}_happy_3.svg`] = cat({ fur, bob: -2, arms: 'up', eyes: 'happy', mouth: 'open', sway: 1, legL: -1, legR: -1, extras: spark(8, 20, 2.4, C.cyan) + spark(56, 12, 3, C.magenta) });
  files[`${prefix}_happy_4.svg`] = cat({ fur, bob: 0, arms: 'up', eyes: 'happy', sway: 0.4, extras: spark(12, 24, 2, C.yellow) });

  // HURT — daño / bug detectado (3 frames)
  const bar = (y, w, col) => rr(38 - w / 2, y, w, 2, 0, col, 'opacity="0.75"');
  files[`${prefix}_hurt_1.svg`] = cat({ fur, bob: 1, lean: -9, eyes: 'x', mouth: 'open', sway: -1, arms: 'front', extras: bar(20, 22, C.red) + bar(38, 16, C.cyan) });
  files[`${prefix}_hurt_2.svg`] = cat({ fur, bob: 2, lean: 7, eyes: 'dizzy', mouth: 'flat', sway: 1, extras: bar(26, 26, C.magenta) });
  files[`${prefix}_hurt_3.svg`] = cat({ fur, bob: 3, lean: -4, eyes: 'dizzy', mouth: 'flat', legL: 2, legR: 2 });

  // DOWN — derrota
  files[`${prefix}_down_1.svg`] = cat({ fur, bob: 6, lean: -16, eyes: 'x', mouth: 'flat', sway: -0.6, legL: 3, legR: 3 });

  // ACTION — activar terminal / recoger
  files[`${prefix}_action_1.svg`] = cat({ fur, arms: 'one', mouth: 'open', sway: 0.5, screen: '&gt;_' });
  files[`${prefix}_action_2.svg`] = cat({ fur, bob: -1.5, arms: 'up', eyes: 'wide', mouth: 'open', sway: 1, screen: '&gt;_' });

  // Retrato de busto
  files[`${prefix}_portrait.svg`] = portrait(fur);

  return files;
}

/** Retrato de busto 96x96 para HUD y selección de avatar. */
export function portrait(fur = FURS.binario) {
  const body =
    ci(48, 48, 45, C.deep) +
    ci(48, 48, 44, 'none', `stroke="${fur.trim}" stroke-width="2.5" opacity="0.85"`) +
    circuits(10, 10, 76, 76, fur.trim, 11, 8, 0.25) +
    g('translate(9 24) scale(1.22)',
      poly([[18, 15], [20.5, 1.5], [31, 10]], fur.dark) +
      poly([[20, 13], [21.6, 5], [28.5, 10.5]], fur.ear) +
      poly([[33, 10], [43.5, 1.5], [46, 15]], fur.dark) +
      poly([[35.5, 10.5], [42.4, 5], [44, 13]], fur.ear) +
      rr(15, 8, 34, 28, 12.5, fur.dark) +
      rr(16.5, 9, 31, 26, 11.5, fur.body) +
      pa('M20 16 Q32 10 44 16 L44 12 Q32 6.5 20 12 Z', fur.dark, 'opacity="0.6"') +
      ln(32, 9.5, 32, 7.5, fur.trim, 1.2) +
      ci(32, 6.5, 1.9, fur.trim, 'filter="url(#glow)"') +
      eye(24.5, 22, 'open', fur.trim) +
      eye(39.5, 22, 'open', fur.trim) +
      el(32, 29, 6.4, 4.4, fur.dark, 'opacity="0.55"') +
      poly([[30.4, 27], [33.6, 27], [32, 29]], C.magenta) +
      pa('M29.4 29.8 Q31 32 32 30.2', 'none', `stroke="${C.void}" stroke-width="1.3" stroke-linecap="round"`) +
      pa('M32 30.2 Q33 32 34.6 29.8', 'none', `stroke="${C.void}" stroke-width="1.3" stroke-linecap="round"`)
    ) +
    tx(48, 91, bits(10, 5), fur.trim, 7, 'opacity="0.45"');
  return svg(96, 96, body);
}
