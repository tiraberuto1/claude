export const name='bg_right';
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
// 黒白の市松縁
function dashed(ctx,x0,y0,x1,y1,w){
  ctx.save();ctx.lineCap='butt';
  ctx.strokeStyle='#e8e2d0';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.strokeStyle='#2c2724';ctx.lineWidth=w*0.5;ctx.setLineDash([2,2.4]);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.restore();
}
export function draw(ctx,W,H){
  const R=rng(11);
  ctx.save();
  ctx.beginPath();ctx.rect(340,0,340,H);ctx.clip();
  // 上部の青灰(雲の下地)
  ctx.fillStyle='#8f9f98';ctx.fillRect(340,0,340,40);
  // 黄緑の床
  const g=ctx.createLinearGradient(340,0,680,0);
  g.addColorStop(0,'#a2a468');g.addColorStop(0.5,'#a1a96a');g.addColorStop(1,'#98a266');
  ctx.fillStyle=g;ctx.fillRect(340,72,340,170);
  for(let i=0;i<90;i++){
    const x=340+R()*340,y=74+R()*160,r=8+R()*22;
    ctx.fillStyle=R()<0.5?'rgba(195,190,115,0.07)':'rgba(105,125,70,0.07)';
    ctx.beginPath();ctx.ellipse(x,y,r*1.6,r*0.6,0,0,7);ctx.fill();
  }
  // 障子: 金の柱
  ctx.fillStyle='#c9a66b';ctx.fillRect(340,4,12,68);
  ctx.fillStyle='#e0c892';ctx.fillRect(340,4,2,68);
  // 紺の枠
  ctx.fillStyle='#1d3556';ctx.fillRect(352,36,184,34);
  // 金パネル(基準より暗い緑がかった金)
  const pg=ctx.createLinearGradient(0,40,0,67);pg.addColorStop(0,'#988f66');pg.addColorStop(1,'#a89b6a');
  ctx.fillStyle=pg;ctx.fillRect(356,40,80,26);ctx.fillRect(451,40,76,26);
  ctx.fillStyle='#14233f';ctx.fillRect(436,36,15,34);
  ctx.fillRect(525,36,12,34);
  // パネルの草花
  for(let i=0;i<70;i++){
    const x=358+R()*168,y=42+R()*22;if(x>434&&x<452)continue;
    ctx.fillStyle=R()<0.5?'rgba(110,140,80,0.55)':'rgba(215,175,70,0.6)';
    ctx.beginPath();ctx.arc(x,y,1+R()*1.2,0,7);ctx.fill();
  }
  // 床との境の縁
  ctx.fillStyle='#a8aa6e';ctx.fillRect(340,70,260,3);
  dashed(ctx,340,71,597,71,3);
  // 縁側の板敷き
  ctx.save();
  ctx.beginPath();ctx.moveTo(478,139);ctx.lineTo(680,137);ctx.lineTo(680,198);ctx.lineTo(640,206);ctx.lineTo(560,222);ctx.lineTo(500,224);ctx.lineTo(440,222);ctx.lineTo(455,150);ctx.closePath();ctx.clip();
  const pl=ctx.createLinearGradient(0,137,0,224);pl.addColorStop(0,'rgb(214,164,104)');pl.addColorStop(1,'rgb(206,152,92)');
  ctx.fillStyle=pl;ctx.fillRect(430,130,250,100);
  // 板目(細く斜め)
  for(let i=0;i<420;i++){
    const x=440+R()*240,y=138+R()*86,l=6+R()*18;
    ctx.strokeStyle=R()<0.5?'rgba(235,195,135,0.3)':'rgba(150,100,55,0.22)';ctx.lineWidth=0.6;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+l,y-l*0.28);ctx.stroke();
  }
  // 板の継ぎ目(斜め)
  ctx.strokeStyle='rgba(120,80,45,0.45)';ctx.lineWidth=1;
  for(const y of [154,170,186,202,218]){ctx.beginPath();ctx.moveTo(430,y+8);ctx.lineTo(680,y-14);ctx.stroke();}
  ctx.restore();
  // 縁側手前の濃い板
  ctx.fillStyle='#b7905e';ctx.fillRect(445,220,100,4);
  // 黒茶の倒木状の影(右端)
  ctx.fillStyle='rgba(52,38,28,0.92)';
  ctx.beginPath();ctx.moveTo(680,142);ctx.quadraticCurveTo(655,146,640,152);ctx.quadraticCurveTo(625,158,615,164);
  ctx.quadraticCurveTo(635,162,650,166);ctx.quadraticCurveTo(665,170,680,170);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(680,186);ctx.quadraticCurveTo(665,192,652,200);ctx.lineTo(680,208);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(541,216);ctx.quadraticCurveTo(555,208,572,208);ctx.quadraticCurveTo(562,216,548,220);ctx.closePath();ctx.fill();
  // 縁の点線
  dashed(ctx,430,126,580,126,3);
  dashed(ctx,587,198,640,182,3);
  // 下部の青灰(雲の下地)
  ctx.fillStyle='#8aa0a2';ctx.fillRect(340,228,340,19);
  ctx.restore();
}
