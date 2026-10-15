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
const score=async P=>{const r=await ev(P,TRAIN);return (r[0]+r[1]+r[2])/3;};
const DEF=await p.evaluate(async()=>(await import('/src/pieces/o_garment.js')).DEF);
const steps={bx:[1,2],by:[1,2],sx:[0.01,0.03],sy:[0.01,0.03],tipx:[1,3],tipy:[1,3],dl:[4,8],dark:[0.03,0.08],mstep:[1,2],mph:[1,2],mpy:[1,2],fx:[1,3],fy:[1,3],fs:[0.03,0.08],fdl:[4,8],lw:[1,2],gl:[1,2],tdx:[1,2],tdy:[1,2],bpx:[2,5],bpy:[2,5]};
for(let i=0;i<16;i++){steps['vx'+i]=[1,3];steps['vy'+i]=[1,3];}
const BND={bx:[-6,6],by:[-6,6],sx:[0.94,1.06],sy:[0.94,1.06],tipx:[-6,6],tipy:[-6,6],dl:[-20,20],dark:[0,0.3],mstep:[8,14],mph:[0,10],mpy:[0,10],fx:[-6,6],fy:[-6,6],fs:[0.9,1.15],fdl:[-20,8],lw:[-3,4],gl:[-3,4],tdx:[-4,4],tdy:[-4,4],bpx:[-12,12],bpy:[-8,8]};
for(let i=0;i<16;i++){BND['vx'+i]=[-6,6];BND['vy'+i]=[-6,6];}
const bin=[];
let P={...DEF},best=await score(P);console.log('base',best,await ev(P,TRAIN),await ev(P,VAL));
// 離散項目
for(const k of bin){const Q={...P,[k]:1-P[k]};const v=await score(Q);console.log(k,v);if(v>best){best=v;P=Q;}}
for(let round=0;round<6;round++){let imp=false;
  for(const [k,st] of Object.entries(steps)){for(const d of st){for(const sg of [1,-1]){
    let moved=true;while(moved){moved=false;const Q={...P,[k]:+(P[k]+sg*d).toFixed(3)};const bd=BND[k];if(bd&&(Q[k]<bd[0]||Q[k]>bd[1]))break;
      const v=await score(Q);if(v>best+1e-5){best=v;P=Q;moved=true;imp=true;}}}}}
  console.log('round',round,best,JSON.stringify(P));if(!imp)break;}
console.log('FINAL',JSON.stringify(P));console.log('train',await ev(P,TRAIN));console.log('val',await ev(P,VAL),'val base',await ev(DEF,VAL));
fs.writeFileSync('out/tune_o_garment.json',JSON.stringify(P));
await b.close();await s.close();
