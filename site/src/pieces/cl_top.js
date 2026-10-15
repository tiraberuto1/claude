export const name='cl_top';
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function path(ctx,pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const p=pts[i];
    if(p.length===2)ctx.lineTo(p[0],p[1]);else if(p.length===4)ctx.quadraticCurveTo(...p);else ctx.bezierCurveTo(...p);}
  ctx.closePath();}
export function draw(ctx,W,H){
  const R=rng(11);
  ctx.save();ctx.scale(W/680,H/247);
  // 右上の霞の淡い刷き(紙の暖色が透ける)
  {
    const g=ctx.createLinearGradient(0,0,0,40);
    g.addColorStop(0,'rgba(130,150,142,0.10)');g.addColorStop(1,'rgba(130,150,142,0.45)');
    const m=ctx.createLinearGradient(430,0,560,0);
    ctx.save();ctx.beginPath();ctx.rect(430,0,260,45);ctx.clip();
    ctx.fillStyle=g;ctx.globalAlpha=1;ctx.fillRect(430,0,260,45);ctx.restore();
  }
  const shapes=[
    // 左の帯 + 右へ膨らむ舌
    {a:0.86,c:[128,148,140],pts:[[-5,-5],[300,-5],[300,8],[290,14,284,26],[280,40,250,43],[215,45,190,44],[176,43,171,41],[100,40,50,39],[-5,37]]},
    // 最上端の細帯
    {a:0.7,c:[130,150,142],pts:[[290,-5],[490,-5],[490,3],[420,5],[340,5],[300,4]]},
    // 中央の大雲(左に丸い舌)
    {a:0.88,c:[130,152,150],pts:[[337,31],[336,22,350,15],[358,10,372,8],[430,6],[500,8],[560,12],[560,26],[540,34],[490,38],[440,39],[380,40],[350,40,337,31]]},
    // 右の楕円の塊
    {a:0.82,c:[132,152,148],pts:[[526,54],[528,42,556,37],[590,33,640,30],[700,28],[700,70],[640,69],[580,67],[540,66,526,54]]},
    // 左右縁
    {a:0.8,c:[128,148,142],pts:[[-5,72],[10,72],[24,76,28,92],[26,108,14,115],[-5,116]]},
    {a:0.8,c:[130,150,142],pts:[[700,88],[664,88],[652,92,650,102],[652,114,668,118],[700,120]]},
  ];
  for(const s of shapes){
    const pts=s.pts,[r,gg,b]=s.c;
    ctx.save();path(ctx,pts);
    ctx.fillStyle=`rgba(${r},${gg},${b},${s.a})`;ctx.fill();ctx.clip();
    for(let i=0;i<90;i++){
      const x=R()*680,y=R()*75;
      ctx.fillStyle=R()<0.5?'rgba(190,185,150,0.10)':'rgba(100,130,140,0.08)';
      ctx.beginPath();ctx.ellipse(x,y,8+R()*40,1.5+R()*5,0,0,7);ctx.fill();
    }
    for(let i=0;i<120;i++){ctx.fillStyle=R()<0.6?'rgba(205,190,135,0.3)':'rgba(225,225,200,0.25)';ctx.fillRect(R()*680,R()*75,1,1);}
    ctx.lineJoin='round';path(ctx,pts);
    ctx.strokeStyle='rgba(100,130,138,0.10)';ctx.lineWidth=10;ctx.stroke();
    ctx.lineWidth=4;ctx.stroke();
    ctx.restore();
    ctx.save();path(ctx,pts);ctx.strokeStyle='rgba(105,133,138,0.6)';ctx.lineWidth=0.9;ctx.stroke();ctx.restore();
  }
  ctx.strokeStyle='rgba(105,133,138,0.5)';ctx.lineWidth=0.8;
  const bz=(a)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.bezierCurveTo(...a.slice(2));ctx.stroke();};
  bz([172,12,215,8,262,18,282,30]);bz([180,30,215,22,255,30,270,38]);
  bz([374,8,372,20,400,19,450,19]);bz([420,19,480,20,520,22,560,22]);
  bz([560,36,600,33,640,33,680,32]);
  ctx.restore();
}
