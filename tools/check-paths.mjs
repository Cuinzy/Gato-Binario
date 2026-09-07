/**
 * check-paths.mjs — Verifica que TODA ruta de recurso referenciada desde el
 * código exista con exactamente las mismas mayúsculas/minúsculas.
 *
 * Windows no distingue mayúsculas, pero el servidor de Vercel (Linux) sí:
 * este chequeo evita imágenes rotas al desplegar.
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, posix } from 'node:path';

const ROOT = process.cwd();

// --- Índice de todos los archivos reales del proyecto -----------------------
const real = new Set();
(function walk(dir, rel = '') {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.vercel') continue;
    const abs = join(dir, name);
    const r = rel ? `${rel}/${name}` : name;
    if (statSync(abs).isDirectory()) walk(abs, r);
    else real.add(r);
  }
})(ROOT);

// --- Rutas referenciadas desde el código ------------------------------------
const sources = [...real].filter(f =>
  (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.html') || f.endsWith('.css')) &&
  !f.startsWith('tools/gen/') && f !== 'tools/check-paths.mjs');

const refRe = /['"`(]((?:assets|css|js)\/[A-Za-z0-9_\-./]+?\.(?:svg|png|jpg|jpeg|webp|gif|json|mp3|ogg|wav|css|js))['"`)]/g;

const missing = [];
const seen = new Set();
for (const src of sources) {
  // Se quitan los comentarios: dentro hay rutas de ejemplo que no son reales
  const text = readFileSync(join(ROOT, src), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  let m;
  while ((m = refRe.exec(text)) !== null) {
    const path = m[1];
    if (seen.has(path)) continue;
    seen.add(path);
    if (!real.has(path)) missing.push({ path, src });
  }
}

// --- Rutas construidas dinámicamente (plantillas de assets.js) --------------
const dynamic = [];
const { ANIM, TILES, AVATARS } = await import('../js/core/assets.js').catch(() => ({}));
if (ANIM) {
  for (const a of Object.values(ANIM)) a.files.forEach(f => dynamic.push(f));
  for (let z = 0; z < 5; z++) {
    TILES.floor(z).forEach(f => dynamic.push(f));
    dynamic.push(TILES.wall(z), TILES.platform(z));
  }
  AVATARS.forEach(a => dynamic.push(a.file));
}
for (const p of new Set(dynamic)) if (!real.has(p)) missing.push({ path: p, src: 'js/core/assets.js (dinámica)' });

if (missing.length) {
  console.log(`✘ ${missing.length} rutas no coinciden con ningún archivo real:`);
  missing.forEach(m => console.log(`   ${m.path}   ← ${m.src}`));
  process.exit(1);
}
console.log(`✔ ${seen.size + new Set(dynamic).size} rutas verificadas: todas existen con la misma capitalización`);
