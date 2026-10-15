export const name='o_head';
// 探索パラメータ(tools/tune_o_head.mjs が書き換える)
export const P={hx:-0.2,hy:0,hsx:0.928,hsy:0.947,hb:1.15,hs:0.7,tn:8,
  fx:3.15,fy:0,fsx:1.0006,fsy:0.9887,fr:0.877,fg:1.0166,fb:0.9927,sa:0.95,
  ex:-0.88,ey:-0.33,mx:4.0,my:1.67,msx:0.9974,
  kx:0.36,ky:0.27,ksx:1.064,ksy:0.994,kb:1.041,
  ta:0,tl:1,
  ho:new Array(34).fill(0),fo:new Array(30).fill(0),bo:new Array(16).fill(0),eo:new Array(16).fill(0),
  to:new Array(12).fill(0),so:new Array(18).fill(0),no:new Array(14).fill(0)};
const O=(a,pts)=>pts.map((p,i)=>[p[0]+(a[2*i]||0),p[1]+(a[2*i+1]||0)]);
const sc=(hex,r,g,b)=>{const n=parseInt(hex.slice(1),16);const q=v=>Math.max(0,Math.min(255,Math.round(v)));
  return `rgb(${q((n>>16&255)*r)},${q((n>>8&255)*g)},${q((n&255)*b)})`;};
const xf=(ctx,cx,cy,dx,dy,sx,sy)=>{ctx.translate(cx+dx,cy+dy);ctx.scale(sx,sy);ctx.translate(-cx,-cy);};
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const pg=(ctx,pts,fill,stroke,lw)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.7;ctx.lineJoin='round';ctx.stroke();}};
const ln=(ctx,pts,col,lw)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
const lg=(ctx,x0,y0,x1,y1,st)=>{const g=ctx.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;};

function hair(ctx){
  ctx.save();xf(ctx,104,70,P.hx,P.hy,P.hsx,P.hsy);
  // 振り乱した髪: 灰褐の塊 + 右へ流れる毛筋
  const H=O(P.ho,[[58,66],[54,50],[78,42],[104,40],[124,39],[138,44],[150,56],[160,66],[160,84],[150,98],[142,108],[132,106],[128,100],[100,98],[76,96],[60,82],[58,66]]);
  ctx.beginPath();ctx.moveTo(H[0][0],H[0][1]);
  ctx.bezierCurveTo(H[1][0],H[1][1],H[2][0],H[2][1],H[3][0],H[3][1]);
  ctx.bezierCurveTo(H[4][0],H[4][1],H[5][0],H[5][1],H[6][0],H[6][1]);
  ctx.bezierCurveTo(H[7][0],H[7][1],H[8][0],H[8][1],H[9][0],H[9][1]);
  ctx.bezierCurveTo(H[10][0],H[10][1],H[11][0],H[11][1],H[12][0],H[12][1]);
  ctx.lineTo(H[13][0],H[13][1]);ctx.bezierCurveTo(H[14][0],H[14][1],H[15][0],H[15][1],H[16][0],H[16][1]);
  ctx.fillStyle=lg(ctx,56,40,150,100,[[0,sc('#6e5a42',P.hb,P.hb,P.hb)],[0.5,sc('#7a644a',P.hb,P.hb,P.hb)],[1,sc('#6a563e',P.hb,P.hb,P.hb)]]);ctx.fill();
  ctx.save();ctx.clip();
  seed=21;
  for(let i=0;i<260;i++){
    const x=54+rnd()*60,y=40+rnd()*60;
    const L=30+rnd()*70,dy=(rnd()-0.35)*16;
    const c=rnd();
    ctx.strokeStyle=c<0.4?'rgba(40,30,22,0.3)':c<0.75?'rgba(150,126,98,0.5)':'rgba(90,72,54,0.5)';
    ctx.lineWidth=(0.5+rnd()*0.5)*P.hs;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+L*0.3,y-4+rnd()*3,x+L*0.7,y+dy*0.5,x+L,y+dy);ctx.stroke();
  }
  ctx.restore();
  for(let k=0;k<70;k++){
    const a=rnd()*6.283,cx=104,cy=70,x=cx+Math.cos(a)*(44+rnd()*6),y=cy+Math.sin(a)*(26+rnd()*4);
    if(Math.cos(a)<-0.2&&rnd()<0.5)continue;
    ctx.strokeStyle=rnd()<0.5?'rgba(80,64,48,0.8)':'rgba(130,108,84,0.7)';ctx.lineWidth=0.8;
    ctx.beginPath();ctx.moveTo(x-Math.cos(a)*5,y-Math.sin(a)*5);ctx.lineTo(x+Math.cos(a)*(2+rnd()*5)+3,y+Math.sin(a)*(2+rnd()*4));ctx.stroke();}
  for(let k=0;k<P.tn;k++){
    const right=k<P.tn*0.62,x=right?122+rnd()*30:55+rnd()*14,y=right?46+rnd()*34:56+rnd()*30;
    pg(ctx,[[x,y],[x+(right?9:-4)+rnd()*8,y-3-rnd()*4+(right?0:6)],[x+((right?14:-12)+rnd()*10)*P.tl,y+rnd()*8+P.ta*(right?1:-1)*((right?14:12)*P.tl)/10]],k%2?'#6a563e':'#5a4832');}
  // 右下へ垂れる毛房
  for(let k=0;k<26;k++){
    const x=126+rnd()*30,y=60+rnd()*40;
    ctx.strokeStyle=rnd()<0.5?'rgba(70,56,42,0.7)':'rgba(130,112,92,0.5)';ctx.lineWidth=0.6;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y+8,x+4+rnd()*8,y+16+rnd()*8);ctx.stroke();
  }
  ctx.restore();
}

function face(ctx){
  ctx.save();xf(ctx,118,78,P.fx,P.fy,P.fsx,P.fsy);
  const ink='#6a2a14';
  // 耳
  pg(ctx,[[93,66],[88,58],[90,52],[98,58],[101,66]],'#D07030',ink,0.6);
  // 顔 (角張った輪郭)
  const f=O(P.fo,[[100,57],[108,53],[120,52],[131,55],[138,62],[140,72],[136,80],[132,88],[128,96],[124,103],[116,105],[108,100],[100,94],[96,84],[96,72]]);
  pg(ctx,f,lg(ctx,96,54,130,104,[[0,sc('#C87244',P.fr,P.fg,P.fb)],[0.5,sc('#B8683E',P.fr,P.fg,P.fb)],[1,sc('#B08048',P.fr,P.fg,P.fb)]]),ink,0.8);
  // 頬・顎の明部と影
  ctx.globalAlpha=0.55;pg(ctx,[[100,72],[110,70],[112,82],[104,92],[98,84]],'#D8803C');
  pg(ctx,[[124,66],[136,68],[133,80],[126,82]],'#D88840');
  ctx.globalAlpha=P.sa;
  pg(ctx,[[96,72],[104,76],[102,90],[98,84]],'#A83A1E');pg(ctx,[[134,72],[139,72],[134,86],[130,88]],'#A83A1E');
  pg(ctx,[[100,58],[130,55],[136,62],[120,62]],'#A83A1E');pg(ctx,[[117,82],[122,82],[124,92],[116,92]],'#7A2418');
  ctx.globalAlpha=0.5;pg(ctx,[[116,90],[130,88],[124,102],[116,102]],'#A8441C');ctx.globalAlpha=1;
  ctx.save();ctx.translate(P.ex,P.ey);
  // 眉間のしわ・額
  ln(ctx,[[106,62],[112,66],[118,70]],'#8a3414',0.8);
  ln(ctx,[[134,62],[128,67],[122,70]],'#8a3414',0.8);
  ln(ctx,[[116,56],[117,66]],'#8a3414',0.6);ln(ctx,[[112,57],[113,64]],'#8a3414',0.5);ln(ctx,[[121,56],[121,65]],'#8a3414',0.5);
  ln(ctx,[[108,72],[116,76],[120,80]],'#8a3414',0.7);
  ln(ctx,[[132,74],[126,78],[122,82]],'#8a3414',0.7);
  // 白い眉
  ln(ctx,O(P.bo.slice(0,8),[[104,73],[110,70],[116,72],[119,76]]),'#C8A860',1.2);
  ln(ctx,O(P.bo.slice(8),[[126,76],[132,71],[138,72],[141,75]]),'#C8A860',1.2);
  ln(ctx,[[104,72],[112,71],[117,73]],'#7a5a34',0.5);
  // 目
  pg(ctx,O(P.eo.slice(0,8),[[108,80.5],[113,79],[117,82],[112,83]]),'#F0E4B8','#3a1a0c',0.5);
  pg(ctx,O(P.eo.slice(8),[[124,82],[130,80],[136,84],[130,86]]),'#F0E4B8','#3a1a0c',0.5);
  ctx.fillStyle='#2a1408';ctx.fillRect(112,79.2,3,3);ctx.fillRect(129,81.5,3,3);
  // 鼻
  ln(ctx,[[119,83],[120,90],[125,92]],'#8a3414',0.8);
  ctx.restore();
  ctx.save();xf(ctx,118,96,P.mx,P.my,P.msx,P.msx);
  // 口: 牙と赤い口中
  pg(ctx,[[106,91],[114,89],[122,91],[130,90],[131,96],[125,102],[116,103],[110,99]],'#C02818','#5a0e08',0.6);
  ctx.fillStyle='#E8D8A0';
  [[102,91,2,5],[108,89,2,6],[114,91,2,4],[124,91,2,5],[130,90,2,6],[118,98,2,4]].forEach((t,ti)=>{t=[t[0]+P.to[2*ti],t[1]+P.to[2*ti+1],t[2],t[3]];pg(ctx,[[t[0],t[1]],[t[0]+t[2],t[1]],[t[0]+t[2]/2,t[1]+t[3]]],'#E8D8A0');});
  ln(ctx,[[104,94],[112,98],[122,100]],'#e07060',0.7);
  ctx.restore();
  ctx.restore();
}

function hand(ctx){
  // 刀を握る手
  pg(ctx,[[40,102],[46,104],[50,110],[48,116],[43,114],[41,109]],'#D89048','#6a2a14',0.5);
  ln(ctx,[[44,106],[48,110]],'#8a4a20',0.4);
}

function mask(ctx){
  ctx.save();xf(ctx,313,20,P.kx,P.ky,P.ksx,P.ksy);
  // 右上: 橙赤の面 (獣面)
  const ink='#7a2a12';
  // 外側の赤い毛/たてがみ
  pg(ctx,O(P.no,[[300,4],[322,4],[338,6],[340,16],[334,26],[326,24],[318,16]]),'#A8542C');
  for(let k=0;k<8;k++){ln(ctx,[[328+k*1.4,18],[329+k*1.4,26+k%3*3]],'rgba(150,70,36,0.7)',1.1);}
  // 鼻づら
  pg(ctx,O(P.so,[[286,18],[290,10],[298,7],[310,8],[322,10],[326,16],[316,20],[304,22],[292,24]]),'#C07C34',ink,0.6);
  pg(ctx,[[292,12],[304,9],[316,11],[308,15],[296,17]],'#D49A44');
  // 上の目・暗点
  ctx.fillStyle='#2a1a10';ctx.beginPath();ctx.arc(293,6.5,1.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(303,7.5,1.6,0,7);ctx.fill();
  ctx.fillStyle='#4a2a14';ctx.beginPath();ctx.ellipse(299,16.5,2,1.3,0,0,7);ctx.fill();
  // 口: 赤い口中と牙
  pg(ctx,[[292,24],[304,21],[316,21],[322,28],[314,36],[304,39],[296,34]],'#B05A2A');
  pg(ctx,[[298,24],[306,22],[316,23],[318,29],[310,34],[302,32]],'#A82820',ink,0.5);
  pg(ctx,[[294,26],[302,26],[304,29],[296,30]],'#C84030');
  pg(ctx,[[306,19],[312,20],[314,26],[308,24]],'#EFE2C8');
  [[298,32],[303,34],[308,35],[313,32],[318,28]].forEach(t=>pg(ctx,[[t[0],t[1]],[t[0]+2,t[1]],[t[0]+1,t[1]+3]],'#F4ECD6'));
  ln(ctx,[[292,34],[300,37],[308,38]],'#E8A040',1);
  ln(ctx,[[322,10],[324,20],[318,30]],'#E8B050',0.9);
  ctx.restore();
  if(P.kb!==1){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle=P.kb<1?`rgba(0,0,0,${1-P.kb})`:`rgba(255,255,255,${P.kb-1})`;ctx.fillRect(280,0,70,45);ctx.restore();}
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
