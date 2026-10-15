export const name='s_left';
// 角を丸めた閉パス (各頂点の手前 k の位置から二次曲線で曲がる)
const sm=(c,pts,k)=>{k=k||.32;const n=pts.length,A=(p,q)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k];
  for(let i=0;i<n;i++){const p=pts[i],a=A(p,pts[(i+n-1)%n]),b=A(p,pts[(i+1)%n]);if(i)c.lineTo(a[0],a[1]);else c.moveTo(a[0],a[1]);c.quadraticCurveTo(p[0],p[1],b[0],b[1]);}c.closePath();};
const P=(c,pts,f,s,lw,k)=>{c.beginPath();sm(c,pts,k);if(f){c.fillStyle=f;c.fill();}if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.lineJoin='round';c.stroke();}};
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
function stripe(c,poly,ang,w,cols,edge,ph){
  c.save();c.beginPath();sm(c,poly);c.clip();
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  c.translate(cx,cy);c.rotate(ang);
  for(let i=-30;i<30;i++){c.fillStyle=cols[((i%cols.length)+cols.length)%cols.length];c.fillRect(i*w+(ph||0)*w,-60,w+.4,120);}
  c.restore();
  if(edge)P(c,poly,null,edge,1);
}
// 数値パラメータ(座標降下で探索した値): 各部位の平行移動 dx,dy と縞の角度/ピッチ/位相/コントラスト
export const params={"blade_x": 0, "blade_y": 0, "pole_x": 3, "pole_y": -1.5, "scab_x": -0.25, "scab_y": -1.875, "greave_x": 0, "greave_y": 0, "sword_x": 1.5, "sword_y": 0.5, "hakL_x": 1, "hakL_y": 0.5, "hakR_x": 0, "hakR_y": 0, "dark_x": 3.375, "dark_y": 1, "skL_x": 1, "skL_y": -1, "skR_x": 0.375, "skR_y": 1, "torso_x": 0, "torso_y": -1, "chest_x": -0.25, "chest_y": 2.5, "shoulder_x": -0.5, "shoulder_y": 0.375, "sleeve_x": 1.5, "sleeve_y": 1.625, "face_x": 0.5, "face_y": -1.75, "axe_x": -1.5, "axe_y": -1.125, "arm_x": 3.125, "arm_y": 2.125, "bucket_x": 1.125, "bucket_y": -1.125, "skL_a": -0.575, "skL_w": 4.325, "skL_p": -1.425, "skR_a": 0.2, "skR_w": 3.762, "skR_p": 0, "torso_a": 0.637, "torso_w": 3, "torso_p": -0.494, "sho_a": 0.069, "sho_w": 2.706, "sho_p": 0.625, "ct": 0.831, "br": 0.906, "skL_s": 1, "skR_s": 0.956, "torso_s": 1.055, "shoulder_s": 0.998, "sleeve_s": 1.019, "face_s": 0.89, "axe_s": 0.947, "hakL_s": 0.995, "dark_s": 0.981, "arm_s": 1.048, "bucket_s": 1.044, "chest_s": 1.035, "scab_s": 1.019, "sword_s": 1, "pole_s": 0.828, "vo": {"greave": [0, 0, 3.5, 3, 0, 2, -1, 0, 1.375, 0.125], "hakL": [-1.375, -0.5, 5, 0, 4, 2.5, 0.25, -0.25, 0.125, -0.625, -0.75, -4.75], "dark": [1, 3.75, 4.5, 3, 1.5, -2, -3.625, -3, 0.875, 0], "skL": [4, 1.125, -2, -2, 1.5, -0.5, 5, -2.5, -2.75, -0.375], "skR": [0.125, -2.625, 5, -1.75, -2.125, 1, 1.625, 3.125, 0, -0.5], "torso": [4, 1.75, 3.375, -4.25, -0.625, 0.75, -5, 0.5, 0.75, -0.5, 1.75, 1], "sho": [-0.125, 0.25, -5, -1.375, 0.125, 1.25, -1, -4.875, -4, 1.375, 2.5, -1.625], "sleeve": [0.375, 0.375, -0.875, -0.375, 0.125, 1.75, -3.5, -3.125, -0.75, 2.375], "helm": [5, -1.5, 2.5, -0.5, -4.25, 5, -4.25, -0.25, -0.25, -0.75, 4.5, -1.5], "axe": [0, 0, -3, -1, 0, -1, -1.25, 0, 0, 0, 2.25, 2, 3, 1, -1, -2, 1, 1, 2.5, -2], "tachi": [1, 1, 0, 0], "katana": [2, -1, 0, 0.5], "blade": [-2, 0.875, 1, 0, -1, 0, 0, 0, 0, 0, -1, -1]}, "orc": [203, 55, 43], "dkc": [126, 46, 48]};
export function draw(ctx,W,H){
  const c=ctx,Q=params, K='#241612',OR0=Q.orc,DK0=Q.dkc, SK='#e6c29a';
  const V=(n,pts)=>{const o=Q.vo[n];return o?pts.map((p,i)=>[p[0]+o[2*i],p[1]+o[2*i+1]]):pts;};
  const mk=(v)=>'rgb('+v.map(Math.round)+')',mean=OR0.map((v,i)=>(2*v+DK0[i])/3);
  const OR=mk(mean.map((m,i)=>(m+(OR0[i]-m)*Q.ct)*Q.br)),DK=mk(mean.map((m,i)=>(m+(DK0[i]-m)*Q.ct)*Q.br));
  const CEN={"pole": [180, 95], "scab": [20, 165], "sword": [30, 85], "hakL": [50, 145], "dark": [125, 140], "skL": [66, 150], "skR": [100, 155], "torso": [72, 135], "chest": [88, 134], "shoulder": [82, 108], "sleeve": [58, 114], "face": [110, 114], "axe": [146, 113], "arm": [130, 135], "bucket": [140, 182], "hakR": [107, 163], "blade": [195, 105], "greave": [35, 165]};
  const open=k=>{c.save();c.translate(Q[k+'_x'],Q[k+'_y']);const sc=Q[k+'_s'];if(sc!==undefined&&sc!==1){const o=CEN[k];c.translate(o[0],o[1]);c.scale(sc,sc);c.translate(-o[0],-o[1]);}},close=()=>c.restore();
  // --- 薙刀(鬼の持ち物): 金の柄と青い三日月刃 ---
  open('pole');
  L(c,[153,80],[186,101],'#b89440',3.4);L(c,[153,79],[186,100],'#7ab8a8',1);
  c.save();c.strokeStyle='#4f93c4';c.lineCap='round';
  {const b=V('blade',[[181,97],[190,103],[197,95],[207,102],[201,115],[186,108]]);
  const draw3=(col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(b[0][0],b[0][1]);c.lineTo(b[1][0],b[1][1]);
   c.moveTo(b[1][0]-2,b[1][1]-1);c.quadraticCurveTo(b[1][0]+3,b[1][1]-6,b[2][0],b[2][1]);
   c.moveTo(b[1][0]-2,b[1][1]-1);c.quadraticCurveTo(b[1][0]+8,b[1][1]-3,b[3][0],b[3][1]);
   c.moveTo(b[1][0],b[1][1]+1);c.quadraticCurveTo(b[1][0]+8,b[1][1]+2,b[4][0],b[4][1]);
   c.moveTo(b[0][0]+3,b[0][1]+1);c.quadraticCurveTo(b[0][0]+1,b[0][1]+6,b[5][0],b[5][1]);c.stroke();};
  draw3('#2f628f',4.6);draw3('#4f93c4',3.2);c.restore();}
  close();
  // --- 左下の太刀(鞘) ---
  open('scab');
  {const t=V('tachi',[[0,180],[42,151]]);L(c,t[0],t[1],'#233a55',7,'butt');}
  L(c,[0,177],[40,148.5],'#4f7a8a',1.6,'butt');
  P(c,V('greave',[[17,172],[24,162],[50,151],[53,157],[28,177]]),'#b08c44',K,.8);
  for(let i=0;i<4;i++)L(c,[27+i*7,164-i*3.5],[30+i*7,170-i*3.5],'#f0ead8',1.4,'butt');
  P(c,[[10,172],[20,174],[24,182],[12,180]],'#8a5a38');
  close();
  // --- 振り上げた刀 ---
  open('sword');
  {const t=V('katana',[[20,62],[43,104]]);L(c,t[0],t[1],'#7c93a8',1.6,'butt');}
  L(c,[42,103],[46,110],'#c9a44a',2.4);E(c,46,111,3,2.5,'#e6c9a8');
  close();
  // --- 青い袴 (腰・太もも) ---
  open('hakL');
  P(c,V('hakL',[[39,135],[58,128],[63,150],[56,158],[42,155],[37,145]]),'#3d7ca8','#244e78',.8);
  E(c,107,163,13,7,'#4a8bb4',-.2,'#2f5f88',.7);
  close();
  // --- 胴の暗部 (胸と腕の間) ---
  open('dark');
  P(c,V('dark',[[100,128],[122,124],[142,138],[132,148],[110,146]]),'#2a1a16');stripe(c,[[108,137],[122,134],[142,141],[134,147],[112,145]],-.5,2.6,['#2a1a16','#8a2e28']);
  close();
  // --- 草摺 (縞の裾) ---
  open('skL');
  stripe(c,V('skL',[[40,128],[95,130],[90,166],[60,170],[50,150]]),Q.skL_a,Q.skL_w,[OR,OR,DK],K,Q.skL_p);
  close();open('skR');
  stripe(c,V('skR',[[78,143],[100,142],[119,148],[114,167],[84,167]]),Q.skR_a,Q.skR_w,[OR,OR,DK],K,Q.skR_p);
  L(c,[84,167],[114,167],'#2a1410',1.2);
  close();
  // 胴の縞 (上)
  open('torso');
  stripe(c,V('torso',[[72,122],[100,121],[104,134],[92,142],[76,140],[70,130]]),Q.torso_a,Q.torso_w,[OR,OR,DK],K,Q.torso_p);
  close();
  // 胸板 (白地に赤点)
  open('chest');
  // 縄目帯: 胴の縁を巻く下に凸の白〜ピンクの弧
  c.beginPath();c.moveTo(70,128);c.quadraticCurveTo(78,142,96,140);c.strokeStyle='#7a4a3c';c.lineWidth=4.6;c.lineCap='round';c.stroke();
  c.beginPath();c.moveTo(70,128);c.quadraticCurveTo(78,142,96,140);c.strokeStyle='#f4e0d6';c.lineWidth=3.4;c.stroke();
  for(let i=0;i<6;i++){const t=(i+.5)/6,x=(1-t)*(1-t)*70+2*t*(1-t)*78+t*t*96,y=(1-t)*(1-t)*128+2*t*(1-t)*142+t*t*140;E(c,x,y,.9,.9,'#d8786a');}
  close();
  // --- 肩 (袖) 縦縞 ---
  open('shoulder');
  stripe(c,V('sho',[[64,97],[82,94],[100,98],[99,121],[75,122],[65,111]]),Q.sho_a,Q.sho_w,[OR,OR,DK],K,Q.sho_p);
  close();
  // --- 腕 (青い小袖) ---
  open('sleeve');
  P(c,V('sleeve',[[52,108],[64,104],[68,118],[56,122],[50,116]]),'#4a86bb','#2a5882',.8);
  E(c,57,114,7,5,'#4a86bb',-.4);
  close();
  // --- 頭: 小さな兜と顔 ---
  open('face');
  P(c,[[100,121],[106,118],[118,121],[122,128],[108,130]],'#8a3a2c');// 首元(胴の上端が兜の下に潜る)
  E(c,111,116,6.8,7.4,SK,0,'#8a5a3a',.6);
  L(c,[108,118],[113,118],'#6a3a2a',.8);
  P(c,V('helm',[[102,113],[104,107],[111,102.5],[118,105],[120,112],[111,111]]),'#b8904a',K,.8);
  L(c,[103,111],[119,110],'#e0c070',1.1);
  P(c,[[100,113],[103,112],[104,121],[101,122]],'#8a3028',K,.5);
  close();
  // --- 青い斧状の物 ---
  open('axe');
  P(c,V('axe',[[134,112],[137,104],[143,101],[151,102],[157,108],[160,116],[158,123],[150,126],[140,126],[133,121]]),'#6a9cc0','#34566f',1.3,.12);
  P(c,[[141,104],[148,103],[155,110],[150,116],[144,112]],'#86b4d2');
  P(c,[[135,112],[141,112],[139,121],[135,119]],'#fff');
  close();
  // --- 腕 (右へ伸びる緑の籠手と手) ---
  open('arm');
  L(c,[116,124],[143,144],'#8aa874',6.2);
  L(c,[116,123],[143,143],'#b4cf9c',4.2);
  L(c,[119,123],[142,142],'#e8eadc',.9,'butt');
  for(let i=0;i<3;i++)L(c,[124+i*7,126+i*5.4],[126+i*7,129+i*5.4],'#c9a44a',1.3,'butt');
  L(c,[118,127],[134,132],K,1.5);
  L(c,[142,143],[147,147],'#e0ac84',5);
  E(c,149,148,4,3.2,'#e6b890',.6,'#a87450',.5);
  [[153,144],[154,147],[153,150],[150,152]].forEach(q=>L(c,[150,148],q,'#e6b890',1.5));
  close();
  // 肩の黒い縁
  open('arm');
  L(c,[102,126],[116,134],K,2);
  close();
  // --- 桶 ---
  open('bucket');
  P(c,[[130,175],[150,175],[148,189],[132,189]],'#2a1d14');
  L(c,[130,176],[132,189],'#5a3c22',1);
  L(c,[130,181],[150,181],'#5a4a30',1);for(let i=0;i<6;i++)E(c,133+i*3,179+(i%3)*3,.8,.8,'#c8a050');
  E(c,140,175,10.5,3.6,'#e8e4d8',0,'#b8b0a2',.7);
  E(c,140,176.4,8.5,2,'#cfc6b4');
  P(c,[[141,190],[146,190],[146,194],[141,194]],'#c8a060');
  c.beginPath();c.moveTo(153,170);c.quadraticCurveTo(156,164,152,158);c.strokeStyle='#d83a28';c.lineWidth=1.3;c.stroke();
  close();
}

