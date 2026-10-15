export const name='o_body';
// 作業は拡大クロップ座標(3倍, 原点 220,70)で記述し、画像座標へ変換する
const M=(p)=>[220+p[0]/3,70+p[1]/3];
let seed=5;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function sm(ctx,pts,fill,stroke,lw){
  const P=pts.map(M),n=P.length;ctx.beginPath();
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(i===0){const l=P[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}
    ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
  ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.7;ctx.lineJoin='round';ctx.stroke();}
}
function pgon(ctx,pts,fill,stroke,lw){const P=pts.map(M);ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.7;ctx.lineJoin='round';ctx.stroke();}}
function ln(ctx,pts,col,lw){const P=pts.map(M);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';
  ctx.beginPath();P.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
function curve(ctx,pts,col,lw){const P=pts.map(M);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(P[0][0],P[0][1]);
  for(let i=1;i<P.length-1;i++){const m=[(P[i][0]+P[i+1][0])/2,(P[i][1]+P[i+1][1])/2];ctx.quadraticCurveTo(P[i][0],P[i][1],m[0],m[1]);}
  const l=P[P.length-1];ctx.lineTo(l[0],l[1]);ctx.stroke();}
function blob(ctx,x,y,rx,ry,fill,al,rot){const q=M([x,y]);ctx.globalAlpha=al;ctx.fillStyle=fill;
  ctx.beginPath();ctx.ellipse(q[0],q[1],rx/3,ry/3,rot||0,0,7);ctx.fill();ctx.globalAlpha=1;}
const A=(ctx,al,f)=>{ctx.globalAlpha=al;f();ctx.globalAlpha=1;};

export function draw(ctx,W,H){
  const brown='#8A5026',ink='#4a2a16';
  // ---- 白い着物(体の下から右へ広がる) ----
  sm(ctx,[[52,430],[70,380],[130,345],[200,310],[290,290],[400,285],[520,300],[640,330],[700,375],[690,430],[600,465],[480,475],[330,478],[190,472],[90,462]],'#BFA58C','#8a6c58',0.6);
  A(ctx,0.5,()=>sm(ctx,[[300,300],[420,300],[560,320],[650,360],[620,420],[480,440],[330,430]],'#9C8068'));
  A(ctx,0.55,()=>sm(ctx,[[60,430],[90,390],[170,370],[220,400],[180,450],[100,460]],'#D2BCA4'));
  A(ctx,0.4,()=>sm(ctx,[[240,440],[330,420],[400,450],[330,476],[250,470]],'#E0CDB6'));
  // 縁の緑帯と赤
  curve(ctx,[[70,440],[130,462],[220,474],[330,478],[450,474],[560,458]],'#4a8a60',4);
  curve(ctx,[[75,432],[140,452],[230,462],[340,466]],'#C8402A',1.4);
  curve(ctx,[[210,330],[280,322],[340,308],[430,296],[520,312]],'#3E9A6A',1.6);
  // 着物の滲んだ血
  seed=17;
  for(let i=0;i<14;i++)blob(ctx,120+rnd()*260,370+rnd()*90,10+rnd()*22,6+rnd()*12,'#D04030',0.22,rnd()*3);
  // ---- 体の外形 ----
  const body=[[290,230],[310,170],[345,135],[400,110],[430,95],[470,100],[520,92],[580,105],[620,140],[640,200],[690,235],[760,215],[840,215],[930,250],[1010,300],[1045,370],[990,415],[900,420],[800,425],[700,430],[695,470],[610,495],[540,470],[440,440],[385,405],[330,385],[300,340],[275,385],[250,405],[190,410],[195,370],[245,335],[270,285]];
  ctx.save();
  pgon(ctx,body,'#C2692F');
  ctx.save();ctx.clip();
  const mass=(pts,fill,al)=>A(ctx,al,()=>sm(ctx,pts,fill));
  // 左肩〜腕
  mass([[300,215],[350,150],[420,125],[400,200],[340,250],[300,330],[260,400],[200,400],[250,320],[280,260]],'#CC7430',0.9);
  mass([[260,400],[290,330],[330,300],[320,370]],'#A8703A',0.7);
  // 胴(首周り)
  mass([[420,125],[500,100],[590,115],[620,180],[580,250],[500,280],[430,240]],'#C8702E',0.9);
  mass([[430,150],[470,130],[520,150],[500,200],[450,200]],'#D6883E',0.7);
  // 右の肩/胸の影
  mass([[560,180],[620,160],[640,230],[600,290],[540,260]],'#B8683A',0.75);
  mass([[320,230],[360,300],[330,310],[300,260]],'#A8703A',0.7);
  // 腹〜下
  mass([[420,250],[540,270],[640,300],[620,340],[500,330],[420,310]],'#C0642E',0.9);
  // 腿(手前に曲げた脚)
  mass([[400,370],[470,345],[600,345],[690,380],[690,440],[600,450],[470,440]],'#C87A3A',0.95);
  mass([[430,380],[520,360],[640,375],[650,420],[520,430]],'#D08C44',0.8);
  mass([[400,425],[560,455],[690,445],[690,480],[560,490],[430,450]],'#A8703A',0.7);
  // 右脚
  mass([[800,230],[900,260],[1000,300],[1040,380],[960,410],[820,400]],'#B86A2E',0.9);
  mass([[850,270],[950,290],[1000,350],[900,370]],'#CC8A3E',0.7);
  // 足裏
  mass([[560,440],[650,430],[690,455],[670,495],[580,495],[550,470]],'#E0A460',0.95);
  mass([[300,330],[340,300],[400,330],[430,380],[380,410],[320,380]],'#8C5A2A',0.55);
  mass([[600,300],[700,300],[790,340],[690,380],[620,350]],'#8C5A2A',0.5);
  mass([[420,420],[470,440],[540,490],[440,480]],'#7A4A22',0.5);
  // 濃茶の帯状の影(肩の下・腕の下・胴の下端・脚の境目)
  const band=(pts)=>{curve(ctx,pts,'rgba(138,74,28,0.6)',2.2);};
  band([[330,160],[318,220],[345,280],[325,340]]);
  band([[410,150],[390,200],[420,250],[480,275]]);
  band([[600,130],[630,190],[615,250],[560,285]]);
  band([[330,300],[400,330],[470,345],[600,345],[690,380]]);
  band([[700,240],[760,225],[860,240],[950,285]]);
  band([[430,440],[520,455],[690,445]]);
  // 赤い飛沫(首周りに集中)
  seed=11;
  for(let i=0;i<420;i++){
    const x=290+rnd()*760,y=95+rnd()*400;
    const dn=Math.hypot(x-470,y-150),db=Math.hypot(x-580,y-330),da=Math.hypot(x-300,y-330);
    const w=dn<170?1:(Math.hypot(x-540,y-220)<110)?0.8:(db<150||da<100)?0.25:0.08; if(rnd()>w)continue;
    ctx.globalAlpha=0.3+rnd()*0.3;ctx.fillStyle=rnd()<0.8?'#D8401E':'#B04020';
    const q=M([x,y]);ctx.beginPath();ctx.ellipse(q[0],q[1],(5+rnd()*11)/3,(4+rnd()*8)/3,rnd()*3,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(120,100,95,0.34)';ctx.fillRect(0,0,W,H);
  // 筋肉の輪郭線
  const bl='rgba(120,60,26,0.75)';
  curve(ctx,[[330,170],[320,220],[345,280],[330,330]],bl,0.8);
  curve(ctx,[[420,140],[400,190],[420,240],[470,265]],bl,0.7);
  curve(ctx,[[560,120],[600,150],[610,200],[585,250]],bl,0.7);
  curve(ctx,[[470,280],[540,300],[620,300]],bl,0.7);
  curve(ctx,[[420,380],[500,350],[620,350],[680,390]],bl,0.8);
  curve(ctx,[[430,430],[520,450],[620,450]],bl,0.7);
  curve(ctx,[[830,250],[900,280],[960,300]],bl,0.7);
  ctx.restore();
  pgon(ctx,body,null,brown,0.9);
  ctx.restore();
  // 乳首風の黄点
  blob(ctx,560,190,9,9,'#E8C050',0.9);blob(ctx,450,225,8,7,'#D8A030',0.8);
  // ---- 首の噴血(放射状の細い筋) ----
  seed=9;
  sm(ctx,[[420,118],[445,104],[480,98],[520,102],[545,118],[500,128],[450,128]],'#B83020');
  for(let i=0;i<46;i++){const ang=-Math.PI/2+(rnd()-0.5)*2.2,l=35+rnd()*85;
    const x0=450+(rnd()-0.5)*90,y0=108+rnd()*14,w=1.5+rnd()*3;
    const ex=x0+Math.cos(ang)*l,ey=y0+Math.sin(ang)*l,px=-Math.sin(ang)*w,py=Math.cos(ang)*w;
    sm(ctx,[[x0-px,y0-py],[(x0+ex)/2,(y0+ey)/2],[ex,ey],[(x0+ex)/2+px*0.5,(y0+ey)/2+py*0.5],[x0+px,y0+py]],rnd()<0.5?'#C8402A':(rnd()<0.5?'#E06A3A':'#E08A50'));}
  for(let i=0;i<16;i++)blob(ctx,380+rnd()*190,45+rnd()*70,4+rnd()*7,3+rnd()*5,'#D8502A',0.7,rnd()*3);
  // 手(指)
  sm(ctx,[[190,405],[210,375],[260,370],[285,390],[270,430],[225,440],[190,430]],'#D89040',brown,0.6);
  ln(ctx,[[200,410],[250,400]],brown,0.6);ln(ctx,[[205,425],[255,415]],brown,0.6);
  // 刀傷の墨線(足の脇)
  ln(ctx,[[250,380],[300,495]],ink,1.2);
  // ---- 血痕(斜めの筋と滲み) ----
  seed=3;
  for(let i=0;i<26;i++){const x=70+rnd()*480,y=350+rnd()*110,wt=(x<330)?1:0.5;if(rnd()>wt)continue;
    blob(ctx,x,y,6+rnd()*16,3+rnd()*7,rnd()<0.6?'#C8302A':'#D8604A',0.3+rnd()*0.3,0.6+rnd()*0.5);}
  for(let i=0;i<22;i++){const x=80+rnd()*300,y=345+rnd()*110;
    ln(ctx,[[x,y],[x+8+rnd()*20,y+14+rnd()*26]],'#C8302A',0.6+rnd()*0.8);}
}
