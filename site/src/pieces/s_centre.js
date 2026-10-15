export const name='s_centre';
function poly(c,pts,fill,stroke,lw){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||1;c.lineJoin='round';c.stroke();}}
function line(c,pts,col,w,cap){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=col;c.lineWidth=w;c.lineCap=cap||'round';c.lineJoin='round';c.stroke();}
function ell(c,x,y,rx,ry,f,rot){c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,7);c.fillStyle=f;c.fill();}
// 輪郭を共有する1つの鎧: path内を、角度が補間される縞で塗る
// a0,a1: 縞の始点側/終点側の方向(rad)、(ox,oy)から法線方向に pitch ずつ進む
function stripes(c,pts,ox,oy,ang0,ang1,pitch,n,cols,wid){
  c.save();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.clip();
  const a=(ang0+ang1)/2;const nx=-Math.sin(a),ny=Math.cos(a);
  for(let i=-2;i<n;i++){
    const t=i/n,ang=ang0+(ang1-ang0)*Math.max(0,Math.min(1,t));
    const cx=ox+nx*pitch*i,cy=oy+ny*pitch*i,dx=Math.cos(ang),dy=Math.sin(ang);
    line(c,[[cx-dx*90,cy-dy*90],[cx+dx*90,cy+dy*90]],cols[((i%cols.length)+cols.length)%cols.length],wid||pitch*0.62,'butt');
  }
  c.restore();
}
// 調整済み定数(tools/tune_s_centre.mjs の探索結果)。draw の第3引数で上書き可能
export const DEF={lx:-3,ly:-3,ux:0,uy:0,cp:3,cdy:2,clw:3,sp:3.2,
 sdx:17,sdy:6,sa0:-0.45,sa1:0.05,slw:3.2,bp:3.7,bdx:2,bdy:2,
 ba0:0.56,ba1:0.6,blw:2.6,gl:0,gd:0,sr:-30,sg:-25,sb:-20,
 d_body_0x:1,d_body_0y:3,d_body_1x:3,d_body_1y:2,d_body_2x:3,d_body_2y:3,d_body_3x:4,d_body_3y:0,
 d_body_4x:2,d_body_4y:0,d_body_5x:8,d_body_5y:-3,d_body_6x:3,d_body_6y:1,d_body_7x:6,d_body_7y:1,
 d_body_8x:-4,d_body_9x:1,d_body_9y:-2,d_body_10x:-3,d_body_10y:-1,d_body_11x:-4,d_b1_0x:4,d_b1_0y:1,
 d_b1_1x:5,d_b1_2x:2,d_b1_2y:-2,d_b1_3x:-2,d_b1_4x:1,d_b1_4y:-1,d_b2_0x:-9,d_b2_0y:0,
 d_b2_1x:3,d_b2_1y:5,d_b2_3y:2,d_b3_0x:1,d_b3_0y:5,d_b3_1x:3,d_b3_1y:0,d_b3_2x:2,
 d_b3_2y:1,d_b3_3x:8,d_b3_3y:3,d_b3_4x:-2,d_b3_4y:-2,d_b4_0x:5,d_b4_0y:4,d_b4_1x:1,
 d_b4_1y:-2,d_b4_2x:4,d_b4_2y:1,d_b4_3x:1,d_b4_3y:-5,d_lface_0x:3,d_lface_0y:4,d_lface_1x:3,
 d_lface_1y:-6,d_lface_2x:-1,d_lface_2y:-6,d_lface_3x:2,d_lface_4x:-1,d_lface_4y:-1,d_body_8y:-1};
export const VERT={body:12,chest:4,skirt:9,armor:16,sl:6,face:7,b1:6,b2:4,b3:5,b4:4,sw:4,lface:5};
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
function sh(hex,d){const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,(n>>8)&255,n&255].map(v=>clamp(v+d)).join(',')+')';}
function shc(hex,dr,dg,db){const n=parseInt(hex.slice(1),16);return 'rgb('+clamp((n>>16)+dr)+','+clamp(((n>>8)&255)+dg)+','+clamp((n&255)+db)+')';}
export function draw(ctx,W,H,P){
  const K=Object.assign({},DEF,P||{});
  const c=ctx;
  const V=(n,pts)=>pts.map((p,i)=>[p[0]+(K['d_'+n+'_'+i+'x']||0),p[1]+(K['d_'+n+'_'+i+'y']||0)]);
  const skin='#e3b896',hair='#17120f',skinSh='#c99a78';
  const G=[sh('#cdc3b9',K.gl),sh('#5f504b',K.gd)];
  c.save();c.translate(K.lx,K.ly);
  // ================= 下の武者(黄・赤・黒の縞胴) =================
  // 脛当て・袴(青)
  poly(c,V('b1',[[222,184],[246,182],[250,196],[243,208],[222,208],[216,196]]),'#4a6a82');
  poly(c,V('b2',[[222,190],[236,188],[236,204],[224,206]]),'#35607a');
  poly(c,V('b3',[[248,178],[268,176],[276,190],[262,196],[250,192]]),'#718a98');
  poly(c,V('b4',[[236,192],[256,188],[260,198],[240,202]]),'#60808f');
  // 足(茶)
  poly(c,[[192,204],[206,196],[214,203],[206,212],[194,212]],'#a8703a');
  line(c,[[192,138],[214,153]],'#3a9a88',2.2);
  // 黒髷・頭
  poly(c,[[260,152],[275,150],[283,152],[283,160],[272,160]],skin);
  poly(c,[[268,150],[284,147],[286,155],[278,158]],'#d4a584');
  // 胴(1つの輪郭) 上半分:黒赤縞の背
  const body=V('body',[[204,168],[212,163],[222,157],[240,146],[262,148],[272,156],[268,166],[258,170],[248,182],[232,188],[218,183],[210,178]]);
  poly(c,body,'#a8402c');
  stripes(c,body,215+K.bdx,138+K.bdy,K.ba0,K.ba1,K.bp,24,['#c49a30','#c49a30','#a03a2a','#c49a30','#15100e','#b08a2c'],K.blw);
  // 上部(背・黒赤)
  const back=[[222,142],[236,138],[254,140],[262,148],[252,152],[240,148],[226,152]];
  poly(c,back,'#15100e');
  stripes(c,back,222,128,0.35,0.5,3,9,['#15100e','#c0392b','#15100e','#d8b03a'],1.8);
  // 縁取り
  c.save();c.globalAlpha=.8;poly(c,body,null,'#4a1a14',1);c.restore();
  line(c,[[212,166],[222,175],[238,184]],'#6a1f1a',1.5);
  // 頭(黒髷+顔)
  ell(c,270,142,9,8,hair);ell(c,278,146,6,6,hair);
  poly(c,V('lface',[[272,148],[282,148],[284,156],[278,161],[270,157]]),skin);
  ell(c,281,153,.9,.9,'#3a2018');
  line(c,[[278,151],[283,151]],'#3a2018',.8);
  line(c,[[276,159],[281,158]],'#a85a48',.9);
  c.restore();
  c.save();c.translate(K.ux,K.uy);
  // ================= 上の武者(白灰の縞鎧) =================
  // 刀(青い刃・振り上げ)
  const sw=V('sw',[[266,75],[285,66],[310,60],[336,56]]);
  line(c,sw,'#7fa3c4',2.2);
  line(c,[[sw[0][0]-3,sw[0][1]+1],sw[1],sw[2],sw[3]],'#a8cce0',.8);
  line(c,[[256,78],[266,74]],'#c8a050',3);
  // 脚(緑)と脛当て
  poly(c,[[286,138],[308,136],[314,150],[306,154],[294,153]],'#3f8a6c');
  poly(c,[[300,150],[312,148],[314,164],[306,168]],'#c8a060');
  poly(c,[[304,154],[309,153],[310,162],[306,163]],'#ece0c8');
  // 袖(緑)と腕
  poly(c,V('sl',[[260,82],[274,78],[290,84],[292,98],[278,100],[264,96]]),shc('#3f7a5c',K.sr,K.sg,K.sb),'#2a6a52',.8);
  poly(c,[[250,88],[262,84],[264,96],[252,95]],'#7a2a28');
  stripes(c,[[250,88],[262,84],[264,96],[252,95]],250,80,0.1,0.1,3,5,['#15100e','#8a2a28'],1.5);
  poly(c,[[262,76],[270,74],[274,82],[266,84]],'#e0b894');
  // 一体鎧: 胴(上)から草摺(下)まで連続
  const armor=V('armor',[[283,92],[300,91],[313,93],[313,117],[306,124],[310,131],[308,141],[290,141],[268,143],[258,134],[244,121],[241,117],[262,102],[272,104],[280,112],[283,106]]);
  poly(c,armor,'#8a7e74');
  // 胴部(横縞)
  const chest=V('chest',[[283,92],[313,92],[313,118],[283,119]]);
  stripes(c,chest,283,90+K.cdy,0,0,K.cp,9,G,K.clw);
  // 草摺(扇状に広がる縞)
  const skirt=V('skirt',[[239,121],[262,102],[274,106],[284,118],[310,130],[308,140],[290,141],[268,143],[258,134]]);
  stripes(c,skirt,246+K.sdx,98+K.sdy,K.sa0,K.sa1,K.sp,26,G,K.slw);
  // 下端の赤縁と濃縁
  poly(c,[[284,116],[313,115],[314,121],[300,124],[286,122]],'#6a2a28');
  line(c,[[270,142],[290,141],[309,139]],'#4a2e26',3.2);
  line(c,[[242,119],[259,135],[270,143]],'#4a2e26',2.6);
  line(c,[[242,118],[262,102]],'#5a2a2a',1);
  // 草摺の下の薄ピンク(腰)
  poly(c,[[266,101],[285,98],[284,120],[270,114]],'#ecc8b8');
  ell(c,277,108,1,1,'#e08a70');ell(c,280,113,1,1,'#e08a70');ell(c,274,105,1,1,'#e08a70');
  // 頭 ・肩
  poly(c,[[294,94],[306,96],[312,93],[312,86],[296,86]],skinSh);
  poly(c,V('face',[[296,78],[307,75],[314,79],[314,88],[308,93],[298,91],[295,84]]),skin);
  // 髪・髷
  ell(c,305,75,7.5,5,hair);ell(c,301,71,4,3.6,hair);
  poly(c,[[296,79],[304,77],[312,76],[314,80],[309,79],[300,82],[296,84]],hair);
  // 目・鼻・口
  line(c,[[304,82],[309,81.5]],'#2a1a14',1);
  ell(c,307,83,1,.7,'#2a1a14');
  line(c,[[312,84],[313.5,87],[311.5,88]],'#b27a5a',.9);
  line(c,[[306,90],[310,89.5]],'#a04a40',.9);
  // 肩の縁
  line(c,[[283,92],[290,92]],'#8a3a38',1.2);
  c.restore();
}
