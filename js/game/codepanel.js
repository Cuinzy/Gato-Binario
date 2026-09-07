/**
 * codepanel.js — Ruta PROGRAMADOR: el mismo programa, escrito como código.
 *
 * "COMPILAR A BLOQUES" analiza el texto y sustituye el programa;
 * "TRAER DESDE BLOQUES" vuelca el programa actual como código.
 * Así los tres niveles de experiencia trabajan sobre la misma misión.
 */
import { el, $ } from '../core/utils.js';
import { sfx } from '../core/audio.js';
import { COMMANDS, CONDITIONS, toCode, parseCode, declaredFunctions } from './commands.js';

export class CodePanel {
  /** @param {object} o - { editor, msg, refBox, applyBtn, fromBtn, getProgram, setProgram } */
  constructor(o) {
    this.editor = o.editor;
    this.msg = o.msg;
    this.refBox = o.refBox;
    this.getProgram = o.getProgram;
    this.setProgram = o.setProgram;
    this.onCompile = o.onCompile || (() => {});

    o.applyBtn.addEventListener('click', () => this.compile());
    o.fromBtn.addEventListener('click', () => this.fromBlocks());
    this.editor.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); this.insert('  '); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.compile(); }
    });
  }

  insert(text) {
    const s = this.editor.selectionStart, e = this.editor.selectionEnd;
    this.editor.value = this.editor.value.slice(0, s) + text + this.editor.value.slice(e);
    this.editor.selectionStart = this.editor.selectionEnd = s + text.length;
  }

  /** Prepara la referencia rápida y una plantilla inicial para el nivel. */
  setLevel(level) {
    this.level = level;
    this.renderRef(level);
    if (!this.editor.value.trim()) this.editor.value = this.template(level);
    this.say('', '');
  }

  template(level) {
    const lines = ['// Ruta Programador — GatoScript', '// Ctrl+Enter compila'];
    if (level.structs?.includes('defun')) {
      lines.push('', 'funcion reparar() {', '  avanzar();', '}', '', '// reparar();');
    } else if (level.structs?.includes('repeat')) {
      lines.push('', 'repetir (3) {', '  avanzar();', '}');
    } else {
      lines.push('', 'avanzar();');
    }
    return lines.join('\n');
  }

  renderRef(level) {
    const box = this.refBox;
    box.innerHTML = '';
    const add = (code, desc) => box.append(
      el('div', { class: 'ref-row' }, el('code', { text: code }), el('span', { text: desc }))
    );
    for (const name of level.blocks || Object.keys(COMMANDS)) {
      const c = COMMANDS[name];
      if (c) add(`${name}();`, c.label.toLowerCase());
    }
    if (level.structs?.includes('repeat')) add('repetir (n) { … }', 'repite n veces el bloque');
    if (level.structs?.includes('if')) {
      add('si (cond) { … } sino { … }', 'decide según un sensor');
      for (const [key, c] of Object.entries(CONDITIONS)) add(`${key}()`, c.desc);
    }
    if (level.structs?.includes('defun')) {
      add('funcion nombre() { … }', 'crea una habilidad reutilizable');
      add('nombre();', 'usa la habilidad creada');
    }
  }

  say(text, cls = '') {
    this.msg.textContent = text;
    this.msg.className = 'code-msg ' + cls;
  }

  /** Texto -> programa. */
  compile() {
    const known = declaredFunctions(this.getProgram());
    const { program, error } = parseCode(this.editor.value, known);
    if (error) {
      this.say('⚠ ' + error, 'err');
      sfx('error');
      return false;
    }
    this.setProgram(program);
    this.say('✓ Compilación exitosa — el programa pasó a la secuencia de bloques.', 'ok');
    sfx('success');
    this.onCompile(program);
    return true;
  }

  /** Programa -> texto. */
  fromBlocks() {
    const code = toCode(this.getProgram());
    this.editor.value = code || '// (la secuencia está vacía)';
    this.say('Código generado desde los bloques.', 'ok');
    sfx('click');
  }

  /** Refresca el editor si el programa cambió por otro camino. */
  syncFrom(program) {
    if (document.activeElement === this.editor) return;
    this.editor.value = toCode(program) || this.editor.value;
  }
}
