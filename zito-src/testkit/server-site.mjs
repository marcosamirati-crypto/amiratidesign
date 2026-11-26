// Servidor de TESTE do site aberto: serve /zito, imita as rotas /api/zito/*
// e faz o papel do Supabase Realtime (canal de broadcast) com um WebSocket.
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { WebSocketServer } from 'ws';

const ROOT = new URL('../', import.meta.url).pathname;
const DIST = join(ROOT, 'dist-site');
const chans = new Map(); // nome -> Set(ws)
let msgs = 0;

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/api/zito/config') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ url: null, anon: null, ai: false })); }
  if (u.pathname === '/api/zito/codex') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ version: '1.0', bible: readFileSync(join(ROOT, 'ZITO_UNIVERSE_BIBLE.md'), 'utf8'), bestiario: JSON.parse(readFileSync(join(ROOT, 'data/bestiario.json'), 'utf8')) })); }
  if (u.pathname === '/stats') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ msgs, channels: [...chans].map(([k, v]) => [k, v.size]) })); }
  let p = u.pathname === '/zito' || u.pathname === '/zito/' ? '/zito/index.html' : u.pathname;
  if (!p.startsWith('/zito/')) { res.statusCode = 404; return res.end('404'); }
  const file = join(DIST, p.slice(6));
  if (!existsSync(file)) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  let body = readFileSync(file);
  if (file.endsWith('.html')) body = body.toString().replace(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts[^>]+>/g, '');
  res.end(body);
});
const wss = new WebSocketServer({ server, path: '/relay' });
wss.on('connection', (ws, req) => {
  const ch = new URL(req.url, 'http://x').searchParams.get('ch');
  if (!chans.has(ch)) chans.set(ch, new Set());
  chans.get(ch).add(ws);
  ws.on('message', buf => { msgs++; for (const o of chans.get(ch)) if (o !== ws && o.readyState === 1) o.send(buf.toString()); });
  ws.on('close', () => chans.get(ch).delete(ws));
});
server.listen(+process.env.PORT || 8788, () => console.log('site testkit on', +process.env.PORT || 8788));
