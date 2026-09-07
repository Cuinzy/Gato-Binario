import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json', '.png':'image/png', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav' };
createServer(async (req, res) => {
  // Endpoint SOLO de desarrollo: permite que una pagina local guarde un
  // archivo generado en el navegador (se usa para crear assets/og-image.png).
  if (req.method === 'POST' && req.url.startsWith('/__save')) {
    const target = new URL(req.url, 'http://localhost').searchParams.get('path') || '';
    if (!/^[A-Za-z0-9_\-./]+$/.test(target) || target.includes('..')) {
      res.writeHead(400); return res.end('ruta invalida');
    }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    const b64 = body.replace(/^data:[^;]+;base64,/, '');
    await writeFile(join(ROOT, target), Buffer.from(b64, 'base64'));
    res.writeHead(200); return res.end('ok');
  }

  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = join(ROOT, p);
  try {
    const s = await stat(file);
    if (s.isDirectory()) throw 0;
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('404'); }
}).listen(5501, () => console.log('http://localhost:5501'));
