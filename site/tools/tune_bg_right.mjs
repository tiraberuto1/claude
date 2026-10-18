// bg_right 専用: SSIM を目的関数とした座標降下。基準は測定にのみ使用。
import { chromium } from 'playwright'; import fs from 'node:fs';
const src=fs.readFileSync('src/pieces/bg_right.js','utf8').replace(/export /g,'');
const refb64=fs.readFileSync('ref/reference.jpg').toString('base64');
const TRAIN0={A:[451,40,490,66],B:[340,66,420,76],C:[630,76,680,130],D:[540,205,640,218],E:[430,122,580,132],F:[622,184,668,193],G:[480,140,520,158],H:[640,140,680,150]};
const HOLD0={X:[356,40,372,66],Y:[600,76,630,125],Z:[500,200,540,214],W:[560,128,600,138]};
const TRAIN={A:[340,25,540,70],B:[420,125,560,225],C:[560,125,680,225]};
const HOLD={D:[340,70,420,125],E:[540,70,680,125],F:[340,225,500,247],G:[470,126,600,160]};
const SPACE={plankL:[0.9,1.1,0.02],flDx:[-4,4,1],flDy:[-3,3,1],seamSlope:[-0.15,0.0,0.01],dashY:[69,74,0.5],dashY2:[127,133,0.5],dashY3:[185,192,0.5],dashPhase:[0,5,0.5]};
for(let i=0;i<4;i++)SPACE['bo'+i]=[-8,8,2];
for(let i=0;i<3;i++)SPACE['sm'+i]=[-3,3,1];
for(let i=0;i<4;i++){SPACE['pk'+i+'x']=[-4,4,1];SPACE['pk'+i+'y']=[-4,4,1];}
const ovb64=fs.readFileSync(process.env.OVERLAY||'/tmp/claude-0/-home-user-claude/f8198fb8-7e82-589a-a2ef-031a55397919/scratchpad/overlay.png').toString('base64');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const pg=await b.newPage();
await pg.setContent('<canvas id=c width=680 height=247></canvas>');
const res=await pg.evaluate(async({src,ovb64,refb64,TRAIN,HOLD,SPACE})=>{
  const mod=new Function(src+';return {draw,P};')(); const {draw,P}=mod;
  const img=new Image();img.src='data:image/jpeg;base64,'+refb64;await img.decode();
  const ov=new Image();ov.src='data:image/png;base64,'+ovb64;await ov.decode();
  const c=document.getElementById('c'),ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0);const rd=ctx.getImageData(0,0,680,247).data;
  const gray=d=>{const g=new Float64Array(680*247);for(let i=0;i<g.length;i++)g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];return g};
  const RG=gray(rd);
  function ssim(G,[x0,y0,x1,y1]){const k=7,C1=6.5025,C2=58.5225;let tot=0,n=0;
    for(let y=y0;y+k<=y1;y++)for(let x=x0;x+k<=x1;x++){let ma=0,mb=0,aa=0,bb=0,ab=0;
      for(let j=0;j<k;j++)for(let i=0;i<k;i++){const a=RG[(y+j)*680+x+i],q=G[(y+j)*680+x+i];ma+=a;mb+=q;aa+=a*a;bb+=q*q;ab+=a*q;}
      const m=k*k;ma/=m;mb/=m;const va=aa/m-ma*ma,vb=bb/m-mb*mb,cv=ab/m-ma*mb;
      tot+=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));n++;}
    return n?tot/n:0;}
  const render=()=>{ctx.clearRect(0,0,680,247);ctx.fillStyle='#000';ctx.fillRect(0,0,680,247);draw(ctx,680,247);ctx.drawImage(ov,0,0);return gray(ctx.getImageData(0,0,680,247).data);};
  const score=(R)=>{const G=render();let s=0,n=0;for(const r of Object.values(R)){s+=ssim(G,r);n++;}return s/n;};
  const before={t:score(TRAIN),h:score(HOLD)};
  const base0=JSON.parse(JSON.stringify(P));const ac=k=>{let m=/^pk(\d)([xyt])$/.exec(k);if(m)return [P.pk[+m[1]],'xyt'.indexOf(m[2])];m=/^(bo|sm)(\d)$/.exec(k);if(m)return [P[m[1]],+m[2]];return [P,k]};const get=k=>{const [o,i]=ac(k);return o[i]};const set=(k,v)=>{const [o,i]=ac(k);o[i]=v};let best=before.t;
  for(let pass=0;pass<2;pass++)for(const k of Object.keys(SPACE)){const [lo,hi,st]=SPACE[k];let bv=get(k);
    for(let v=lo;v<=hi+1e-9;v+=st){set(k,v);const s=score(TRAIN);if(s>best+1e-5){best=s;bv=v;}}set(k,bv);}
  const after={t:best,h:score(HOLD)};
  const tuned=JSON.parse(JSON.stringify(P));const per={};
  for(const k of Object.keys(SPACE)){Object.assign(P,JSON.parse(JSON.stringify(base0)));{const cur=JSON.parse(JSON.stringify(P));Object.assign(P,JSON.parse(JSON.stringify(tuned)));const sv=get(k);Object.assign(P,JSON.parse(JSON.stringify(cur)));set(k,sv);}per[k]=[+(score(TRAIN)-before.t).toFixed(4),+(score(HOLD)-before.h).toFixed(4)];}
  Object.assign(P,JSON.parse(JSON.stringify(tuned))); 
  return {before,after,per,P:JSON.parse(JSON.stringify(P))};
},{src,ovb64,refb64,TRAIN,HOLD,SPACE});
console.log(JSON.stringify(res,null,1));await b.close();
