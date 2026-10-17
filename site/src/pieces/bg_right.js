export const name='bg_right';
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
// 黒白の市松縁
let DP=4.4,DPH=0;
function dashed(ctx,x0,y0,x1,y1,w){
  ctx.save();ctx.lineCap='butt';
  ctx.strokeStyle='#e8e2d0';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.strokeStyle='#2c2724';ctx.lineWidth=w*0.5;ctx.setLineDash([DP*0.45,DP*0.55]);ctx.lineDashOffset=-DPH;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.restore();
}
// 調整可能な数値(tools/tune_bg_right.mjs の探索結果)
export const P={grainSlope:0.01,grainStep:2.0,grainAlpha:0.35,seamSlope:-0.088,seamOff:0,seamAlpha:0.7,
  dashPeriod:5.4,dashPhase:0,plankL:1.0,floorL:1.0,plankTop:139,dashY:71,dashY2:130,dashY3:188.5,
  panelL:1.0,flDx:0,flDy:2,
  pk:[[2,0,0],[4,0,0],[0,0,0],[4,1,0],[0,0,-0.06]],
  bo:[8,6,0,-2],sm:[0,1,0],bo2:0};
const sc=(rgb,k)=>'rgb('+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*k)))).join(',')+')';
export function draw(ctx,W,H){
  const R=rng(11);DP=P.dashPeriod;DPH=P.dashPhase;
  ctx.save();
  ctx.beginPath();ctx.rect(340,0,340,H);ctx.clip();
  // 上部の青灰(雲の下地)
  ctx.fillStyle='#8f9b8e';ctx.fillRect(340,0,340,40);
  // 黄緑の床
  const g=ctx.createLinearGradient(340,0,680,0);
  g.addColorStop(0,'#908a62');g.addColorStop(0.5,'#9a9663');g.addColorStop(1,'#989460');
  ctx.fillStyle=g;ctx.fillRect(340,72,340,170);
  for(let i=0;i<90;i++){
    const x=340+R()*340,y=74+R()*160,r=8+R()*22;
    ctx.fillStyle=R()<0.5?'rgba(190,180,110,0.07)':'rgba(95,110,65,0.08)';
    ctx.beginPath();ctx.ellipse(x,y,r*1.6,r*0.6,0,0,7);ctx.fill();
  }
  // 障子: 金の柱
  ctx.fillStyle='#c9a66b';ctx.fillRect(340,4,12,68);
  ctx.fillStyle='#e0c892';ctx.fillRect(340,4,2,68);
  // 紺の枠
  ctx.fillStyle='#1d3556';ctx.fillRect(352,36,184,34);
  // 金パネル(基準より暗い緑がかった金)
  const pg=ctx.createLinearGradient(0,40,0,67);pg.addColorStop(0,'#7f7055');pg.addColorStop(1,'#86765a');
  ctx.globalAlpha=1;ctx.fillStyle=pg;ctx.fillRect(356,40,80,26);ctx.fillRect(451,40,76,26);
  ctx.fillStyle='#14233f';ctx.fillRect(436,36,15,34);
  ctx.fillRect(525,36,12,34);
  // パネルの草花
  for(let i=0;i<35;i++){
    const x=358+R()*168+P.flDx,y=42+R()*22+P.flDy;if(x>434&&x<452)continue;
    ctx.fillStyle=R()<0.5?'rgba(110,140,80,0.55)':'rgba(215,175,70,0.6)';
    ctx.beginPath();ctx.arc(x,y,1+R()*1.2,0,7);ctx.fill();
  }
  // 床との境の縁
  ctx.fillStyle='#9c9a68';ctx.fillRect(340,70,260,3);
  dashed(ctx,340,P.dashY,597,P.dashY,3);
  // 縁側奥の汚れたオリーブ褐色の床
  ctx.fillStyle='rgba(136,116,81,0.9)';ctx.fillRect(480,128,200,11);
  // 縁側の板敷き
  ctx.save();
  ctx.beginPath();ctx.moveTo(478,P.plankTop);ctx.lineTo(680,P.plankTop-2);ctx.lineTo(680,198);ctx.lineTo(640,206);ctx.lineTo(560,222);ctx.lineTo(500,224);ctx.lineTo(440,222);ctx.lineTo(455,150);ctx.closePath();ctx.clip();
  const pl=ctx.createLinearGradient(0,137,0,224);pl.addColorStop(0,sc([178,130,84],P.plankL*0.98));pl.addColorStop(1,sc([168,120,76],P.plankL*0.98));
  ctx.fillStyle=pl;ctx.fillRect(430,130,250,100);
  // 板目(細い横筋・僅かに斜め)
  for(let y=138;y<226;y+=P.grainStep+R()*1.2){
    for(let x=430;x<680;x+=8+R()*30){
      const l=10+R()*40;
      ctx.strokeStyle=R()<0.7?'rgba(138,94,60,'+P.grainAlpha+')':'rgba(215,170,120,0.25)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+(680-x)*P.grainSlope);ctx.lineTo(x+l,y+(680-x-l)*P.grainSlope);ctx.stroke();
    }
  }
  // 板ごとの明暗(帯)と実測した縁板・継ぎ目
  [[142,158],[158,175],[175,192],[192,224]].forEach((r,i)=>{const o=P.bo[i];ctx.fillStyle=o>=0?'rgba(255,235,200,'+(o*0.02)+')':'rgba(60,30,10,'+(-o*0.02)+')';ctx.fillRect(430,r[0],250,r[1]-r[0]);});
  ctx.fillStyle='rgba(176,128,104,0.8)';ctx.fillRect(480,135+P.sm[0],200,7);
  ctx.fillStyle='rgba(178,130,108,0.8)';ctx.fillRect(440,218+P.sm[1],110,7);
  ctx.strokeStyle='rgba(196,148,120,0.9)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(586,205+P.sm[2]);ctx.lineTo(637,176+P.sm[2]);ctx.stroke();
  ctx.strokeStyle='rgba(107,74,48,0.6)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(520,142+P.sm[0]);ctx.lineTo(680,142+P.sm[0]);ctx.stroke();
  // ピンク褐色の汚れ
  for(let i=0;i<30;i++){const x=450+R()*230,y=140+R()*80;ctx.fillStyle='rgba(160,95,75,0.10)';ctx.beginPath();ctx.ellipse(x,y,10+R()*14,3+R()*4,-0.2,0,7);ctx.fill();}
  // 板の継ぎ目(斜め)
  ctx.strokeStyle='rgba(107,74,48,'+P.seamAlpha+')';ctx.lineWidth=0.8;
  for(const y of [162,178,194,210,226]){ctx.beginPath();ctx.moveTo(430,y+P.seamOff-P.seamSlope*0);ctx.lineTo(680,y+P.seamOff+250*P.seamSlope);ctx.stroke();}
  ctx.restore();
  // 縁側手前の濃い板
  ctx.fillStyle='#b7905e';ctx.fillRect(445,220,100,4);
  // 黒茶の倒木状の影(右端)
  const jag=(pts,seed)=>{
    const Q=rng(seed);
    ctx.beginPath();
    pts.forEach((q,i)=>{const x=q[0]+(i%2?-1:1)*Q()*2,y=q[1]+(Q()-0.5)*3;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.closePath();ctx.fillStyle='rgba(58,42,30,0.95)';ctx.fill();
    ctx.strokeStyle='rgba(90,67,46,0.5)';ctx.lineWidth=1;ctx.stroke();
    // かすれた端の筋
    for(let i=0;i<14;i++){const q=pts[Math.floor(Q()*pts.length)];ctx.strokeStyle='rgba(70,50,36,0.5)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]-4-Q()*8,q[1]+(Q()-0.3)*5);ctx.stroke();}
  };
  // 緑の床がのぞく部分
  ctx.fillStyle='rgb(150,142,96)';
  ctx.beginPath();ctx.moveTo(634,170);ctx.lineTo(680,166);ctx.lineTo(680,184);ctx.lineTo(650,186);ctx.lineTo(626,186);ctx.closePath();ctx.fill();
  // 倒木: 右上がりの割れた板片
  const plank=(pts,seed,col,pi)=>{
    const [ox,oy,tl]=P.pk[pi];
    const Q=rng(seed);
    ctx.beginPath();
    pts.forEach((q,i)=>{const x=q[0]+(Q()-0.5)*2.5+ox,y=q[1]+(Q()-0.5)*2+oy+tl*(q[0]-650);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    ctx.closePath();ctx.fillStyle=col;ctx.fill();
    ctx.strokeStyle='rgba(48,34,24,0.8)';ctx.lineWidth=0.9;ctx.stroke();
  };
  // 主流木(先細り・欠けた縁)
  plank([[611,172],[619,168],[627,166],[635,162],[642,160],[650,156],[658,153],[666,150],[673,147],[680,145],[680,160],[676,164],[670,166],[664,163],[658,167],[650,166],[643,169],[636,171],[628,172],[620,175],[614,175]],3,'rgb(104,80,58)',0);
  // 上の割れ目の筋(明るい木肌)
  plank([[626,166],[636,162],[646,158],[656,155],[666,152],[676,149],[680,149],[680,153],[670,156],[660,160],[650,163],[640,166],[632,169]],5,'rgb(132,104,76)',1);
  // 右上の小片
  plank([[660,140],[666,137],[673,135],[680,133],[680,139],[674,141],[668,142],[664,144]],8,'rgb(112,88,62)',2);
  // 下左の流木(左向きに先細り)
  plank([[540,217],[546,213],[552,210],[558,208],[566,206],[574,205],[580,207],[578,211],[572,213],[565,214],[559,216],[552,218],[546,219]],9,'rgb(96,74,54)',3);
  // 右下隅の黒茶の板
  plank([[680,185],[670,188],[660,193],[652,199],[680,201]],7,'rgb(52,40,30)',4);
  // 縁の点線
  dashed(ctx,430,P.dashY2,580,P.dashY2,3);
  dashed(ctx,622,P.dashY3,667,P.dashY3,3);
  // 下部の青灰(雲の下地)
  ctx.fillStyle='#86998f';ctx.fillRect(500,228,180,19);
  ctx.fillStyle='rgb(150,140,92)';ctx.fillRect(340,228,160,8);
  ctx.fillStyle='rgb(145,115,70)';ctx.fillRect(340,236,160,11);
  ctx.restore();
}
