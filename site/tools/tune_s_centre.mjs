// s_centre 専用: SSIMを目的関数にした座標降下。基準画像は測定にのみ使用(描画コードへは定数のみ反映)
import { chromium } from 'playwright'; import { createServer } from 'vite';
const s = await createServer({ server: { port: 6000 + Math.floor(Math.random()*2000) }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage(); p.on('pageerror', e => console.error('PAGEERR', e.message));
await p.goto(s.resolvedUrls.local[0] + 'index.html?x'); 
const res = await p.evaluate(async()=>{const m=await import('/tools/tune_s_centre_page.js');return m.run();});
import('node:fs').then(f=>f.writeFileSync('/tmp/claude-0/-home-user-claude/f8198fb8-7e82-589a-a2ef-031a55397919/scratchpad/tune_res.json',JSON.stringify(res)));console.log(JSON.stringify(res.after),JSON.stringify(res.before));
await b.close(); await s.close();
