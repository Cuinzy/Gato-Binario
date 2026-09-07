/**
 * generate-sprites.mjs — Genera TODOS los recursos gráficos del juego.
 *
 * Uso:  node tools/generate-sprites.mjs
 *
 * Escribe archivos .svg dentro de assets/ y produce assets/manifest.json
 * con el inventario completo (útil para depurar o reemplazar recursos).
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FURS } from './gen/style.mjs';
import { playerFrames } from './gen/player.mjs';
import { enemyFrames, bossFrames } from './gen/enemies.mjs';
import { itemFrames, objectFrames, environmentFrames } from './gen/items.mjs';
import { uiIcons, commandIcons, badgeIcons, logoFull, logoMark } from './gen/ui.mjs';
import { backgroundFrames } from './gen/backgrounds.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function writeAll(dir, files) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) mkdirSync(full, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(full, name), content, 'utf8');
  }
  return Object.keys(files).map(f => `${dir}/${f}`);
}

const manifest = { generated: new Date().toISOString(), files: {} };
const add = (k, list) => { manifest.files[k] = list; };

// --- Jugador: 6 variantes de pelaje con todas sus animaciones ---
let playerList = [];
for (const [furName, fur] of Object.entries(FURS)) {
  playerList = playerList.concat(writeAll('assets/sprites/player', playerFrames(fur, `cat_${furName}`)));
}
add('player', playerList);

// --- Avatares (retratos de selección) ---
const avatars = {};
for (const [furName, fur] of Object.entries(FURS)) {
  avatars[`avatar_${furName}.svg`] = playerFrames(fur, 'tmp')['tmp_portrait.svg'];
}
add('avatars', writeAll('assets/sprites/avatars', avatars));

// --- Enemigos, boss, items, objetos, entorno ---
add('enemies', writeAll('assets/sprites/enemies', enemyFrames()));
add('boss', writeAll('assets/sprites/boss', bossFrames()));
add('items', writeAll('assets/sprites/items', itemFrames()));
add('objects', writeAll('assets/sprites/objects', objectFrames()));
add('environment', writeAll('assets/sprites/environment', environmentFrames()));

// --- UI ---
add('icons', writeAll('assets/icons', { ...uiIcons(), ...commandIcons() }));
add('badges', writeAll('assets/badges', badgeIcons()));
add('backgrounds', writeAll('assets/backgrounds', backgroundFrames()));
add('logo', writeAll('assets', { 'logo.svg': logoFull(), 'logo_mark.svg': logoMark(256) }));

writeFileSync(join(ROOT, 'assets/manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

const total = Object.values(manifest.files).reduce((a, b) => a + b.length, 0);
console.log(`Sprites generados: ${total} archivos SVG`);
for (const [k, v] of Object.entries(manifest.files)) console.log(`  ${k.padEnd(14)} ${v.length}`);
