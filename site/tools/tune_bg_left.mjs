// bg_left 用パラメータ探索(座標降下)。基準は目的関数の測定にのみ使う(描画コードには埋め込まない)
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const REF=fs.readFileSync(process.argv[2]); const W0=680,H0=247;
const s=await createServer({server:{port:7200+Math.floor(Math.random()*800)},logLevel:'error'});await s.listen();
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage();await p.goto(s.resolvedUrls.local[0]);
async function render(P){for(let t=0;;t++){try{return await render1(P);}catch(e){if(t>20)throw e;await new Promise(r=>setTimeout(r,500));}}}
async function render1(P){return p.evaluate(async(P)=>{const m=await import('/src/pieces/bg_left.js?t=0');
  const c=document.createElement('canvas');c.width=680;c.height=247;const x=c.getContext('2d');m.draw(x,680,247,P);
  const d=x.getImageData(0,0,340,247).data,o=new Uint8Array(340*247);
  for(let i=0;i<o.length;i++)o[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];return Array.from(o);},P);}
function box(a,w,h,k=7){const ow=w-k+1,oh=h-k+1,o=new Float64Array(ow*oh);for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){let t=0;for(let j=0;j<k;j++)for(let i=0;i<k;i++)t+=a[(y+j)*w+x+i];o[y*ow+x]=t/(k*k);}return o;}
function ssim(g,[x0,y0,x1,y1]){const w=x1-x0,h=y1-y0,A=new Float64Array(w*h),B=new Float64Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){A[y*w+x]=REF[(y0+y)*W0+x0+x];B[y*w+x]=g[(y0+y)*340+x0+x];}
  const AA=A.map(v=>v*v),BB=B.map(v=>v*v),AB=A.map((v,i)=>v*B[i]);
  const ma=box(A,w,h),mb=box(B,w,h),maa=box(AA,w,h),mbb=box(BB,w,h),mab=box(AB,w,h);
  const C1=6.5025,C2=58.5225;let t=0;for(let i=0;i<ma.length;i++){const va=maa[i]-ma[i]**2,vb=mbb[i]-mb[i]**2,cv=mab[i]-ma[i]*mb[i];
    t+=((2*ma[i]*mb[i]+C1)*(2*cv+C2))/((ma[i]**2+mb[i]**2+C1)*(va+vb+C2));}return t/ma.length;}
const TUNE=[[168,62,290,80],[150,184,250,196],[60,172,100,196],[195,208,225,228],[176,78,245,125],[176,126,290,138]];
const VAL=[[176,30,300,62],[240,40,340,62],[0,184,30,196]];
const mean=(g,R)=>R.reduce((a,r)=>a+ssim(g,r),0)/R.length;
const {DEFAULTS}=await p.evaluate(async()=>{const m=await import('/src/pieces/bg_left.js?t=0');return {DEFAULTS:m.DEFAULTS};});
let P={...DEFAULTS};
const step={dyTop:.5,dwTop:.4,dpTop:.2,dphTop:1,ddTop:.4,dxTop:2,dy2:.5,dw2:.4,dyMid:.5,dyBot:.5,dwMid:.4,dpMid:.2,diagX0:2,diagY0:2,diagX1:2,diagY1:2,beamY:.5,beamH:.7,st0x:3,st0y:1,st1x:3,st1y:1,st2x:3,st2y:1,stA:.1,stW:2};
const ev=async Q=>{const g=await render(Q);return mean(g,TUNE);};
let best=await ev(P);const v0=mean(await render(P),VAL);console.log('start tune',best.toFixed(4),'val',v0.toFixed(4));
for(let it=0;it<4;it++){let imp=false;
  for(const k of Object.keys(step)){for(const d of [1,-1,2,-2]){const Q={...P,[k]:P[k]+d*step[k]};const v=await ev(Q);if(v>best+1e-5){best=v;P=Q;imp=true;}}}
  console.log('iter',it,best.toFixed(4));if(!imp)break;}
const v1=mean(await render(P),VAL);console.log('end tune',best.toFixed(4),'val',v1.toFixed(4));
for(const r of [...TUNE,...VAL])console.log(r.join(','),ssim(await render(DEFAULTS),r).toFixed(3),'->',ssim(await render(P),r).toFixed(3));
console.log(JSON.stringify(P));
await b.close();await s.close();
