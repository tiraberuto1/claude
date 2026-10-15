export const name='bg_left';
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
// 黒白の点線縁(白帯+黒点、周期7px)
function dashed(ctx,x0,y0,x1,y1,w=3,per=7){
  const L=Math.hypot(x1-x0,y1-y0),a=Math.atan2(y1-y0,x1-x0);
  ctx.save();ctx.translate(x0,y0);ctx.rotate(a);
  ctx.fillStyle='#e8e4d2';ctx.fillRect(0,-w/2,L,w);
  ctx.fillStyle='rgba(120,110,90,0.35)';ctx.fillRect(0,w/2-0.5,L,0.5);
  ctx.fillStyle='#26221e';
  for(let t=2;t<L;t+=per)ctx.fillRect(t,-w/2,Math.min(3.4,L-t),w);
  ctx.restore();
}
export function draw(ctx,W,H){
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
  ctx.save();ctx.translate(270,70);ctx.rotate(0.65);
  for(let i=0;i<5;i++){ctx.fillStyle='rgba(140,105,50,'+(0.08+0.03*i)+')';ctx.fillRect(-10,-20+i*5,90,6);}
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
  for(const [x,y,w,h,a] of [[83,181.5,9,2.6,0.75],[78,183,6,2,0.5],[75,191,9,2.4,0.55],[208,218,10,2.6,0.75],[214,221,7,2,0.6],[199,216,4,1.6,0.45]]){
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
  for(let i=0;i<46;i++){
    const cx=R()*150,cy=50+R()*125,r=6+R()*13,a0=Math.PI*(1.1+R()*0.3),a1=a0+Math.PI*(0.35+R()*0.35);
    ctx.strokeStyle=R()<0.7?'rgba(70,150,125,0.75)':'rgba(120,170,110,0.65)';
    ctx.lineWidth=0.7+R()*0.6;
    ctx.beginPath();ctx.arc(cx,cy,r,a0,a1);ctx.stroke();
    if(R()<0.4){ctx.beginPath();ctx.arc(cx+4,cy+1,r*0.8,a0,a1);ctx.stroke();}
  }
  // 金砂子のかすれ
  for(let i=0;i<14;i++){ctx.strokeStyle='rgba(225,200,130,0.5)';ctx.lineWidth=0.6;const x=R()*150,y=50+R()*125;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y-5);ctx.stroke();}
  ctx.restore();

  // 障子の縦柱: 紺 / 黒線 / 木 / 紺
  ctx.fillStyle='#1d4b7d';ctx.fillRect(147,50,7,19);
  ctx.fillStyle='#1c1a18';ctx.fillRect(154,50,1.2,19);
  ctx.fillStyle='#b99a64';ctx.fillRect(155,50,8,19);
  ctx.fillStyle='rgba(120,90,50,0.35)';ctx.fillRect(158,50,0.8,19);
  ctx.fillStyle='#d6bd88';ctx.fillRect(156,50,1.2,19);
  ctx.fillStyle='#1d4b7d';ctx.fillRect(167,50,3,12);
  // 障子の斜め桟(紺)
  ctx.fillStyle='#24456e';
  ctx.beginPath();ctx.moveTo(170,50);ctx.lineTo(182,50);ctx.lineTo(171,62);ctx.closePath();ctx.fill();
  ctx.fillStyle='#14110f';
  ctx.beginPath();ctx.moveTo(182,50);ctx.lineTo(183,50);ctx.lineTo(171,64);ctx.lineTo(170,63);ctx.closePath();ctx.fill();

  // 横梁(褐色の木)
  const bm=ctx.createLinearGradient(0,68,0,76);bm.addColorStop(0,'rgb(176,138,88)');bm.addColorStop(1,'rgb(160,124,80)');
  ctx.fillStyle=bm;ctx.fillRect(158,68,182,7);
  ctx.fillStyle='rgba(235,215,170,0.35)';ctx.fillRect(170,69,170,1);
  ctx.fillStyle='rgba(100,70,35,0.35)';ctx.fillRect(160,74,180,1);
  for(let i=0;i<40;i++){ctx.fillStyle='rgba(120,85,45,0.18)';ctx.fillRect(162+R()*175,68+R()*6,8+R()*25,0.7);}

  // 点線縁
  dashed(ctx,163,67.5,340,67.5,2.6,7.8);
  dashed(ctx,292,74,340,74,2.2,7.5);
  dashed(ctx,175,132,330,132,3);
  dashed(ctx,92,189,248,189,3);
  dashed(ctx,92,190,256,76,3);

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
