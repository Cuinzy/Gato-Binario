/**
 * commands.js — Catálogo de instrucciones de GatoScript y utilidades para
 * trabajar con el "programa" (árbol de nodos) que construyen los jugadores.
 *
 * El MISMO programa se ve como bloques (Ruta Explorador) o como código
 * (Ruta Programador). Por eso el modelo vive aquí, separado de las interfaces.
 *
 * NODOS DEL PROGRAMA
 *   { t:'cmd',    name:'avanzar' }
 *   { t:'repeat', n:4, body:[...] }
 *   { t:'if',     cond:'hayMoneda', body:[...], elseBody:[...] }
 *   { t:'defun',  name:'reparar', body:[...] }
 *   { t:'call',   name:'reparar' }
 */

// ---------------------------------------------------------------------------
// INSTRUCCIONES SIMPLES
// ---------------------------------------------------------------------------
export const COMMANDS = {
  avanzar:        { kind: 'move',   label: 'AVANZAR',      icon: 'cmd_forward',  code: 'avanzar' },
  girarIzquierda: { kind: 'turn',   label: 'GIRAR IZQ.',   icon: 'cmd_left',     code: 'girarIzquierda' },
  girarDerecha:   { kind: 'turn',   label: 'GIRAR DER.',   icon: 'cmd_right',    code: 'girarDerecha' },
  saltar:         { kind: 'action', label: 'SALTAR',       icon: 'cmd_jump',     code: 'saltar' },
  recoger:        { kind: 'action', label: 'RECOGER',      icon: 'cmd_grab',     code: 'recoger' },
  activar:        { kind: 'action', label: 'ACTIVAR',      icon: 'cmd_activate', code: 'activar' },
  esperar:        { kind: 'action', label: 'ESPERAR',      icon: 'cmd_wait',     code: 'esperar' },
};

// ---------------------------------------------------------------------------
// CONDICIONES (sensores)
// ---------------------------------------------------------------------------
export const CONDITIONS = {
  hayMuro:     { label: 'HAY MURO',     desc: 'Verdadero si justo delante hay un muro o el borde.' },
  hayMoneda:   { label: 'HAY BIT',      desc: 'Verdadero si en la casilla actual hay un bit.' },
  hayObstaculo:{ label: 'HAY OBSTÁCULO', desc: 'Verdadero si delante hay un muro, firewall o enemigo.' },
  hayEnemigo:  { label: 'HAY ENEMIGO',  desc: 'Verdadero si delante hay un bug o robot.' },
  hayMeta:     { label: 'HAY META',     desc: 'Verdadero si estás sobre el servidor objetivo.' },
  hayObjeto:   { label: 'HAY OBJETO',   desc: 'Verdadero si en la casilla actual hay algo recogible.' },
};

// ---------------------------------------------------------------------------
// BLOQUES ESTRUCTURALES (los que abren cuerpo)
// ---------------------------------------------------------------------------
export const STRUCTS = {
  repeat: { kind: 'loop',    label: 'REPETIR',  icon: 'cmd_repeat' },
  if:     { kind: 'control', label: 'SI',       icon: 'cmd_if' },
  defun:  { kind: 'func',    label: 'FUNCIÓN',  icon: 'cmd_function' },
  call:   { kind: 'func',    label: 'USAR',     icon: 'cmd_function' },
};

/** Metadatos de presentación de cualquier nodo. */
export function nodeMeta(node) {
  if (node.t === 'cmd') return { ...COMMANDS[node.name], name: node.name };
  if (node.t === 'repeat') return { ...STRUCTS.repeat, name: 'repetir' };
  if (node.t === 'if') return { ...STRUCTS.if, name: 'si' };
  if (node.t === 'defun') return { ...STRUCTS.defun, name: node.name };
  if (node.t === 'call') return { ...STRUCTS.call, name: node.name };
  return { kind: 'move', label: '?', icon: 'cmd_wait', name: '?' };
}

// ---------------------------------------------------------------------------
// CONTEO Y RECORRIDO
// ---------------------------------------------------------------------------
/** Número total de nodos del programa (métrica de "instrucciones usadas"). */
export function countNodes(list) {
  let n = 0;
  for (const node of list) {
    n++;
    if (node.body) n += countNodes(node.body);
    if (node.elseBody) n += countNodes(node.elseBody);
  }
  return n;
}

/** ¿El programa usa algún nodo de cierto tipo? */
export function usesType(list, type) {
  for (const node of list) {
    if (node.t === type) return true;
    if (node.body && usesType(node.body, type)) return true;
    if (node.elseBody && usesType(node.elseBody, type)) return true;
  }
  return false;
}

/** Cuenta cuántas veces aparece un comando simple concreto. */
export function countCmd(list, name) {
  let n = 0;
  for (const node of list) {
    if (node.t === 'cmd' && node.name === name) n++;
    if (node.body) n += countCmd(node.body, name);
    if (node.elseBody) n += countCmd(node.elseBody, name);
  }
  return n;
}

// ---------------------------------------------------------------------------
// RUTAS (accesos por índice dentro del árbol)
// ---------------------------------------------------------------------------
/**
 * Una "ruta" es un array como [2,'body',0] que identifica un nodo.
 * Devuelve el array contenedor y el índice final.
 */
export function resolvePath(program, path) {
  let list = program;
  for (let i = 0; i < path.length - 1; i += 2) {
    const idx = path[i];
    const key = path[i + 1];
    list = list[idx][key];
  }
  return { list, index: path[path.length - 1] };
}

/** Obtiene el nodo señalado por una ruta. */
export function nodeAt(program, path) {
  const { list, index } = resolvePath(program, path);
  return list[index];
}

/** Elimina el nodo de una ruta y lo devuelve. */
export function removeAt(program, path) {
  const { list, index } = resolvePath(program, path);
  return list.splice(index, 1)[0];
}

/** Inserta un nodo en el contenedor descrito por `containerPath` e índice. */
export function insertAt(program, containerPath, index, node) {
  const list = containerAt(program, containerPath);
  list.splice(Math.max(0, Math.min(index, list.length)), 0, node);
}

/** Devuelve el array (contenedor) descrito por una ruta de contenedor. */
export function containerAt(program, containerPath) {
  let list = program;
  for (let i = 0; i < containerPath.length; i += 2) {
    list = list[containerPath[i]][containerPath[i + 1]];
  }
  return list;
}

/** ¿`inner` está dentro de `outer`? (evita soltar un bloque dentro de sí mismo) */
export function isDescendant(outerPath, innerPath) {
  if (innerPath.length <= outerPath.length) return false;
  for (let i = 0; i < outerPath.length; i++) if (outerPath[i] !== innerPath[i]) return false;
  return true;
}

// ---------------------------------------------------------------------------
// SERIALIZACIÓN A CÓDIGO (GatoScript)
// ---------------------------------------------------------------------------
export function toCode(list, indent = 0) {
  const pad = '  '.repeat(indent);
  const out = [];
  for (const node of list) {
    switch (node.t) {
      case 'cmd':
        out.push(`${pad}${node.name}();`);
        break;
      case 'repeat':
        out.push(`${pad}repetir (${node.n}) {`);
        out.push(toCode(node.body, indent + 1));
        out.push(`${pad}}`);
        break;
      case 'if':
        out.push(`${pad}si (${node.cond}()) {`);
        out.push(toCode(node.body, indent + 1));
        if (node.elseBody && node.elseBody.length) {
          out.push(`${pad}} sino {`);
          out.push(toCode(node.elseBody, indent + 1));
        }
        out.push(`${pad}}`);
        break;
      case 'defun':
        out.push(`${pad}funcion ${node.name}() {`);
        out.push(toCode(node.body, indent + 1));
        out.push(`${pad}}`);
        break;
      case 'call':
        out.push(`${pad}${node.name}();`);
        break;
    }
  }
  return out.filter(l => l !== '').join('\n');
}

// ---------------------------------------------------------------------------
// PARSER DE CÓDIGO -> ÁRBOL
// ---------------------------------------------------------------------------
/**
 * Analiza GatoScript y devuelve { program, error }.
 * Sintaxis tolerante: acepta con o sin `;`, mayúsculas/minúsculas y acentos.
 */
export function parseCode(src, knownFunctions = []) {
  const tokens = tokenize(src);
  let i = 0;
  const funcs = new Set(knownFunctions);

  function fail(msg, tok) {
    const line = tok ? tok.line : (tokens[tokens.length - 1]?.line ?? 1);
    throw new Error(`Línea ${line}: ${msg}`);
  }

  function parseBlock(stopAtBrace) {
    const list = [];
    while (i < tokens.length) {
      const tok = tokens[i];
      if (tok.v === '}') {
        if (stopAtBrace) return list;
        fail('Hay una llave "}" de más', tok);
      }
      list.push(parseStatement());
    }
    if (stopAtBrace) fail('Falta cerrar una llave "}"');
    return list;
  }

  function expect(val, msg) {
    const tok = tokens[i];
    if (!tok || tok.v !== val) fail(msg || `Se esperaba "${val}"`, tok);
    i++;
    return tok;
  }

  function parseStatement() {
    const tok = tokens[i];
    const word = normalize(tok.v);

    // repetir (n) { ... }
    if (word === 'repetir') {
      i++;
      expect('(', 'Después de "repetir" se espera "(" con el número de veces');
      const numTok = tokens[i];
      const n = parseInt(numTok?.v, 10);
      if (!Number.isFinite(n) || n < 1 || n > 200) fail('El número de repeticiones debe estar entre 1 y 200', numTok);
      i++;
      expect(')');
      expect('{', 'Falta "{" después de repetir(...)');
      const body = parseBlock(true);
      expect('}');
      return { t: 'repeat', n, body };
    }

    // si (cond) { ... } sino { ... }
    if (word === 'si') {
      i++;
      expect('(', 'Después de "si" se espera "(" con una condición');
      const condTok = tokens[i];
      const cond = resolveCond(condTok?.v);
      if (!cond) fail(`Condición desconocida: "${condTok?.v}". Usa ${Object.keys(CONDITIONS).join(', ')}`, condTok);
      i++;
      if (tokens[i]?.v === '(') { i++; expect(')'); }
      expect(')');
      expect('{', 'Falta "{" después de si(...)');
      const body = parseBlock(true);
      expect('}');
      let elseBody = [];
      if (tokens[i] && normalize(tokens[i].v) === 'sino') {
        i++;
        expect('{', 'Falta "{" después de sino');
        elseBody = parseBlock(true);
        expect('}');
      }
      return { t: 'if', cond, body, elseBody };
    }

    // funcion nombre() { ... }
    if (word === 'funcion') {
      i++;
      const nameTok = tokens[i];
      if (!nameTok || !/^[a-zA-ZáéíóúñÁÉÍÓÚÑ_][\w]*$/.test(nameTok.v)) fail('La función necesita un nombre', nameTok);
      const name = nameTok.v;
      i++;
      if (tokens[i]?.v === '(') { i++; expect(')'); }
      expect('{', 'Falta "{" para el cuerpo de la función');
      const body = parseBlock(true);
      expect('}');
      funcs.add(name);
      return { t: 'defun', name, body };
    }

    // llamada / comando simple
    if (/^[a-zA-ZáéíóúñÁÉÍÓÚÑ_][\w]*$/.test(tok.v)) {
      const cmd = resolveCmd(tok.v);
      i++;
      if (tokens[i]?.v === '(') { i++; expect(')'); }
      if (tokens[i]?.v === ';') i++;
      if (cmd) return { t: 'cmd', name: cmd };
      if (funcs.has(tok.v)) return { t: 'call', name: tok.v };
      fail(`No conozco la instrucción "${tok.v}()". Revisa la referencia rápida.`, tok);
    }

    fail(`No entiendo "${tok.v}"`, tok);
  }

  try {
    const program = parseBlock(false);
    return { program, error: null };
  } catch (e) {
    return { program: null, error: e.message };
  }
}

function tokenize(src) {
  const out = [];
  let line = 1;
  const re = /\s+|\/\/[^\n]*|[a-zA-ZáéíóúñÁÉÍÓÚÑ_][\w]*|\d+|[(){};]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const v = m[0];
    if (/^\s+$/.test(v)) { line += (v.match(/\n/g) || []).length; continue; }
    if (v.startsWith('//')) continue;
    if (v === ';') continue;
    out.push({ v, line });
  }
  return out;
}

/** Quita acentos y pasa a minúsculas para comparar palabras clave. */
function normalize(s = '') {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function resolveCmd(word) {
  const w = normalize(word);
  for (const key of Object.keys(COMMANDS)) if (normalize(key) === w) return key;
  const alias = { adelante: 'avanzar', avanza: 'avanzar', izquierda: 'girarIzquierda', derecha: 'girarDerecha', salta: 'saltar', recoge: 'recoger', activa: 'activar', espera: 'esperar' };
  return alias[w] || null;
}

function resolveCond(word) {
  if (!word) return null;
  const w = normalize(word);
  for (const key of Object.keys(CONDITIONS)) if (normalize(key) === w) return key;
  return null;
}

/** Nombres de funciones declaradas en un programa. */
export function declaredFunctions(list) {
  const names = [];
  for (const node of list) {
    if (node.t === 'defun') names.push(node.name);
    if (node.body) names.push(...declaredFunctions(node.body));
  }
  return names;
}
