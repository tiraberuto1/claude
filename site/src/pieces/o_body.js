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
  // ---- 白い着物 ----
  sm(ctx,[[60,420],[90,385],[170,375],[240,330],[330,300],[430,310],[560,340],[620,380],[600,440],[520,470],[380,480],[250,470],[120,455],[60,445]],'#EDE6DC','#a88c78',0.6);
  // 裾の縁(緑と赤)
  curve(ctx,[[210,350],[280,345],[340,330],[430,320],[520,345]],'#3E9A6A',1.6);
  curve(ctx,[[250,440],[330,462],[420,468],[540,450]],'#C8402A',1.2);
  // 着物の陰影
  A(ctx,0.35,()=>sm(ctx,[[90,420],[200,400],[260,440],[170,460]],'#cdbfb0'));
  A(ctx,0.3,()=>sm(ctx,[[420,400],[520,390],[600,420],[520,460]],'#d8cdbd'));
  // ---- 体の外形 ----
  const body=[[300,215],[340,150],[400,110],[470,95],[560,100],[610,150],[640,215],[700,250],[820,230],[900,260],[1000,300],[1040,380],[960,410],[800,420],[690,430],[690,470],[600,490],[540,470],[430,440],[380,400],[320,370],[290,330],[270,380],[250,400],[190,410],[200,370],[250,330],[280,270]];
  ctx.save();
  sm(ctx,body,'#D4642E');
  ctx.save();ctx.clip();
  const mass=(pts,fill,al)=>A(ctx,al,()=>sm(ctx,pts,fill));
  // 左肩〜腕
  mass([[300,215],[350,150],[420,125],[400,200],[340,250],[300,330],[260,400],[200,400],[250,320],[280,260]],'#E0803A',0.9);
  mass([[260,400],[290,330],[330,300],[320,370]],'#A8703A',0.7);
  // 胴(首周り)
  mass([[420,125],[500,100],[590,115],[620,180],[580,250],[500,280],[430,240]],'#DF7436',0.9);
  mass([[430,150],[470,130],[520,150],[500,200],[450,200]],'#E89048',0.7);
  // 右の肩/胸の影
  mass([[560,180],[620,160],[640,230],[600,290],[540,260]],'#B8683A',0.75);
  mass([[320,230],[360,300],[330,310],[300,260]],'#A8703A',0.7);
  // 腹〜下
  mass([[420,250],[540,270],[640,300],[620,340],[500,330],[420,310]],'#C0642E',0.9);
  // 腿(手前に曲げた脚)
  mass([[400,370],[470,345],[600,345],[690,380],[690,440],[600,450],[470,440]],'#C87A3A',0.95);
  mass([[430,380],[520,360],[640,375],[650,420],[520,430]],'#E09A50',0.8);
  mass([[400,425],[560,455],[690,445],[690,480],[560,490],[430,450]],'#A8703A',0.7);
  // 右脚
  mass([[800,230],[900,260],[1000,300],[1040,380],[960,410],[820,400]],'#C8742E',0.9);
  mass([[850,270],[950,290],[1000,350],[900,370]],'#DE9446',0.7);
  // 足裏
  mass([[560,440],[650,430],[690,455],[670,495],[580,495],[550,470]],'#E0A460',0.95);
  // 赤い飛沫(首周りに集中)
  seed=11;
  for(let i=0;i<420;i++){
    const x=290+rnd()*760,y=95+rnd()*400;
    const dn=Math.hypot(x-470,y-150),db=Math.hypot(x-580,y-330),da=Math.hypot(x-300,y-330);
    const w=dn<150?1:(db<150||da<100)?0.5:0.12; if(rnd()>w)continue;
    ctx.globalAlpha=0.3+rnd()*0.3;ctx.fillStyle=rnd()<0.7?'#D8401E':'#8A2A18';
    const q=M([x,y]);ctx.beginPath();ctx.ellipse(q[0],q[1],(5+rnd()*11)/3,(4+rnd()*8)/3,rnd()*3,0,7);ctx.fill();}
  ctx.globalAlpha=1;
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
  sm(ctx,body,null,brown,0.9);
  ctx.restore();
  // 乳首風の黄点
  blob(ctx,560,190,9,9,'#E8C050',0.9);blob(ctx,450,225,8,7,'#D8A030',0.8);
  // ---- 首の噴血(大きな塊) ----
  seed=9;
  sm(ctx,[[400,115],[420,90],[450,100],[470,80],[500,95],[530,85],[560,105],[540,130],[470,130]],'#A82A18');
  sm(ctx,[[420,112],[440,98],[462,106],[480,92],[505,102],[535,96],[540,118],[480,124]],'#D8401E');
  for(let i=0;i<26;i++){const ang=-Math.PI/2+(rnd()-0.5)*1.6,l=40+rnd()*70;
    const x0=410+rnd()*140,y0=100+rnd()*20;
    ln(ctx,[[x0,y0],[x0+Math.cos(ang)*l*0.5,y0+Math.sin(ang)*l*0.5],[x0+Math.cos(ang)*l,y0+Math.sin(ang)*l]],rnd()<0.5?'#C8381E':'#9A3018',1.0+rnd()*1.4);}
  for(let i=0;i<14;i++)blob(ctx,400+rnd()*200,50+rnd()*70,6+rnd()*8,5+rnd()*6,'#C8381E',0.7,rnd()*3);
  // 手(指)
  sm(ctx,[[190,405],[210,375],[260,370],[285,390],[270,430],[225,440],[190,430]],'#D89040',brown,0.6);
  ln(ctx,[[200,410],[250,400]],brown,0.6);ln(ctx,[[205,425],[255,415]],brown,0.6);
  // 刀傷の墨線(足の脇)
  ln(ctx,[[250,380],[300,495]],ink,1.2);
  // ---- 血痕 ----
  seed=3;
  for(let i=0;i<70;i++){const x=120+rnd()*420,y=340+rnd()*130;
    blob(ctx,x,y,4+rnd()*10,3+rnd()*7,rnd()<0.6?'#D0302A':'#E06050',0.55+rnd()*0.3,rnd()*3);}
  for(let i=0;i<10;i++){const x=240+rnd()*200,y=380+rnd()*90;
    ln(ctx,[[x,y],[x+10+rnd()*20,y+20+rnd()*20]],'#C8302A',1);}
}
