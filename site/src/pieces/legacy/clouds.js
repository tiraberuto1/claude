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
    // 上段 左の帯 + 丸い舌状の膨らみ
    {up:true,pts:[[-5,-5],[690,-5],[690,3],[345,3],[300,6],[288,16,284,30],[280,44,250,47],[215,50,180,46],[171,44,170,38],[-5,40]],a:0.9},
    // 上段 中央の大雲(左端は丸い舌)
    {up:true,pts:[[470,8],[560,4],[690,-2],[690,34],[640,37],[590,39,560,38],[548,41,520,41],[420,42],[360,42],[338,41,336,30],[334,18,350,14],[400,10]],a:0.92},
    // 上段 右下の丸い塊
    {up:true,pts:[[690,38],[640,38],[590,40,574,44],[550,46,532,48],[560,52],[690,52]],a:0.88},
    // 下段 左
    {pts:[[-5,194],[150,194],[178,195,188,210],[194,224,176,234],[150,238],[-5,238]],a:0.9},
    {pts:[[-5,237],[345,237],[352,252],[-5,252]],a:0.85},
    {pts:[[480,252],[490,240],[500,237],[690,237],[690,252]],a:0.92},
    // 下段 右
    {pts:[[500,246],[498,238,520,231],[545,229,600,230],[690,230],[690,252],[500,252]],a:0.9},
    {pts:[[574,216],[574,206,598,201],[640,200],[690,200],[690,232],[600,232],[580,228,574,216]],a:0.88},
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
    // 縁の濃淡: 縁ほど濃く内側は淡い
    path(ctx,s.pts);
    ctx.lineJoin='round';
    ctx.strokeStyle='rgba(95,130,150,0.12)';ctx.lineWidth=16;ctx.stroke();
    ctx.strokeStyle='rgba(95,130,150,0.14)';ctx.lineWidth=8;ctx.stroke();
    ctx.strokeStyle='rgba(85,120,140,0.16)';ctx.lineWidth=3;ctx.stroke();
    // 内側の重なりの弧線
    ctx.strokeStyle='rgba(95,132,153,0.35)';ctx.lineWidth=0.8;ctx.translate(0,0);
    ctx.restore();
    // 縁の濃い線
    ctx.save();path(ctx,s.pts);ctx.lineWidth=1;ctx.strokeStyle='rgba(95,132,153,0.6)';ctx.stroke();ctx.restore();
  }
  // 下端の横線(霞の重なり)
  ctx.strokeStyle='rgba(70,95,110,0.35)';ctx.lineWidth=0.8;
  const ln=(x0,y0,x1,y1,cx,cy)=>{ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo(cx,cy,x1,y1);ctx.stroke();};
  
  ln(60,212,160,212,110,205);ln(70,222,170,222,120,214);ln(40,205,175,205,110,200);
  ln(585,222,680,220,640,216);ln(525,240,640,236,690,236);
  // 上端の細帯の境(y≈4)
  // すやりの内側輪郭(上左の弧)
  ctx.strokeStyle='rgba(75,100,115,0.4)';
  ctx.beginPath();ctx.moveTo(172,18);ctx.bezierCurveTo(230,12,252,24,240,26);ctx.bezierCurveTo(250,38,200,40,185,44);ctx.stroke();
  ctx.beginPath();ctx.moveTo(285,26);ctx.bezierCurveTo(260,40,230,42,200,45);ctx.stroke();
  ctx.beginPath();ctx.moveTo(372,5);ctx.bezierCurveTo(380,28,400,22,440,18);ctx.stroke();
  ctx.restore();
}
