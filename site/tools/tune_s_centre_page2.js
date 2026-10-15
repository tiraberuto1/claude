// 縞の位相・ピッチ・角度の全探索(低次元)。基準は測定のみに使用
export async function run(){
  const W=680,H=247;
  const sc=await import('/src/pieces/s_centre.js');
  const { pieces } = await import('/src/pieces/index.js');
  const mk=()=>{const e=document.createElement('canvas');e.width=W;e.height=H;return e;};
  const below=mk(),above=mk();let seen=false;
  for(const q of pieces){ if(q.name==='s_centre'){seen=true;continue;} q.draw((seen?above:below).getContext('2d'),W,H); }
  const img=new Image(); img.src='/ref/reference.jpg'; await img.decode();
  const rx=mk().getContext('2d');rx.drawImage(img,0,0);
  const gray=d=>{const o=new Float64Array(W*H);for(let i=0;i<W*H;i++)o[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];return o;};
  const R=gray(rx.getImageData(0,0,W,H).data);
  function ssim(S,[x0,y0,x1,y1]){const k=7,C1=6.5025,C2=58.5225;let tot=0,n=0;
    for(let y=y0;y+k<=y1;y++)for(let x=x0;x+k<=x1;x++){let sa=0,sb=0,saa=0,sbb=0,sab=0;
      for(let j=0;j<k;j++)for(let i=0;i<k;i++){const id=(y+j)*W+x+i,a=R[id],g=S[id];sa+=a;sb+=g;saa+=a*a;sbb+=g*g;sab+=a*g;}
      const N=49,ma=sa/N,mb=sb/N,va=saa/N-ma*ma,vb=sbb/N-mb*mb,cv=sab/N-ma*mb;
      tot+=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));n++;}return tot/n;}
  const ox=mk().getContext('2d'),tmp=mk();
  function render(P){ox.clearRect(0,0,W,H);ox.drawImage(below,0,0);const t=tmp.getContext('2d');t.clearRect(0,0,W,H);sc.draw(t,W,H,P);ox.drawImage(tmp,0,0);ox.drawImage(above,0,0);return gray(ox.getImageData(0,0,W,H).data);}
  const ev=(P,r)=>ssim(render(P),r);
  const out={};
  const groups={
    chest:{train:[283,93,299,118],valid:[298,93,313,118],all:[283,93,313,118],
      ph:'cdy',pi:'cp',angs:['ca'],pr:[1.6,2.3,.025],aw:.1},
    skirt:{train:[245,100,275,142],valid:[275,100,308,142],all:[245,100,308,142],
      ph:'sdy',pi:'sp',angs:['sa0','sa1'],pr:[1.6,2.3,.025],aw:.1},
    body:{train:[215,150,240,185],valid:[240,150,265,185],all:[215,150,265,185],
      ph:'bdy',pi:'bp',angs:['ba0','ba1'],pr:[3.2,4.3,.05],aw:.1}};
  for(const [name,g] of Object.entries(groups)){
    const base={...sc.DEF};
    const res={before:{train:ev(base,g.train),valid:ev(base,g.valid),all:ev(base,g.all)}};
    let P={...base};
    const fit=(region)=>{
      let Q={...base},best=-9;
      const p0=base[g.ph];
      // 位相×ピッチ全探索(0.1px刻み)
      for(let pi=g.pr[0];pi<=g.pr[1]+1e-9;pi+=g.pr[2])for(let ph=0;ph<2*pi;ph+=.1){
        const T={...Q,[g.pi]:pi,[g.ph]:ph};const v=ev(T,region);if(v>best){best=v;var B=T;}}
      Q=B;
      for(let it=0;it<2;it++){
        for(const a of g.angs){const a0=base[a];let bb=best;let bv=Q[a];
          for(let d=-g.aw;d<=g.aw+1e-9;d+=.01){const T={...Q,[a]:a0+d};const v=ev(T,region);if(v>bb){bb=v;bv=a0+d;}}
          Q[a]=bv;best=bb;}
        // 位相再探索
        let bp=Q[g.ph];for(let d=-1;d<=1;d+=.1){const T={...Q,[g.ph]:Q[g.ph]+d};const v=ev(T,region);if(v>best){best=v;bp=T[g.ph];}}Q[g.ph]=bp;
      }
      return {Q,best};
    };
    const f1=fit(g.train);
    res.fitTrain={train:f1.best,valid:ev(f1.Q,g.valid),all:ev(f1.Q,g.all),params:Object.fromEntries([g.ph,g.pi,...g.angs].map(k=>[k,+f1.Q[k].toFixed(3)]))};
    const f2=fit(g.all);
    res.fitAll={all:f2.best,train:ev(f2.Q,g.train),valid:ev(f2.Q,g.valid),params:Object.fromEntries([g.ph,g.pi,...g.angs].map(k=>[k,+f2.Q[k].toFixed(3)]))};
    out[name]=res;
  }
  return out;
}
