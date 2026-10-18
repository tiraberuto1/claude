// o_garment 専用: SSIM を目的関数にした座標降下。使い方: node tools/tune_o_garment.mjs
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const s=await createServer({server:{port:6200+Math.floor(Math.random()*2000),hmr:false,watch:null},logLevel:'error'});await s.listen();
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:680,height:247}});
p.on('pageerror',e=>console.error('PAGEERR',e.message));
await p.goto(s.resolvedUrls.local[0]+'tools/tune_o_garment.html');await p.waitForFunction('window.__ready',null,{timeout:60000});
const TRAIN=[[420,125,600,205],[536,150,595,192],[400,110,620,215]];
const VAL=[[450,178,545,208],[555,140,605,198],[425,128,470,175]];
const ev=(P,R)=>p.evaluate(([P,R])=>window.evalP(P,R),[P,R]);
const DEF=await p.evaluate(async()=>(await import('/src/pieces/o_garment.js')).DEF);
const steps={bx:[1,2],by:[1,2],sx:[0.01,0.03],sy:[0.01,0.03],tipx:[1,3],tipy:[1,3],dl:[4,8],dark:[0.03,0.08],lw:[1,2],gl:[1,2],tdx:[1,2],tdy:[1,2],bpx:[2,5],bpy:[2,5],fx:[1],fy:[1],fs:[0.03],fdl:[4],gam:[0.5],gpe:[1],gph:[0.5],ma:[0.01],msx:[0.1],mph:[0.1,0.5],mpy:[0.1,0.5]};
for(let i=0;i<16;i++){steps['vx'+i]=[1,2];steps['vy'+i]=[1,2];}
const BND={bx:[-6,6],by:[-6,6],sx:[0.94,1.06],sy:[0.94,1.06],tipx:[-4,4],tipy:[-4,4],dl:[-20,20],dark:[0,0.3],fx:[2,8],fy:[-3,3],fs:[0.9,1.15],fdl:[-20,8],lw:[-3,4],gl:[-3,4],tdx:[-4,4],tdy:[-4,4],bpx:[-12,12],bpy:[-8,8],gam:[1,2],gpe:[8,12],gph:[0,6.3],ma:[-0.1,0.1],msx:[8.5,23],mph:[-30,30],mpy:[-30,30]};
for(let i=0;i<16;i++){BND['vx'+i]=[-4,4];BND['vy'+i]=[-4,4];}
let P={...DEF};
for(let i=0;i<16;i++){P['vx'+i]=Math.max(-4,Math.min(4,P['vx'+i]));P['vy'+i]=Math.max(-4,Math.min(4,P['vy'+i]));}
P.tipx=Math.min(4,P.tipx);P.tipy=Math.min(4,P.tipy);
const score=async Q=>{const r=await ev(Q,TRAIN);return (r[0]+r[1]+r[2])/3;};
let best=await score(P);const START={...P};console.log('start',best,await ev(P,TRAIN),await ev(P,VAL));
// 段階A: 紋の格子(間隔・角度・位相)を全探索
if(!process.env.SKIP_A){const bases=[[8.5,11.5,0.5],[12,16,1],[17,23,1.5]];
for(const [lo,hi,sp] of bases)for(let m=lo;m<=hi+1e-9;m+=sp)for(let a=-0.1;a<=0.1001;a+=0.05)
  for(let px=0;px<m;px+=1.5)for(let py=0;py<m;py+=1.5){
    const Q={...P,msx:m,ma:a,mph:px,mpy:py};const v=await score(Q);if(v>best){best=v;P=Q;}}
}
console.log('A',best,P.msx,P.ma,P.mph,P.mpy);
for(let round=0;round<6;round++){let imp=false;
  for(const [k,st] of Object.entries(steps)){for(const d of st){for(const sg of [1,-1]){
    let moved=true;while(moved){moved=false;const Q={...P,[k]:+(P[k]+sg*d).toFixed(3)};const bd=BND[k];if(bd&&(Q[k]<bd[0]||Q[k]>bd[1]))break;
      const v=await score(Q);if(v>best+1e-5){best=v;P=Q;moved=true;imp=true;}}}}}
  console.log('round',round,best);if(!imp)break;}
console.log('FINAL',JSON.stringify(P));console.log('train',await ev(P,TRAIN),'start',await ev(START,TRAIN));console.log('val',await ev(P,VAL),'val start',await ev(START,VAL));
fs.writeFileSync('out/tune_o_garment.json',JSON.stringify(P));
await b.close();await s.close();
