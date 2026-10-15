// s_left 用パラメータ探索 (座標降下)。基準画像は目的関数の測定にのみ使用し、描画コードには一切埋め込まない。
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const s = await createServer({ server: { port: 6600 + Math.floor(Math.random()*900) }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 680, height: 247 } });
p.on('pageerror', e => console.error('ERR', e.message));
await p.goto(s.resolvedUrls.local[0]);
const res = await p.evaluate(async (rounds) => {
  const W=680,H=247, mod = await import('/src/pieces/index.js'); const pieces = mod.pieces;
  const mine = pieces.findIndex(x=>x.name==='s_left'); const P = pieces[mine].params;
  const refImg = await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='/ref/reference.jpg';});
  const rc=document.createElement('canvas');rc.width=W;rc.height=H;const rx=rc.getContext('2d');rx.drawImage(refImg,0,0);
  const gray=d=>{const o=new Float64Array(W*H);for(let i=0;i<W*H;i++)o[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];return o;};
  const R=gray(rx.getImageData(0,0,W,H).data);
  const layer=(idx)=>{const cvs=document.createElement('canvas');cvs.width=W;cvs.height=H;const x=cvs.getContext('2d');idx.forEach(i=>{const t=document.createElement('canvas');t.width=W;t.height=H;pieces[i].draw(t.getContext('2d'),W,H);x.drawImage(t,0,0);});return cvs;};
  const below=layer(pieces.map((_,i)=>i).filter(i=>i<mine)), above=layer(pieces.map((_,i)=>i).filter(i=>i>mine));
  const work=document.createElement('canvas');work.width=W;work.height=H;const wx=work.getContext('2d',{willReadFrequently:true});
  const mt=document.createElement('canvas');mt.width=W;mt.height=H;const mtx=mt.getContext('2d');
  function render(){wx.fillStyle='#000';wx.fillRect(0,0,W,H);wx.drawImage(below,0,0);mtx.clearRect(0,0,W,H);pieces[mine].draw(mtx,W,H);wx.drawImage(mt,0,0);wx.drawImage(above,0,0);return gray(wx.getImageData(0,0,W,H).data);}
  function ssim(S,[x0,y0,x1,y1]){const k=7,C1=6.5025,C2=58.5225;let sum=0,n=0;
    for(let y=y0;y<=y1-k;y++)for(let x=x0;x<=x1-k;x++){let ma=0,mb=0,aa=0,bb=0,ab=0;for(let j=0;j<k;j++)for(let i=0;i<k;i++){const a=R[(y+j)*W+x+i],bv=S[(y+j)*W+x+i];ma+=a;mb+=bv;aa+=a*a;bb+=bv*bv;ab+=a*bv;}
      ma/=49;mb/=49;const va=aa/49-ma*ma,vb=bb/49-mb*mb,cv=ab/49-ma*mb;sum+=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));n++;}return sum/n;}
  const SEARCH=[[15,70,200,200],[40,100,120,170],[78,142,119,167],[120,165,155,195]];
  const HOLD=[[0,150,100,247],[100,95,200,150],[20,60,70,110]];
  const score=()=>{const S=render();return SEARCH.reduce((a,r)=>a+ssim(S,r),0)/SEARCH.length;};
  const hold=()=>{const S=render();return HOLD.map(r=>ssim(S,r));};
  const init=JSON.parse(JSON.stringify(P)), s0=score(), h0=hold();
  const step=k=>/_x$|_y$/.test(k)?2:/_a$/.test(k)?.1:/_s$/.test(k)?.05:k==='br'?.05:/_w$/.test(k)?.5:/_p$/.test(k)?.5:.3;
  let best=s0;const keys=Object.keys(P);
  for(let r=0;r<rounds;r++){const f=1/Math.pow(2,r);let imp=false;
    let again=true;while(again){again=false;for(const k of keys){for(const d of [1,-1]){const old=P[k];P[k]=old+d*step(k)*f;if(k.endsWith('_w')&&P[k]<1.2)P[k]=old;if(k==='ct'){P[k]=Math.max(0,Math.min(1,P[k]));}
      const sc=score();if(sc>best+1e-5){best=sc;imp=true;again=true;break;}else P[k]=old;}}}
    if(!imp&&r>2)break;}
  return {init,final:JSON.parse(JSON.stringify(P)),s0,s1:best,h0,h1:hold(),
    detail0:null};
}, 5);
console.log(JSON.stringify(res,null,1)); fs.writeFileSync(process.argv[2]||'out/tune_result.json',JSON.stringify(res));
await b.close(); await s.close();
