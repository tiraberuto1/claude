// bg_left 用パラメータ探索。基準は目的関数の測定にのみ使う(描画コードには埋め込まない)
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const REF=fs.readFileSync(process.argv[2]); const W0=680;
const s=await createServer({server:{port:7200+Math.floor(Math.random()*800)},logLevel:'error'});await s.listen();
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage();await p.goto(s.resolvedUrls.local[0]);
async function render(P){for(let t=0;;t++){try{return await p.evaluate(async(P)=>{const m=await import('/src/pieces/bg_left.js?t=0');
  const c=document.createElement('canvas');c.width=680;c.height=247;const x=c.getContext('2d');m.draw(x,680,247,P);
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
let P={...D.D,leaves:D.L.map(l=>[...l])};const P0=JSON.parse(JSON.stringify(P));
const clone=P=>({...P,leaves:P.leaves.map(l=>[...l])});
// ---- 段階A: 点線(短冊): 線ごとに tune/val 領域を分ける
const LINES={
 t:{tune:[168,62,230,80],val:[230,62,290,80],B:{Y:[66.5,68.5],W:[2,3.4],P:[6,8],G:[1.2,3.2]}},
 m:{tune:[176,126,230,138],val:[230,126,290,138],B:{Y:[132,136],W:[2,3.6],P:[6,8],G:[1.2,3.2]}},
 b:{tune:[150,183,200,197],val:[200,183,250,197],B:{Y:[188.5,191],W:[3.5,5.5],P:[6,8],G:[1.2,3.2]}},
 d:{tune:[176,78,245,125],val:[176,78,245,125],B:{W:[2.2,3.6],P:[6,8],G:[1.2,3.2]}},
};
const rep=[];
for(const [n,L] of Object.entries(LINES)){
  const ev=async Q=>ssim(await render(Q),L.tune);
  let best=await ev(P);const v0=ssim(await render(P),L.val);const t0=best;
  for(let it=0;it<3;it++){
    for(const k of ['Y','W','P','G']){ if(!L.B[k])continue; const key=n+k;const st={Y:.25,W:.3,P:.05,G:.25}[k];
      for(const d of [1,-1,2,-2,3,-3]){const Q={...P,[key]:P[key]+d*st};if(Q[key]<L.B[k][0]||Q[key]>L.B[k][1])continue;const v=await ev(Q);if(v>best+1e-5){best=v;P=Q;}}}
    // 位相の全探索(0.1px刻み)
    const key=n+'Ph';let bp=P[key];for(let ph=0;ph<P[n+'P'];ph+=0.1){const v=await ev({...P,[key]:ph});if(v>best+1e-5){best=v;bp=ph;}}P[key]=bp;
  }
  const v1=ssim(await render(P),L.val);rep.push(`${n}: tune ${t0.toFixed(3)}->${best.toFixed(3)} val ${v0.toFixed(3)}->${v1.toFixed(3)}`);
  if(v1<v0-0.003){ // 検証悪化: 採用しない
    for(const k of Object.keys(P))if(k.startsWith(n)&&k!=='leaves')P[k]=P0[k];rep.push(n+': 不採用');}
}
console.log(rep.join('\n'));
// ---- 段階B: 草の葉(全46枚、初期位置から±5px以内)
const TUNE=[[0,46,50,74],[0,118,35,160],[0,160,40,176]],VAL=[[30,46,60,74],[35,118,55,140]];
const inR=(l,R)=>R.some(r=>l[0]+l[2]>r[0]&&l[0]-l[2]<r[2]&&l[1]+l[2]>r[1]&&l[1]-l[2]<r[3]);
const evL=async Q=>mean(await render(Q),TUNE);
const vl0=mean(await render(P),VAL);let bestL=await evL(P);const tl0=bestL;const init=P.leaves.map(l=>[...l]);
const LS=[1.5,1.5,1,.12,.12,.15],LB=[5,5,4,.5,.5,.5];
for(let it=0;it<3;it++)for(let i=0;i<P.leaves.length;i++){if(!inR(P.leaves[i],TUNE))continue;
  for(let j=0;j<6;j++)for(const d of [1,-1,2,-2]){const Q=clone(P);Q.leaves[i][j]+=d*LS[j];
    if(Math.abs(Q.leaves[i][j]-init[i][j])>LB[j]||(j==5&&(Q.leaves[i][5]<.5||Q.leaves[i][5]>2.4)))continue;
    const v=await evL(Q);if(v>bestL+1e-5){bestL=v;P=Q;}}}
const vl1=mean(await render(P),VAL);
console.log(`leaves: tune ${tl0.toFixed(3)}->${bestL.toFixed(3)} val ${vl0.toFixed(3)}->${vl1.toFixed(3)}`);
if(vl1<vl0-0.002){P.leaves=init;console.log('leaves: 不採用');}
const out=clone(P);
for(const k of Object.keys(out)){}
console.log(JSON.stringify(out));
await b.close();await s.close();
