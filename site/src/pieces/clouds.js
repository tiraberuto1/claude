export const name='clouds';
// 乱数(決定的)
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function path(ctx,pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const p=pts[i];
    if(p.length===2)ctx.lineTo(p[0],p[1]);else if(p.length===4)ctx.quadraticCurveTo(p[0],p[1],p[2],p[3]);else ctx.bezierCurveTo(p[0],p[1],p[2],p[3],p[4],p[5]);}
  ctx.closePath();}
function lerp(a,b,t){return a+(b-a)*t;}
export function draw(ctx,W,H){
  const sx=W/680,sy=H/247;
  ctx.save();ctx.scale(sx,sy);
  const R=rng(7);
  // 各霞の形(画像座標)
  const shapes=[
    // 上段 左の帯 + 右の膨らみ
    {up:true,pts:[[-5,-5],[690,-5],[690,3],[560,3],[420,3],[345,3],[300,6],[285,22],[283,34],[275,42],[240,47],[200,47],[172,45],[170,40],[-5,40]],
     a:0.9},
    // 上段 中央の大雲
    {up:true,pts:[[339,14],[342,12],[400,10],[480,8],[560,4],[690,-2],[690,3],[690,34],[640,37],[570,39],[548,40],[420,41],[345,41],[336,40],[339,27]],a:0.9,fade:true},
    // 上段 右下の膨らみ
    {up:true,pts:[[530,48],[540,43],[580,40],[690,38],[690,50],[540,50]],a:0.85},
    // 下段 左
    {pts:[[-5,194],[150,194],[175,198,188,212],[190,225,176,234],[150,238],[-5,238]],a:0.9},
    {pts:[[-5,237],[500,237],[690,237],[690,252],[-5,252]],a:0.92},
    // 下段 右
    {pts:[[500,245],[500,236],[520,231,560,230],[690,230],[690,252],[500,252]],a:0.9},
    {pts:[[574,215],[576,206,598,201],[690,200],[690,232],[600,232],[580,228,574,215]],a:0.88},
    // 左右縁の小さな霞
    {pts:[[-5,72],[10,72],[24,76,28,92],[26,108,14,115],[-5,116]],a:0.75},
    {pts:[[690,88],[664,88],[652,92,650,102],[652,114,668,118],[690,120]],a:0.8},
  ];
  for(const s of shapes){
    ctx.save();
    path(ctx,s.pts);
    // 横方向グラデ: 左は青、右は黄味
    const g=ctx.createLinearGradient(0,0,680,0);
    if(s.up){
      g.addColorStop(0,'rgb(128,147,138)');g.addColorStop(0.45,'rgb(134,144,130)');
      g.addColorStop(0.72,'rgb(138,145,128)');g.addColorStop(1,'rgb(160,151,126)');
    }else{
      g.addColorStop(0,'rgb(120,142,132)');g.addColorStop(0.5,'rgb(128,140,124)');g.addColorStop(1,'rgb(126,141,130)');
    }
    ctx.globalAlpha=Math.min(1,s.a+0.08);ctx.fillStyle=g;ctx.fill();
    ctx.globalAlpha=1;
    ctx.clip();
    // 絹目・ムラ
    for(let i=0;i<260;i++){
      const x=R()*680,y=R()*252,w=10+R()*50,h=2+R()*8;
      const t=R();
      ctx.fillStyle=t<0.5?'rgba(175,165,125,0.08)':'rgba(95,130,150,0.09)';
      ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,7);ctx.fill();
    }
    // 金砂子風の細かな粒
    for(let i=0;i<500;i++){
      ctx.fillStyle=R()<0.6?'rgba(200,185,130,0.22)':'rgba(215,215,190,0.16)';
      ctx.fillRect(R()*680,R()*252,1,1);
    }
    ctx.restore();
    // 縁の濃い線
    ctx.save();path(ctx,s.pts);ctx.lineWidth=0.9;ctx.strokeStyle='rgba(70,95,105,0.35)';ctx.stroke();ctx.restore();
  }
  // 下端の横線(霞の重なり)
  ctx.strokeStyle='rgba(70,95,110,0.35)';ctx.lineWidth=0.8;
  const ln=(x0,y0,x1,y1,cx,cy)=>{ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cx,cy,x1,y1);ctx.stroke();};
  ln(0,40,170,40,80,40);
  ln(340,40,560,40,450,40);
  ln(0,237,690,237,300,237);
  ln(60,212,160,212,110,205);ln(70,222,170,222,120,214);ln(40,205,175,205,110,200);
  ln(520,232,690,231,600,231);
  ln(580,214,690,212,630,211);
  // 上端の細帯の境(y≈4)
  ln(0,3,690,3,300,3);
  // すやりの内側輪郭(上左の弧)
  ctx.strokeStyle='rgba(75,100,115,0.4)';
  ctx.beginPath();ctx.moveTo(172,18);ctx.bezierCurveTo(230,12,252,24,240,26);ctx.bezierCurveTo(250,38,200,40,185,44);ctx.stroke();
  ctx.beginPath();ctx.moveTo(285,26);ctx.bezierCurveTo(260,40,230,42,200,45);ctx.stroke();
  ctx.beginPath();ctx.moveTo(372,5);ctx.bezierCurveTo(380,28,400,22,440,18);ctx.stroke();
  ctx.restore();
}
