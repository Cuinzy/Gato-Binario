/** Comprueba que ningún SVG generado tenga atributos duplicados o NaN. */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
let bad = 0, checked = 0;
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!f.endsWith('.svg')) continue;
    checked++;
    const src = readFileSync(p, 'utf8');
    if (/NaN|undefined/.test(src)) { console.log('VALOR INVALIDO:', p); bad++; continue; }
    for (const tag of src.match(/<[a-zA-Z][^>]*>/g) || []) {
      const names = (tag.match(/[\s]([a-zA-Z-:]+)=/g) || []).map(s => s.trim().slice(0, -1));
      const dup = names.filter((v, i) => names.indexOf(v) !== i);
      if (dup.length) { console.log('ATRIBUTO DUPLICADO:', p, dup.join(','), tag.slice(0, 90)); bad++; break; }
    }
  }
}
walk('assets');
console.log(`${checked} SVG revisados, ${bad} con problemas`);
