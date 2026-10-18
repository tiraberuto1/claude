export const name='cl_bottom';
// 調整可能な数値定数(SSIM探索の対象)
export const P={
  lTop:192.5,
  lBot:237.78,
  lTipX:191.64,
  lTipY:213.61,
  sTop:238,
  sEndX:356.2,
  rbTop:229.5,
  rbLeft:500,
  bgTop:200.5,
  bgLeft:576.67,
  bgBot:231.5,
  lCol:[131.09,138.08,122.68],
  sCol:[138.81,137.6,99.53],
  rbCol:[131.57,142.27,100.55],
  bgCol:[155.93,140.8,122.64],
  edge:0.21,
  wash:0.38,
  mottle:0.6,
  gold:0.2,
  lineA:0.45,
  arcA:1.83,
  arcDy:3.25,
  arcRDy:0.32,
  ov1:0.16,
  ov2:0.01,
  hiA:0.21,
  loA:0.04,
  tipHi:0.17,
  o:{S:[-0.95,3.85,1.27,0.3,-4,0,1.7,0,2.5,0.27,2.56,-1,0.5,-2.87,0.6,-0.6,-0.75,-0.6,0,0,0,0,0,0,0,0,0,0,0,-0.8],a4:[-1.67,3.3,0,2.4,0.58,4],RB:[1.5,-1.1,0,0,0.75,0,-1.1,0,-3,0,-3.25,0.38,0.5,0,0,-0.75,-3,-0.75,0,-0.62,0,-4,0,0,0,0,0,0,0.6,0],a5:[-4,-2.65,-0.83,-0.5,3.25,1.5,-1.35,0.25],BG:[-2.01,-1.4,2.47,-0.85,2.18,3.65,0.55,2.5,-3.25,-1.73,2.33,0.25,1.5,0,0,0,-2.5,0.2,0,1.5,0,0,0,0,-0.27,0.8,2.03,1,-2.59,0,3,1.8,4,-3.85,-1.6,0.76,1.5,1.12],a6:[1.95,0.6,-1.75,0.5,0.6,1.5,-4,3.25],a7:[0.25,2.44,2.38,2.83,-4,-0.38,4,0],L:[0.5,4,3.5,2.43,0,1.5,-0.5,-0.27,-1.75,-1,2.3,0.27,1.5,0,-1.5,0,-0.2,0,-1.5,0,0,0.75,1.5,-3,0.75,1,-1,-0.43,0,1.5,1.5,-0.25,0,0,-1.5,0,-2.83,-1.75,-3.85,1.5,-1,1,-1.5,0,-0.25,0,0,-1.07,-0.9,2.87],a1:[-4,1.93,-3.45,-0.75,1.04,1.02,2.28,2.11,-4,0],a2:[4,-3.1,0.85,-0.85,-0.93,1.5,0.75,3.25,-0.15,4,-0.43,0],a3:[4,1,-2.51,-1.5,-1.5,0,2.88,0.6,1.12,-0.1],a8:[4,-0.6,0.4,1.65,4,-1.5,4,-0.25]},
};
function O(id,n){if(!P.o[id]||P.o[id].length!==2*n)P.o[id]=new Array(2*n).fill(0);return P.o[id];}
// 輪郭点を倍密化(間に中点を挿入)し、ずれを適用
function dens(id,pts){
  const q=[];for(let i=0;i<pts.length;i++){q.push(pts[i]);if(i<pts.length-1)q.push([(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2]);}
  const o=O(id,q.length);return q.map((a,i)=>[a[0]+o[2*i],a[1]+o[2*i+1]]);
}
function rng(s){return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
// 点列(Catmull-Rom風に滑らか)で閉パス
function smooth(ctx,pts){
  const n=pts.length;ctx.beginPath();
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let s=m(pts[n-1],pts[0]);ctx.moveTo(s[0],s[1]);
  for(let i=0;i<n;i++){const p=pts[i],e=m(p,pts[(i+1)%n]);ctx.quadraticCurveTo(p[0],p[1],e[0],e[1]);}
  ctx.closePath();
}
function blob(ctx,pts,col,R,o={}){
  pts=dens(o.id,pts);
  ctx.save();
  smooth(ctx,pts);
  ctx.fillStyle=col;ctx.fill();
  ctx.clip();
  // 内側を淡く(縁は濃く残す)
  smooth(ctx,pts);
  ctx.save();ctx.shadowColor='rgba(168,190,196,0.55)';ctx.shadowBlur=0;ctx.restore();
  const bb=o.bb;
  const g=ctx.createLinearGradient(0,bb[1],0,bb[3]);
  const w=P.wash;g.addColorStop(0,`rgba(142,160,150,${0.35*w})`);g.addColorStop(0.5,`rgba(142,160,150,${0.18*w})`);g.addColorStop(1,`rgba(120,145,150,${0.2*w})`);
  ctx.fillStyle=g;ctx.fillRect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]);
  // 刷毛のムラ(横長)
  for(let i=0;i<140;i++){
    const x=bb[0]+R()*(bb[2]-bb[0]),y=bb[1]+R()*(bb[3]-bb[1]);
    ctx.fillStyle=R()<0.5?`rgba(165,180,170,${0.07*P.mottle})`:`rgba(95,125,140,${0.07*P.mottle})`;
    ctx.beginPath();ctx.ellipse(x,y,15+R()*50,1+R()*3,0,0,7);ctx.fill();
  }
  // 縁のにじみ(濃)
  smooth(ctx,pts);ctx.lineJoin='round';
  ctx.strokeStyle=`rgba(98,126,134,${0.10*P.edge})`;ctx.lineWidth=14;ctx.stroke();
  ctx.strokeStyle=`rgba(98,126,134,${0.12*P.edge})`;ctx.lineWidth=7;ctx.stroke();
  ctx.strokeStyle=`rgba(95,125,145,${0.18*P.edge})`;ctx.lineWidth=3;ctx.stroke();
  // 金砂子
  for(let i=0;i<120*P.gold;i++){
    ctx.fillStyle=R()<0.5?'rgba(205,195,140,0.25)':'rgba(220,220,200,0.2)';
    ctx.fillRect(bb[0]+R()*(bb[2]-bb[0]),bb[1]+R()*(bb[3]-bb[1]),1,1);
  }
  ctx.restore();
  // すやり線(輪郭の細い濃青線)
  smooth(ctx,pts);ctx.strokeStyle=o.line||`rgba(85,120,145,${P.lineA})`;ctx.lineWidth=0.9;ctx.stroke();
}
function arc(ctx,pts,a=0.4,w=0.8,id){
  if(id){const o=O(id,pts.length);pts=pts.map((q,i)=>[q[0]+o[2*i],q[1]+o[2*i+1]]);}
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length-1;i++){const e=[(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2];
    if(i===pts.length-2)ctx.quadraticCurveTo(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);
    else ctx.quadraticCurveTo(pts[i][0],pts[i][1],e[0],e[1]);}
  ctx.strokeStyle=`rgba(88,122,148,${a*P.arcA})`;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();
}
export function draw(ctx,W,H){
  ctx.save();ctx.scale(W/680,H/247);
  const R=rng(11);
  const cc=a=>`rgba(${a[0]},${a[1]},${a[2]},0.98)`;
  const {lTop,lBot,lTipX,lTipY,sTop,sEndX,rbTop,rbLeft,bgTop,bgLeft,bgBot}=P;
  const dy=P.arcDy,ry=P.arcRDy;
  // 左下の細帯
  blob(ctx,[[-20,sTop],[100,sTop+0.5],[250,sTop],[sEndX-33,sTop+0.5],[sEndX-11,sTop+2],[sEndX,sTop+8],[sEndX-4,sTop+24],[-20,sTop+24]],cc(P.sCol),R,{bb:[-20,sTop-1,sEndX,sTop+12],line:'rgba(80,110,108,0.85)',id:'S'});
  // 左の帯(右端が丸い)
  const mY=lTipY, tx=lTipX;
  blob(ctx,[[-20,lTop],[60,lTop-0.5],[150,lTop+0.5],[tx-24,lTop+3],[tx-9,mY-13],[tx-1,mY-5],[tx,mY],[tx-1,mY+6],[tx-6,mY+14],[tx-16,mY+22],[tx-27,lBot-0.5],[60,lBot],[-20,lBot-0.5]],cc(P.lCol),R,{bb:[-20,lTop-1,tx+1,lBot+1],id:'L'});
  // 重なる帯(内側の2枚)の淡い段差
  const tint=v=>v>0?`rgba(165,185,185,${v})`:`rgba(70,100,110,${-v})`;
  const mid=[[120,211],[141,210.6],[158,214],[170,222],[171,229],[165,236],[120,238]];
  const inn=[[100,222],[136,222],[152,225],[159,231],[154,237],[100,238]];
  ctx.fillStyle=tint(P.ov1);smooth(ctx,mid.map((q,i)=>i<mid.length-2?[q[0]+(0),q[1]]:q));ctx.fill();
  ctx.fillStyle=tint(P.ov2);smooth(ctx,inn);ctx.fill();
  const curves=[
    ['a1',[[40,213],[100,212.8],[132,213.5],[137,217],[134,221]],0.4],
    ['a2',[[120,211],[141,210.6],[158,214],[170,222],[171,229],[165,236]],0.5],
    ['a3',[[100,222],[136,222],[152,225],[159,231],[154,237]],0.5],
    ['a8',[[10,220.5],[60,220.2],[100,220.5],[136,222]],0.3],
  ];
  for(const [id,pts,al] of curves){
    arc(ctx,pts,al,1,id);
    ctx.save();ctx.translate(0.9,1.1);
    const o=O(id,pts.length);const q=pts.map((u,i)=>[u[0]+o[2*i],u[1]+o[2*i+1]]);
    ctx.beginPath();ctx.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length-1;i++){const e=[(q[i][0]+q[i+1][0])/2,(q[i][1]+q[i+1][1])/2];ctx.quadraticCurveTo(q[i][0],q[i][1],i===q.length-2?q[i+1][0]:e[0],i===q.length-2?q[i+1][1]:e[1]);}
    ctx.strokeStyle=`rgba(170,195,195,${P.hiA})`;ctx.lineWidth=0.9;ctx.stroke();ctx.restore();
  }
  // 先端の縁の明線(輪郭の少し内側)
  ctx.beginPath();ctx.moveTo(tx-20,lTop+4.5);ctx.bezierCurveTo(tx-6,mY-14,tx-2,mY-6,tx-2,mY);ctx.bezierCurveTo(tx-2,mY+10,tx-12,mY+20,tx-26,lBot-2);
  ctx.strokeStyle=`rgba(175,198,198,${P.tipHi})`;ctx.lineWidth=1.1;ctx.stroke();
  ctx.save();
  const L=(pts,col)=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);ctx.quadraticCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1]);ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.stroke();};
  L([[10,lTop+6],[100,lTop+3.5],[165,lTop+5]],`rgba(150,175,170,${P.hiA})`);
  L([[10,lBot-5.5],[100,lBot-2.5],[160,lBot-4.5]],`rgba(80,108,104,${P.loA})`);
  L([[30,222],[120,224.5],[178,222]],'rgba(90,118,112,0.3)');
  ctx.restore();
  arc(ctx,[[-5,236],[100,236.5],[180,236]],0.3,0.7,'a4');
  // 右下の帯
  blob(ctx,[[rbLeft-2,rbTop+12.5],[rbLeft+2,rbTop+5.5],[rbLeft+20,rbTop+1.5],[560,rbTop],[620,rbTop-0.5],[690,rbTop-0.5],[700,262],[rbLeft,262]],cc(P.rbCol),R,{bb:[rbLeft-2,rbTop-0.5,690,248],id:'RB'});
  arc(ctx,[[515,238],[560,235],[620,234],[690,233]],0.3,0.8,'a5');
  // 右の膨らみ
  const bh=bgBot-bgTop;
  blob(ctx,[[bgLeft,bgTop+13.5],[bgLeft+2,bgTop+5.5],[bgLeft+17,bgTop+1],[625,bgTop],[690,bgTop-0.5],[700,bgTop-0.5],[700,bgBot-0.5],[610,bgBot],[bgLeft+9,bgBot-2.5],[bgLeft+1,bgBot-9.5]],cc(P.bgCol),R,{bb:[bgLeft,bgTop,690,bgBot+1],id:'BG'});
  arc(ctx,[[592,214+ry],[608,210+ry],[640,209+ry],[690,209+ry]],0.35,0.8,'a6');
  arc(ctx,[[582,222+ry],[600,219+ry],[640,219.5+ry],[690,219+ry]],0.3,0.8,'a7');
  ctx.restore();
}
