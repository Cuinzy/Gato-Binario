/**
 * world.js — Modelo del escenario y semántica de ejecución.
 *
 * El mundo es una rejilla. El intérprete recorre el árbol del programa y
 * pide al mundo que ejecute acciones simples; el mundo devuelve eventos que
 * el renderizador anima y la interfaz traduce a mensajes.
 */

export const DIRS = [
  { dx: 1, dy: 0, name: 'este' },   // 0 E
  { dx: 0, dy: 1, name: 'sur' },    // 1 S
  { dx: -1, dy: 0, name: 'oeste' }, // 2 W
  { dx: 0, dy: -1, name: 'norte' }, // 3 N
];

const KEYS = {
  '#': 'wall',
  '.': 'floor',
  ' ': 'void',
};

const ITEM_CHARS = { c: 'coin', '*': 'star', x: 'chip', k: 'key' };
const OBJ_CHARS = { G: 'server', w: 'switch', D: 'door', T: 'terminal', F: 'firewall', P: 'portal' };

export class World {
  constructor(level) {
    this.level = level;
    this.w = level.map[0].length;
    this.h = level.map.length;
    this.reset();
  }

  /** Vuelve al estado inicial del nivel. */
  reset() {
    const L = this.level;
    this.tiles = [];
    this.items = new Map();
    this.objects = new Map();

    for (let y = 0; y < this.h; y++) {
      const row = [];
      for (let x = 0; x < this.w; x++) {
        const ch = L.map[y][x];
        if (KEYS[ch]) row.push(KEYS[ch]);
        else row.push('floor'); // cualquier contenido se apoya sobre piso
        if (ITEM_CHARS[ch]) this.items.set(k(x, y), { type: ITEM_CHARS[ch], x, y });
        if (OBJ_CHARS[ch]) this.objects.set(k(x, y), { type: OBJ_CHARS[ch], x, y, on: false });
      }
      this.tiles.push(row);
    }

    this.player = { x: L.start.x, y: L.start.y, dir: L.start.dir ?? 0 };
    this.enemies = (L.enemies || []).map((e, i) => ({
      id: i,
      type: e.type,
      route: e.route,
      every: e.every || 1,
      idx: 0,
      ticks: 0,
      x: e.route[0][0],
      y: e.route[0][1],
    }));

    this.collected = { coin: 0, star: 0, chip: 0, key: 0 };
    this.tick = 0;
    this.finished = false;
    this.failed = false;
  }

  // -------------------------------------------------------------------------
  // CONSULTAS
  // -------------------------------------------------------------------------
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  tileAt(x, y) { return this.inside(x, y) ? this.tiles[y][x] : 'wall'; }

  itemAt(x, y) { return this.items.get(k(x, y)) || null; }

  objectAt(x, y) { return this.objects.get(k(x, y)) || null; }

  enemyAt(x, y) { return this.enemies.find(e => e.x === x && e.y === y) || null; }

  /** ¿Se puede pisar esa casilla? */
  walkable(x, y) {
    const t = this.tileAt(x, y);
    if (t !== 'floor') return false;
    const o = this.objectAt(x, y);
    if (o && o.type === 'door' && !o.on) return false;
    return true;
  }

  /** Casilla justo delante del gato. */
  ahead(steps = 1) {
    const d = DIRS[this.player.dir];
    return { x: this.player.x + d.dx * steps, y: this.player.y + d.dy * steps };
  }

  /** Total de un tipo de ítem que queda en el mapa. */
  remaining(type) {
    let n = 0;
    for (const it of this.items.values()) if (it.type === type) n++;
    return n;
  }

  /** Total inicial de un tipo (para los contadores). */
  totalOf(type) {
    let n = 0;
    for (const row of this.level.map) for (const ch of row) if (ITEM_CHARS[ch] === type) n++;
    return n;
  }

  switchesTotal() {
    let n = 0;
    for (const row of this.level.map) for (const ch of row) if (ch === 'w') n++;
    return n;
  }

  switchesOn() {
    let n = 0;
    for (const o of this.objects.values()) if (o.type === 'switch' && o.on) n++;
    return n;
  }

  // -------------------------------------------------------------------------
  // CONDICIONES (sensores usados por SI)
  // -------------------------------------------------------------------------
  evalCondition(name) {
    const a = this.ahead();
    switch (name) {
      case 'hayMuro': return !this.walkable(a.x, a.y);
      case 'hayMoneda': return this.itemAt(this.player.x, this.player.y)?.type === 'coin';
      case 'hayObjeto': return Boolean(this.itemAt(this.player.x, this.player.y));
      case 'hayEnemigo': return Boolean(this.enemyAt(a.x, a.y));
      case 'hayObstaculo': return !this.walkable(a.x, a.y) || Boolean(this.enemyAt(a.x, a.y)) ||
        this.objectAt(a.x, a.y)?.type === 'firewall';
      case 'hayMeta': return this.objectAt(this.player.x, this.player.y)?.type === 'server';
      default: return false;
    }
  }

  // -------------------------------------------------------------------------
  // ACCIONES
  // -------------------------------------------------------------------------
  /**
   * Ejecuta una acción simple. Devuelve un evento:
   *   { action, ok, type, ... }  type: 'move'|'turn'|'jump'|'pickup'|'activate'|'wait'|'bump'|'hit'|'none'
   */
  perform(action) {
    if (this.finished || this.failed) return { action, ok: false, type: 'none' };
    let ev;
    switch (action) {
      case 'avanzar': ev = this.doMove(); break;
      case 'girarIzquierda': ev = this.doTurn(-1); break;
      case 'girarDerecha': ev = this.doTurn(1); break;
      case 'saltar': ev = this.doJump(); break;
      case 'recoger': ev = this.doPick(); break;
      case 'activar': ev = this.doActivate(); break;
      case 'esperar': ev = { action, ok: true, type: 'wait' }; break;
      default: ev = { action, ok: true, type: 'none' };
    }
    this.tick++;
    if (!ev.ok) return ev;               // ya falló: no movemos enemigos
    const enemyEv = this.tickEnemies();
    return enemyEv || ev;
  }

  doMove() {
    const t = this.ahead();
    if (!this.walkable(t.x, t.y)) {
      this.failed = true;
      const o = this.objectAt(t.x, t.y);
      return {
        action: 'avanzar', ok: false, type: 'bump',
        msg: o?.type === 'door' ? 'Puerta bloqueada: necesitas activarla.' : 'El gato chocó contra un muro.',
        at: t,
      };
    }
    if (this.enemyAt(t.x, t.y)) {
      this.failed = true;
      return { action: 'avanzar', ok: false, type: 'hit', msg: 'Un enemigo bloqueaba el paso.', at: t };
    }
    const from = { x: this.player.x, y: this.player.y };
    this.player.x = t.x; this.player.y = t.y;
    const obj = this.objectAt(t.x, t.y);
    if (obj?.type === 'firewall') {
      this.failed = true;
      return { action: 'avanzar', ok: false, type: 'hit', msg: 'El firewall quemó al gato.', from, at: t };
    }
    return { action: 'avanzar', ok: true, type: 'move', from, at: t };
  }

  doJump() {
    const over = this.ahead(1);
    const t = this.ahead(2);
    if (!this.walkable(t.x, t.y) || this.enemyAt(t.x, t.y)) {
      this.failed = true;
      return { action: 'saltar', ok: false, type: 'bump', msg: 'No hay dónde aterrizar.', at: t };
    }
    const from = { x: this.player.x, y: this.player.y };
    this.player.x = t.x; this.player.y = t.y;
    return { action: 'saltar', ok: true, type: 'jump', from, over, at: t };
  }

  doTurn(delta) {
    this.player.dir = (this.player.dir + delta + 4) % 4;
    return { action: delta > 0 ? 'girarDerecha' : 'girarIzquierda', ok: true, type: 'turn', dir: this.player.dir };
  }

  doPick() {
    const key = k(this.player.x, this.player.y);
    const it = this.items.get(key);
    if (!it) {
      // Recoger en vacío no es un error grave: solo no pasa nada.
      return { action: 'recoger', ok: true, type: 'none', soft: 'Aquí no había nada que recoger.' };
    }
    this.items.delete(key);
    this.collected[it.type] = (this.collected[it.type] || 0) + 1;
    return { action: 'recoger', ok: true, type: 'pickup', item: it, at: { x: it.x, y: it.y } };
  }

  doActivate() {
    const o = this.objectAt(this.player.x, this.player.y);
    if (!o) {
      return { action: 'activar', ok: true, type: 'none', soft: 'No hay nada que activar en esta casilla.' };
    }
    if (o.type === 'server') {
      o.on = true;
      if (this.level.win !== 'switches') this.finished = true;
      return { action: 'activar', ok: true, type: 'activate', obj: o, at: { x: o.x, y: o.y }, win: this.finished };
    }
    if (o.type === 'switch') {
      o.on = true;
      const all = this.switchesOn() === this.switchesTotal();
      if (this.level.win === 'switches' && all) this.finished = true;
      return { action: 'activar', ok: true, type: 'activate', obj: o, at: { x: o.x, y: o.y }, win: this.finished };
    }
    if (o.type === 'door') {
      const hasKey = this.collected.key > 0;
      if (!hasKey) return { action: 'activar', ok: true, type: 'none', soft: 'La puerta pide una llave.' };
      o.on = true;
      return { action: 'activar', ok: true, type: 'activate', obj: o, at: { x: o.x, y: o.y } };
    }
    if (o.type === 'terminal') {
      o.on = true;
      return { action: 'activar', ok: true, type: 'activate', obj: o, at: { x: o.x, y: o.y }, terminal: true };
    }
    return { action: 'activar', ok: true, type: 'none' };
  }

  /** Mueve los enemigos y comprueba si atraparon al gato. */
  tickEnemies() {
    for (const e of this.enemies) {
      e.ticks++;
      if (e.ticks % e.every === 0) {
        e.idx = (e.idx + 1) % e.route.length;
        e.x = e.route[e.idx][0];
        e.y = e.route[e.idx][1];
      }
      if (e.x === this.player.x && e.y === this.player.y) {
        this.failed = true;
        return { action: 'enemigo', ok: false, type: 'hit', msg: 'Un robot patrulla te detectó.', at: { x: e.x, y: e.y } };
      }
    }
    return null;
  }
}

const k = (x, y) => `${x},${y}`;

// ===========================================================================
// INTÉRPRETE
// ===========================================================================
const MAX_STEPS = 3000;

/**
 * Recorre el árbol del programa y produce acciones simples.
 * Es un generador: cada `yield` es { action, path } listo para ejecutar.
 * Lanza un error controlado si detecta un programa desbocado.
 */
export function* runProgram(program, world) {
  const funcs = new Map();
  collectFunctions(program, funcs);
  let steps = 0;

  function* execList(list, path) {
    for (let i = 0; i < list.length; i++) {
      yield* execNode(list[i], [...path, i]);
    }
  }

  function* execNode(node, path) {
    if (++steps > MAX_STEPS) {
      throw new Error('El programa se pasó de vueltas (¿un ciclo demasiado grande?).');
    }
    switch (node.t) {
      case 'cmd':
        yield { action: node.name, path };
        break;
      case 'repeat':
        for (let r = 0; r < node.n; r++) {
          yield* execList(node.body, [...path, 'body']);
          if (world.finished || world.failed) return;
        }
        break;
      case 'if':
        if (world.evalCondition(node.cond)) yield* execList(node.body, [...path, 'body']);
        else if (node.elseBody) yield* execList(node.elseBody, [...path, 'elseBody']);
        break;
      case 'defun':
        break; // las definiciones no ejecutan nada por sí solas
      case 'call': {
        const fn = funcs.get(node.name);
        if (!fn) throw new Error(`La función "${node.name}()" no está definida.`);
        // Se resalta el cuerpo real de la función, esté donde esté declarada.
        yield* execList(fn.node.body, [...fn.path, 'body']);
        break;
      }
    }
  }

  yield* execList(program, []);
}

/** Registra las funciones declaradas junto con su ruta en el árbol. */
function collectFunctions(list, map, path = []) {
  for (let i = 0; i < list.length; i++) {
    const node = list[i];
    const here = [...path, i];
    if (node.t === 'defun') map.set(node.name, { node, path: here });
    if (node.body) collectFunctions(node.body, map, [...here, 'body']);
    if (node.elseBody) collectFunctions(node.elseBody, map, [...here, 'elseBody']);
  }
}
