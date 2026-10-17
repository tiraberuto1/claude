export const name='o_head';
// 探索パラメータ(tools/tune_o_head.mjs が書き換える)
export const P={hx:0,hy:0,hsx:0.987,hsy:1,hb:0.9,hs:0.6,tn:16,fx:0,fy:0,fsx:1.0065,fsy:0.85,fr:1,fg:1,fb:1,sa:0.55,ex:0,ey:0,mx:0,my:0,msx:1,kx:0.3888,ky:0.3888,ksx:1.0616,ksy:0.9592,kb:0.94,ta:0.4,tl:0.6704,ho:[1.87,0.65,1.65,2,2,2,2,0.76,-2,0.22,2,2,0,-2,-1.6,-0.4,-1.2,2,-0.22,2,0.53,2,-2,2,-0.96,2,-0.8,1.01,-2,2,0,1.52,-0.63,-0.57,2,-0.65,-0.11,0.98,-0.96,2,2,0,0,2,2,0,2,0.02,2,2,-2,-0.62,-0.14,2,0,1.58,-1.2,-2,0.6,-2,0,0,-0.22,1.22,-2,-0.6,-2,2,-2,2,-2,2,0,0.22,-0.65,2,0,0],fo:[1.44,2,1.35,0.43,0.13,0.37,-0.24,0,2,-2,2,-2,-0.58,2,-0.04,1.8,-2,2,1.15,1.2,-0.6,0,-1.22,1.36,-2,-2,0,-1.76,-1.87,-1.87,2,-1.4,-1.38,1.4,-1.87,0.64,1.62,0.62,2,0.82,1.4,1.14],bo:[2,0.64,2,0.22,0,0,2,2,-2,-2,-2,0.49],eo:[-0.22,-0.36,-0.14,1.24,0,0,0,0],to:[-0.69,-2,-1.4,0,1.62,-1.37],so:[0.47,-2,1.64,1.1,2,-1.08,1.4,2,2,-1.11,2,-1.11,-0.64,0.13,-2,-0.17,1.69,-1.09],no:[2,-1.28,1.16,1.0,2,-2,2,-2,-1.77,-1.26,-1.28,-1.38,-2,-0.5]};
const O=(a,pts)=>pts.map((p,i)=>[p[0]+(a[2*i]||0),p[1]+(a[2*i+1]||0)]);
const sc=(hex,r,g,b)=>{const n=parseInt(hex.slice(1),16);const q=v=>Math.max(0,Math.min(255,Math.round(v)));
  return `rgb(${q((n>>16&255)*r)},${q((n>>8&255)*g)},${q((n&255)*b)})`;};
const xf=(ctx,cx,cy,dx,dy,sx,sy)=>{ctx.translate(cx+dx,cy+dy);ctx.scale(sx,sy);ctx.translate(-cx,-cy);};
let seed=1;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
const pg=(ctx,pts,fill,stroke,lw)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.7;ctx.lineJoin='round';ctx.stroke();}};
const ln=(ctx,pts,col,lw)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();};
const sm=(ctx,pts,fill,stroke,lw)=>{const n=pts.length;ctx.beginPath();
  for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(i===0){const l=pts[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
  ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw||0.7;ctx.stroke();}};
const HP=[[51,60],[54,55],[59,51],[64,48],[70,46],[76,44],[82,42],[89,41],[95,41.5],[101,40.5],[107,41],[114,42],[120,44],[125,47],[129,52],[134,56],[139,60],[143,64],[148,68],[152,72],[156,77],[157,82],[155,87],[154,92],[151,96],[147,100],[143,102],[138,101],[130,100],[118,96],[104,90],[92,82],[84,78],[76,77],[68,74],[62,71],[57,68],[53,64]];
const lg=(ctx,x0,y0,x1,y1,st)=>{const g=ctx.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;};

function hair(ctx){
  ctx.save();xf(ctx,104,70,P.hx,P.hy,P.hsx,P.hsy);
  // 振り乱した髪: 灰褐の塊 + 右へ流れる毛筋
  const H=O(P.ho,HP);
  sm(ctx,H,null);
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
  for(let k=0;k<P.tn*2;k++){
    const i=Math.floor(k*29/(P.tn*2)),q=H[i],r=H[(i+1)%H.length];
    let nx=r[1]-H[(i+H.length-1)%H.length][1],ny=-(r[0]-H[(i+H.length-1)%H.length][0]);const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;
    const L=(2+rnd()*3.5)*P.tl;
    ctx.strokeStyle=k%2?'rgba(100,82,62,0.85)':'rgba(66,52,40,0.85)';ctx.lineWidth=0.7;
    ctx.beginPath();ctx.moveTo(q[0]-nx*1.5,q[1]-ny*1.5);ctx.quadraticCurveTo(q[0]+nx*L*0.5+ny*1.5,q[1]+ny*L*0.5-nx*1.5+P.ta,q[0]+nx*L+ny*(rnd()*4-1)+2,q[1]+ny*L+rnd()*3);ctx.stroke();}
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
  // 眉間のしわ・頬の陰影
  ctx.globalAlpha=0.4;ctx.fillStyle='#A03018';
  ctx.beginPath();ctx.ellipse(104,88,4.5,6,0.2,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(132,92,3,4,0,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(120,76,4,3,0.4,0,7);ctx.fill();ctx.globalAlpha=1;
  [[[114,64],[115,72]],[[117,63],[118,73]],[[120,64],[120.5,71]]].forEach(w=>ln(ctx,w,'#7A1C10',0.7));
  ln(ctx,[[110,90],[108,96],[112,100]],'#8A2414',0.7);ln(ctx,[[124,91],[127,95],[126,99]],'#8A2414',0.6);
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
  for(let k=0;k<16;k++){const x=305+k*2.2,y=6+(k*5)%14;ln(ctx,[[x,y],[x+3,y+2.5]],k%2?'rgba(220,100,50,0.8)':'rgba(150,40,24,0.8)',0.6);}
  for(let k=0;k<5;k++){const x=325+k*2.2;ln(ctx,[[x,20+k%2],[x+0.6,25+k%3*2],[x-0.3,31+k%2*4]],'rgba(176,40,28,0.8)',0.9);}
  // 鼻づら
  sm(ctx,O(P.so,[[286,18],[290,10],[298,7],[310,8],[322,10],[326,16],[316,20],[304,22],[292,24]]),'#C07C34',ink,0.6);
  pg(ctx,[[292,12],[304,9],[316,11],[308,15],[296,17]],'#D49A44');
  // 頭上(目の載る頭)
  ctx.fillStyle='#B8602C';ctx.beginPath();ctx.ellipse(298,7,12,5,0,0,7);ctx.fill();
  ctx.fillStyle='#D8A858';ctx.beginPath();ctx.ellipse(293,6.5,2.4,1.8,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(303,7.5,2.4,1.8,0,0,7);ctx.fill();
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
