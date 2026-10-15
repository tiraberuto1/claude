// usage: node tools/shot.mjs out.png
import { chromium } from 'playwright'; import { createServer } from 'vite';
const out = process.argv[2] || 'out/shot.png';
const s = await createServer({ server: { port: 5199 }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 680, height: 247 }, deviceScaleFactor: 1 });
p.on('pageerror', e => console.error('PAGEERR', e.message));
await p.goto('http://localhost:5199/'); await p.waitForFunction('window.__ready', null, { timeout: 30000 });
import('node:fs').then(f => f.mkdirSync('out', { recursive: true }));
await p.screenshot({ path: out }); await b.close(); await s.close();
