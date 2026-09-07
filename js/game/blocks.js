/**
 * blocks.js — Ruta EXPLORADOR: construir el programa con bloques.
 *
 * Se puede añadir un bloque de dos formas:
 *   · haciendo clic en la paleta (se añade al final)  → ideal en proyector/tablet
 *   · arrastrándolo hasta la secuencia o dentro de un bloque contenedor
 * Los bloques ya colocados se reordenan arrastrándolos.
 */
import { el, $, $$ } from '../core/utils.js';
import { ICON } from '../core/assets.js';
import { sfx } from '../core/audio.js';
import {
  COMMANDS, CONDITIONS, STRUCTS, nodeMeta, countNodes,
  containerAt, removeAt, isDescendant, declaredFunctions,
} from './commands.js';

export class BlockEditor {
  /**
   * @param {object} o - { palette, sequence, count, onChange }
   */
  constructor(o) {
    this.paletteEl = o.palette;
    this.seqEl = o.sequence;
    this.countEl = o.count;
    this.onChange = o.onChange || (() => {});
    this.program = [];
    this.history = [];
    this.level = null;
    this.locked = false;

    this.seqEl.addEventListener('dragover', e => this.onDragOver(e));
    this.seqEl.addEventListener('drop', e => this.onDrop(e));
    this.seqEl.addEventListener('dragleave', e => {
      if (e.target === this.seqEl) this.seqEl.classList.remove('drop-hover');
    });
  }

  // -------------------------------------------------------------------------
  // CONFIGURACIÓN
  // -------------------------------------------------------------------------
  setLevel(level) {
    this.level = level;
    this.program = [];
    this.history = [];
    this.renderPalette();
    this.render();
  }

  setProgram(program) {
    this.pushHistory();
    this.program = program;
    this.render();
    this.changed();
  }

  getProgram() { return this.program; }

  setLocked(v) {
    this.locked = v;
    this.seqEl.classList.toggle('locked', v);
  }

  pushHistory() {
    this.history.push(JSON.stringify(this.program));
    if (this.history.length > 40) this.history.shift();
  }

  undo() {
    if (!this.history.length) return;
    this.program = JSON.parse(this.history.pop());
    this.render();
    this.changed();
  }

  clear() {
    this.pushHistory();
    this.program = [];
    this.render();
    this.changed();
  }

  changed() {
    if (this.countEl) this.countEl.textContent = countNodes(this.program);
    this.onChange(this.program);
  }

  // -------------------------------------------------------------------------
  // PALETA
  // -------------------------------------------------------------------------
  renderPalette() {
    const p = this.paletteEl;
    p.innerHTML = '';
    const names = this.level?.blocks || Object.keys(COMMANDS);

    for (const name of names) {
      const c = COMMANDS[name];
      if (!c) continue;
      p.append(this.paletteChip(c.kind, c.icon, c.label, () => ({ t: 'cmd', name })));
    }

    for (const s of this.level?.structs || []) {
      if (s === 'repeat') {
        p.append(this.paletteChip('loop', STRUCTS.repeat.icon, 'REPETIR n', () => ({ t: 'repeat', n: 4, body: [] })));
      }
      if (s === 'if') {
        p.append(this.paletteChip('control', STRUCTS.if.icon, 'SI …', () => ({ t: 'if', cond: 'hayMoneda', body: [], elseBody: [] })));
      }
      if (s === 'defun') {
        p.append(this.paletteChip('func', STRUCTS.defun.icon, 'FUNCIÓN', () => ({ t: 'defun', name: 'reparar', body: [] })));
        p.append(this.paletteChip('func', STRUCTS.call.icon, 'USAR FUNCIÓN', () => {
          const fns = declaredFunctions(this.program);
          return { t: 'call', name: fns[0] || 'reparar' };
        }));
      }
    }
  }

  paletteChip(kind, icon, label, make) {
    const node = el('div', {
      class: 'block',
      draggable: 'true',
      dataset: { kind },
      title: 'Clic para añadir · arrastra para colocar',
    },
      el('img', { src: ICON(icon), alt: '' }),
      el('span', { text: label })
    );
    node.addEventListener('click', () => {
      if (this.locked) return;
      this.pushHistory();
      this.program.push(make());
      sfx('click');
      this.render();
      this.changed();
    });
    node.addEventListener('dragstart', e => {
      if (this.locked) return e.preventDefault();
      this._dragMake = make;
      this._dragFrom = null;
      e.dataTransfer.setData('text/plain', 'new');
      e.dataTransfer.effectAllowed = 'copy';
      node.classList.add('dragging');
    });
    node.addEventListener('dragend', () => node.classList.remove('dragging'));
    return node;
  }

  // -------------------------------------------------------------------------
  // SECUENCIA
  // -------------------------------------------------------------------------
  render() {
    const scroll = this.seqEl.scrollTop;
    this.seqEl.innerHTML = '';
    this.renderList(this.program, [], this.seqEl, 0);
    this.seqEl.scrollTop = scroll;
    if (this.countEl) this.countEl.textContent = countNodes(this.program);
  }

  renderList(list, path, host, depth) {
    list.forEach((node, i) => {
      const nodePath = [...path, i];
      switch (node.t) {
        case 'cmd':
        case 'call':
          host.append(this.simpleRow(node, nodePath, depth));
          break;
        case 'repeat':
          host.append(this.repeatRow(node, nodePath, depth));
          break;
        case 'if':
          host.append(this.ifRow(node, nodePath, depth));
          break;
        case 'defun':
          host.append(this.defunRow(node, nodePath, depth));
          break;
      }
    });
  }

  rowBase(node, path, depth, extraClass = '') {
    const meta = nodeMeta(node);
    const row = el('div', {
      class: `seq-item ${extraClass}`,
      draggable: 'true',
      dataset: { kind: meta.kind, path: JSON.stringify(path) },
      style: { marginLeft: (depth * 14) + 'px' },
    });
    row.addEventListener('dragstart', e => {
      if (this.locked) return e.preventDefault();
      this._dragMake = null;
      this._dragFrom = path;
      e.dataTransfer.setData('text/plain', 'move');
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    return row;
  }

  deleteBtn(path) {
    return el('button', {
      class: 'del', title: 'Quitar', text: '✕',
      onclick: e => {
        e.stopPropagation();
        if (this.locked) return;
        this.pushHistory();
        removeAt(this.program, path);
        sfx('click');
        this.render();
        this.changed();
      },
    });
  }

  simpleRow(node, path, depth) {
    const meta = nodeMeta(node);
    const row = this.rowBase(node, path, depth);
    row.append(
      el('span', { class: 'idx', text: path[path.length - 1] + 1 }),
      el('img', { src: ICON(meta.icon), alt: '' }),
      el('span', { class: 'lbl', text: node.t === 'call' ? `${node.name}()` : meta.label }),
      this.deleteBtn(path),
    );
    return row;
  }

  repeatRow(node, path, depth) {
    const wrap = el('div', { class: 'seq-group' });
    const head = this.rowBase(node, path, depth);
    const num = el('input', { class: 'num', type: 'number', min: '1', max: '50', value: node.n });
    num.addEventListener('change', () => {
      node.n = Math.max(1, Math.min(50, parseInt(num.value, 10) || 1));
      num.value = node.n;
      this.changed();
    });
    num.addEventListener('click', e => e.stopPropagation());
    head.append(
      el('span', { class: 'idx', text: path[path.length - 1] + 1 }),
      el('img', { src: ICON('cmd_repeat'), alt: '' }),
      el('span', { class: 'lbl', text: 'REPETIR' }),
      num,
      el('span', { class: 'lbl', text: 'VECES' }),
      this.deleteBtn(path),
    );
    wrap.append(head, this.bodyContainer(node.body, [...path, 'body'], depth + 1));
    wrap.append(this.endRow('FIN REPETIR', depth));
    return wrap;
  }

  ifRow(node, path, depth) {
    const wrap = el('div', { class: 'seq-group' });
    const head = this.rowBase(node, path, depth);
    const sel = el('select', { class: 'num', style: { width: '118px' } });
    for (const [key, c] of Object.entries(CONDITIONS)) {
      sel.append(el('option', { value: key, text: c.label, selected: key === node.cond }));
    }
    sel.addEventListener('change', () => { node.cond = sel.value; this.changed(); });
    sel.addEventListener('click', e => e.stopPropagation());
    head.append(
      el('span', { class: 'idx', text: path[path.length - 1] + 1 }),
      el('img', { src: ICON('cmd_if'), alt: '' }),
      el('span', { class: 'lbl', text: 'SI' }),
      sel,
      this.deleteBtn(path),
    );
    wrap.append(head, this.bodyContainer(node.body, [...path, 'body'], depth + 1));

    const elseHead = el('div', {
      class: 'seq-item end', style: { marginLeft: (depth * 14) + 'px' },
    }, el('span', { class: 'lbl', text: 'SINO' }));
    wrap.append(elseHead, this.bodyContainer(node.elseBody || (node.elseBody = []), [...path, 'elseBody'], depth + 1));
    wrap.append(this.endRow('FIN SI', depth));
    return wrap;
  }

  defunRow(node, path, depth) {
    const wrap = el('div', { class: 'seq-group' });
    const head = this.rowBase(node, path, depth);
    const name = el('input', { class: 'num', style: { width: '96px' }, value: node.name });
    name.addEventListener('change', () => {
      node.name = (name.value || 'accion').replace(/[^\w]/g, '') || 'accion';
      name.value = node.name;
      this.render();
      this.changed();
    });
    name.addEventListener('click', e => e.stopPropagation());
    head.append(
      el('span', { class: 'idx', text: path[path.length - 1] + 1 }),
      el('img', { src: ICON('cmd_function'), alt: '' }),
      el('span', { class: 'lbl', text: 'FUNCIÓN' }),
      name,
      this.deleteBtn(path),
    );
    wrap.append(head, this.bodyContainer(node.body, [...path, 'body'], depth + 1));
    wrap.append(this.endRow('FIN FUNCIÓN', depth));
    return wrap;
  }

  endRow(text, depth) {
    return el('div', { class: 'seq-item end', style: { marginLeft: (depth * 14) + 'px' }, text });
  }

  bodyContainer(list, containerPath, depth) {
    const box = el('div', {
      class: 'seq-body',
      dataset: { container: JSON.stringify(containerPath) },
      style: { marginLeft: (depth * 14) + 'px' },
    });
    if (!list.length) box.append(el('div', { class: 'seq-empty', text: 'suelta bloques aquí' }));
    this.renderList(list, containerPath, box, 0);
    box.addEventListener('dragover', e => this.onDragOver(e));
    box.addEventListener('drop', e => this.onDrop(e));
    return box;
  }

  // -------------------------------------------------------------------------
  // ARRASTRAR Y SOLTAR
  // -------------------------------------------------------------------------
  onDragOver(e) {
    if (this.locked) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = this._dragFrom ? 'move' : 'copy';
    const host = e.currentTarget;
    $$('.drop-hover', this.seqEl).forEach(n => n.classList.remove('drop-hover'));
    this.seqEl.classList.remove('drop-hover');
    host.classList.add('drop-hover');
  }

  onDrop(e) {
    if (this.locked) return;
    e.preventDefault();
    e.stopPropagation();
    const host = e.currentTarget;
    host.classList.remove('drop-hover');
    $$('.drop-hover', this.seqEl).forEach(n => n.classList.remove('drop-hover'));

    const containerPath = host === this.seqEl ? [] : JSON.parse(host.dataset.container);
    const index = this.dropIndex(host, e.clientY);

    this.pushHistory();
    let node;
    if (this._dragFrom) {
      if (isDescendant(this._dragFrom, containerPath)) { this._dragFrom = null; return; }
      node = removeAt(this.program, this._dragFrom);
      this._dragFrom = null;
    } else if (this._dragMake) {
      node = this._dragMake();
      this._dragMake = null;
    } else return;

    const list = containerAt(this.program, containerPath);
    list.splice(Math.max(0, Math.min(index, list.length)), 0, node);
    sfx('click');
    this.render();
    this.changed();
  }

  /** Calcula el índice de inserción según la posición del cursor. */
  dropIndex(host, clientY) {
    const rows = Array.from(host.children).filter(n => n.classList.contains('seq-item') || n.classList.contains('seq-group'));
    let idx = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) { idx = i; break; }
    }
    return idx;
  }

  // -------------------------------------------------------------------------
  // RESALTADO DURANTE LA EJECUCIÓN
  // -------------------------------------------------------------------------
  highlight(path) {
    this.clearHighlight();
    if (!path) return;
    const row = this.seqEl.querySelector(`[data-path='${JSON.stringify(path)}']`);
    if (row) {
      row.classList.add('running');
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  clearHighlight() {
    $$('.seq-item.running', this.seqEl).forEach(n => n.classList.remove('running'));
  }

  markError(path) {
    const row = path && this.seqEl.querySelector(`[data-path='${JSON.stringify(path)}']`);
    if (row) row.classList.add('errored');
  }

  clearErrors() {
    $$('.seq-item.errored', this.seqEl).forEach(n => n.classList.remove('errored'));
  }
}
