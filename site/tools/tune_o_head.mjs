// o_head パラメータ探索(SSIMを目的関数にした座標降下)。基準は測定のみ・描画には埋め込まない
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const gray = [...fs.readFileSync(process.argv[2])];
const s = await createServer({ server: { port: 5200 + Math.floor(Math.random()*3000) }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 680, height: 247 } });
p.on('pageerror', e => console.error('PAGEERR', e.message));
await p.goto(s.resolvedUrls.local[0]); await p.waitForFunction('window.__ready', null, { timeout: 30000 });
const res = await p.evaluate(async (gray) => {
  const W=680,H=247;
  const { pieces } = await import('/src/pieces/index.js');
  const head = pieces.find(x=>x.name==='o_head'), P = head.P, idx = pieces.indexOf(head);
  const lay = (a,b2)=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    for(let i=a;i<b2;i++){const t=document.createElement('canvas');t.width=W;t.height=H;pieces[i].draw(t.getContext('2d'),W,H);x.drawImage(t,0,0);}return c;};
  const below=lay(0,idx), above=lay(idx+1,pieces.length);
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d',{willReadFrequently:true});
  const hc=document.createElement('canvas');hc.width=W;hc.height=H;const hx=hc.getContext('2d');
  const R=Float64Array.from(gray);
  const box=(a,w,h,k=7)=>{const o=new Float64Array((w-k+1)*(h-k+1));
    const ii=new Float64Array((w+1)*(h+1));
    for(let y=0;y<h;y++){let r=0;for(let x=0;x<w;x++){r+=a[y*w+x];ii[(y+1)*(w+1)+x+1]=ii[y*(w+1)+x+1]+r;}}
    for(let y=0;y+k<=h;y++)for(let x=0;x+k<=w;x++)o[y*(w-k+1)+x]=(ii[(y+k)*(w+1)+x+k]-ii[y*(w+1)+x+k]-ii[(y+k)*(w+1)+x]+ii[y*(w+1)+x])/(k*k);return o;};
  const ssim=(S,[x0,y0,x1,y1])=>{const w=x1-x0,h=y1-y0,a=new Float64Array(w*h),bb=new Float64Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){a[y*w+x]=R[(y0+y)*W+x0+x];bb[y*w+x]=S[(y0+y)*W+x0+x];}
    const mul=(u,v)=>{const o=new Float64Array(u.length);for(let i=0;i<o.length;i++)o[i]=u[i]*v[i];return o;};
    const ma=box(a,w,h),mb=box(bb,w,h),aa=box(mul(a,a),w,h),bq=box(mul(bb,bb),w,h),ab=box(mul(a,bb),w,h);
    const C1=6.5025,C2=58.5225;let t=0;
    for(let i=0;i<ma.length;i++){const va=aa[i]-ma[i]*ma[i],vb=bq[i]-mb[i]*mb[i],cv2=ab[i]-ma[i]*mb[i];
      t+=((2*ma[i]*mb[i]+C1)*(2*cv2+C2))/((ma[i]*ma[i]+mb[i]*mb[i]+C1)*(va+vb+C2));}
    return t/ma.length;};
  const render=()=>{hx.clearRect(0,0,W,H);head.draw(hx,W,H);cx.clearRect(0,0,W,H);cx.drawImage(below,0,0);cx.drawImage(hc,0,0);cx.drawImage(above,0,0);
    const d=cx.getImageData(0,0,W,H).data,g=new Float64Array(W*H);for(let i=0;i<g.length;i++)g[i]=Math.floor((299*d[4*i]+587*d[4*i+1]+114*d[4*i+2])/1000);return g;};
  const TR=[[0,30,160,150],[90,55,138,100],[286,0,340,38]], HO=[[55,40,90,90],[120,40,160,100],[0,0,340,150],[150,40,200,110],[200,0,286,40]];
  const ev=(rs)=>{const g=render();return rs.map(r=>ssim(g,r));};
  const obj=()=>{const v=ev(TR);return v[0]*1+v[1]*1+v[2]*1;};
  const P0=JSON.parse(JSON.stringify(P)), before={tr:ev(TR),ho:ev(HO)};
  const D=[];const sc0={hx:4,hy:4,hsx:0.06,hsy:0.06,hb:0.05,hs:0.2,tn:4,fx:3,fy:3,fsx:0.05,fsy:0.05,fr:0.08,fg:0.08,fb:0.08,sa:0.2,ex:2,ey:2,mx:2,my:2,msx:0.1,kx:3,ky:3,ksx:0.08,ksy:0.08,kb:0.1,ta:0.4,tl:0.2};
  const lim={fr:[0.85,1.0],fg:[0.95,1.1],fb:[0.95,1.1],hs:[0.6,3],tn:[8,40],sa:[0.3,0.9],hb:[0.9,1.2],kb:[0.8,1.2],ta:[-0.4,0.4],tl:[0.6,1.6]};
  for(const k in sc0)D.push({get:()=>P[k],set:v=>{P[k]=k==='tn'?Math.round(v):v;},step:sc0[k],lim:lim[k],base:null});
  for(const k of ['ho','fo','bo','eo','to','so','no'])P[k].forEach((_,i)=>D.push({get:()=>P[k][i],set:v=>{P[k][i]=v;},step:1,lim:[-2,2]}));
  let best=obj();
  for(let round=0;round<5;round++){
    for(const d of D){for(const sg of [1,-1]){let moved=true;
      while(moved){moved=false;const old=d.get();let nv=old+sg*d.step;if(d.lim)nv=Math.max(d.lim[0],Math.min(d.lim[1],nv));if(nv===old)break;
        d.set(nv);const o=obj();if(o>best+1e-5){best=o;moved=true;}else d.set(old);}}}
    for(const d of D)d.step*=0.6;
  }
  return {P0,P:JSON.parse(JSON.stringify(P)),before,after:{tr:ev(TR),ho:ev(HO)},best};
}, gray);
console.log(JSON.stringify(res,null,1)); await b.close(); await s.close();
