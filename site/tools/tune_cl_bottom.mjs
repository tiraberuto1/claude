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
  const init=JSON.parse(JSON.stringify(P));
  const v0=score(VA),t0=score(TR);
  // パラメータ一覧
  const keys=[];for(const k in P){if(Array.isArray(P[k]))P[k].forEach((_,i)=>keys.push([k,i]));else keys.push([k,null]);}
  const get=([k,i])=>i===null?P[k]:P[k][i],set=([k,i],v)=>{if(i===null)P[k]=v;else P[k][i]=v;};
  const stepOf=([k,i])=>i!==null?6:(['edge','wash','mottle','gold','arcA'].includes(k)?0.4:(k==='lineA'?0.15:2));
  let best=obj();
  for(let it=0;it<8;it++){
    let imp=false;
    for(const key of keys){
      const s0=stepOf(key)/(1+it*0.6);
      for(const d of [s0,-s0]){
        const old=get(key);let v=old+d;
        if(['edge','wash','mottle','gold','arcA','lineA'].includes(key[0])&&v<0)v=0;
        set(key,v);const o=obj();
        if(o>best+1e-5){best=o;imp=true;}else set(key,old);
      }
    }
    if(!imp)break;
  }
  return {init,P:JSON.parse(JSON.stringify(P)),t0,t1:score(TR),v0,v1:score(VA),best};
},{src,ref,base});
console.log(JSON.stringify(res,null,1));
fs.writeFileSync('out/tune_result.json',JSON.stringify(res));
await b.close();
