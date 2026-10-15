export async function run(){
  const W=680,H=247;
  const { pieces } = await import('/src/pieces/index.js');
  const mk=()=>{const e=document.createElement('canvas');e.width=W;e.height=H;return e;};
  const below=mk(),above=mk();let seen=false,sc;
  for(const q of pieces){ if(q.name==='s_centre'){seen=true;sc=q;continue;} q.draw((seen?above:below).getContext('2d'),W,H); }
  const img=new Image(); img.src='/ref/reference.jpg'; await img.decode();
  const rc=mk(),rx=rc.getContext('2d');rx.drawImage(img,0,0);
  const gray=d=>{const o=new Float64Array(W*H);for(let i=0;i<W*H;i++)o[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];return o;};
  const R=gray(rx.getImageData(0,0,W,H).data);
  function ssim(S,[x0,y0,x1,y1],mask){const k=7,C1=6.5025,C2=58.5225;const w=x1-x0,h=y1-y0;let tot=0,n=0;
    for(let y=0;y+k<=h;y++)for(let x=0;x+k<=w;x++){if(mask&&Object.values(valid).some(([a,b,c2,d])=>x0+x<c2&&x0+x+k>a&&y0+y<d&&y0+y+k>b))continue;let sa=0,sb=0,saa=0,sbb=0,sab=0;
      for(let j=0;j<k;j++)for(let i=0;i<k;i++){const id=(y0+y+j)*W+x0+x+i,a=R[id],g=S[id];sa+=a;sb+=g;saa+=a*a;sbb+=g*g;sab+=a*g;}
      const N=49,ma=sa/N,mb=sb/N,va=saa/N-ma*ma,vb=sbb/N-mb*mb,cv=sab/N-ma*mb;
      tot+=((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2));n++;}return tot/n;}
  const out=mk(),ox=out.getContext('2d'),tmp=mk();
  function render(P){ox.clearRect(0,0,W,H);ox.drawImage(below,0,0);const t=tmp.getContext('2d');t.clearRect(0,0,W,H);sc.draw(t,W,H,P);ox.drawImage(tmp,0,0);ox.drawImage(above,0,0);return gray(ox.getImageData(0,0,W,H).data);}
  const regs={up:[230,60,330,170],lo:[190,130,300,205],chest:[283,93,313,118]};
  const tune=[0,0,0,0]; // dummy
  const train=[200,58,335,210];           // 目的関数: 両武者を含む領域
  const valid={ vA:[255,100,285,125], vB:[225,160,255,185] };
  const f=P=>{const S=render(P);return ssim(S,train,true)+ssim(S,[283,93,313,118]);};
  const steps={lx:1,ly:1,ux:1,uy:1,cdy:.5,sdx:1,sdy:1,sa0:.05,sa1:.05,bdx:1,bdy:1,ba0:.04,ba1:.04,sr:6,sg:6,sb:6};
  const lim={gl:60,gd:60,sr:50,sg:50,sb:50,lx:6,ly:6,ux:6,uy:6};
  for(const [n,cnt] of Object.entries(sc.VERT))if(!['chest','skirt','armor','sl','face','sw'].includes(n))for(let i=0;i<cnt;i++)for(const ax of 'xy'){steps['d_'+n+'_'+i+ax]=1;lim['d_'+n+'_'+i+ax]=3;}
  const rep=P0=>{const S=render(P0);return Object.fromEntries([...Object.entries(regs),...Object.entries(valid)].map(([k,r])=>[k,+ssim(S,r).toFixed(4)]));};
  const D={...sc.DEF};
  for(const k of Object.keys(steps))if(!(k in D))D[k]=0;
  const before=rep(D);
  let P={...D};let cur=f(P);const start=cur;
  const keys=Object.keys(steps);
  for(let it=0;it<6;it++){let imp=false;
    for(const k of keys){for(const sg of [1,-1]){for(let m=1;m<=6;m++){
      let nv=P[k]+sg*steps[k]*m;const L=lim[k];if(L!==undefined){const b0=D[k];if(Math.abs(nv-b0)>L)break;}
      const Q={...P,[k]:nv};const v=f(Q);if(v>cur+1e-5){cur=v;P=Q;imp=true;}else if(m>2)break;}}}
    if(!imp)break;}
  const out2={};for(const k of keys)if(Math.abs(P[k]-D[k])>1e-9)out2[k]=+P[k].toFixed(3);
  return {start,cur,P:out2,before,after:rep(P)};
}
