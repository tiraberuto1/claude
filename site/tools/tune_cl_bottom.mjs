// cl_bottom 専用: SSIMを目的関数とする座標降下。基準は測定のみに使用(描画へは埋め込まない)
import { chromium } from 'playwright'; import fs from 'node:fs';
const src=fs.readFileSync('src/pieces/cl_bottom.js','utf8').replace(/export /g,'');
const ref='data:image/jpeg;base64,'+fs.readFileSync('ref/reference.jpg').toString('base64');
const base='data:image/png;base64,'+fs.readFileSync('out/tmp0.png').toString('base64');
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await b.newPage();
const res=await p.evaluate(async ({src,ref,base})=>{
  const load=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});
  const gray=(img)=>{const c=document.createElement('canvas');c.width=680;c.height=247;const x=c.getContext('2d');x.drawImage(img,0,0);return x.getImageData(0,0,680,247);};
  const R=gray(await load(ref)),B=await load(base);
  const mod=new Function(src+';return {P,draw,name};')();
  const P=mod.P;
  const cv=document.createElement('canvas');cv.width=680;cv.height=247;const cx=cv.getContext('2d');
  const G=(d)=>{const g=new Float64Array(680*247);for(let i=0;i<g.length;i++)g[i]=0.299*d.data[i*4]+0.587*d.data[i*4+1]+0.114*d.data[i*4+2];return g;};
  const Rg=G(R);
  const box=(a,x0,y0,x1,y1,k=7)=>{const w=x1-x0,h=y1-y0;const o=new Float64Array((w-k+1)*(h-k+1));return o;};
  function ssim(S,x0,y0,x1,y1){
    const k=7,C1=6.5025,C2=58.5225;let tot=0,n=0;
    for(let y=y0;y+k<=y1;y++)for(let x=x0;x+k<=x1;x++){
      let sa=0,sb=0,saa=0,sbb=0,sab=0;
      for(let j=0;j<k;j++)for(let i=0;i<k;i++){const a=Rg[(y+j)*680+x+i],c=S[(y+j)*680+x+i];sa+=a;sb+=c;saa+=a*a;sbb+=c*c;sab+=a*c;}
      const N=49,ma=sa/N,mb=sb/N,va=saa/N-ma*ma,vb=sbb/N-mb*mb,cvv=sab/N-ma*mb;
      tot+=((2*ma*mb+C1)*(2*cvv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));n++;}
    return tot/n;}
  const TR=[[0,185,230,247],[0,215,300,247],[480,185,680,247],[560,185,680,247]];
  const VA=[[20,196,120,236],[100,190,200,247],[520,225,600,247],[600,225,680,247],[500,195,570,247]];
  function render(){cx.clearRect(0,0,680,247);cx.drawImage(B,0,0);mod.draw(cx,680,247);return G(cx.getImageData(0,0,680,247));}
  const score=(regs)=>{const S=render();return regs.map(r=>ssim(S,...r));};
  const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const obj=()=>mean(score(TR));
  render();  // P.o を初期化
  const init=JSON.parse(JSON.stringify(P));
  const v0=score(VA),t0=score(TR);
  const keys=[];
  for(const k in P){ if(k==='o'){for(const id in P.o)P.o[id].forEach((_,i)=>keys.push(['o',id,i]));}
    else if(Array.isArray(P[k]))P[k].forEach((_,i)=>keys.push([k,i]));else keys.push([k,null]);}
  const get=(K)=>K[0]==='o'?P.o[K[1]][K[2]]:(K[1]===null?P[K[0]]:P[K[0]][K[1]]);
  const set=(K,v)=>{if(K[0]==='o')P.o[K[1]][K[2]]=v;else if(K[1]===null)P[K[0]]=v;else P[K[0]][K[1]]=v;};
  const SOFT=['edge','wash','mottle','gold','arcA','lineA'];
  const stepOf=(K)=>K[0]==='o'?1.5:(K[1]!==null?5:(SOFT.includes(K[0])?0.3:2));
  const BND={lTop:[192.5,196],lBot:[236,239],lTipX:[187,193],lTipY:[209,217],sTop:[237,239.5],sEndX:[354,362],rbTop:[228,231],rbLeft:[498,503],bgTop:[199,202],bgLeft:[572,578],bgBot:[226,231.5]};
  const lo=(K)=>K[1]===null&&BND[K[0]]?BND[K[0]][0]:K[0]==='o'?-5:(K[0]==='edge'||K[0]==='mottle'||K[0]==='gold'?0.2:(SOFT.includes(K[0])?0:-1e9));
  const hi=(K)=>K[1]===null&&BND[K[0]]?BND[K[0]][1]:K[0]==='o'?5:(K[0]==='edge'||K[0]==='mottle'||K[0]==='gold'?1.5:1e9);
  const CORE=[[30,205,150,230],[20,240,340,247],[540,238,660,246],[600,205,680,228]];
  const cmean=(D,r)=>{const[x0,y0,x1,y1]=r;const m=[0,0,0];let n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){for(let c=0;c<3;c++)m[c]+=D.data[(y*680+x)*4+c];n++;}return m.map(v=>v/n);};
  const RM=CORE.map(r=>cmean(R,r));
  const pen=()=>{cx.clearRect(0,0,680,247);cx.drawImage(B,0,0);mod.draw(cx,680,247);const D=cx.getImageData(0,0,680,247);let e=0;CORE.forEach((r,i)=>{const m=cmean(D,r);m.forEach((v,c)=>{e+=Math.max(0,Math.abs(v-RM[i][c])-6);});});return e;};
  const tot=()=>obj()-0.01*pen();
  let best=tot();
  for(let it=0;it<10;it++){
    let imp=false;
    for(const key of keys){
      const s0=stepOf(key)/(1+it*0.5);
      for(const d of [s0,-s0]){
        const old=get(key);const v=Math.min(hi(key),Math.max(lo(key),old+d));
        if(v===old)continue;
        set(key,v);
        const o=tot();
        if(o>best+1e-5){best=o;imp=true;}else set(key,old);
      }
    }
    if(!imp)break;
  }
  const pf=pen();return {pf,init,P:JSON.parse(JSON.stringify(P)),t0,t1:score(TR),v0,v1:score(VA),best};
},{src,ref,base});
console.log(JSON.stringify(res,null,1));
fs.writeFileSync('out/tune_result.json',JSON.stringify(res));
await b.close();
