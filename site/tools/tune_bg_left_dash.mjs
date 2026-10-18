// bg_left 用パラメータ探索。基準は目的関数の測定にのみ使う(描画コードには埋め込まない)
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const REF=fs.readFileSync(process.argv[2]); const W0=680;
const s=await createServer({server:{port:7200+Math.floor(Math.random()*800)},logLevel:'error'});await s.listen();
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage();await p.goto(s.resolvedUrls.local[0]);
async function render(P){for(let t=0;;t++){try{return await p.evaluate(async(P)=>{const m=await import('/src/pieces/bg_left.js?t=0');
  const c=document.createElement('canvas');c.width=680;c.height=247;const x=c.getContext('2d');const ix=await import('/src/pieces/index.js');for(const q of ix.pieces){if(q.name==='bg_left')m.draw(x,680,247,P);else q.draw(x,680,247);}
  const d=x.getImageData(0,0,340,247).data,o=new Uint8Array(340*247);
  for(let i=0;i<o.length;i++)o[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];return Array.from(o);},P);}catch(e){if(t>20)throw e;await new Promise(r=>setTimeout(r,500));}}}
function box(a,w,h,k=7){const ow=w-k+1,oh=h-k+1,o=new Float64Array(ow*oh);for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){let t=0;for(let j=0;j<k;j++)for(let i=0;i<k;i++)t+=a[(y+j)*w+x+i];o[y*ow+x]=t/(k*k);}return o;}
function ssim(g,[x0,y0,x1,y1]){const w=x1-x0,h=y1-y0,A=new Float64Array(w*h),B=new Float64Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){A[y*w+x]=REF[(y0+y)*W0+x0+x];B[y*w+x]=g[(y0+y)*340+x0+x];}
  const AA=A.map(v=>v*v),BB=B.map(v=>v*v),AB=A.map((v,i)=>v*B[i]);
  const ma=box(A,w,h),mb=box(B,w,h),maa=box(AA,w,h),mbb=box(BB,w,h),mab=box(AB,w,h);
  const C1=6.5025,C2=58.5225;let t=0;for(let i=0;i<ma.length;i++){const va=maa[i]-ma[i]**2,vb=mbb[i]-mb[i]**2,cv=mab[i]-ma[i]*mb[i];
    t+=((2*ma[i]*mb[i]+C1)*(2*cv+C2))/((ma[i]**2+mb[i]**2+C1)*(va+vb+C2));}return t/ma.length;}
const mean=(g,R)=>R.reduce((a,r)=>a+ssim(g,r),0)/R.length;
const D=await p.evaluate(async()=>{const m=await import('/src/pieces/bg_left.js?t=0');return {D:m.DEFAULTS,L:m.LEAVES};});
let P=JSON.parse(fs.readFileSync(process.argv[3]));const P0=JSON.parse(JSON.stringify(P));
const clone=P=>({...P,leaves:P.leaves.map(l=>[...l])});
// ---- 段階A: 点線(短冊): 線ごとに tune/val 領域を分ける
const LINES={
 t:{tune:[168,62,262,80],val:[262,62,292,80],B:{Y:[66.5,68.5],W:[2,3.4],P:[6.4,7.4],G:[1.2,3.2]}},
 m:{tune:[176,126,262,138],val:[262,126,292,138],B:{Y:[132,136],W:[2,3.6],P:[6.4,7.4],G:[1.2,3.2]}},
};
const rep=[];
for(const [n,L] of Object.entries(LINES)){
  const ev=async Q=>ssim(await render(Q),L.tune);
  let best=await ev(P);const v0=ssim(await render(P),L.val);const t0=best;
  for(let it=0;it<3;it++){
    for(const k of ['Y','W','P','G']){ if(!L.B[k])continue; const key=n+k;const st={Y:.25,W:.3,P:.02,G:.25}[k];
      for(const d of [1,-1,2,-2,3,-3]){const Q={...P,[key]:P[key]+d*st};if(Q[key]<L.B[k][0]||Q[key]>L.B[k][1])continue;const v=await ev(Q);if(v>best+1e-5){best=v;P=Q;}}}
    // 位相の全探索(0.1px刻み)
    const key=n+'Ph';let bp=P[key];for(let ph=0;ph<P[n+'P'];ph+=0.1){const v=await ev({...P,[key]:ph});if(v>best+1e-5){best=v;bp=ph;}}P[key]=bp;
  }
  const v1=ssim(await render(P),L.val);rep.push(`${n}: tune ${t0.toFixed(3)}->${best.toFixed(3)} val ${v0.toFixed(3)}->${v1.toFixed(3)}`);
  if(v1<v0-0.003){ // 検証悪化: 採用しない
    for(const k of Object.keys(P))if(k.startsWith(n)&&k!=='leaves')P[k]=P0[k];rep.push(n+': 不採用');}
}
console.log(rep.join('\n'));
const out=clone(P);
for(const k of Object.keys(out)){}
console.log(JSON.stringify(out));
await b.close();await s.close();
