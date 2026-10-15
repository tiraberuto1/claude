export const name='oni';
const C=(x,y)=>[220+x/3,50+y/3];
function poly(ctx,pts,fill,stroke,lw){
  ctx.beginPath();pts.forEach((p,i)=>{const q=C(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});
  ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.lineJoin='round';ctx.stroke();}
}
function smooth(ctx,pts,fill,stroke,lw){
  const P=pts.map(p=>C(p[0],p[1]));const n=P.length;
  ctx.beginPath();
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(i===0){const l=P[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}
    ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||1;ctx.stroke();}
}
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function blob(ctx,cx,cy,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,rnd()*3,0,7);ctx.fill();}
function grad(ctx,x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);stops.forEach(s=>g.addColorStop(s[0],s[1]));return g;}

export function draw(ctx,W,H){
  const ink='#3a2418';
  // ---- 白い着物の布 ----
  smooth(ctx,[[60,470],[90,400],[200,380],[330,340],[460,380],[560,430],[640,490],[300,495],[100,495]],'#efe7dc','#8a6a5a',0.8);
  smooth(ctx,[[250,420],[320,380],[420,390],[520,420],[560,470],[300,490]],'#f6f0e8');
  // 赤い襟/裾
  smooth(ctx,[[160,420],[260,360],[360,335],[420,350],[300,400]],'#c84a3c','#6a2018',0.8);
  smooth(ctx,[[610,250],[700,240],[800,260],[900,300],[900,360],[760,360],[640,330]],'#d4473a','#5a1c14',0.8);
  // ---- 鬼の体 ----
  const body=[[300,240],[330,180],[400,140],[470,125],[540,140],[600,190],[640,260],[650,330],[700,400],[720,470],[600,495],[420,495],[400,430],[330,400],[270,330]];
  smooth(ctx,body,null);
  ctx.save();
  const a=C(300,130),b=C(650,420);
  smooth(ctx,body,grad(ctx,a[0],a[1],b[0],b[1],[[0,'#e2692c'],[0.4,'#d9702a'],[1,'#c0732c']]),ink,1.1);
  ctx.clip();
  // 血と濃淡の斑
  seed=11;
  for(let i=0;i<260;i++){
    const x=300+rnd()*350,y=130+rnd()*350;
    const dh=Math.hypot(x-480,y-190);
    const red=dh<140?0.35:0.12;
    const q=C(x,y);
    ctx.globalAlpha=red*rnd()+0.05;
    blob(ctx,q[0],q[1],1+rnd()*4,1+rnd()*3,rnd()<0.5?'#c42a18':(rnd()<0.5?'#e8a040':'#a05a20'));
  }
  ctx.globalAlpha=1;
  // 筋肉の線
  ctx.strokeStyle='rgba(110,50,20,0.7)';ctx.lineWidth=0.9;
  const ln=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>{const q=C(p[0],p[1]);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]);});ctx.stroke();};
  ln([[340,260],[380,230],[430,225]]);ln([[560,230],[600,260],[610,320]]);
  ln([[420,300],[480,340],[560,330]]);ln([[400,420],[470,400],[560,430]]);
  ln([[500,200],[480,260],[500,300]]);ln([[330,330],[360,380],[400,400]]);
  ctx.restore();
  // 首の血の噴出
  const c=C(480,150);
  const bl=ctx.createRadialGradient(c[0],c[1],2,c[0],c[1],26);
  bl.addColorStop(0,'rgba(190,30,15,0.9)');bl.addColorStop(1,'rgba(200,50,20,0)');
  ctx.fillStyle=bl;ctx.beginPath();ctx.ellipse(c[0],c[1],28,16,0,0,7);ctx.fill();
  ctx.strokeStyle='rgba(200,40,20,0.8)';ctx.lineWidth=1.2;
  seed=5;
  for(let i=0;i<22;i++){const ang=-Math.PI/2+(rnd()-0.5)*2.2,l=8+rnd()*20;
    ctx.beginPath();ctx.moveTo(c[0]+(rnd()-0.5)*20,c[1]);ctx.lineTo(c[0]+Math.cos(ang)*l+(rnd()-.5)*20,c[1]+Math.sin(ang)*l);ctx.stroke();}
  // 足元の血痕
  seed=3;
  [[285,205],[300,210],[255,207],[360,198],[415,214],[452,196],[210,215],[200,222],[540,200]].forEach(p=>{
    for(let i=0;i<5;i++)blob(ctx,p[0]+rnd()*14-7,p[1]+rnd()*6-3,1.5+rnd()*4,1+rnd()*2,'rgba(200,40,25,0.55)');});
  // 鬼の手(下左)
  smooth(ctx,[[170,470],[200,455],[260,440],[290,470],[250,495],[190,495]],'#d98a40',ink,0.8);
  // ---- 左の鬼の顔・髪 ----
  // 髪
  ctx.save();
  seed=21;
  ctx.fillStyle='#5c4e44';
  ctx.beginPath();ctx.moveTo(58,62);
  ctx.bezierCurveTo(62,40,100,38,128,48);ctx.bezierCurveTo(150,56,156,70,152,86);
  ctx.bezierCurveTo(146,98,128,100,118,100);ctx.lineTo(80,98);ctx.bezierCurveTo(60,90,52,72,58,62);ctx.fill();
  ctx.strokeStyle='rgba(30,22,18,0.55)';ctx.lineWidth=0.6;
  for(let i=0;i<70;i++){const x=58+rnd()*95,y=42+rnd()*55;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14+rnd()*12,y-4+rnd()*8);ctx.stroke();}
  ctx.restore();
  // 顔
  ctx.beginPath();ctx.moveTo(88,62);ctx.bezierCurveTo(95,50,118,50,130,60);ctx.bezierCurveTo(138,72,132,92,120,100);
  ctx.bezierCurveTo(108,106,96,100,90,90);ctx.bezierCurveTo(84,80,84,70,88,62);
  ctx.fillStyle=grad(ctx,90,55,125,100,[[0,'#e46a24'],[1,'#e8a838']]);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=0.9;ctx.stroke();
  // 耳
  ctx.fillStyle='#e8934a';ctx.beginPath();ctx.moveTo(90,66);ctx.lineTo(88,53);ctx.lineTo(100,60);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(130,62);ctx.lineTo(134,52);ctx.lineTo(126,58);ctx.fill();ctx.stroke();
  // 目・眉・口
  ctx.strokeStyle=ink;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(98,68);ctx.lineTo(108,72);ctx.moveTo(114,70);ctx.lineTo(126,68);ctx.stroke();
  ctx.fillStyle='#e8dcc0';ctx.fillRect(101,73,5,2);ctx.fillRect(116,72,5,2);
  ctx.strokeStyle='#8a3a1a';ctx.beginPath();ctx.moveTo(108,78);ctx.lineTo(110,86);ctx.stroke();
  ctx.fillStyle='#b81c14';ctx.beginPath();ctx.moveTo(100,88);ctx.quadraticCurveTo(112,86,124,88);ctx.quadraticCurveTo(114,98,104,96);ctx.fill();
  ctx.fillStyle='#f0e8d0';ctx.fillRect(103,88,2,3);ctx.fillRect(112,88,2,3);
  // ---- 左上の持物(刀) ----
  ctx.strokeStyle='#6a86a8';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(14,48);ctx.lineTo(42,100);ctx.stroke();
  ctx.strokeStyle='#cfd8e0';ctx.lineWidth=0.5;ctx.stroke();
  // ---- 右上の赤い髪/面 ----
  const m=ctx.createRadialGradient(312,18,2,312,18,22);
  m.addColorStop(0,'#c8501c');m.addColorStop(1,'rgba(200,100,30,0)');
  ctx.fillStyle=m;ctx.beginPath();ctx.ellipse(312,17,24,14,0.1,0,7);ctx.fill();
  ctx.fillStyle='#d9a040';ctx.beginPath();ctx.ellipse(310,20,10,6,0,0,7);ctx.fill();
}
