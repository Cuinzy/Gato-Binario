/**
 * terminal.js — Terminal de ambientación (esquina inferior izquierda) y
 * secuencia de arranque de la pantalla inicial.
 */
import { $, el, wait, pick } from '../core/utils.js';
import { sfx } from '../core/audio.js';

const body = $('#mini-term-body');
const MAX_LINES = 8;

/** Escribe una línea en la terminal pequeña. */
export function term(text, cls = '') {
  if (!body) return;
  const line = el('div', { class: cls, text: `> ${text}` });
  body.append(line);
  while (body.children.length > MAX_LINES) body.firstChild.remove();
  body.scrollTop = body.scrollHeight;
}

/** Frases de ambiente que se sueltan de vez en cuando. */
const AMBIENT = [
  ['analizando paquetes…', ''],
  ['integridad del núcleo: 62%', 'w'],
  ['bug detectado en sector 0x1F', 'e'],
  ['GatoBinario.exe respondiendo', 'c'],
  ['recompilando módulo gráfico…', ''],
  ['firewall reiniciado', 'w'],
  ['ping al servidor central… ok', 'c'],
  ['memoria fragmentada', 'w'],
  ['0101 0111 0010 1101', ''],
  ['rastreando origen del bug…', 'e'],
];

export function startAmbient() {
  setInterval(() => {
    const [t, c] = pick(AMBIENT);
    term(t, c);
  }, 6500);
}

export function initTerminalToggle() {
  const box = $('#mini-term');
  const btn = $('#btn-term-toggle');
  btn?.addEventListener('click', () => {
    box.classList.toggle('collapsed');
    btn.textContent = box.classList.contains('collapsed') ? '▴' : '▾';
    sfx('click');
  });
}

// ---------------------------------------------------------------------------
// SECUENCIA DE ARRANQUE
// ---------------------------------------------------------------------------
const BOOT = [
  ['GATO BINARIO OS v1.0', 'ok'],
  ['iniciando sistema...', ''],
  ['montando /nucleo ......... OK', 'ok'],
  ['cargando GatoBinario.exe .. OK', 'ok'],
  ['verificando integridad ....', ''],
  ['ERROR: 4 zonas corrompidas', 'err'],
  ['buscando bugs .............', ''],
  ['ALERTA: BUG SUPREMO ACTIVO', 'err'],
  ['SISTEMA COMPROMETIDO', 'err'],
  ['buscando programadores ....', 'warn'],
  ['jugador detectado', 'ok'],
  ['mision 01 cargada', 'ok'],
  ['', ''],
  ['pulsa INICIAR MISION para continuar', 'ok'],
];

/**
 * Reproduce el arranque con efecto de tecleo.
 * @returns {Promise<void>} resuelve al terminar (o si el usuario lo salta)
 */
export function playBoot(logEl, fillEl) {
  return new Promise(resolve => {
    let skipped = false;
    const skip = () => { skipped = true; };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    (async () => {
      for (let i = 0; i < BOOT.length; i++) {
        const [text, cls] = BOOT[i];
        const line = el('span', { class: cls });
        logEl.append(line, document.createTextNode('\n'));
        if (skipped) {
          line.textContent = text;
        } else {
          for (const ch of text) {
            line.textContent += ch;
            if (Math.random() < 0.22) sfx('type');
            await wait(skipped ? 0 : 11);
          }
        }
        fillEl.style.width = Math.round(((i + 1) / BOOT.length) * 100) + '%';
        if (!skipped) await wait(text ? 90 : 30);
      }
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      resolve();
    })();
  });
}
