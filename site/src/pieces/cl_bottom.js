export const name='cl_bottom';
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
  ctx.save();
  smooth(ctx,pts);
  ctx.fillStyle=col;ctx.fill();
  ctx.clip();
  // 内側を淡く(縁は濃く残す)
  smooth(ctx,pts);
  ctx.save();ctx.shadowColor='rgba(168,190,196,0.55)';ctx.shadowBlur=0;ctx.restore();
  const bb=o.bb;
  const g=ctx.createLinearGradient(0,bb[1],0,bb[3]);
  g.addColorStop(0,'rgba(142,160,150,0.35)');g.addColorStop(0.5,'rgba(142,160,150,0.18)');g.addColorStop(1,'rgba(120,145,150,0.2)');
  ctx.fillStyle=g;ctx.fillRect(bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]);
  // 刷毛のムラ(横長)
  for(let i=0;i<140;i++){
    const x=bb[0]+R()*(bb[2]-bb[0]),y=bb[1]+R()*(bb[3]-bb[1]);
    ctx.fillStyle=R()<0.5?'rgba(165,180,170,0.07)':'rgba(95,125,140,0.07)';
    ctx.beginPath();ctx.ellipse(x,y,15+R()*50,1+R()*3,0,0,7);ctx.fill();
  }
  // 縁のにじみ(濃)
  smooth(ctx,pts);ctx.lineJoin='round';
  ctx.strokeStyle='rgba(98,126,134,0.10)';ctx.lineWidth=14;ctx.stroke();
  ctx.strokeStyle='rgba(98,126,134,0.12)';ctx.lineWidth=7;ctx.stroke();
  ctx.strokeStyle='rgba(95,125,145,0.18)';ctx.lineWidth=3;ctx.stroke();
  // 金砂子
  for(let i=0;i<120;i++){
    ctx.fillStyle=R()<0.5?'rgba(205,195,140,0.25)':'rgba(220,220,200,0.2)';
    ctx.fillRect(bb[0]+R()*(bb[2]-bb[0]),bb[1]+R()*(bb[3]-bb[1]),1,1);
  }
  ctx.restore();
  // すやり線(輪郭の細い濃青線)
  smooth(ctx,pts);ctx.strokeStyle=o.line||'rgba(85,120,145,0.55)';ctx.lineWidth=0.9;ctx.stroke();
}
function arc(ctx,pts,a=0.4,w=0.8){
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length-1;i++){const e=[(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2];
    if(i===pts.length-2)ctx.quadraticCurveTo(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);
    else ctx.quadraticCurveTo(pts[i][0],pts[i][1],e[0],e[1]);}
  ctx.strokeStyle=`rgba(88,122,148,${a})`;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();
}
export function draw(ctx,W,H){
  ctx.save();ctx.scale(W/680,H/247);
  const R=rng(11);
  const C1='rgba(118,138,128,0.97)', C2='rgba(126,132,112,0.97)';
  // 左下の細帯(全幅に近い)
  blob(ctx,[[-20,238],[100,238.5],[250,238],[330,238.5],[352,240],[364,246],[360,262],[-20,262]],'rgba(118,138,130,0.96)',R,{bb:[-20,237,364,250]});
  // 左の帯(右端が丸い)
  blob(ctx,[[-20,194],[60,193.5],[150,194.5],[172,196],[186,205],[191,214],[186,224],[174,232],[150,237],[60,237.5],[-20,237]],C1,R,{bb:[-20,193,192,238]});
  // 左の帯の内側弧(3本)
  arc(ctx,[[40,212],[90,208],[140,208.5],[170,211],[180,216]],0.35);
  arc(ctx,[[60,218],[110,216],[155,217],[176,222],[168,228]],0.32);
  arc(ctx,[[100,205],[150,203],[178,206],[186,213]],0.28);
  arc(ctx,[[-5,236],[100,236.5],[180,236]],0.3,0.7);
  // 右下の帯
  blob(ctx,[[498,242],[502,235],[520,231],[560,229.5],[620,229],[690,229],[700,262],[500,262]],C2,R,{bb:[498,229,690,248]});
  arc(ctx,[[515,238],[560,235],[620,234],[690,233]],0.3);
  // 右の膨らみ
  blob(ctx,[[573,214],[575,206],[590,201.5],[625,200.5],[690,200],[700,200],[700,230],[610,231],[582,228],[574,221]],'rgba(124,134,116,0.97)',R,{bb:[573,200,690,232]});
  arc(ctx,[[592,214],[608,210],[640,209],[690,209]],0.35);
  arc(ctx,[[582,222],[600,219],[640,219.5],[690,219]],0.3);
  ctx.restore();
}
