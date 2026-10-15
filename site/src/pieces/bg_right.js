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
  ctx.fillStyle='#8f9b8e';ctx.fillRect(340,0,340,40);
  // 黄緑の床
  const g=ctx.createLinearGradient(340,0,680,0);
  g.addColorStop(0,'#908a62');g.addColorStop(0.5,'#8e8860');g.addColorStop(1,'#8a865f');
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
  ctx.fillStyle=pg;ctx.fillRect(356,40,80,26);ctx.fillRect(451,40,76,26);
  ctx.fillStyle='#14233f';ctx.fillRect(436,36,15,34);
  ctx.fillRect(525,36,12,34);
  // パネルの草花
  for(let i=0;i<35;i++){
    const x=358+R()*168,y=42+R()*22;if(x>434&&x<452)continue;
    ctx.fillStyle=R()<0.5?'rgba(110,140,80,0.55)':'rgba(215,175,70,0.6)';
    ctx.beginPath();ctx.arc(x,y,1+R()*1.2,0,7);ctx.fill();
  }
  // 床との境の縁
  ctx.fillStyle='#9c9a68';ctx.fillRect(340,70,260,3);
  dashed(ctx,340,71,597,71,3);
  // 縁側奥の汚れたオリーブ褐色の床
  ctx.fillStyle='rgba(136,116,81,0.9)';ctx.fillRect(480,128,200,11);
  // 縁側の板敷き
  ctx.save();
  ctx.beginPath();ctx.moveTo(478,139);ctx.lineTo(680,137);ctx.lineTo(680,198);ctx.lineTo(640,206);ctx.lineTo(560,222);ctx.lineTo(500,224);ctx.lineTo(440,222);ctx.lineTo(455,150);ctx.closePath();ctx.clip();
  const pl=ctx.createLinearGradient(0,137,0,224);pl.addColorStop(0,'rgb(178,130,84)');pl.addColorStop(1,'rgb(168,120,76)');
  ctx.fillStyle=pl;ctx.fillRect(430,130,250,100);
  // 板目(細い横筋・僅かに斜め)
  for(let y=138;y<226;y+=2+R()*1.2){
    for(let x=430;x<680;x+=8+R()*30){
      const l=10+R()*40;
      ctx.strokeStyle=R()<0.7?'rgba(138,94,60,0.35)':'rgba(215,170,120,0.25)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+(680-x)*0.02);ctx.lineTo(x+l,y+(680-x-l)*0.02);ctx.stroke();
    }
  }
  // ピンク褐色の汚れ
  for(let i=0;i<30;i++){const x=450+R()*230,y=140+R()*80;ctx.fillStyle='rgba(160,95,75,0.10)';ctx.beginPath();ctx.ellipse(x,y,10+R()*14,3+R()*4,-0.2,0,7);ctx.fill();}
  // 板の継ぎ目(斜め)
  ctx.strokeStyle='rgba(107,74,48,0.7)';ctx.lineWidth=0.8;
  for(const y of [154,170,186,202,218]){ctx.beginPath();ctx.moveTo(430,y+8);ctx.lineTo(680,y-14);ctx.stroke();}
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
  jag([[680,141],[664,144],[650,148],[638,154],[628,158],[619,164],[614,167],[626,166],[634,169],[644,168],[652,171],[662,170],[670,173],[680,172]],3);
  jag([[680,185],[672,189],[664,193],[658,197],[651,201],[660,203],[668,205],[680,209]],5);
  jag([[541,217],[548,212],[556,210],[565,208],[573,208],[566,212],[559,215],[552,218],[546,221]],7);
  // 縁の点線
  dashed(ctx,430,126,580,126,3);
  dashed(ctx,587,198,640,182,3);
  // 下部の青灰(雲の下地)
  ctx.fillStyle='#86998f';ctx.fillRect(340,228,340,19);
  ctx.restore();
}
