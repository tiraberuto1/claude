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
const steps={bx:[1,2,4],by:[1,2,4],sx:[0.02,0.05],sy:[0.02,0.05],tipx:[2,5],tipy:[2,5],dl:[6,12],dark:[0.05,0.1],mstep:[1,3],mph:[1,2],fx:[1,3],fy:[1,3],fs:[0.05,0.1],fdl:[6,12]};
const bin=['motif','wrink','hl','toes','blood'];
let P={...DEF},best=await score(P);console.log('base',best,await ev(P,TRAIN),await ev(P,VAL));
// 離散項目
for(const k of bin){const Q={...P,[k]:1-P[k]};const v=await score(Q);console.log(k,v);if(v>best){best=v;P=Q;}}
for(let round=0;round<4;round++){let imp=false;
  for(const [k,st] of Object.entries(steps)){for(const d of st){for(const sg of [1,-1]){
    let moved=true;while(moved){moved=false;const Q={...P,[k]:+(P[k]+sg*d).toFixed(3)};if(k==='dark'&&(Q.dark<0||Q.dark>0.6))break;if(k==='mstep'&&Q.mstep<5)break;
      const v=await score(Q);if(v>best+1e-5){best=v;P=Q;moved=true;imp=true;}}}}}
  console.log('round',round,best,JSON.stringify(P));if(!imp)break;}
console.log('FINAL',JSON.stringify(P));console.log('train',await ev(P,TRAIN));console.log('val',await ev(P,VAL),'val base',await ev(DEF,VAL));
fs.writeFileSync('out/tune_o_garment.json',JSON.stringify(P));
await b.close();await s.close();
