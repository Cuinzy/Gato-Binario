/**
 * levels.js — Datos de las zonas del sistema.
 *
 * MAPA (cada carácter es una casilla de 1x1):
 *   '#' muro            '.' piso
 *   ' ' vacío (no transitable, se ve como abismo de datos)
 *   'G' servidor objetivo
 *   'c' bit (moneda)    '*' estrella      'x' chip       'k' llave
 *   'w' interruptor     'D' puerta bloqueada             'T' terminal
 *   'F' firewall (daña) 'P' portal decorativo
 *
 * La posición inicial se define aparte (start) para poder colocar al gato
 * encima de cualquier casilla.
 */

export const LEVELS = [
  // =========================================================================
  // ZONA 01 — ARRANQUE DEL SISTEMA (secuencias)
  // =========================================================================
  {
    id: 'z1',
    order: 1,
    code: 'ZONA 01',
    name: 'Arranque del sistema',
    theme: 0,
    bg: 'zone1',
    topic: 'Secuencias',
    win: 'server',
    optimal: 12,
    intro: [
      'Sistema en modo de arranque… el Gato Binario despierta dentro del núcleo.',
      'Un programa es una SECUENCIA de instrucciones en orden.',
      'Lleva al gato hasta el servidor y actívalo.',
    ],
    blocks: ['avanzar', 'girarIzquierda', 'girarDerecha', 'recoger', 'activar'],
    structs: [],
    map: [
      '#########',
      '#S.c.c..#',
      '#######.#',
      '#......G#',
      '#########',
    ],
    start: { x: 1, y: 1, dir: 0 },
    enemies: [],
    decor: [{ type: 'terminal', x: 3, y: 3 }],
    dialogs: {
      start: '¡Sistema comprometido! Necesito llegar al servidor. Ordena mis instrucciones.',
      firstBump: 'Ay… choqué. Revisa el orden de la secuencia.',
    },
    hacks: [
      { id: 'z1-min', icon: '⚡', title: 'Código mínimo', desc: 'Completa la zona usando 12 instrucciones o menos.', xp: 50, check: c => c.nodes <= 12 },
      { id: 'z1-turn', icon: '🎯', title: 'Un solo giro', desc: 'Termina la misión usando máximo 1 giro.', xp: 50, check: c => c.turns <= 1 },
      { id: 'z1-all', icon: '💰', title: 'Sin dejar bits', desc: 'Recoge los 2 bits de la zona.', xp: 30, check: c => c.coinsLeft === 0 },
    ],
    debug: {
      title: 'Encuentra el bug',
      lines: ['avanzar();', 'avanzar();', 'recoger();', 'girarDerecha();', 'avanzar();'],
      bugLine: 3,
      explain: 'El giro estaba antes de tiempo: el gato aún debía avanzar por el pasillo.',
      xp: 30,
    },
  },

  // =========================================================================
  // ZONA 02 — LABERINTO DE DATOS (decisiones)
  // =========================================================================
  {
    id: 'z2',
    order: 2,
    code: 'ZONA 02',
    name: 'Laberinto de datos',
    theme: 1,
    bg: 'zone2',
    topic: 'Decisiones',
    win: 'server',
    optimal: 20,
    intro: [
      'Los paquetes de datos vienen mezclados: algunas casillas traen bits y otras no.',
      'Con SI puedes DECIDIR qué hacer en cada casilla.',
      'Consejo: SI (hayMoneda) { recoger } y luego avanzar.',
    ],
    blocks: ['avanzar', 'girarIzquierda', 'girarDerecha', 'recoger', 'activar', 'esperar'],
    structs: ['if', 'repeat'],
    map: [
      '#############',
      '#S.c..c.c...#',
      '###########.#',
      '#..c..c..c..#',
      '#.###########',
      '#G..........#',
      '#############',
    ],
    start: { x: 1, y: 1, dir: 0 },
    enemies: [],
    decor: [{ type: 'terminal', x: 11, y: 5 }, { type: 'portal', x: 6, y: 5 }],
    dialogs: {
      start: 'Este pasillo está lleno de datos sueltos. ¡Decide en cada casilla!',
    },
    hacks: [
      { id: 'z2-if', icon: '🧠', title: 'Piensa antes de actuar', desc: 'Resuelve la zona usando al menos un bloque SI.', xp: 50, check: c => c.usedIf },
      { id: 'z2-min', icon: '⚡', title: 'Solución compacta', desc: 'Termina con 20 instrucciones o menos (usa SI y REPETIR).', xp: 50, check: c => c.nodes <= 20 },
      { id: 'z2-all', icon: '💰', title: 'Cazador de bits', desc: 'Recoge los 6 bits del laberinto.', xp: 40, check: c => c.coinsLeft === 0 },
    ],
    debug: {
      title: 'Depura la condición',
      lines: ['repetir (10) {', '  si (hayMuro()) {', '    recoger();', '  }', '  avanzar();', '}'],
      bugLine: 2,
      explain: 'La condición correcta era hayMoneda(): estábamos preguntando por muros para recoger bits.',
      xp: 30,
    },
  },

  // =========================================================================
  // ZONA 03 — FÁBRICA DE BUGS (repetición)
  // =========================================================================
  {
    id: 'z3',
    order: 3,
    code: 'ZONA 03',
    name: 'Fábrica de Bugs',
    theme: 2,
    bg: 'zone3',
    topic: 'Ciclos',
    win: 'server',
    optimal: 14,
    intro: [
      'La fábrica repite el mismo patrón una y otra vez… y tú también puedes.',
      'En vez de escribir AVANZAR cuatro veces, usa REPETIR 4 { AVANZAR }.',
      'Observa la escalera: el mismo tramo se repite 4 veces.',
      'Aviso: hay un firewall al final del pasillo. No se puede pisar, pero sí SALTAR.',
    ],
    blocks: ['avanzar', 'girarIzquierda', 'girarDerecha', 'saltar', 'recoger', 'activar', 'esperar'],
    structs: ['repeat', 'if'],
    map: [
      '#################',
      '#Sc.#############',
      '###.#############',
      '###.c.###########',
      '#####.###########',
      '#####.c.#########',
      '#######.#########',
      '#######.c.#######',
      '#########.###*###',
      '#########.cGF...#',
      '#################',
    ],
    start: { x: 1, y: 1, dir: 0 },
    // El robot patrulla el pasillo que lleva a la estrella secreta.
    // `every` = cuántas instrucciones del jugador tarda en dar un paso.
    enemies: [
      { type: 'robot', route: [[14, 9], [15, 9]], every: 2 },
    ],
    decor: [{ type: 'terminal', x: 1, y: 9 }],
    dialogs: {
      start: 'Escaleras infinitas… ¡pero el patrón se repite! Usa un ciclo.',
      star: 'La estrella está detrás de un firewall. Un muro no se rodea… se SALTA.',
    },
    hacks: [
      { id: 'z3-loop', icon: '🔁', title: 'Ciclo maestro', desc: 'Resuelve la zona usando al menos un bloque REPETIR.', xp: 50, check: c => c.usedRepeat },
      { id: 'z3-min', icon: '⚡', title: 'Menos de 15', desc: 'Completa con 14 instrucciones o menos.', xp: 50, check: c => c.nodes <= 14 },
      { id: 'z3-star', icon: '⭐', title: 'Salto de fe', desc: 'Consigue la estrella escondida al otro lado del firewall.', xp: 60, check: c => c.starsTaken > 0 },
    ],
    debug: {
      title: 'El ciclo roto',
      lines: ['repetir (4) {', '  avanzar();', '  girarDerecha();', '  avanzar();', '  girarDerecha();', '}'],
      bugLine: 5,
      explain: 'El segundo giro debía ser girarIzquierda(): con dos giros a la derecha el gato daba media vuelta.',
      xp: 30,
    },
  },

  // =========================================================================
  // ZONA 04 — NÚCLEO DEL SISTEMA (funciones)
  // =========================================================================
  {
    id: 'z4',
    order: 4,
    code: 'ZONA 04',
    name: 'Núcleo del Sistema',
    theme: 3,
    bg: 'zone4',
    topic: 'Funciones',
    win: 'switches',
    optimal: 18,
    intro: [
      'El núcleo tiene 4 nodos idénticos que hay que reparar.',
      'Crea una FUNCIÓN con el procedimiento de reparación y úsala 4 veces.',
      'Repara los 4 nodos para restaurar el núcleo.',
    ],
    blocks: ['avanzar', 'girarIzquierda', 'girarDerecha', 'recoger', 'activar', 'esperar'],
    structs: ['repeat', 'if', 'defun'],
    map: [
      '###########',
      '#w...x...w#',
      '#.#######.#',
      '#.#######.#',
      '#.#######.#',
      '#x#######x#',
      '#.#######.#',
      '#.#######.#',
      '#.#######.#',
      '#w...x...w#',
      '###########',
    ],
    start: { x: 1, y: 1, dir: 0 },
    enemies: [],
    decor: [{ type: 'server', x: 5, y: 5, big: true }],
    dialogs: {
      start: 'Cuatro nodos, el mismo procedimiento. ¡Hazlo una vez y reutilízalo!',
    },
    hacks: [
      { id: 'z4-fn', icon: '🧩', title: 'Piensa en funciones', desc: 'Resuelve el núcleo definiendo al menos una FUNCIÓN.', xp: 60, check: c => c.usedDefun },
      { id: 'z4-min', icon: '⚡', title: 'Núcleo eficiente', desc: 'Completa con 18 instrucciones o menos.', xp: 60, check: c => c.nodes <= 18 },
      { id: 'z4-chips', icon: '🔧', title: 'Todas las piezas', desc: 'Recoge los 4 chips del núcleo.', xp: 40, check: c => c.chipsLeft === 0 },
    ],
    debug: {
      title: 'Función incompleta',
      lines: ['funcion reparar() {', '  avanzar();', '  recoger();', '}', 'reparar();', 'reparar();'],
      bugLine: 3,
      explain: 'Faltaba activar() dentro de la función: el gato recogía el chip pero nunca reparaba el nodo.',
      xp: 40,
    },
  },
];

export const getLevel = id => LEVELS.find(l => l.id === id);

// ---------------------------------------------------------------------------
// NODO DEL BOSS (aparece al final del mapa)
// ---------------------------------------------------------------------------
export const BOSS_NODE = {
  id: 'boss',
  order: 5,
  code: 'NÚCLEO PROFUNDO',
  name: 'Bug Supremo',
  bg: 'boss',
  topic: 'Todo junto',
  intro: [
    'Aquí vive lo que corrompió el sistema.',
    'Cuatro fases. Todo el equipo participa.',
  ],
};
