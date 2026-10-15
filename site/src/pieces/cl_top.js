export const name='cl_top';
// 探索で調整する数値パラメータ(名前付き定数)
export const P0={
  lBot:42,bBot:50.5,bTipX:287,bTipY:36,bTopY:1,cTop:5.25,cBot:39.5,cTongX:329.5,cTongY:34,cRight:550,oTipX:523.5,oTipY:58,oTopY:35.5,oBot:70,oTopR:35,aL:0.93,aC:0.95,aO:0.95,aS:0.39,aE:0.71,dR:7,dG:2.5,dB:-2,edgeA:0.34,glowA:0.04,glowW:10,arcA:0.28,dust:116,leW:28,leT:76.5,leB:115.5,leM:89,reX:651,reT:91,reB:126,reM:105.5,
  wl1:0,wl2:0,wl3:0.75,wc1:0.75,wc2:3.75,wc3:0,wc4:0,wo1:1.25,wo2:0.25,wo3:2,wo4:2,
  washTop:0.2,washBot:0.43,warmA:0.4
};
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function path(ctx,pts){ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const p=pts[i];
    if(p.length===2)ctx.lineTo(p[0],p[1]);else if(p.length===4)ctx.quadraticCurveTo(...p);else ctx.bezierCurveTo(...p);}
  ctx.closePath();}
export function draw(ctx,W,H,Q){
  const P=Object.assign({},P0,Q||{});
  const R=rng(11);
  ctx.save();ctx.scale(W/680,H/247);
  const cl=(c)=>[c[0]+P.dR,c[1]+P.dG,c[2]+P.dB];
  // 右上の霞の淡い刷き(紙の暖色が透ける)
  {
    ctx.save();ctx.beginPath();ctx.rect(400,0,300,48);ctx.clip();
    const w=ctx.createLinearGradient(0,0,0,42);
    w.addColorStop(0,`rgba(190,165,122,${P.warmA})`);w.addColorStop(0.6,`rgba(185,160,122,${P.warmA*0.73})`);w.addColorStop(1,'rgba(185,160,122,0)');
    ctx.fillStyle=w;ctx.fillRect(400,0,300,48);
    const g=ctx.createLinearGradient(0,0,0,40);
    g.addColorStop(0,`rgba(130,150,142,${P.washTop})`);g.addColorStop(1,`rgba(130,150,142,${P.washBot})`);
    ctx.fillStyle=g;ctx.fillRect(430,0,260,45);ctx.restore();
  }
  const shapes=[
    {a:P.aL,c:[128,148,140],pts:[[-5,-5],[172,-5],[250,P.bTopY],[262,8],[278,18,P.bTipX,P.bTipY],[278,40,250,P.bBot-3],[215,P.bBot+1],[190,P.bBot],[176,P.bBot-1,170,P.lBot+1],[100,P.lBot+P.wl1],[50,P.lBot-1+P.wl2],[-5,P.lBot-3+P.wl3]]},
    {a:P.aS,c:[132,150,140],pts:[[280,-5],[480,-5],[480,2],[420,4],[340,4],[290,3]]},
    {a:P.aC,c:[133,150,140],pts:[[P.cTongX,P.cTongY],[P.cTongX-1,22,350,15],[358,P.cTop+2,372,P.cTop],[430,P.cTop-2],[500,P.cTop],[P.cRight,P.cTop+4],[P.cRight,26],[540,P.cBot-5+P.wc1],[490,P.cBot-1+P.wc2],[440,P.cBot+P.wc3],[380,P.cBot+1+P.wc4],[350,P.cBot+1,P.cTongX,P.cTongY]]},
    {a:P.aO,c:[134,150,142],pts:[[P.oTipX,P.oTipY],[P.oTipX+2,42,556,P.oTopY],[590,P.oTopY-4,640,P.oTopR],[700,P.oTopR-2],[700,P.oBot+3+P.wo1],[640,P.oBot+2+P.wo2],[580,P.oBot+P.wo3],[540,P.oBot-1+P.wo4,P.oTipX,P.oTipY]]},
    {a:P.aE,c:[140,152,138],pts:[[-5,P.leT],[10,P.leT],[P.leW-4,P.leT+4,P.leW,P.leM],[P.leW-2,P.leB-8,14,P.leB-1],[-5,P.leB]]},
    {a:P.aE*0.9,c:[150,156,136],pts:[[700,P.reT],[664,P.reT],[P.reX+2,P.reT+4,P.reX,P.reM],[P.reX+2,P.reB-6,668,P.reB-2],[700,P.reB]]},
  ];
  for(const s of shapes){
    const pts=s.pts,[r,gg,b]=cl(s.c);
    ctx.save();path(ctx,pts);
    ctx.fillStyle=`rgba(${r},${gg},${b},${s.a})`;ctx.fill();ctx.clip();
    for(let i=0;i<90;i++){
      const x=R()*680,y=R()*75;
      ctx.fillStyle=R()<0.5?'rgba(190,185,150,0.10)':'rgba(100,130,140,0.08)';
      ctx.beginPath();ctx.ellipse(x,y,8+R()*40,1.5+R()*5,0,0,7);ctx.fill();
    }
    for(let i=0;i<P.dust;i++){ctx.fillStyle=R()<0.6?'rgba(205,190,135,0.3)':'rgba(225,225,200,0.25)';ctx.fillRect(R()*680,R()*75,1,1);}
    ctx.lineJoin='round';path(ctx,pts);
    ctx.strokeStyle=`rgba(100,130,138,${P.glowA})`;ctx.lineWidth=P.glowW;ctx.stroke();
    ctx.lineWidth=P.glowW*0.4;ctx.stroke();
    ctx.restore();
    ctx.save();path(ctx,pts);ctx.strokeStyle=`rgba(105,133,138,${P.edgeA})`;ctx.lineWidth=0.9;ctx.stroke();ctx.restore();
  }
  ctx.strokeStyle=`rgba(105,133,138,${P.arcA})`;ctx.lineWidth=0.8;
  const bz=(a)=>{ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.bezierCurveTo(...a.slice(2));ctx.stroke();};
  bz([172,12,215,8,262,18,282,30]);bz([180,30,215,22,255,30,270,38]);
  bz([374,8,372,20,400,19,450,19]);bz([420,19,480,20,520,22,560,22]);
  bz([560,36,600,33,640,33,680,32]);
  ctx.restore();
}
