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
  const sm=(pts,fill,stroke,lw)=>{const P=pts;const n=P.length;ctx.beginPath();
    for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      if(i===0){const l=P[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}
      ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
    ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}};
  const brown='#7A4A22';
  // 白い着物
  sm([[238,200],[250,182],[300,172],[360,165],[420,172],[445,190],[440,214],[300,216],[245,214]],'#F2EBE3','#9a7a66',0.6);
  sm([[240,196],[300,184],[360,178],[420,186],[444,196]],null,'#3E9A6A',1.6);
  sm([[300,178],[340,168],[380,164]],null,'#C8402A',1.4);
  // 右の赤い着物
  sm([[430,132],[460,126],[500,132],[535,150],[542,180],[520,196],[470,190],[440,170]],'#D8452F','#6a2018',0.7);
  ctx.fillStyle='#3A5AA8';
  for(let y=136;y<192;y+=11)for(let x=440+((y/11|0)%2)*6;x<535;x+=12){ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();}
  // 体(4パス)
  const body=[[318,130],[324,108],[345,96],[365,98],[378,90],[395,96],[414,108],[432,128],[442,152],[470,170],[520,160],[538,176],[522,200],[470,213],[420,214],[380,206],[340,200],[300,206],[288,186],[303,160]];
  ctx.save();
  sm(body,'#C98B3E');
  ctx.clip();
  const mass=(pts,fill,al)=>{ctx.globalAlpha=al;sm(pts,fill);ctx.globalAlpha=1;};
  mass([[330,110],[350,100],[372,108],[366,135],[345,150],[324,140]],'#E0A857',0.8);       // 肩
  mass([[385,110],[420,112],[438,140],[428,168],[395,160],[378,135]],'#E0A857',0.7);       // 腹
  mass([[440,160],[480,172],[515,165],[525,190],[470,205],[440,190]],'#E0A857',0.7);       // 太腿
  mass([[298,150],[322,160],[330,200],[300,206],[290,185]],'#A8672A',0.7);                 // 腕影
  mass([[360,150],[380,145],[400,170],[385,200],[350,195]],'#A8672A',0.55);
  mass([[420,195],[470,190],[520,200],[470,214],[425,214]],'#A8672A',0.6);
  seed=11;
  for(let i=0;i<340;i++){
    const x=300+rnd()*240,y=92+rnd()*122;
    const dn=Math.hypot(x-375,y-110),db=Math.hypot(x-410,y-145);
    const w=(dn<45||db<35)?1:0.35; if(rnd()>w)continue;
    ctx.globalAlpha=0.4+rnd()*0.2;
    ctx.fillStyle=rnd()<0.7?'#D8502A':'#E0A857';
    ctx.beginPath();ctx.ellipse(x,y,1+rnd()*4,1+rnd()*3,rnd()*3,0,7);ctx.fill();
  }
  ctx.globalAlpha=1;
  // 筋肉の線(茶褐)
  ctx.strokeStyle=brown;ctx.lineWidth=0.7;
  const ln=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
  ln([[330,140],[350,128],[372,120]]);ln([[385,120],[405,135],[428,140]]);ln([[360,150],[385,175],[400,190]]);
  ln([[445,175],[480,182],[515,176]]);ln([[305,170],[320,185],[330,200]]);ln([[400,112],[412,130],[425,160]]);
  ctx.restore();
  sm(body,null,brown,0.8);
  // 首元の赤斑帯
  seed=5;
  for(let i=0;i<40;i++){ctx.globalAlpha=0.5;ctx.fillStyle='#D8502A';ctx.beginPath();ctx.ellipse(350+rnd()*60,98+rnd()*14,2+rnd()*5,1.5+rnd()*3,0,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  // 噴血 放射線
  for(let i=0;i<38;i++){const ang=-Math.PI/2+(rnd()-0.5)*1.22,l=10+rnd()*15;
    const x0=355+rnd()*40,y0=96+rnd()*6;
    ctx.strokeStyle=rnd()<0.5?'#C8402A':'#E06A3A';ctx.lineWidth=0.8+rnd()*0.7;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+Math.cos(ang)*l,y0+Math.sin(ang)*l);ctx.stroke();}
  // 血痕
  seed=3;
  for(let i=0;i<20;i++){ctx.fillStyle='#D8402A';ctx.globalAlpha=0.8;const x=240+rnd()*200,y=172+rnd()*40;
    ctx.beginPath();ctx.ellipse(x,y,1+rnd()*2.5,1+rnd()*2,rnd()*3,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  // 手
  sm([[272,200],[290,194],[300,206],[290,216],[268,214]],'#D9A050',brown,0.6);
  // ---- 左の鬼の顔・髪 ----
  seed=21;
  ctx.fillStyle='#6A5A48';
  ctx.beginPath();ctx.moveTo(58,64);
  ctx.bezierCurveTo(62,40,100,36,130,46);ctx.bezierCurveTo(152,54,160,72,152,92);
  ctx.bezierCurveTo(146,100,130,102,118,102);ctx.lineTo(80,98);ctx.bezierCurveTo(60,90,52,74,58,64);ctx.fill();
  for(let i=0;i<110;i++){const x=58+rnd()*50,y=42+rnd()*55;
    ctx.strokeStyle=rnd()<0.5?'rgba(40,30,22,0.6)':'rgba(140,120,100,0.5)';ctx.lineWidth=0.6;
    ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+25,y-6,x+50,y+4,x+40+rnd()*50,y+rnd()*14);ctx.stroke();}
  // 顔
  ctx.beginPath();ctx.moveTo(90,56);ctx.bezierCurveTo(102,48,122,50,131,60);ctx.bezierCurveTo(138,74,134,92,124,102);
  ctx.bezierCurveTo(112,108,98,102,92,92);ctx.bezierCurveTo(86,80,86,66,90,56);
  ctx.fillStyle=grad(ctx,90,55,125,102,[[0,'#D86A30'],[0.6,'#E07A38'],[1,'#E8A848']]);ctx.fill();ctx.strokeStyle='#7A3A18';ctx.lineWidth=0.8;ctx.stroke();
  ctx.strokeStyle='rgba(140,50,20,0.7)';ctx.lineWidth=0.8;
  const l2=(a)=>{ctx.beginPath();a.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
  l2([[94,62],[104,68],[110,70]]);l2([[128,62],[120,68],[114,70]]);
  l2([[110,62],[110,72]]);l2([[106,64],[106,70]]);l2([[114,64],[114,70]]);
  l2([[98,76],[104,84]]);l2([[128,76],[122,86]]);l2([[110,74],[108,84],[112,86]]);
  ctx.fillStyle='#F0E4C0';ctx.fillRect(99,72,5,2);ctx.fillRect(118,72,5,2);
  ctx.fillStyle='#B81C14';ctx.beginPath();ctx.moveTo(98,90);ctx.quadraticCurveTo(112,86,126,90);ctx.quadraticCurveTo(114,102,104,98);ctx.fill();
  ctx.fillStyle='#F4ECD6';ctx.fillRect(102,90,2,5);ctx.fillRect(116,90,2,5);
  // ---- 左上の持物(刀) ----
  ctx.strokeStyle='#6a86a8';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(14,48);ctx.lineTo(42,100);ctx.stroke();
  ctx.strokeStyle='#cfd8e0';ctx.lineWidth=0.5;ctx.stroke();
  // ---- 右上の赤い髪/面 ----
  const m=ctx.createRadialGradient(312,18,2,312,18,22);
  m.addColorStop(0,'#c8501c');m.addColorStop(1,'rgba(200,100,30,0)');
  ctx.fillStyle=m;ctx.beginPath();ctx.ellipse(312,17,24,14,0.1,0,7);ctx.fill();
  ctx.fillStyle='#d9a040';ctx.beginPath();ctx.ellipse(310,20,10,6,0,0,7);ctx.fill();
}
