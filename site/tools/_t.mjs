import { chromium } from 'playwright'; import { createServer } from 'vite';
const s = await createServer({ server: { port: 6123 }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 680, height: 247 }});
p.on('console',m=>console.log('C',m.text()));p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto(s.resolvedUrls.local[0]); await p.waitForTimeout(3000);
console.log(await p.evaluate('window.__ready'));await p.screenshot({path:'out/_dbg.png'});
await b.close(); await s.close();
