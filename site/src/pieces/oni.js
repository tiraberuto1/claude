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
  const brown='#7A4A22';
  const sm=(pts,fill,stroke,lw)=>{const P=pts;const n=P.length;ctx.beginPath();
    for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      if(i===0){const l=P[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}
      ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
    ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}};
  const pg=(pts,fill,stroke,lw)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}};
  // 右の赤い着物(体の下から右へ)
  sm([[425,135],[450,128],[490,134],[528,150],[540,180],[525,205],[480,208],[440,200],[425,175]],'#C23A2E','#5a1810',0.7);
  ctx.strokeStyle='rgba(240,150,120,0.55)';ctx.lineWidth=0.6;
  for(let y=140;y<205;y+=9)for(let x=436+((y/9|0)%2)*5;x<530;x+=10){ctx.beginPath();ctx.arc(x,y,2.2,0,7);ctx.stroke();}
  // 白い着物(体の左下から前方へ)
  sm([[236,205],[244,188],[272,178],[310,170],[350,176],[372,196],[380,218],[300,224],[245,222]],'#EDE6DC','#9a7a66',0.6);
  sm([[262,188],[300,176],[340,174],[370,190]],null,'#C8402A',1.8);
  sm([[266,192],[304,180],[342,179],[366,194]],null,'#3E9A6A',1.2);
  // 体
  const body=[[308,190],[304,160],[312,128],[330,108],[356,100],[372,92],[395,96],[412,106],[424,128],[436,155],[446,180],[470,190],[512,184],[522,198],[500,212],[448,224],[400,222],[360,212],[330,208],[300,214],[280,214],[272,200],[290,194]];
  ctx.save();
  sm(body,'#D2602E');
  ctx.clip();
  const mass=(pts,fill,al)=>{ctx.globalAlpha=al;sm(pts,fill);ctx.globalAlpha=1;};
  mass([[316,125],[336,106],[358,104],[352,130],[340,160],[322,168]],'#E07838',0.8);   // 肩
  mass([[372,108],[398,102],[418,125],[420,160],[395,170],[372,150]],'#DC7034',0.8);  // 胴
  mass([[310,160],[330,150],[336,185],[318,196],[304,190]],'#A86A32',0.7);            // 腕影
  mass([[338,160],[362,150],[368,185],[345,198]],'#8C5A2A',0.5);
  mass([[395,165],[432,168],[444,190],[420,200],[395,190]],'#A86A32',0.6);            // 腹の下
  mass([[360,200],[420,190],[450,200],[445,224],[380,224]],'#C07838',0.9);            // 脚(折り曲げ)
  mass([[380,200],[430,195],[445,210],[420,222],[385,220]],'#E0944A',0.7);
  mass([[448,184],[480,190],[515,186],[520,198],[490,208],[455,205]],'#C8742E',0.9);  // 右脚
  seed=11;
  for(let i=0;i<360;i++){
    const x=300+rnd()*230,y=92+rnd()*130;
    const dn=Math.hypot(x-380,y-110),db=Math.hypot(x-410,y-145);
    const w=(dn<45||db<35)?1:0.3; if(rnd()>w)continue;
    ctx.globalAlpha=0.35+rnd()*0.25;
    ctx.fillStyle=rnd()<0.75?'#D8401E':'#8A2A18';
    ctx.beginPath();ctx.ellipse(x,y,1+rnd()*3.5,1+rnd()*2.5,rnd()*3,0,7);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.strokeStyle=brown;ctx.lineWidth=0.7;
  const ln=(pts)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
  ln([[322,128],[334,150],[330,175]]);ln([[360,105],[352,130],[345,160]]);ln([[376,112],[392,128],[415,130]]);
  ln([[398,132],[400,160],[418,170]]);ln([[360,200],[390,192],[432,196]]);ln([[370,212],[400,206],[440,212]]);
  ln([[450,192],[485,196],[515,192]]);
  ctx.restore();
  sm(body,null,brown,0.9);
  // 首の噴出: 太い塊 + 放射
  seed=5;
  ctx.fillStyle='#8A2A18';pg([[362,104],[368,90],[376,96],[384,82],[392,96],[402,86],[404,104],[386,110]],'#8A2A18');
  pg([[366,104],[372,92],[380,98],[387,86],[394,98],[400,92],[400,104],[384,108]],'#D8401E');
  for(let i=0;i<36;i++){const ang=-Math.PI/2+(rnd()-0.5)*1.4,l=10+rnd()*16;
    const x0=362+rnd()*42,y0=98+rnd()*6;
    ctx.strokeStyle=rnd()<0.4?'#8A2A18':(rnd()<0.5?'#D8401E':'#E06A3A');ctx.lineWidth=0.9+rnd()*1.3;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+Math.cos(ang)*l,y0+Math.sin(ang)*l);ctx.stroke();}
  // 血痕
  seed=3;
  for(let i=0;i<30;i++){ctx.fillStyle='#C8302A';ctx.globalAlpha=0.8;const x=244+rnd()*130,y=176+rnd()*44;
    ctx.beginPath();ctx.ellipse(x,y,1+rnd()*2.5,1+rnd()*2,rnd()*3,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  // 手(指のある多角形)
  pg([[284,196],[272,200],[266,208],[270,214],[278,212],[281,219],[288,214],[294,216],[300,208],[300,198]],'#D89040',brown,0.6);
  ln([[272,203],[282,204]]);ln([[274,210],[286,208]]);
  // 足裏
  pg([[500,176],[518,172],[530,178],[532,190],[520,196],[506,196],[498,188]],'#D8884A',brown,0.6);
  ln([[524,178],[522,168]]);ln([[517,175],[515,167]]);ln([[510,175],[508,168]]);
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
  ctx.beginPath();ctx.moveTo(90,54);ctx.lineTo(104,50);ctx.lineTo(122,50);ctx.lineTo(132,58);ctx.lineTo(136,74);ctx.lineTo(132,90);ctx.lineTo(124,103);
  ctx.lineTo(108,106);ctx.lineTo(94,94);ctx.lineTo(87,78);ctx.lineTo(86,64);ctx.closePath();
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
  // ---- 右上の面 ----
  pg([[286,10],[300,5],[322,5],[338,8],[340,22],[330,32],[318,38],[300,38],[292,30],[287,20]],'#D9822A','#8A3A18',0.8);
  pg([[290,12],[305,9],[320,10],[318,17],[300,20]],'#E8A848');
  pg([[296,22],[312,19],[322,22],[318,32],[304,34]],'#A82A20');
  ctx.fillStyle='#F2EAD0';[[300,24],[306,26],[312,25],[316,29],[302,32]].forEach(q=>ctx.fillRect(q[0],q[1],2,3));
  ctx.fillStyle='#3a2a18';ctx.fillRect(292,10,3,2);ctx.fillRect(301,10,3,2);
  ctx.strokeStyle='#D8401E';ctx.lineWidth=1.2;
  for(let k=0;k<10;k++){ctx.beginPath();ctx.moveTo(330+k*0.8,12);ctx.lineTo(334+k*0.8,26+k%3*3);ctx.stroke();}
}
