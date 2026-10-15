export const name='s_left';
const P=(c,pts,f,s,lw)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(f){c.fillStyle=f;c.fill();}if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.lineJoin='round';c.stroke();}};
const L=(c,a,b,col,w,cap)=>{c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.strokeStyle=col;c.lineWidth=w;c.lineCap=cap||'round';c.stroke();};
const E=(c,x,y,rx,ry,f,rot,s,lw)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,7);c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.stroke();}};
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
// 四角形 q=[a,b,c,d] (a-b 上辺, d-c 下辺) を a-d 方向に n 本の縞に分割 (縞は a-b と平行に並ぶ)
function bands(c,q,cols,n,edge){
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n;
    P(c,[lerp(q[0],q[3],t0),lerp(q[1],q[2],t0),lerp(q[1],q[2],t1),lerp(q[0],q[3],t1)],cols[i%cols.length]);}
  if(edge)P(c,q,null,edge,1);
}
// 縦縞: a-d方向ではなく a-b 方向に分割
function vbands(c,q,cols,n,edge){
  for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n;
    P(c,[lerp(q[0],q[1],t0),lerp(q[0],q[1],t1),lerp(q[3],q[2],t1),lerp(q[3],q[2],t0)],cols[i%cols.length]);}
  if(edge)P(c,q,null,edge,1);
}
// 多角形 poly をクリップし、角度 ang(rad) の縞を幅 w で交互に塗る
function stripe(c,poly,ang,w,cols,edge){
  c.save();c.beginPath();poly.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  c.translate(cx,cy);c.rotate(ang);
  for(let i=-30;i<30;i++){c.fillStyle=cols[((i%cols.length)+cols.length)%cols.length];c.fillRect(i*w,-60,w+.4,120);}
  c.restore();
  if(edge)P(c,poly,null,edge,1);
}
export function draw(ctx,W,H){
  const c=ctx, K='#241612',OR='#b05f46',DK='#4a2a28', R1='#b8302c', R2='#6a1c1a', SK='#e6c29a';
  // --- 薙刀(鬼の持ち物): 金の柄と青い三日月刃 ---
  L(c,[153,80],[186,101],'#b89440',3.4);L(c,[153,79],[186,100],'#7ab8a8',1);
  c.save();c.strokeStyle='#4f93c4';c.lineCap='round';
  c.lineWidth=2.8;c.beginPath();c.moveTo(181,97);c.lineTo(190,103);c.stroke();
  c.lineWidth=2;c.beginPath();c.moveTo(188,102);c.lineTo(197,95);c.moveTo(188,102);c.lineTo(207,102);c.moveTo(190,104);c.lineTo(201,115);c.moveTo(184,98);c.lineTo(186,108);c.stroke();c.restore();
  // --- 左下の太刀(鞘) ---
  L(c,[0,180],[42,151],'#233a55',7,'butt');
  L(c,[0,177],[40,148.5],'#4f7a8a',1.6,'butt');
  P(c,[[17,172],[24,162],[50,151],[53,157],[28,177]],'#b08c44',K,.8);
  for(let i=0;i<4;i++)L(c,[27+i*7,164-i*3.5],[30+i*7,170-i*3.5],'#f0ead8',1.4,'butt');
  P(c,[[10,172],[20,174],[24,182],[12,180]],'#8a5a38');
  // --- 振り上げた刀 ---
  L(c,[20,62],[43,104],'#7c93a8',1.6,'butt');
  L(c,[42,103],[46,110],'#c9a44a',2.4);E(c,46,111,3,2.5,'#e6c9a8');
  // --- 青い袴 (腰・太もも) ---
  P(c,[[39,135],[58,128],[63,150],[56,158],[42,155],[37,145]],'#3d7ca8','#244e78',.8);
  E(c,107,163,13,7,'#4a8bb4',-.2,'#2f5f88',.7);
  // --- 胴の暗部 (胸と腕の間) ---
  P(c,[[100,128],[122,124],[142,138],[132,148],[110,146]],'#2a1a16');stripe(c,[[108,137],[122,134],[142,141],[134,147],[112,145]],-.5,2.6,['#2a1a16','#8a2e28']);
  // --- 草摺 (縞の裾) ---
  stripe(c,[[46,131],[67,127],[88,150],[78,168]],-.28,2.6,[OR,OR,DK],K);
  stripe(c,[[78,143],[100,142],[119,148],[114,167],[84,167]],.1,2.5,[OR,OR,DK],K);
  L(c,[84,167],[114,167],'#2a1410',1.2);
  // 胴の縞 (上)
  stripe(c,[[52,127],[76,120],[90,126],[88,142],[58,143]],.25,2.6,[OR,OR,DK],K);
  // 胸板 (白地に赤点)
  E(c,88,134,15,8,'#c9a67a',-.15,'#6a4a30',.8);
  for(let i=0;i<4;i++)L(c,[75+i*1.5,129+i*3.4],[101-i*1.5,130+i*3.4],'#e2c9a0',.8,'butt');
  // --- 肩 (袖) 縦縞 ---
  stripe(c,[[64,97],[82,94],[100,98],[99,121],[75,122],[65,111]],.1,2.8,[OR,OR,DK],K);
  // --- 腕 (青い小袖) ---
  P(c,[[52,108],[64,104],[68,118],[56,122],[50,116]],'#4a86bb','#2a5882',.8);
  E(c,57,114,7,5,'#4a86bb',-.4);
  // --- 頭: 小さな兜と顔 ---
  E(c,112,117,7,7.5,SK,0,'#8a5a3a',.6);
  P(c,[[104,111],[112,104],[122,108],[121,114],[111,112]],'#c8a850',K,.8);
  E(c,110,106,7,4,'#7a5a28',-.2);
  L(c,[109,118],[113,118],'#6a3a2a',.8);
  P(c,[[101,113],[106,112],[107,122],[102,124]],'#c04838');
  // --- 青い斧状の物 ---
  P(c,[[135,101],[150,102],[160,114],[157,123],[140,127],[131,122],[134,110]],'#5e95bc','#34566f',.9);
  P(c,[[142,103],[148,102],[156,112],[148,113]],'#7fb0d0');
  P(c,[[135,112],[141,112],[139,121],[135,119]],'#fff');
  // --- 腕 (右へ伸びる緑の籠手と手) ---
  L(c,[116,124],[146,146],'#a9c58f',4);
  L(c,[119,123],[146,145],'#e8eadc',1,'butt');
  L(c,[118,127],[134,132],K,1.5);
  E(c,148,147,3.4,2.4,'#e6b890',.5);
  L(c,[149,146],[153,143],'#e6b890',1.4);
  // 肩の黒い縁
  L(c,[102,126],[116,134],K,2);
  // --- 桶 ---
  P(c,[[130,175],[150,175],[148,189],[132,189]],'#2a1d14');
  L(c,[130,176],[132,189],'#5a3c22',1);
  L(c,[130,181],[150,181],'#5a4a30',1);for(let i=0;i<6;i++)E(c,133+i*3,179+(i%3)*3,.8,.8,'#c8a050');
  E(c,140,175,10.5,3.6,'#e8e4d8',0,'#b8b0a2',.7);
  E(c,140,176.4,8.5,2,'#cfc6b4');
  P(c,[[141,190],[146,190],[146,194],[141,194]],'#c8a060');
  c.beginPath();c.moveTo(153,170);c.quadraticCurveTo(156,164,152,158);c.strokeStyle='#d83a28';c.lineWidth=1.3;c.stroke();
}
