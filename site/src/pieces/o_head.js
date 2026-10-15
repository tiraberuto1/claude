export const name='o_head';
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const pg=(ctx,pts,fill,stroke,lw)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.7;ctx.lineJoin='round';ctx.stroke();}};
const ln=(ctx,pts,col,lw)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
const lg=(ctx,x0,y0,x1,y1,st)=>{const g=ctx.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;};

function hair(ctx){
  // 振り乱した髪: 灰褐の塊 + 右へ流れる毛筋
  ctx.beginPath();ctx.moveTo(58,66);
  ctx.bezierCurveTo(54,50,78,42,104,40);
  ctx.bezierCurveTo(124,39,138,44,150,56);
  ctx.bezierCurveTo(160,66,160,84,150,98);
  ctx.bezierCurveTo(142,108,132,106,128,100);
  ctx.lineTo(100,98);ctx.bezierCurveTo(76,96,60,82,58,66);
  ctx.fillStyle=lg(ctx,56,40,150,100,[[0,'#5a4a3a'],[0.5,'#6e5e4a'],[1,'#5c4c3c']]);ctx.fill();
  ctx.save();ctx.clip();
  seed=21;
  for(let i=0;i<260;i++){
    const x=54+rnd()*60,y=40+rnd()*60;
    const L=30+rnd()*70,dy=(rnd()-0.35)*16;
    const c=rnd();
    ctx.strokeStyle=c<0.4?'rgba(36,28,22,0.55)':c<0.75?'rgba(150,130,106,0.5)':'rgba(96,80,62,0.6)';
    ctx.lineWidth=0.5+rnd()*0.5;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+L*0.3,y-4+rnd()*3,x+L*0.7,y+dy*0.5,x+L,y+dy);ctx.stroke();
  }
  ctx.restore();
  // 右下へ垂れる毛房
  for(let k=0;k<26;k++){
    const x=126+rnd()*30,y=60+rnd()*40;
    ctx.strokeStyle=rnd()<0.5?'rgba(70,56,42,0.7)':'rgba(130,112,92,0.5)';ctx.lineWidth=0.6;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y+8,x+4+rnd()*8,y+16+rnd()*8);ctx.stroke();
  }
}

function face(ctx){
  const ink='#6a2a14';
  // 耳
  pg(ctx,[[93,66],[88,58],[90,52],[98,58],[101,66]],'#D07030',ink,0.6);
  // 顔 (角張った輪郭)
  const f=[[100,57],[108,53],[120,52],[131,55],[138,62],[140,72],[136,80],[132,88],[128,96],[124,103],[116,105],[108,100],[100,94],[96,84],[96,72]];
  pg(ctx,f,lg(ctx,96,54,130,104,[[0,'#D86A30'],[0.55,'#DC7434'],[1,'#C85C28']]),ink,0.8);
  // 頬・顎の明部と影
  ctx.globalAlpha=0.55;pg(ctx,[[100,72],[110,70],[112,82],[104,92],[98,84]],'#E89048');
  pg(ctx,[[124,66],[136,68],[133,80],[126,82]],'#E8A055');
  ctx.globalAlpha=0.5;pg(ctx,[[116,90],[130,88],[124,102],[116,102]],'#A8441C');ctx.globalAlpha=1;
  // 眉間のしわ・額
  ln(ctx,[[106,62],[112,66],[118,70]],'#8a3414',0.8);
  ln(ctx,[[134,62],[128,67],[122,70]],'#8a3414',0.8);
  ln(ctx,[[116,56],[117,66]],'#8a3414',0.6);ln(ctx,[[112,57],[113,64]],'#8a3414',0.5);ln(ctx,[[121,56],[121,65]],'#8a3414',0.5);
  ln(ctx,[[108,72],[116,76],[120,80]],'#8a3414',0.7);
  ln(ctx,[[132,74],[126,78],[122,82]],'#8a3414',0.7);
  // 白い眉
  pg(ctx,[[104,71],[112,70],[118,73],[112,75],[106,75]],'#EAD8B0');
  pg(ctx,[[126,74],[133,70],[141,73],[134,77],[127,78]],'#EAD8B0');
  ln(ctx,[[104,72],[112,71],[117,73]],'#7a5a34',0.5);
  // 目
  pg(ctx,[[107,80],[113,78],[118,82],[112,83]],'#F0E4B8','#3a1a0c',0.5);
  pg(ctx,[[124,82],[130,80],[136,84],[130,86]],'#F0E4B8','#3a1a0c',0.5);
  ctx.fillStyle='#2a1408';ctx.fillRect(112,79.2,3,3);ctx.fillRect(129,81.5,3,3);
  // 鼻
  ln(ctx,[[119,83],[120,90],[125,92]],'#8a3414',0.8);
  // 口: 牙と赤い口中
  pg(ctx,[[100,90],[110,87],[120,90],[130,89],[136,94],[128,101],[118,103],[108,98]],'#B01C14','#5a0e08',0.6);
  ctx.fillStyle='#F4ECD2';
  [[102,91,2,5],[108,89,2,6],[114,91,2,4],[124,91,2,5],[130,90,2,6],[118,98,2,4]].forEach(t=>pg(ctx,[[t[0],t[1]],[t[0]+t[2],t[1]],[t[0]+t[2]/2,t[1]+t[3]]],'#F4ECD2'));
  ln(ctx,[[104,94],[112,98],[122,100]],'#e07060',0.7);
}

function hand(ctx){
  // 刀を握る手
  pg(ctx,[[40,102],[46,104],[50,110],[48,116],[43,114],[41,109]],'#D89048','#6a2a14',0.5);
  ln(ctx,[[44,106],[48,110]],'#8a4a20',0.4);
}

function mask(ctx){
  // 右上: 橙赤の面 (獣面)
  const ink='#7a2a12';
  // 外側の赤い毛/たてがみ
  pg(ctx,[[300,4],[322,4],[338,6],[340,16],[334,26],[326,24],[318,16]],'#D8502A');
  for(let k=0;k<8;k++){ln(ctx,[[328+k*1.4,18],[329+k*1.4,26+k%3*3]],'rgba(200,60,30,0.7)',1.1);}
  // 鼻づら
  pg(ctx,[[286,18],[290,10],[298,7],[310,8],[322,10],[326,16],[316,20],[304,22],[292,24]],'#E49A38',ink,0.6);
  pg(ctx,[[292,12],[304,9],[316,11],[308,15],[296,17]],'#F0B450');
  // 上の目・暗点
  ctx.fillStyle='#2a1a10';ctx.beginPath();ctx.arc(293,6.5,1.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(303,7.5,1.6,0,7);ctx.fill();
  ctx.fillStyle='#4a2a14';ctx.beginPath();ctx.ellipse(299,16.5,2,1.3,0,0,7);ctx.fill();
  // 口: 赤い口中と牙
  pg(ctx,[[296,22],[306,19],[318,18],[322,24],[316,31],[310,38],[300,38],[294,32]],'#B8281E',ink,0.6);
  pg(ctx,[[294,28],[304,25],[310,28],[300,33]],'#C84030');
  pg(ctx,[[306,19],[312,20],[314,26],[308,24]],'#EFE2C8');
  [[298,32],[303,34],[308,35],[313,32],[318,28]].forEach(t=>pg(ctx,[[t[0],t[1]],[t[0]+2,t[1]],[t[0]+1,t[1]+3]],'#F4ECD6'));
  ln(ctx,[[292,34],[300,37],[308,38]],'#E8A040',1);
  ln(ctx,[[322,10],[324,20],[318,30]],'#E8B050',0.9);
}

export function draw(ctx,W,H){
  // 持物の刀(左上)
  ln(ctx,[[14,46],[42,101]],'#5f7ea0',1.7);
  ln(ctx,[[14.5,46.5],[41,100]],'#bccad8',0.5);
  ln(ctx,[[40,98],[46,108]],'#7a5a2a',1.6);
  hair(ctx);
  face(ctx);
  hand(ctx);
  mask(ctx);
}
