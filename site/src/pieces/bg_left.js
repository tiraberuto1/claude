export const name='bg_left';
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
// 黒白の点線縁(白帯+黒点、周期7px)
// 探索対象の数値パラメータ(tools/tune_bg_left.mjs で最適化)
export const DEFAULTS={
  tY:67.5,tW:2.6,tP:6.8,tPh:2,tG:2,tX:163,
  uY:74,uW:2.2,uP:7,uPh:2,uG:2,
  mY:133.5,mW:2.8,mP:6.8,mPh:2,mG:2,
  bY:189.7,bW:4.6,bP:6.4,bPh:2,bG:2,
  diagX0:98,diagY0:190,diagX1:254,diagY1:76,dW:3,dP:6.8,dPh:2,dG:2,
  beamY:69.5,beamH:7.7,
  st0x:83,st0y:181.5,st1x:72,st1y:192,st2x:208,st2y:218,stA:0.85,stW:11,
  skx:290,sky:82,skang:0.7,sklen:90,skw:4,ska:1.8,
  pbx:148,pw:7,pwood:155,pww:10,p2x:166,tx0:171,tx1:182,ty1:51,tvx:170,tvy:61,
  leaves:null,
};
// 草の葉 [cx,cy,r,a0,a1,線幅,色種別]
function makeLeaves(){const R=rng(5),o=[];for(let i=0;i<46;i++){const cx=R()*150,cy=50+R()*125,r=6+R()*13,a0=Math.PI*(1.1+R()*0.3),a1=a0+Math.PI*(0.35+R()*0.35);o.push([cx,cy,r,a0,a1,0.7+R()*0.6,R()<0.7?0:1,R()<0.4]);}return o;}
export const LEAVES=(()=>{const L=makeLeaves(),T=[[35.701, 141.511, 9.16, 4.26, 6.147, 0.916, 0, true], [13.703, 158.63, 5.35, 3.908, 5.255, 1.487, 0, false], [71.026, 98.46, 17.4, 3.53, 5.707, 0.914, 1, false], [89.911, 109.311, 18.743, 3.878, 5.53, 0.832, 0, false], [28.11, 101.101, 18.715, 3.681, 5.762, 0.869, 0, true], [133.16, 116.688, 11.113, 4.02, 5.231, 0.796, 0, true], [117.537, 86.023, 7.299, 3.888, 5.155, 0.914, 0, false], [36.682, 88.111, 13.378, 4.127, 5.663, 1.086, 0, true], [13.903, 120.791, 17.933, 4.349, 5.549, 0.992, 0, false], [12.156, 136.318, 19.324, 4.015, 5.419, 2.44, 1, true], [102.693, 161.768, 6.549, 3.991, 6.169, 0.897, 1, true], [30.591, 172.248, 8.668, 3.566, 5.463, 1.068, 0, false], [23.156, 63.923, 16.789, 3.674, 5.156, 0.511, 0, true], [19.196, 117.852, 13.618, 3.64, 4.891, 0.885, 0, false], [85.179, 78.641, 8.569, 3.704, 5.119, 1.242, 0, false], [58.255, 83.905, 8.44, 4.334, 6.135, 0.75, 0, true], [76.163, 131.543, 11.645, 3.805, 5.753, 0.861, 0, true], [128.004, 167.823, 13.018, 3.822, 5.34, 0.906, 1, true], [97.898, 60.29, 6.17, 4.203, 6.37, 1.14, 0, false], [5.506, 84.47, 9.415, 3.749, 5.806, 1.013, 0, true], [143.438, 132.401, 11.258, 3.529, 5.239, 1.088, 0, false], [61.524, 143.971, 17.44, 4.102, 5.505, 0.788, 0, false], [147.974, 51.065, 17.55, 4.204, 5.318, 0.99, 1, true], [107.398, 69.53, 14.204, 3.743, 5.65, 1.245, 0, false], [35.712, 87.951, 10.773, 3.547, 5.708, 1.245, 1, false], [41.917, 70.237, 9.689, 3.765, 5.606, 1.126, 0, false], [66.748, 91.022, 8.302, 3.733, 5.351, 1.202, 0, true], [48.2, 128.88, 18.307, 4.257, 5.487, 1.145, 0, false], [133.938, 117.348, 17.726, 3.834, 5.318, 0.997, 0, false], [40.565, 128.763, 17.462, 3.882, 4.986, 1.022, 1, false], [109.78, 65.917, 8.407, 4.127, 5.756, 0.994, 0, false], [11.405, 111.514, 10.116, 4.188, 5.826, 0.722, 0, true], [43.284, 60.45, 13.044, 3.791, 5.034, 1.217, 0, false], [78.065, 159.898, 9.346, 3.532, 4.931, 1.09, 1, false], [56.85, 82.211, 8.237, 4.266, 5.645, 0.793, 0, false], [79.719, 155.632, 9.913, 4.214, 6.297, 0.893, 0, true], [93.139, 102.821, 16.045, 4.13, 6.122, 0.987, 0, false], [74.238, 162.193, 11.819, 3.578, 4.746, 1.052, 0, false], [111.954, 92.068, 10.554, 4.338, 5.529, 1.038, 0, false], [85.071, 57.635, 17.872, 3.969, 6.119, 1.086, 0, false], [137.111, 150.725, 6.437, 4.045, 6.216, 1.199, 1, true], [148.118, 167.4, 18.249, 3.837, 5.528, 0.941, 1, true], [5.311, 141.355, 17.513, 3.957, 5.278, 0.974, 1, false], [58.606, 147.129, 14.057, 3.925, 5.985, 1.036, 0, true], [3.024, 81.13, 13.818, 4.641, 4.995, 2.154, 0, false], [17.963, 115.476, 14.895, 4.023, 5.606, 1.096, 0, false]];return T.length===L.length?T:L;})();
function dashed(ctx,x0,y0,x1,y1,w,per,ph,gap){
  // 白い短冊(長さ per-gap)と暗い隙間(gap)の繰り返し
  const L=Math.hypot(x1-x0,y1-y0),a=Math.atan2(y1-y0,x1-x0);
  ctx.save();ctx.translate(x0,y0);ctx.rotate(a);
  ctx.fillStyle='#e6e2d0';ctx.fillRect(0,-w/2,L,w);
  if(w>4){ctx.fillStyle='rgba(110,100,80,0.35)';ctx.fillRect(0,-0.7,L,1.4);}
  ctx.fillStyle='rgba(90,80,60,0.45)';ctx.fillRect(0,-w/2,L,0.6);ctx.fillRect(0,w/2-0.6,L,0.6);
  ctx.fillStyle='#3a342e';
  for(let t=ph;t<L;t+=per)ctx.fillRect(t,-w/2,Math.min(gap,L-t),w);
  ctx.restore();
}
export function draw(ctx,W,H,P=DEFAULTS){
  const LV=P.leaves||LEAVES;
  const R=rng(11);
  ctx.save();
  ctx.beginPath();ctx.rect(0,0,340,H);ctx.clip();
  // 全体下地(雲の下): 青灰
  ctx.fillStyle='#8a9788';ctx.fillRect(0,0,340,H);
  let g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#958f7c');g.addColorStop(0.18,'#88958a');g.addColorStop(0.85,'#869488');g.addColorStop(1,'#868a78');
  ctx.fillStyle=g;ctx.fillRect(0,0,340,H);

  // 黄緑の床
  ctx.fillStyle='rgb(150,148,93)';
  ctx.fillRect(0,44,340,150);
  ctx.fillRect(165,28,175,20);
  // 床のムラ(褐色・黄・濃緑)
  for(let i=0;i<150;i++){
    const x=R()*340,y=44+R()*150,r=8+R()*26,k=R();
    const c=k<0.35?'150,120,60':k<0.6?'185,175,105':k<0.8?'110,130,70':'165,140,70';
    const rg=ctx.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,'rgba('+c+','+(0.10+R()*0.12)+')');rg.addColorStop(1,'rgba('+c+',0)');
    ctx.fillStyle=rg;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  // 褐色の斜めの染み(右上)
  ctx.save();ctx.translate(P.skx,P.sky);ctx.rotate(P.skang);
  for(let i=0;i<5;i++){ctx.fillStyle='rgba(140,105,50,'+(P.ska*(0.08+0.03*i))+')';ctx.fillRect(-10,-20+i*P.skw*0.83,P.sklen,P.skw);}
  ctx.restore();
  // 下部の褐色ムラ
  for(let i=0;i<14;i++){
    const x=170+R()*170,y=140+R()*50,r=10+R()*20;
    const rg=ctx.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,'rgba(150,110,50,0.25)');rg.addColorStop(1,'rgba(150,110,50,0)');
    ctx.fillStyle=rg;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  // 褐色のぼかし斑点と赤褐色の染み
  for(let i=0;i<26;i++){
    const x=90+R()*250,y=60+R()*130,r=5+R()*12;
    const rg=ctx.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,'rgba(176,138,78,0.22)');rg.addColorStop(1,'rgba(176,138,78,0)');
    ctx.fillStyle=rg;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  for(const [x,y,r] of [[92,181,4],[108,179,5],[118,183,3],[190,160,4]]){
    const rg=ctx.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,'rgba(181,84,60,0.5)');rg.addColorStop(1,'rgba(181,84,60,0)');
    ctx.fillStyle=rg;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  // 基準位置の赤茶の染み(横長楕円・ぼかし)
  for(const [x,y,w,h,a] of [[P.st0x,P.st0y,P.stW,2.6,P.stA],[P.st0x-5,P.st0y+1.5,6,2,0.5],[P.st1x,P.st1y,P.stW,2.4,0.55],[P.st2x,P.st2y,P.stW+1,2.6,P.stA],[P.st2x+6,P.st2y+3,7,2,0.6],[P.st2x-9,P.st2y-2,4,1.6,0.45]]){
    ctx.save();ctx.filter='blur(0.8px)';ctx.fillStyle='rgba(158,100,56,'+a+')';
    ctx.beginPath();ctx.ellipse(x,y,w,h,-0.05,0,7);ctx.fill();ctx.restore();
  }
  // 繊維目(縦の細線)
  for(let i=0;i<220;i++){
    ctx.fillStyle=R()<0.5?'rgba(200,195,120,0.10)':'rgba(90,100,50,0.08)';
    ctx.fillRect(R()*340,44+R()*150,0.6,3+R()*10);
  }
  // 縦の継ぎ目(紙の折れ)
  ctx.fillStyle='rgba(215,200,160,0.18)';ctx.fillRect(173,0,1,H);
  ctx.fillStyle='rgba(110,100,70,0.2)';ctx.fillRect(174,0,1,H);

  // 金屏風(左)
  ctx.save();
  ctx.beginPath();ctx.moveTo(0,44);ctx.lineTo(148,44);ctx.lineTo(148,72);ctx.lineTo(125,128);ctx.lineTo(90,160);ctx.lineTo(40,174);ctx.lineTo(0,178);ctx.closePath();ctx.clip();
  const gg=ctx.createLinearGradient(0,44,0,180);
  gg.addColorStop(0,'rgb(178,150,104)');gg.addColorStop(0.5,'rgb(180,152,108)');gg.addColorStop(1,'rgb(168,146,100)');
  ctx.fillStyle=gg;ctx.fillRect(0,44,160,140);
  // 金のムラ
  for(let i=0;i<70;i++){
    const x=R()*150,y=44+R()*135,r=6+R()*16,k=R();
    const c=k<0.4?'215,185,110':k<0.7?'140,125,85':'196,160,95';
    const rg=ctx.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,'rgba('+c+',0.22)');rg.addColorStop(1,'rgba('+c+',0)');
    ctx.fillStyle=rg;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  for(let i=0;i<260;i++){ctx.fillStyle=R()<0.5?'rgba(225,195,120,0.16)':'rgba(120,110,80,0.12)';ctx.fillRect(R()*150,44+R()*135,3+R()*9,0.6+R()*1.2);}
  // 青緑の草(弧状の細い葉)
  ctx.lineCap='round';
  for(const [cx,cy,r,a0,a1,lw,kind,dbl] of LV){
    ctx.strokeStyle=kind===0?'rgba(70,150,125,0.75)':'rgba(120,170,110,0.65)';
    ctx.lineWidth=lw;
    ctx.beginPath();ctx.arc(cx,cy,r,a0,a1);ctx.stroke();
    if(dbl){ctx.beginPath();ctx.arc(cx+4,cy+1,r*0.8,a0,a1);ctx.stroke();}
  }
  // 金砂子のかすれ
  for(let i=0;i<14;i++){ctx.strokeStyle='rgba(225,200,130,0.5)';ctx.lineWidth=0.6;const x=R()*150,y=50+R()*125;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y-5);ctx.stroke();}
  ctx.restore();

  // 障子の縦柱: 紺 / 黒線 / 木 / 紺
  ctx.fillStyle='#1d4b7d';ctx.fillRect(P.pbx,50,P.pw,19);
  ctx.fillStyle='#1c1a18';ctx.fillRect(P.pbx+P.pw,50,1.2,19);
  ctx.fillStyle='#b99a64';ctx.fillRect(P.pwood,50,P.pww,19);
  ctx.fillStyle='rgba(120,90,50,0.35)';ctx.fillRect(158,50,0.8,19);
  ctx.fillStyle='#d6bd88';ctx.fillRect(156,50,1.2,19);
  ctx.fillStyle='#1d4b7d';ctx.fillRect(P.p2x,50,3,12);
  // 障子の斜め桟(紺)
  ctx.fillStyle='#24456e';
  ctx.beginPath();ctx.moveTo(P.tx0,P.ty1);ctx.lineTo(P.tx1,P.ty1);ctx.lineTo(P.tvx,P.tvy);ctx.closePath();ctx.fill();
  ctx.fillStyle='#14110f';
  ctx.beginPath();ctx.moveTo(P.tx1,P.ty1);ctx.lineTo(P.tx1+1,P.ty1);ctx.lineTo(P.tvx,P.tvy+2);ctx.lineTo(P.tx0,P.tvy+1);ctx.closePath();ctx.fill();

  // 横梁(褐色の木)
  const bm=ctx.createLinearGradient(0,68,0,76);bm.addColorStop(0,'rgb(176,138,88)');bm.addColorStop(1,'rgb(160,124,80)');
  ctx.fillStyle=bm;ctx.fillRect(158,P.beamY,182,P.beamH);
  ctx.fillStyle='rgba(235,215,170,0.35)';ctx.fillRect(170,69,170,1);
  ctx.fillStyle='rgba(100,70,35,0.35)';ctx.fillRect(160,74,180,1);
  for(let i=0;i<40;i++){ctx.fillStyle='rgba(120,85,45,0.18)';ctx.fillRect(162+R()*175,68+R()*6,8+R()*25,0.7);}

  // 点線縁
  dashed(ctx,P.tX,P.tY,340,P.tY,P.tW,P.tP,P.tPh,P.tG);
  dashed(ctx,292,P.uY,340,P.uY,P.uW,P.uP,P.uPh,P.uG);
  dashed(ctx,175,P.mY,330,P.mY,P.mW,P.mP,P.mPh,P.mG);
  dashed(ctx,92,P.bY,248,P.bY,P.bW,P.bP,P.bPh,P.bG);
  dashed(ctx,P.diagX0,P.diagY0,P.diagX1,P.diagY1,P.dW,P.dP,P.dPh,P.dG);
  // 金屏風下縁の斜め点線(左下、人物の足元の背後)
  ctx.save();ctx.strokeStyle='rgba(205,170,110,0.9)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(2,185);ctx.lineTo(44,168);ctx.stroke();ctx.restore();
  dashed(ctx,3,186.5,44,170,2.2,6.5,1,2);

  // 左下の縁(金地との境)
  ctx.fillStyle='rgba(60,50,40,0.5)';ctx.fillRect(0,178,2,1);

  // 下の灰青帯と褐色の筋(雲の下地)
  const bt=ctx.createLinearGradient(0,196,0,H);bt.addColorStop(0,'#8a968a');bt.addColorStop(1,'#869186');
  ctx.fillStyle=bt;ctx.fillRect(0,196,175,H-196);
  ctx.fillStyle='rgb(148,142,92)';ctx.fillRect(175,194,165,38);
  ctx.fillStyle='rgba(165,125,80,0.35)';ctx.fillRect(175,226,165,10);
  ctx.fillStyle='#889487';ctx.fillRect(175,236,165,H-236);
  // 上部の青灰
  ctx.fillStyle='#8d9a90';ctx.fillRect(0,0,340,44);
  ctx.fillStyle='rgb(150,150,100)';ctx.fillRect(176,28,164,17);
  ctx.fillStyle='rgba(215,200,160,0.18)';ctx.fillRect(173,0,1,H);
  ctx.restore();
}
