// s_right 用パラメータ探索 (座標降下, 第8ラウンド: 形・縞も対象)。基準画像は目的関数の測定にのみ使用。描画コードには埋め込まない。
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';
const rounds=+process.argv[3]||4;
const s = await createServer({ server: { port: 6600 + Math.floor(Math.random()*900) }, logLevel: 'error' }); await s.listen();
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 680, height: 247 } });
p.on('pageerror', e => console.error('ERR', e.message));
await p.goto(s.resolvedUrls.local[0]);
const res = await p.evaluate(async (rounds) => {
  const W=680,H=247, mod = await import('/src/pieces/index.js'); const pieces = mod.pieces;
  const mine = pieces.findIndex(x=>x.name==='s_right'); const M=pieces[mine]; const P=M.params;
  Object.keys(M.PIV).forEach(g=>{ if(!P[g])P[g]=[0,0,0,1]; });
  const refImg = await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='/ref/reference.jpg';});
  const rc=document.createElement('canvas');rc.width=W;rc.height=H;const rx=rc.getContext('2d');rx.drawImage(refImg,0,0);
  const RD=rx.getImageData(0,0,W,H).data;
  const chan=(d,f)=>{const o=new Float64Array(W*H);for(let i=0;i<W*H;i++)o[i]=f(d[i*4],d[i*4+1],d[i*4+2]);return o;};
  const LUM=(r,g,b)=>.299*r+.587*g+.114*b;
  const R=chan(RD,LUM);
  const layer=(idx)=>{const cvs=document.createElement('canvas');cvs.width=W;cvs.height=H;const x=cvs.getContext('2d');idx.forEach(i=>{const t=document.createElement('canvas');t.width=W;t.height=H;pieces[i].draw(t.getContext('2d'),W,H);x.drawImage(t,0,0);});return cvs;};
  const below=layer(pieces.map((_,i)=>i).filter(i=>i<mine)), above=layer(pieces.map((_,i)=>i).filter(i=>i>mine));
  const work=document.createElement('canvas');work.width=W;work.height=H;const wx=work.getContext('2d',{willReadFrequently:true});
  const mt=document.createElement('canvas');mt.width=W;mt.height=H;const mtx=mt.getContext('2d');
  function renderData(){wx.fillStyle='#000';wx.fillRect(0,0,W,H);wx.drawImage(below,0,0);mtx.clearRect(0,0,W,H);M.draw(mtx,W,H);wx.drawImage(mt,0,0);wx.drawImage(above,0,0);return wx.getImageData(0,0,W,H).data;}
  const X0=420,Y0=35,X1=680,Y1=200;
  function ssimMap(Rr,S,k){const C1=6.5025,C2=58.5225,n=k*k,out=new Float32Array(W*H);
    for(let y=Y0;y<=Y1-k;y++)for(let x=X0;x<=X1-k;x++){let ma=0,mb=0,aa=0,bb=0,ab=0;for(let j=0;j<k;j++){const o=(y+j)*W+x;for(let i=0;i<k;i++){const a=Rr[o+i],bv=S[o+i];ma+=a;mb+=bv;aa+=a*a;bb+=bv*bv;ab+=a*bv;}}
      ma/=n;mb/=n;const va=aa/n-ma*ma,vb=bb/n-mb*mb,cv=ab/n-ma*mb;out[y*W+x]=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));}return out;}
    const inTrain=(x,y)=>((Math.floor(x/10)+Math.floor(y/10))&1)===0;
  const boxMean=(m,[x0,y0,x1,y1],which)=>{let s=0,n=0;for(let y=y0;y<=y1-7;y++)for(let x=x0;x<=x1-7;x++){const tr=inTrain(x,y);if(which==='train'&&!tr)continue;if(which==='val'&&tr)continue;s+=m[y*W+x];n++;}return s/n;};
  const SEARCH=[[420,35,680,200],[460,40,560,130],[540,70,650,190],[600,140,650,185]];
  const score=()=>{const S=chan(renderData(),LUM);const m=ssimMap(R,S,7);return SEARCH.reduce((a,r)=>a+boxMean(m,r,'train'),0)/SEARCH.length;};
  const full=()=>{const d=renderData();const out={};
    const m7=ssimMap(R,chan(d,LUM),7);out.luma7={all:boxMean(m7,SEARCH[0]),val:boxMean(m7,SEARCH[0],'val'),train:boxMean(m7,SEARCH[0],'train'),A:boxMean(m7,SEARCH[1]),B:boxMean(m7,SEARCH[2]),leg:boxMean(m7,SEARCH[3]),C:boxMean(m7,[440,135,510,205])};
    const m11=ssimMap(R,chan(d,LUM),11);out.luma11={all:boxMean(m11,SEARCH[0]),val:boxMean(m11,SEARCH[0],'val')};
    ['R','G','B'].forEach((ch,ci)=>{const rr=chan(RD,(r,g,b)=>[r,g,b][ci]),ss=chan(d,(r,g,b)=>[r,g,b][ci]);const m=ssimMap(rr,ss,7);out[ch]={all:boxMean(m,SEARCH[0]),val:boxMean(m,SEARCH[0],'val')};});return out;};
  // 構造の把握と初期化
  M.draw(mtx,W,H);const st=M.stats;
  const ensure=(key,n,len,init)=>{if(!P[key])P[key]={};for(let i=0;i<n;i++)if(!P[key][i])P[key][i]=Array.from({length:len(i)},()=>init);};
  P.P=P.P||{};P.PB=P.PB||{};P.L=P.L||{};P.E=P.E||{};P.S=P.S||{};
  st.P.forEach((n,i)=>{if(!P.P[i])P.P[i]=new Array(n*2).fill(0);if(P.PB[i]===undefined)P.PB[i]=1;});
  st.L.forEach((n,i)=>{if(!P.L[i])P.L[i]=[0,0,0,0];});
  st.E.forEach((n,i)=>{if(!P.E[i])P.E[i]=[0,0];});
  st.S.forEach((n,i)=>{if(!P.S[i])P.S[i]=[1,0,0,1,...new Array(n*2).fill(0)];});
  const init=JSON.parse(JSON.stringify(P)); const m0=full(); const s0=score();
  // スロット定義 [取得, 設定, 刻み, 下限, 上限]
  const THIN=new Set(['spearA','spearB','Asword','Bsword','Bsword2','blade','rope']);
  const slots=[];
  Object.keys(M.PIV).forEach(g=>{[0,1,2,3].forEach(i=>{const lo=[-9,-9,-.2,THIN.has(g)?.9:.85][i],hi=[9,9,.2,THIN.has(g)?1.1:1.15][i];slots.push({a:P[g],i,st:[2,2,.04,.04][i],lo,hi});});});
  for(const k in P.P){for(let j=0;j<P.P[k].length;j++)slots.push({a:P.P[k],i:j,st:2,lo:-5,hi:5});slots.push({a:P.PB,i:k,st:.06,lo:.8,hi:1.2});}
  for(const k in P.L)for(let j=0;j<4;j++)slots.push({a:P.L[k],i:j,st:2,lo:-5,hi:5});
  for(const k in P.E)for(let j=0;j<2;j++)slots.push({a:P.E[k],i:j,st:1.5,lo:-4,hi:4});
  for(const k in P.S){const a=P.S[k];slots.push({a,i:0,st:.08,lo:.8,hi:1.25},{a,i:1,st:1,lo:-4,hi:4},{a,i:2,st:.04,lo:-.15,hi:.15},{a,i:3,st:.06,lo:.8,hi:1.25});for(let j=4;j<a.length;j++)slots.push({a,i:j,st:2,lo:-5,hi:5});}
  // 初期値が範囲外ならクランプ
  slots.forEach(t=>{t.a[t.i]=Math.max(t.lo,Math.min(t.hi,t.a[t.i]));});
  let best=score();const t0=performance.now();
  for(let r=0;r<rounds;r++){const f=1/Math.pow(2,r);
    for(const t of slots){for(const d of [1,-1]){const old=t.a[t.i];const nv=Math.max(t.lo,Math.min(t.hi,old+d*t.st*f));if(nv===old)continue;t.a[t.i]=nv;
      const sc=score();if(sc>best+1e-5){best=sc;break;}else t.a[t.i]=old;}}
    window.__prog=[r,best,(performance.now()-t0)/1000];}
  const m1=full();
  return {final:JSON.parse(JSON.stringify(P)),s0,s1:best,m0,m1,nslots:slots.length};
}, rounds);
fs.writeFileSync(process.argv[2]||'out/tune_result.json',JSON.stringify(res));
console.log(JSON.stringify({s0:res.s0,s1:res.s1,n:res.nslots,m0:res.m0,m1:res.m1}));
await b.close(); await s.close();
