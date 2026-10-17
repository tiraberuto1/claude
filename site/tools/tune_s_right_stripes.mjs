// s_right 用パラメータ探索 (座標降下, 第8ラウンド: 形・縞も対象)。基準画像は目的関数の測定にのみ使用。描画コードには埋め込まない。
import { chromium } from 'playwright'; import { createServer } from 'vite'; import fs from 'node:fs';

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
  window.__boxes=[[493,100,557,125,'h'],[499,54,548,101,'h'],[592,119,651,152,'h'],[591,84,622,131,'v'],[442,168,490,190,'h'],[456,178,513,205,'h']];
  M.draw(mtx,W,H);const st=M.stats;
  const regionScore=(box)=>{const S=chan(renderData(),LUM);return boxAll(ssimMapBox(R,S,box),box);};
  function ssimMapBox(Rr,S,[x0,y0,x1,y1]){const k=7,C1=6.5025,C2=58.5225,n=49,out=new Float32Array(W*H);
    for(let y=y0;y<=y1-k;y++)for(let x=x0;x<=x1-k;x++){let ma=0,mb=0,aa=0,bb=0,ab=0;for(let j=0;j<k;j++){const o=(y+j)*W+x;for(let i=0;i<k;i++){const a=Rr[o+i],bv=S[o+i];ma+=a;mb+=bv;aa+=a*a;bb+=bv*bv;ab+=a*bv;}}
      ma/=n;mb/=n;const va=aa/n-ma*ma,vb=bb/n-mb*mb,cv=ab/n-ma*mb;out[y*W+x]=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));}return out;}
  const boxAll=(m,[x0,y0,x1,y1])=>{let s=0,n=0;for(let y=y0;y<=y1-7;y++)for(let x=x0;x<=x1-7;x++){s+=m[y*W+x];n++;}return s/n;};
  const scoreBox=(box)=>{const S=chan(renderData(),LUM);return boxAll(ssimMapBox(R,S,box),box);};
  const out=[];
  for(const si of Object.keys(P.S).map(Number)){
    const q=P.S[si];const [rep,Pd]=st.SR[si];
    // 領域 = 縞クリップ多角形の外接矩形(元頂点+現在の頂点オフセット)。描画から取得できないので統計から大まかな箱を与える
    const BOX=window.__boxes[si];
    const [bx0,by0,bx1,by1]=BOX;const mx=Math.floor((bx0+bx1)/2),my=Math.floor((by0+by1)/2);
    const halves=BOX[4]==='h'?[[bx0,by0,mx+3,by1],[mx-3,by0,bx1,by1]]:[[bx0,by0,bx1,my+3],[bx0,my-3,bx1,by1]];
    const base={pitch:q[0],phase:q[1],ang:q[2]};
    const prange=rep?Pd*q[0]:4; // 位相探索範囲
    const search=(box)=>{let best=-9,bp=null;
      const p0=base.pitch;
      const coarse=[];for(let pf=-.15;pf<=.1501;pf+=.05)for(let a=-.1;a<=.1001;a+=.02){for(let ph=rep?0:-4;ph<=(rep?prange:4)+1e-9;ph+=.5)coarse.push([p0*(1+pf),ph,base.ang+a]);}
      const ev=(c)=>{q[0]=c[0];q[1]=c[1];q[2]=Math.max(-.15,Math.min(.15,c[2]));return scoreBox(box);};
      let cb=null;for(const c of coarse){const v=ev(c);if(v>best){best=v;cb=c;}}
      // 微調整: 位相0.1刻み±.5, 角度0.01刻み±.02, ピッチ0.05刻み(相対)±.05
      let fb=cb;for(let pf=-.05;pf<=.0501;pf+=.05)for(let a=-.02;a<=.0201;a+=.01)for(let ph=-.5;ph<=.5001;ph+=.1){const c=[cb[0]*(1+pf/ (1)) ,cb[1]+ph,cb[2]+a];const v=ev(c);if(v>best){best=v;fb=c;}}
      return {c:fb,v:best};};
    // ベースライン
    const b0={pitch:q[0],phase:q[1],ang:q[2]};
    const rest=()=>{q[0]=b0.pitch;q[1]=b0.phase;q[2]=b0.ang;};
    const baseH=halves.map(h=>scoreBox(h)),baseAll=scoreBox(BOX);
    // 半分1で探索 → 半分2で検証 / 逆
    const val=[];for(let h=0;h<2;h++){rest();const r=search(halves[h]);q[0]=r.c[0];q[1]=r.c[1];q[2]=Math.max(-.15,Math.min(.15,r.c[2]));val.push({train:[baseH[h],r.v],val:[baseH[1-h],scoreBox(halves[1-h])]});}
    rest();const full=search(BOX);q[0]=full.c[0];q[1]=full.c[1];q[2]=Math.max(-.15,Math.min(.15,full.c[2]));
    out.push({si,rep,Pd,box:BOX,baseAll,fullBest:full.v,params:[q[0],q[1],q[2]],val});
    window.__prog=si;
  }
  return {final:JSON.parse(JSON.stringify(P)),out};
}, 0);
fs.writeFileSync(process.argv[2]||'out/tune_stripes.json',JSON.stringify(res));
console.log(JSON.stringify(res.out));
await b.close(); await s.close();
