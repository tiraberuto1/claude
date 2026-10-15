export const name='o_head';
// 探索パラメータ(tools/tune_o_head.mjs が書き換える)
export const P={hx:0,hy:4,hsx:0.7678,hsy:1,hb:0.9,hs:0.6259,tn:10,fx:0,fy:0,fsx:1,fsy:0.85,fr:1,fg:1,fb:1,sa:0.55,ex:0,ey:0,mx:0,my:0,msx:1,kx:0,ky:0,ksx:1.048,ksy:0.9592,kb:1.053,ta:0.3136,tl:0.7568,ho:[-1.87,-2,-2,-2,-2,-2,-2,-2,-1.87,1,-2,0.6,1.87,-0.6,2,-2,2,2,2,-0.13,-2,-1.87,-2,2,-2,2,2,1,2,-2,2,-2,-2,1.87],fo:[1.18,2,1.22,0.78,0,0.37,-0.37,0,2,-2,2,-2,-0.58,2,0.09,1.8,-0.23,2,1.51,1.8,-0.6,0,-1.22,1.36,-2,-2,-1,-2,-1.85,-1.87,2,-2,-2,2,-0.42,1,1,1.09,2,0.6,1.4,1.14],bo:[2,0.64,2,-1,0,0,2,2,-2,-2,-2,0.36],eo:[-0.22,-0.36,-0.14,1.24,0,0,0,0],to:[-2,-0.64,-1.4,0,1.62,-1.37],so:[2,-2,2,-0.14,2,0.36,2,2,2,-0.21,1.6,-2,-2.0,0.13,1.62,0.36,1.11,-1.22],no:[1.8,-1.6,2,0.72,2,0.62,2,-2,-1.78,-1,-2,-0.78,-2,-1.14]};
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
    const right=k<P.tn*0.62,x=right?124+rnd()*26:56+rnd()*14,y=right?50+rnd()*30:58+rnd()*28;
    ctx.strokeStyle=k%2?'rgba(96,78,58,0.8)':'rgba(70,56,42,0.8)';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+(right?6:-4)*P.tl,y-2+P.ta*4,x+(right?12:-8)*P.tl,y+2,x+(right?18:-12)*P.tl,y+4+rnd()*6);ctx.stroke();}
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
  const ink='#5a2010';
  // 左の耳
  pg(ctx,[[93,76],[91,67],[93,60],[96,58],[99,63],[101,72]],'#D8883C',ink,0.6);
  pg(ctx,[[94,70],[94,63],[96,61],[97,66]],'#C0602C');
  // 右の耳/角
  pg(ctx,[[127,64],[130,59],[133,61],[134,68],[130,72]],'#D0602C',ink,0.5);
  // 顔の地(額は朱赤、下は橙)
  const f=O(P.fo,[[97,74],[100,66],[105,58],[111,54],[118,53],[125,57],[128,63],[133,70],[136,77],[140,81],[137,86],[131,90],[129,96],[128,103],[120,102],[112,99],[104,100],[97,98],[91,92],[87,85],[89,78]]);
  pg(ctx,f,lg(ctx,110,53,118,103,[[0,'#D8602A'],[0.45,'#CC4C26'],[1,'#D8843A']]),ink,0.8);
  // 左頬の橙黄
  ctx.globalAlpha=0.85;pg(ctx,[[88,80],[94,77],[99,80],[98,88],[93,94],[88,90]],'#E8963E');ctx.globalAlpha=1;
  // 額の赤い筋
  for(let i=0;i<6;i++)ln(ctx,[[108+i*2.2,55+i*0.5],[114+i*2.4,60+i*1.2],[118+i*2,67+i*1.2]],'rgba(160,44,20,0.7)',0.7);
  // 目の周りの濃い赤
  ctx.globalAlpha=0.6;
  ctx.fillStyle='#9A2416';ctx.beginPath();ctx.ellipse(112,81.5,6,4,0.2,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(127,87,5.5,3.6,0.3,0,7);ctx.fill();ctx.globalAlpha=1;
  // 眉(太い暗赤の帯)
  pg(ctx,O(P.bo.slice(0,6),[[104,72],[112,69],[122,74],[124,79],[114,76]]),'#8A2414');
  pg(ctx,O(P.bo.slice(6,12),[[122,80],[131,80],[138,83],[132,85],[124,84]]),'#8A2414');
  // 白い毛束
  ctx.lineCap='round';
  [[107,71,105,67],[110,70,109,66],[113,70,113,66],[116,71,117,67],[129,80,134,78],[131,82,137,80],[133,83,139,83],[130,84,136,86]].forEach(t=>ln(ctx,[[t[0],t[1]],[t[2],t[3]]],'#EFE6C8',1.1));
  // 目(小さく、眉の下)
  const e=P.eo;
  ctx.fillStyle='#E8DCA8';ctx.strokeStyle='#2a1008';ctx.lineWidth=0.5;
  ctx.beginPath();ctx.ellipse(112+e[0],82+e[1],2.8,1.7,0.1,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(127.5+e[2],87.5+e[3],2.6,1.6,0.15,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#2a1408';ctx.beginPath();ctx.arc(112.6+e[0],82+e[1],1.1,0,7);ctx.fill();ctx.beginPath();ctx.arc(127.8+e[2],87.6+e[3],1.1,0,7);ctx.fill();
  // 鼻(黄土の大きな鼻)
  pg(ctx,[[111,90],[116,87.5],[122,89],[124.5,94],[120,98],[114,97],[111,94]],'#D89C40','#8a3414',0.5);
  pg(ctx,[[113,90],[117,89],[121,90],[117,92]],'#E8BA5C');
  ctx.fillStyle='#4a1408';ctx.beginPath();ctx.ellipse(115,94.5,1.6,1,0,0,7);ctx.fill();
  ln(ctx,[[119,83],[117,88]],'#9a2c14',0.8);
  // 口(左: 赤と白い牙)
  pg(ctx,[[93,84],[100,82],[106,88],[107,96],[100,99],[94,94]],'#B01C18',ink,0.5);
  const t=P.to;
  [[96,86,3,5],[100,89,3,5],[102,94,3,4]].forEach((q,i)=>pg(ctx,[[q[0]+t[2*i],q[1]+t[2*i+1]],[q[0]+q[2]+t[2*i],q[1]+t[2*i+1]],[q[0]+q[2]/2+t[2*i],q[1]+q[3]+t[2*i+1]]],'#F2EAD0'));
  // 下唇・あごの突起
  pg(ctx,[[104,98],[114,99],[124,100],[128,103],[118,102],[106,101]],'#C0301C');
  pg(ctx,[[118,92],[128,98],[125,104],[119,100]],'#D8883A');
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
  [[308,10,7],[318,8,7],[328,10,8],[334,16,6],[324,16,6],[316,14,6],[330,22,5]].forEach((c,i)=>{const o=P.no[2*(i%7)]||0;ctx.fillStyle=i%2?'#B8502A':'#A8442A';ctx.beginPath();ctx.arc(c[0]+o,c[1]+(P.no[2*(i%7)+1]||0),c[2],0,7);ctx.fill();});
  for(let k=0;k<7;k++){ln(ctx,[[326+k*1.8,22],[327+k*1.8,27+k%3*3]],'rgba(170,60,34,0.7)',1.1);}
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
