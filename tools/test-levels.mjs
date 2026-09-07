/**
 * test-levels.mjs — Verifica que cada zona se puede completar y que la
 * solución "modelo" cabe dentro del límite de instrucciones (3 estrellas).
 *
 * Uso: node tools/test-levels.mjs
 */
import { LEVELS } from '../js/game/levels.js';
import { World, runProgram } from '../js/game/world.js';
import { countNodes } from '../js/game/commands.js';

const cmd = n => ({ t: 'cmd', name: n });
const rep = (n, body) => ({ t: 'repeat', n, body });
const iff = (cond, body) => ({ t: 'if', cond, body, elseBody: [] });
const fn = (name, body) => ({ t: 'defun', name, body });
const call = name => ({ t: 'call', name });
const AV = cmd('avanzar'), GD = cmd('girarDerecha'), GI = cmd('girarIzquierda');
const RE = cmd('recoger'), AC = cmd('activar'), ES = cmd('esperar');

// --- Soluciones modelo -----------------------------------------------------
const SOLUTIONS = {
  z1: [AV, AV, RE, AV, AV, RE, AV, AV, GD, AV, AV, AC],

  z2: [
    rep(10, [iff('hayMoneda', [RE]), AV]),
    GD, AV, AV, GD,
    rep(10, [iff('hayMoneda', [RE]), AV]),
    GI, AV, AV, AC,
  ],

  z3: [
    rep(4, [AV, RE, AV, GD, AV, AV, GI]),
    AV, RE, AV, AC,
  ],

  z4: [
    fn('reparar', [AV, AV, AV, AV, RE, AV, AV, AV, AV, AC, GD]),
    rep(4, [call('reparar')]),
  ],
};

// --- Reto secreto de la zona 3: la estrella detrás del robot ---------------
const Z3_STAR = [
  rep(4, [AV, RE, AV, GD, AV, AV, GI]),
  AV, RE, AV, AC,          // llega al servidor y lo activa (fin de nivel)
];

let failures = 0;

for (const L of LEVELS) {
  const program = SOLUTIONS[L.id];
  if (!program) { console.log(`· ${L.id}: sin solución modelo`); continue; }

  const w = new World(L);
  let steps = 0, err = null;
  try {
    for (const s of runProgram(program, w)) {
      const ev = w.perform(s.action);
      steps++;
      if (!ev.ok) { err = `${ev.type}: ${ev.msg} en paso ${steps} (${s.action})`; break; }
      if (w.finished) break;
    }
  } catch (e) { err = e.message; }

  const nodes = countNodes(program);
  const coinsLeft = w.remaining('coin');
  const chipsLeft = w.remaining('chip');
  const ok = w.finished && !err;
  const stars = ok ? 1 + ((coinsLeft + chipsLeft === 0) ? 1 : 0) + (nodes <= L.optimal ? 1 : 0) : 0;

  if (!ok || stars < 3) failures++;
  console.log(
    `${ok ? '✔' : '✘'} ${L.id.padEnd(3)} ${L.name.padEnd(24)} ` +
    `nodos=${String(nodes).padStart(3)}/${L.optimal}  pasos=${String(steps).padStart(3)}  ` +
    `bits restantes=${coinsLeft} chips=${chipsLeft}  estrellas=${stars}` +
    (err ? `\n     ERROR: ${err}` : '')
  );
}

console.log(failures ? `\n${failures} zona(s) con problemas` : '\nTodas las zonas se completan con 3 estrellas');
process.exit(failures ? 1 : 0);
