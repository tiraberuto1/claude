// o_body 専用: SSIM(+平均色)を目的関数にした座標降下。基準は測定にのみ使用。
// usage: node tools/tune_o_body.mjs out/tune_P.json [sweeps]
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const out = process.argv[2] || 'out/tune_P.json'; const SW = +(process.argv[3] || 10);
const s = await createServer({ server: { port: 6000 + Math.floor(Math.random()*3000) }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 680, height: 247 } });
p.on('pageerror', e => console.error('PAGEERR', e.message)); p.on('console', m => console.log(m.text()));
await p.goto(s.resolvedUrls.local[0]); await p.waitForFunction('window.__ready', null, { timeout: 30000 });
const res = await p.evaluate(async (SW) => {
  const W=680,H=247;
  const idx = await import('/src/pieces/index.js'); const ob = await import('/src/pieces/o_body.js');
  const P = ob.P;
  const ref = await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='/ref/reference.jpg';});
  const cv=(()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;});
  const rc=cv();rc.getContext('2d').drawImage(ref,0,0);const rd=rc.getContext('2d').getImageData(0,0,W,H).data;
  const gray=(d)=>{const g=new Float64Array(W*H);for(let i=0;i<W*H;i++)g[i]=0.299*d[4*i]+0.587*d[4*i+1]+0.114*d[4*i+2];return g;};
  const RG=gray(rd);
  const layers=idx.pieces.map(pc=>{const c=cv();if(pc.name!=='o_body')pc.draw(c.getContext('2d'),W,H);return c;});
  const bi=idx.pieces.findIndex(x=>x.name==='o_body');
  const below=cv(),above=cv();
  layers.forEach((c,i)=>{if(i<bi)below.getContext('2d').drawImage(c,0,0);if(i>bi)above.getContext('2d').drawImage(c,0,0);});
  const bodyc=cv(),comp=cv();
  function integ(a){const S=new Float64Array((W+1)*(H+1));for(let y=0;y<H;y++){let r=0;for(let x=0;x<W;x++){r+=a[y*W+x];S[(y+1)*(W+1)+x+1]=S[y*(W+1)+x+1]+r;}}return S;}
  const k=7;function box(S,x,y){const w=W+1;return (S[(y+k)*w+x+k]-S[y*w+x+k]-S[(y+k)*w+x]+S[y*w+x])/(k*k);}
  const RR=new Float64Array(W*H);for(let i=0;i<W*H;i++)RR[i]=RG[i]*RG[i];
  const SR=integ(RG),SRR=integ(RR);
  const C1=(0.01*255)**2,C2=(0.03*255)**2;
  const regs=[[270,85,530,225],[340,75,420,110],[230,165,440,230]];
  const hold=[[440,100,520,160],[290,100,340,160],[260,190,330,225]]; // 検証用(目的関数から除外)
  const inHold=(x,y)=>hold.some(h=>x>=h[0]&&x<h[2]&&y>=h[1]&&y<h[3]);
  function evalP(){
    const c=bodyc.getContext('2d');c.clearRect(0,0,W,H);ob.draw(c,W,H);
    const q=comp.getContext('2d');q.clearRect(0,0,W,H);q.drawImage(below,0,0);q.drawImage(bodyc,0,0);q.drawImage(above,0,0);
    const d=q.getImageData(0,0,W,H).data;const G=gray(d);
    const GG=new Float64Array(W*H),RGx=new Float64Array(W*H);for(let i=0;i<W*H;i++){GG[i]=G[i]*G[i];RGx[i]=G[i]*RG[i];}
    const SG=integ(G),SGG=integ(GG),SRG=integ(RGx);
    const m=(x,y)=>{const ma=box(SR,x,y),mb=box(SG,x,y);const va=box(SRR,x,y)-ma*ma,vb=box(SGG,x,y)-mb*mb,cv_=box(SRG,x,y)-ma*mb;
      return ((2*ma*mb+C1)*(2*cv_+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));};
    const tr=[],ho=[];let tot=0;
    for(const r of regs){let s=0,n=0;for(let y=r[1];y<=r[3]-k;y++)for(let x=r[0];x<=r[2]-k;x++){if(inHold(x,y))continue;s+=m(x,y);n++;}tr.push(s/n);tot+=s/n;}
    let hs=0,hn=0;for(const h of hold)for(let y=h[1];y<=h[3]-k;y++)for(let x=h[0];x<=h[2]-k;x++){hs+=m(x,y);hn++;}
    // 平均色(体域, 両方のRGB)
    const r0=regs[0];let dm=0;for(let ch=0;ch<3;ch++){let a=0,bb=0,n=0;for(let y=r0[1];y<r0[3];y++)for(let x=r0[0];x<r0[2];x++){const i=4*(y*W+x)+ch;a+=rd[i];bb+=d[i];n++;}dm+=Math.abs(a-bb)/n;}
    const r1=regs[2];let dm2=0;for(let ch=0;ch<3;ch++){let a=0,bb=0,n=0;for(let y=r1[1];y<r1[3];y++)for(let x=r1[0];x<r1[2];x++){const i=4*(y*W+x)+ch;a+=rd[i];bb+=d[i];n++;}dm2+=Math.abs(a-bb)/n;}
    let hf=0,hn2=0;for(let y=120;y<200;y++)for(let x=300;x<430;x++){const i=4*(y*W+x);hn2++;if(d[i]>=d[i+1]+30&&d[i+1]>=d[i+2]+10)hf++;}hf/=hn2;
    const score=tot/3-2*(dm+dm2)/(2*3*255)-0.3*Math.max(0,0.8-hf);
    return {score,tr,hold:hs/hn,dm,dm2,hf};
  }
  // 葉の列挙
  const leaves=[];
  (function walk(o,kind,key){
    for(const kk of Object.keys(o)){const v=o[kk];
      if(typeof v==='number'){let t=kind;if(kk==='a'||kk==='dens'&&0)t='a';if(kk==='c')t='c';leaves.push({o,kk,t:(kk==='a')?'a':kind});}
      else if(Array.isArray(v)||typeof v==='object'){walk(v,(kk==='c')?'c':(kk==='a'?'a':kind),kk);}
    }})(P,'xy','');
  // c配列の葉: 親キー c を検出するため再構築
  leaves.length=0;
  (function walk(o,kind,grp){for(const kk of Object.keys(o)){const v=o[kk];
    if(typeof v==='number'){leaves.push({o,kk,grp,t:(kind==='c')?'c':(kk==='a'?'a':(kk==='spread'||kk==='len'||kk==='ox'||kk==='dens')?'s':'xy')});}
    else walk(v,(kk==='c')?'c':kind==='c'?'c':'xy',grp||kk);}})(P,'xy','');
  for(const l of leaves)l.o0=l.o[l.kk];
  const spanXY={body:6,masses:5,kim:6,crown:4,hand:3,sprays:5,loin:3};const span={c:18,a:0.25,s:0.3};
  const stepOf={xy:[10,5,2.5],c:[16,8,4],a:[0.15,0.08,0.04],s:[0.2,0.1,0.05]};
  const limL=(l,v)=>{v=(()=>{const sp=l.t==='xy'?(spanXY[l.grp]||12):span[l.t];return Math.max(l.o0-sp,Math.min(l.o0+sp,v));})();return lim(l.t,v);};
  const lim=(t,v)=>t==='c'?Math.max(0,Math.min(255,v)):t==='a'?Math.max(0,Math.min(1,v)):t==='s'?Math.max(0.05,v):v;
  let cur=evalP();const base=cur;console.log('init',JSON.stringify(base));
  let seed=1;const rn=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let sw=0;sw<SW;sw++){
    const lvl=Math.min(2,Math.floor(sw/Math.max(1,SW/3)));
    const order=leaves.map((l,i)=>[rn(),i]).sort((a,b)=>a[0]-b[0]).map(x=>leaves[x[1]]);
    let acc=0;
    for(const l of order){const st=stepOf[l.t][lvl];const old=l.o[l.kk];
      for(const dir of [1,-1]){l.o[l.kk]=limL(l,old+dir*st);if(l.t==='c'&&l.grp!=='kim'&&l.grp!=='tint'&&!(l.o[0]>=l.o[1]+30&&l.o[1]>=l.o[2]+10&&l.o[1]<=0.72*l.o[0]&&l.o[2]>=0.22*l.o[0])){l.o[l.kk]=old;continue;}const e=evalP();if(e.score>cur.score+1e-5){cur=e;acc++;break;}l.o[l.kk]=old;}
    }
    console.log('sweep',sw,'acc',acc,JSON.stringify({score:cur.score,tr:cur.tr,hold:cur.hold,dm:cur.dm,dm2:cur.dm2,hf:cur.hf}));
  }
  return {P,base,cur};
}, SW);
fs.mkdirSync('out',{recursive:true});fs.writeFileSync(out,JSON.stringify(res.P));
console.log('BASE',JSON.stringify(res.base));console.log('FINAL',JSON.stringify(res.cur));
await b.close(); await s.close();
