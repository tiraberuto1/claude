export const name='cl_bottom';
// 調整可能な数値定数(SSIM探索の対象)
export const P={
  lTop:190.47,
  lBot:237.78,
  lTipX:189.64,
  lTipY:211.61,
  sTop:238,
  sEndX:365.04,
  rbTop:229.5,
  rbLeft:502.25,
  bgTop:200.5,
  bgLeft:577.67,
  bgBot:238.17,
  lCol:[129.09,137.33,123.09],
  sCol:[137.14,134.5,101.64],
  rbCol:[133.24,140.6,121.27],
  bgCol:[138.6,141.87,125.14],
  edge:0.4,
  wash:0.25,
  mottle:0.6,
  gold:0.2,
  lineA:0.31,
  arcA:1.64,
  arcDy:3.25,
  arcRDy:0.32,
  o:{S:[3.05,3.85,4.56,0,1.75,0.27,1.5,-0.27,4.35,0.4,3.48,-1.5,1.5,-1.55,1.5,-2.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0.9],L:[1.5,-2.25,0,0.57,1.5,2.5,1,1.77,0,1.5,0,0,0,0,0.6,0,0,1.5,-0.75,0,-1,1.5,0,0,1.93,-0.75,0,1,-1.5,-1.5,0,0,2.5,0,0.84,0.13,3.08,-0.5,-0.57,1.93,2.43,3.75],a1:[-3.85,-0.57,1.6,0.57,1.5,3.28,-1.68,3.12,-1,-0.93],a2:[-2.07,-1.5,0.3,1.5,1.78,-0.9,2.5,-1.5,1.5,1.5],a3:[0,-4.35,0.6,1.75,-1,0,-1.12,0],a4:[-0.36,0.5,-1.33,1.88,-1,1.27],RB:[-0.38,0,1.25,0.5,-1.1,-0.5,-1.12,-0.75,1.25,-0.57,-1,0,-1.5,0,0,0,0,2.5,-2.5,3.85,0,3.6,0,0,0,0,0,0,-0.75,0],a5:[-2.18,-2.5,-1,-2.5,-0.5,-2.1,0,0],BG:[-0.4,-0.93,-3.85,2.25,3.25,3.25,1.6,-1.5,0.15,-1.5,0.25,0.08,1.2,0,0.17,0,-2.5,-0.07,0,1.5,0,0,0.5,0,0.35,0.62,-0.75,0,1.85,0,2.35,-0.35,1.85,-3.25,-0.75,3.1,0.25,2.35],a6:[1.45,0.25,3,1,-0.5,-1.5,0.4,1.5],a7:[1.25,2.93,1.75,2,1.33,0,0.38,0]},
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
  const mY=lTipY, k=lTipX-191;
  blob(ctx,[[-20,lTop],[60,lTop-0.5],[150,lTop+0.5],[172+k,lTop+2],[186+k,mY-9],[lTipX,mY],[186+k,mY+10],[174+k,mY+18],[150,lBot-0.5],[60,lBot],[-20,lBot-0.5]],cc(P.lCol),R,{bb:[-20,lTop-1,lTipX+1,lBot+1],id:'L'});
  arc(ctx,[[40,212+dy],[90,208+dy],[140,208.5+dy],[170,211+dy],[180,216+dy]],0.35,0.8,'a1');
  arc(ctx,[[60,218+dy],[110,216+dy],[155,217+dy],[176,222+dy],[168,228+dy]],0.32,0.8,'a2');
  arc(ctx,[[100,205+dy],[150,203+dy],[178,206+dy],[186,213+dy]],0.28,0.8,'a3');
  ctx.save();
  const L=(pts,col)=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);ctx.quadraticCurveTo(pts[1][0],pts[1][1],pts[2][0],pts[2][1]);ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.stroke();};
  L([[10,lTop+6],[100,lTop+3.5],[165,lTop+5]],'rgba(140,165,160,0.45)');
  L([[10,lBot-5.5],[100,lBot-2.5],[160,lBot-4.5]],'rgba(90,118,112,0.45)');
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
