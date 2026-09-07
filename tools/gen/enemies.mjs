/**
 * enemies.mjs — Bugs, robots patrulla, glitches, virus y el Bug Supremo.
 * Enemigos normales: 64x64. Boss: 192x192.
 */
import { C, svg, rr, el, ci, poly, ln, g, tx, pa, n, circuits, mulberry, radGrad, linGrad } from './style.mjs';

// ===========================================================================
// BUG — criatura digital tipo larva/araña
// ===========================================================================
export function bug(opts = {}) {
  const {
    body = C.magenta, dark = C.magDeep, eyeCol = C.yellow,
    bob = 0, legPhase = 0, eyes = 'open', angry = false, glitch = 0,
  } = opts;

  const B = bob;
  let legs = '';
  for (let i = 0; i < 3; i++) {
    const px = 20 + i * 8;
    const off = Math.sin(legPhase + i * 1.1) * 2.5;
    // izquierda
    legs += pa(`M${px} ${40 + B} L${px - 8} ${44 + B + off} L${px - 11} ${52 + B}`, 'none',
      `stroke="${dark}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`);
    // derecha
    legs += pa(`M${64 - px} ${40 + B} L${72 - px} ${44 + B - off} L${75 - px} ${52 + B}`, 'none',
      `stroke="${dark}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`);
  }

  const eyeSvg = eyes === 'x'
    ? ln(23, 26 + B, 29, 32 + B, C.void, 2.2) + ln(29, 26 + B, 23, 32 + B, C.void, 2.2) +
      ln(35, 26 + B, 41, 32 + B, C.void, 2.2) + ln(41, 26 + B, 35, 32 + B, C.void, 2.2)
    : ci(26, 29 + B, 5, C.void) + ci(26, 29 + B, 3.8, eyeCol, 'filter="url(#glow)"') +
      el(26, 29 + B, 1.4, 2.8, C.void) +
      ci(38, 29 + B, 5, C.void) + ci(38, 29 + B, 3.8, eyeCol, 'filter="url(#glow)"') +
      el(38, 29 + B, 1.4, 2.8, C.void) +
      ci(32, 20 + B, 3, C.void) + ci(32, 20 + B, 2.1, C.red, 'filter="url(#glow)"');

  const brow = angry
    ? ln(20.5, 23 + B, 30, 26 + B, C.void, 2.4) + ln(43.5, 23 + B, 34, 26 + B, C.void, 2.4)
    : '';

  const glitchBars = glitch
    ? rr(6, 22 + B, 52, 2.5, 0, C.cyan, 'opacity="0.7"') + rr(12, 36 + B, 40, 2, 0, C.green, 'opacity="0.6"')
    : '';

  const body_ =
    el(32, 59, 16, 3, '#000', 'opacity="0.35"') +
    legs +
    // antenas
    pa(`M24 ${18 + B} Q19 ${8 + B} 14 ${7 + B}`, 'none', `stroke="${dark}" stroke-width="2" stroke-linecap="round"`) +
    ci(14, 7 + B, 2.4, C.cyan, 'filter="url(#glow)"') +
    pa(`M40 ${18 + B} Q45 ${8 + B} 50 ${7 + B}`, 'none', `stroke="${dark}" stroke-width="2" stroke-linecap="round"`) +
    ci(50, 7 + B, 2.4, C.cyan, 'filter="url(#glow)"') +
    // caparazón
    rr(12, 15 + B, 40, 34, 15, dark) +
    rr(14, 16.5 + B, 36, 30, 13, body) +
    circuits(16, 19 + B, 32, 24, C.void, 21, 5, 0.4) +
    // segmentos
    pa(`M15 ${38 + B} Q32 ${44 + B} 49 ${38 + B}`, 'none', `stroke="${dark}" stroke-width="2" opacity="0.7"`) +
    pa(`M17 ${43 + B} Q32 ${48 + B} 47 ${43 + B}`, 'none', `stroke="${dark}" stroke-width="2" opacity="0.5"`) +
    eyeSvg + brow +
    // boca dentada
    pa(`M25 ${39 + B} l3 3 l3 -3 l3 3 l3 -3`, 'none', `stroke="${C.void}" stroke-width="1.6" stroke-linejoin="round"`) +
    glitchBars;

  return svg(64, 64, body_);
}

// ===========================================================================
// ROBOT PATRULLA — dron con ojo ciclope y orugas
// ===========================================================================
export function robot(opts = {}) {
  const { bob = 0, eyeX = 0, tread = 0, alert = false, eyes = 'open' } = opts;
  const B = bob;
  const accent = alert ? C.red : C.cyan;

  let treads = '';
  for (let i = 0; i < 5; i++) {
    const x = 15 + ((i * 7 + tread * 7) % 35);
    treads += rr(x, 51, 3, 6, 1, C.line);
  }

  const eyeSvg = eyes === 'x'
    ? ln(27, 24, 37, 32, C.red, 2.6) + ln(37, 24, 27, 32, C.red, 2.6)
    : rr(22, 22 + B, 20, 12, 6, C.void) +
      ci(32 + eyeX, 28 + B, 4.6, accent, 'filter="url(#glow)"') +
      ci(32 + eyeX, 28 + B, 2.2, C.white, 'opacity="0.9"') +
      rr(22, 22 + B, 20, 4, 2, C.white, 'opacity="0.12"');

  const body_ =
    el(32, 59.5, 16, 3, '#000', 'opacity="0.35"') +
    // orugas
    rr(12, 48, 40, 12, 5, C.deep) +
    rr(13.5, 49.5, 37, 9, 4, C.panelUp) +
    treads +
    ci(19, 54, 3.4, C.line) + ci(45, 54, 3.4, C.line) +
    // torso
    rr(14, 18 + B, 36, 30, 8, C.deep) +
    rr(15.5, 19.5 + B, 33, 27, 7, C.panel) +
    circuits(18, 22 + B, 28, 22, accent, 33, 5, 0.35) +
    // hombros
    rr(8, 24 + B, 8, 16, 4, C.panelUp) +
    rr(48, 24 + B, 8, 16, 4, C.panelUp) +
    // visor
    eyeSvg +
    // panel inferior
    rr(24, 37 + B, 16, 8, 2, C.void) +
    tx(32, 43.5 + B, '10', accent, 6) +
    // antena
    ln(32, 18 + B, 32, 10 + B, C.line, 2) +
    ci(32, 8 + B, 2.6, alert ? C.red : C.green, 'filter="url(#glow)"');

  return svg(64, 64, body_);
}

// ===========================================================================
// GLITCH — bloque de datos corrupto
// ===========================================================================
export function glitch(seed = 1) {
  const rnd = mulberry(seed);
  let frag = '';
  for (let i = 0; i < 14; i++) {
    const x = 10 + rnd() * 40, y = 10 + rnd() * 40;
    const w = 4 + rnd() * 14, h = 3 + rnd() * 7;
    const col = [C.magenta, C.cyan, C.green, C.purple, C.red][Math.floor(rnd() * 5)];
    frag += rr(x, y, w, h, 0.5, col, `opacity="${n(0.4 + rnd() * 0.6)}"`);
  }
  const body_ =
    rr(10, 10, 44, 44, 4, C.void, 'opacity="0.85"') +
    frag +
    rr(10, 10, 44, 44, 4, 'none', `stroke="${C.magenta}" stroke-width="1.6" opacity="0.8"`) +
    tx(32, 36, '?!', C.white, 16, 'opacity="0.9"');
  return svg(64, 64, body_);
}

// ===========================================================================
// VIRUS — esfera con pinchos
// ===========================================================================
export function virus(opts = {}) {
  const { rot = 0, col = C.purple, dark = C.purpleDeep } = opts;
  let spikes = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + rot;
    const x1 = 32 + Math.cos(a) * 15, y1 = 32 + Math.sin(a) * 15;
    const x2 = 32 + Math.cos(a) * 25, y2 = 32 + Math.sin(a) * 25;
    spikes += ln(x1, y1, x2, y2, dark, 3.4);
    spikes += ci(x2, y2, 2.6, col);
  }
  const body_ =
    spikes +
    ci(32, 32, 16, dark) +
    ci(32, 32, 13.5, col) +
    circuits(22, 22, 20, 20, C.void, 7, 4, 0.5) +
    ci(27, 30, 3.4, C.void) + ci(27, 30, 2.4, C.yellow) +
    ci(38, 30, 3.4, C.void) + ci(38, 30, 2.4, C.yellow) +
    pa('M27 38 Q32 42 38 38', 'none', `stroke="${C.void}" stroke-width="2" stroke-linecap="round"`);
  return svg(64, 64, body_);
}

// ===========================================================================
// BOSS — BUG SUPREMO (192x192)
// ===========================================================================
export function boss(opts = {}) {
  const {
    phase = 1,          // 1..4 (cambia el color según se debilita)
    bob = 0,
    mouth = 'closed',   // closed | open | roar
    eyes = 'open',      // open | angry | hurt | dead
    tentacle = 0,
    aura = true,
  } = opts;

  const palettes = [
    { body: '#3b1150', dark: '#1e0730', trim: C.magenta, eye: C.red },
    { body: '#4a1230', dark: '#280a1c', trim: C.red, eye: C.orange },
    { body: '#3a2a08', dark: '#1f1604', trim: C.orange, eye: C.yellow },
    { body: '#1a2b3c', dark: '#0c1620', trim: C.cyan, eye: C.cyanSoft },
  ];
  const P = palettes[Math.min(3, phase - 1)];
  const B = bob;

  // Tentáculos de datos
  let tents = '';
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const idx = i % 3;
    const bx = 96 + side * (34 + idx * 14);
    const by = 118 + idx * 6;
    const wob = Math.sin(tentacle + i) * 14;
    const d = `M${bx} ${by + B} Q${bx + side * 26 + wob} ${by + 24} ${bx + side * 18 + wob} ${by + 54}`;
    tents += pa(d, 'none', `stroke="${P.dark}" stroke-width="11" stroke-linecap="round"`);
    tents += pa(d, 'none', `stroke="${P.body}" stroke-width="7" stroke-linecap="round"`);
    tents += ci(bx + side * 18 + wob, by + 54, 4.5, P.trim, 'filter="url(#glow)"');
  }

  // Ojos secundarios
  let minorEyes = '';
  const spots = [[62, 66], [130, 66], [52, 92], [140, 92]];
  spots.forEach(([x, y], i) => {
    const r = 7 - (i % 2);
    minorEyes += ci(x, y + B, r + 1.6, C.void);
    minorEyes += ci(x, y + B, r, eyes === 'dead' ? C.gray : P.eye, 'filter="url(#glow)"');
    if (eyes !== 'dead') minorEyes += el(x, y + B, r * 0.35, r * 0.75, C.void);
  });

  // Ojos principales
  let mainEyes;
  if (eyes === 'dead') {
    mainEyes =
      ln(74, 96 + B, 90, 112 + B, C.gray, 4) + ln(90, 96 + B, 74, 112 + B, C.gray, 4) +
      ln(102, 96 + B, 118, 112 + B, C.gray, 4) + ln(118, 96 + B, 102, 112 + B, C.gray, 4);
  } else {
    const pupilY = 104 + B + (eyes === 'angry' ? 1.5 : 0);
    mainEyes =
      el(82, 104 + B, 15, 16, C.void) + el(82, 104 + B, 12.5, 13.5, P.eye, 'filter="url(#glowBig)"') +
      el(82, pupilY, 4.5, 9, C.void) + ci(77, 99 + B, 3.4, C.white, 'opacity="0.85"') +
      el(110, 104 + B, 15, 16, C.void) + el(110, 104 + B, 12.5, 13.5, P.eye, 'filter="url(#glowBig)"') +
      el(110, pupilY, 4.5, 9, C.void) + ci(105, 99 + B, 3.4, C.white, 'opacity="0.85"');
    if (eyes === 'angry') {
      mainEyes += poly([[64, 88 + B], [98, 98 + B], [98, 92 + B], [66, 82 + B]], P.dark);
      mainEyes += poly([[128, 88 + B], [94, 98 + B], [94, 92 + B], [126, 82 + B]], P.dark);
    }
  }

  // Boca
  let mouthSvg;
  if (mouth === 'roar') {
    mouthSvg =
      el(96, 137 + B, 30, 22, C.void) +
      el(96, 137 + B, 26, 18, '#2a0512') +
      poly([[72, 126 + B], [78, 138 + B], [84, 126 + B], [90, 138 + B], [96, 126 + B],
            [102, 138 + B], [108, 126 + B], [114, 138 + B], [120, 126 + B]], C.white) +
      poly([[74, 150 + B], [80, 140 + B], [86, 150 + B], [92, 140 + B], [98, 150 + B],
            [104, 140 + B], [110, 150 + B], [116, 140 + B], [118, 150 + B]], C.white);
  } else if (mouth === 'open') {
    mouthSvg = el(96, 136 + B, 22, 13, C.void) + el(96, 137 + B, 18, 9, '#2a0512') +
      poly([[80, 128 + B], [86, 137 + B], [92, 128 + B], [98, 137 + B], [104, 128 + B], [110, 137 + B]], C.white);
  } else {
    mouthSvg = pa(`M70 ${134 + B} Q96 ${148 + B} 122 ${134 + B}`, 'none',
      `stroke="${C.void}" stroke-width="4.5" stroke-linecap="round"`) +
      poly([[80, 137 + B], [86, 137 + B], [83, 145 + B]], C.white) +
      poly([[106, 137 + B], [112, 137 + B], [109, 145 + B]], C.white);
  }

  const body_ =
    (aura ? ci(96, 106, 86, 'url(#bossAura)') : '') +
    el(96, 178, 60, 9, '#000', 'opacity="0.4"') +
    tents +
    // cuernos
    poly([[52, 66 + B], [40, 20 + B], [72, 50 + B]], P.dark) +
    poly([[56, 62 + B], [47, 32 + B], [66, 52 + B]], P.trim, 'opacity="0.55"') +
    poly([[140, 66 + B], [152, 20 + B], [120, 50 + B]], P.dark) +
    poly([[136, 62 + B], [145, 32 + B], [126, 52 + B]], P.trim, 'opacity="0.55"') +
    // masa principal
    rr(30, 48 + B, 132, 108, 46, P.dark) +
    rr(36, 53 + B, 120, 98, 42, P.body) +
    circuits(44, 60 + B, 104, 84, P.trim, 91, 12, 0.3) +
    // placas
    pa(`M40 ${118 + B} Q96 ${136 + B} 152 ${118 + B}`, 'none', `stroke="${P.dark}" stroke-width="3.5" opacity="0.65"`) +
    pa(`M46 ${72 + B} Q96 ${56 + B} 146 ${72 + B}`, 'none', `stroke="${P.dark}" stroke-width="3.5" opacity="0.5"`) +
    minorEyes +
    mainEyes +
    mouthSvg +
    // "corona" de datos
    tx(96, 44 + B, '01001', P.trim, 13, 'opacity="0.75" filter="url(#glow)"');

  const defs = radGrad('bossAura', [[0, P.trim, 0.35], [0.6, P.trim, 0.1], [1, P.trim, 0]]);
  return svg(192, 192, body_, defs);
}

// ===========================================================================
// CONJUNTOS DE FRAMES
// ===========================================================================
export function enemyFrames() {
  const files = {};

  // --- Bug rosado (básico) ---
  for (let i = 0; i < 4; i++) {
    files[`bug_idle_${i + 1}.svg`] = bug({ bob: [0, -1.5, -2, -1][i], legPhase: i * 1.5 });
  }
  files['bug_angry_1.svg'] = bug({ bob: -2, legPhase: 0.5, angry: true, eyeCol: C.red, glitch: 1 });
  files['bug_angry_2.svg'] = bug({ bob: 0, legPhase: 2.5, angry: true, eyeCol: C.orange, glitch: 1 });
  files['bug_hurt_1.svg'] = bug({ bob: 2, eyes: 'x', legPhase: 1, glitch: 1 });

  // --- Bug verde (variante "syntax error") ---
  for (let i = 0; i < 4; i++) {
    files[`bug_green_idle_${i + 1}.svg`] = bug({
      body: C.greenDeep, dark: '#075c33', eyeCol: C.green,
      bob: [0, -1.5, -2, -1][i], legPhase: i * 1.5 + 0.7,
    });
  }

  // --- Robot patrulla ---
  for (let i = 0; i < 4; i++) {
    files[`robot_idle_${i + 1}.svg`] = robot({ bob: [0, -0.8, -1.2, -0.5][i], eyeX: [-2, 0, 2, 0][i], tread: 0 });
  }
  for (let i = 0; i < 4; i++) {
    files[`robot_move_${i + 1}.svg`] = robot({ bob: [-0.5, 0, -0.5, 0][i], eyeX: 1, tread: i / 4 });
  }
  files['robot_alert_1.svg'] = robot({ bob: -1, alert: true, eyeX: 0 });
  files['robot_alert_2.svg'] = robot({ bob: 0.5, alert: true, eyeX: 0 });
  files['robot_hurt_1.svg'] = robot({ bob: 2, eyes: 'x', alert: true });

  // --- Glitch ---
  for (let i = 0; i < 4; i++) files[`glitch_${i + 1}.svg`] = glitch(i + 3);

  // --- Virus ---
  for (let i = 0; i < 4; i++) files[`virus_${i + 1}.svg`] = virus({ rot: (i / 4) * 0.63 });

  return files;
}

export function bossFrames() {
  const files = {};
  for (let p = 1; p <= 4; p++) {
    files[`boss_idle_p${p}_1.svg`] = boss({ phase: p, bob: 0, tentacle: 0 });
    files[`boss_idle_p${p}_2.svg`] = boss({ phase: p, bob: -3, tentacle: 1.2 });
    files[`boss_idle_p${p}_3.svg`] = boss({ phase: p, bob: -4, tentacle: 2.4 });
    files[`boss_idle_p${p}_4.svg`] = boss({ phase: p, bob: -1, tentacle: 3.6 });
  }
  files['boss_attack_1.svg'] = boss({ phase: 1, bob: -6, mouth: 'roar', eyes: 'angry', tentacle: 2 });
  files['boss_attack_2.svg'] = boss({ phase: 1, bob: 2, mouth: 'open', eyes: 'angry', tentacle: 4 });
  files['boss_hurt_1.svg'] = boss({ phase: 2, bob: 4, mouth: 'open', eyes: 'hurt', tentacle: 5 });
  files['boss_hurt_2.svg'] = boss({ phase: 3, bob: 3, mouth: 'roar', eyes: 'angry', tentacle: 1 });
  files['boss_defeated_1.svg'] = boss({ phase: 4, bob: 8, mouth: 'open', eyes: 'dead', tentacle: 0, aura: false });
  return files;
}
