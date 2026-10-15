// cl_top 専用チューナ(目的関数としてのみ基準を測定。描画コードには何も埋め込まない)
import { chromium } from 'playwright'; import fs from 'node:fs';
const src=fs.readFileSync('src/pieces/cl_top.js','utf8').replace(/export const /g,'const ').replace(/export function /g,'function ');
const b64=f=>'data:image/'+(f.endsWith('jpg')?'jpeg':'png')+';base64,'+fs.readFileSync(f).toString('base64');
const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await br.newPage();
await p.setContent('<canvas id=c width=680 height=247></canvas>');
await p.evaluate(async([src,ref,bg])=>{
  const ld=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});
  const mk=i=>{const c=document.createElement('canvas');c.width=680;c.height=247;const x=c.getContext('2d');x.drawImage(i,0,0);return x.getImageData(0,0,680,247).data;};
  const gray=d=>{const g=new Float64Array(680*247);for(let i=0;i<g.length;i++)g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];return g;};
  const RG=gray(mk(await ld(ref)));const BG=await ld(bg);
  const mod=new Function(src+';return {draw,P0};')();
  const c=document.getElementById('c'),ctx=c.getContext('2d',{willReadFrequently:true});
  function ssim(a,b,x0,y0,x1,y1){const k=7,C1=6.5025,C2=58.5225;let s=0,n=0;
    for(let y=y0;y<=y1-k;y++)for(let x=x0;x<=x1-k;x++){let sa=0,sb=0,saa=0,sbb=0,sab=0;
      for(let j=0;j<k;j++)for(let i=0;i<k;i++){const q=(y+j)*680+x+i,u=a[q],v=b[q];sa+=u;sb+=v;saa+=u*u;sbb+=v*v;sab+=u*v;}
      const m=49,ma=sa/m,mb=sb/m,va=saa/m-ma*ma,vb=sbb/m-mb*mb,cv=sab/m-ma*mb;
      s+=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));n++;}return s/n;}
  window.score=(Q,regs)=>{ctx.clearRect(0,0,680,247);ctx.drawImage(BG,0,0);mod.draw(ctx,680,247,Q);
    const g=gray(ctx.getImageData(0,0,680,247).data);return regs.map(r=>ssim(RG,g,...r));};
  window.P0=mod.P0;
},[src,b64('ref/reference.jpg'),b64('out/R7_bg.png')]);
const TR=[[0,0,680,70],[0,0,170,40],[340,0,520,40],[520,0,680,70]];
const HO=[[170,0,340,55],[560,0,680,35],[0,60,40,125],[640,60,680,125]];
const f=async Q=>{const s=await p.evaluate(([Q,R])=>score(Q,R),[Q,TR]);return s.reduce((a,b)=>a+b)/s.length;};
let Q=await p.evaluate(()=>({...P0}));const q0={...Q};
let best=await f(Q);console.log('start',best.toFixed(4),await p.evaluate(([Q,R])=>score(Q,R),[Q,HO]));
const step={};for(const k in Q){const v=Math.abs(Q[k]);step[k]=v<1?0.1:v<5?1:v<20?2:4; if(k.startsWith('d'))step[k]=4;}
for(let round=0;round<4;round++){
  for(const k in Q){for(const d of [step[k],-step[k]]){
    const T={...Q,[k]:Q[k]+d};if(/^a|A$|Top$|Bot$|warm|wash/.test(k)&&k.length>0&&(T[k]<0||(/^a|A$|warm|wash/.test(k)&&T[k]>1)))continue;
    if(T[k]<0&&!k.startsWith('d'))continue;
    const s=await f(T);if(s>best+1e-5){best=s;Q=T;}}}
  for(const k in step)step[k]/=2;
  console.log('round',round,best.toFixed(4));
}
console.log(JSON.stringify(Q));
console.log('train',await p.evaluate(([Q,R])=>score(Q,R),[Q,TR]),'holdout',await p.evaluate(([Q,R])=>score(Q,R),[Q,HO]));
console.log('holdout start',await p.evaluate(([Q,R])=>score(Q,R),[q0,HO]));
await br.close();
