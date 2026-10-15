export const name='cl_top';
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function path(ctx,pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const p=pts[i];
    if(p.length===2)ctx.lineTo(p[0],p[1]);else if(p.length===4)ctx.quadraticCurveTo(...p);else ctx.bezierCurveTo(...p);}
  ctx.closePath();}
export function draw(ctx,W,H){
  const R=rng(11);
  ctx.save();ctx.scale(W/680,H/247);
  const shapes=[
    // 左の帯 + 右へ膨らむ舌
    [[-5,-5],[300,-5],[300,8],[290,14,284,26],[280,40,250,44],[215,46,190,45],[176,44,171,42],[100,41,50,40],[-5,38]],
    // 最上端の細帯
    [[280,-5],[700,-5],[700,6],[560,7],[420,6],[340,8],[300,7]],
    // 中央の大雲(左に丸い舌)
    [[470,6],[560,2],[700,-2],[700,34],[640,36],[590,38],[560,38],[520,40],[440,41],[370,41],[345,41,336,32],[332,22,350,16],[400,14]],
    // 右下の塊
    [[700,30],[640,34],[590,37,560,40],[534,44,528,54],[530,64,560,68],[610,71,700,73]],
    // 左右縁
    [[-5,72],[10,72],[24,76,28,92],[26,108,14,115],[-5,116]],
    [[700,88],[664,88],[652,92,650,102],[652,114,668,118],[700,120]],
  ];
  for(const pts of shapes){
    ctx.save();path(ctx,pts);
    const g=ctx.createLinearGradient(0,0,680,0);
    g.addColorStop(0,'rgb(126,152,162)');g.addColorStop(0.5,'rgb(134,154,154)');g.addColorStop(1,'rgb(146,156,148)');
    ctx.fillStyle=g;ctx.globalAlpha=0.95;ctx.fill();ctx.globalAlpha=1;ctx.clip();
    for(let i=0;i<120;i++){
      const x=R()*680,y=R()*75;
      ctx.fillStyle=R()<0.5?'rgba(170,175,160,0.10)':'rgba(95,130,155,0.10)';
      ctx.beginPath();ctx.ellipse(x,y,8+R()*40,1.5+R()*5,0,0,7);ctx.fill();
    }
    for(let i=0;i<150;i++){ctx.fillStyle=R()<0.6?'rgba(205,190,135,0.3)':'rgba(225,225,200,0.25)';ctx.fillRect(R()*680,R()*75,1,1);}
    ctx.lineJoin='round';path(ctx,pts);
    ctx.strokeStyle='rgba(88,125,150,0.12)';ctx.lineWidth=14;ctx.stroke();
    ctx.lineWidth=6;ctx.stroke();
    ctx.restore();
    ctx.save();path(ctx,pts);ctx.strokeStyle='rgba(80,112,135,0.65)';ctx.lineWidth=0.9;ctx.stroke();ctx.restore();
  }
  // 内側の重なり弧
  ctx.strokeStyle='rgba(80,112,135,0.45)';ctx.lineWidth=0.8;
  const bz=(a)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.bezierCurveTo(...a.slice(2));ctx.stroke();};
  bz([172,12,215,8,262,18,282,30]);bz([180,30,215,22,255,30,270,38]);
  bz([340,24,380,16,430,22,470,15]);bz([540,52,570,44,610,46,650,50]);bz([560,60,600,56,640,60,680,62]);
  ctx.restore();
}
