export const name='background';
// 乱数(決定的)
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function dashed(ctx,x0,y0,x1,y1,w){
  // 黒白の市松縁(白帯+黒い点)
  ctx.save();ctx.lineCap='butt';
  ctx.strokeStyle='#e9e4d0';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.strokeStyle='#2a2622';ctx.lineWidth=w*0.5;ctx.setLineDash([2.2,2.6]);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
  ctx.restore();
}
export function draw(ctx,W,H){
  const R=rng(7);
  // 全体の下地: 淡い青灰(雲の下)
  ctx.fillStyle='#8fa6a8';ctx.fillRect(0,0,W,H);
  // 黄緑の床
  const g=ctx.createLinearGradient(0,0,W,0);
  g.addColorStop(0,'#a2a566');g.addColorStop(0.3,'#a5ae6c');g.addColorStop(0.6,'#9da863');g.addColorStop(1,'#8f9a5e');
  ctx.fillStyle=g;
  ctx.fillRect(0,40,W,190);ctx.fillRect(175,14,165,50);
  // 床の濃淡ムラ
  for(let i=0;i<260;i++){
    const x=170+R()*510,y=20+R()*205,r=6+R()*22;
    ctx.fillStyle=R()<0.5?'rgba(190,190,110,0.06)':'rgba(110,125,70,0.06)';
    ctx.beginPath();ctx.ellipse(x,y,r*1.6,r*0.6,0,0,7);ctx.fill();
  }
  // 左の金地(右端は斜め)
  ctx.save();
  ctx.beginPath();ctx.moveTo(0,42);ctx.lineTo(150,42);ctx.lineTo(150,65);ctx.lineTo(135,125);ctx.lineTo(110,150);ctx.lineTo(60,175);ctx.lineTo(0,187);ctx.closePath();ctx.clip();
  const gg=ctx.createLinearGradient(0,40,0,195);gg.addColorStop(0,'#c9a866');gg.addColorStop(1,'#a99b62');
  ctx.fillStyle=gg;ctx.fillRect(0,40,160,160);
  for(let i=0;i<300;i++){ctx.fillStyle=R()<0.5?'rgba(235,205,120,0.12)':'rgba(120,120,70,0.10)';ctx.fillRect(R()*150,40+R()*155,6+R()*10,1+R()*2);}
  // 青緑の波(青海波風)
  ctx.strokeStyle='rgba(70,140,130,0.55)';ctx.lineWidth=1.2;
  for(let k=0;k<14;k++){const cx=(k%4)*22+(Math.floor(k/4)%2)*11-4,cy=135+Math.floor(k/4)*14;
    for(let r=6;r<=18;r+=4){ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,0);ctx.stroke();}}
  ctx.strokeStyle='rgba(70,140,130,0.4)';
  for(let k=0;k<8;k++){ctx.beginPath();ctx.moveTo(5+k*12,48);ctx.quadraticCurveTo(10+k*12,60,2+k*12,72);ctx.stroke();}
  ctx.restore();
  // 左の障子の縦柱(紺と木)
  ctx.fillStyle='#223c63';ctx.fillRect(146,48,8,30);
  ctx.fillStyle='#b08f58';ctx.fillRect(154,48,8,30);
  // 横梁(縁側の木)
  ctx.fillStyle='#b98f58';ctx.fillRect(160,63,185,10);
  ctx.fillStyle='rgba(90,60,30,0.3)';ctx.fillRect(160,72,185,1);
  dashed(ctx,164,67,345,67,3);
  // 右上の障子パネル
  ctx.fillStyle='#c8aa6a';ctx.fillRect(340,6,12,66);
  ctx.fillStyle='#1f3a63';ctx.fillRect(352,38,182,32);
  const pg=ctx.createLinearGradient(0,40,0,64);pg.addColorStop(0,'#cdb374');pg.addColorStop(1,'#b8a060');
  ctx.fillStyle=pg;ctx.fillRect(360,40,75,24);ctx.fillRect(450,40,76,24);
  ctx.fillStyle='#1f3a63';ctx.fillRect(434,38,17,32);
  for(let i=0;i<40;i++){ctx.fillStyle=R()<0.5?'rgba(120,150,80,0.5)':'rgba(215,170,60,0.55)';ctx.beginPath();ctx.arc(362+R()*163,42+R()*20,1.3,0,7);ctx.fill();}
  ctx.fillStyle='#233f6a';ctx.fillRect(228,2,14,10);
  ctx.fillStyle='#a2aa68';ctx.fillRect(345,70,335,3);
  dashed(ctx,340,72,600,72,3.2);
  // 右の縁側(板敷き)
  ctx.save();
  ctx.beginPath();ctx.moveTo(500,140);ctx.lineTo(680,134);ctx.lineTo(680,186);ctx.lineTo(560,222);ctx.lineTo(430,222);ctx.lineTo(480,150);ctx.closePath();ctx.clip();
  ctx.fillStyle='#c19a64';ctx.fillRect(420,130,260,100);
  for(let i=0;i<500;i++){ctx.fillStyle=R()<0.5?'rgba(220,180,110,0.12)':'rgba(120,80,40,0.10)';ctx.fillRect(420+R()*260,132+R()*95,4+R()*14,1);}
  ctx.strokeStyle='rgba(110,75,40,0.55)';ctx.lineWidth=1;
  for(const y of [152,170,188,206]){ctx.beginPath();ctx.moveTo(420,y+10);ctx.lineTo(680,y-12);ctx.stroke();}
  ctx.restore();
  ctx.fillStyle='#b99a63';ctx.fillRect(430,220,200,5);
  // 床の白縁(横・斜め)
  dashed(ctx,419,127,575,127,3);
  dashed(ctx,547,123,600,123,3);
  dashed(ctx,175,133,310,133,3);
  dashed(ctx,92,192,247,192,3);
  dashed(ctx,92,192,255,74,3);
  // 下部の青灰の帯(雲の下地)
  const bg=ctx.createLinearGradient(0,195,0,H);bg.addColorStop(0,'#86a2a6');bg.addColorStop(1,'#7f9aa0');
  ctx.fillStyle=bg;ctx.fillRect(0,196,190,H-196);ctx.fillRect(190,232,240,H-232);
  ctx.fillStyle='#9aa86a';ctx.fillRect(430,226,250,14);
  ctx.fillStyle='#7f9aa0';ctx.fillRect(430,238,250,9);
  // 上部の青灰
  ctx.fillStyle='#8fa5a9';ctx.fillRect(0,0,W,12);
  ctx.fillStyle='#9fa89a';ctx.fillRect(150,12,190,4);
  // 左上の縦の継ぎ目線
  ctx.fillStyle='rgba(150,120,80,0.35)';ctx.fillRect(173,0,1,H);
}
