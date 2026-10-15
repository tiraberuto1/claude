export const name='o_garment';
let seed=5;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function sm(ctx,P,fill,stroke,lw){const n=P.length;ctx.beginPath();
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(i===0){const l=P[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}
    ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
  ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function line(ctx,pts,col,lw){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
export const DEF={bx:2,by:1,sx:1,sy:0.99,tipx:1,tipy:1,dl:20,dark:0.01,motif:1,mstep:10,mph:3,mpy:0,wrink:1,hl:1,fx:5,fy:0,fs:1,fdl:8,toes:1,blood:1,lw:4,gl:0,tdx:0,tdy:1,bpx:0,bpy:0,vx0:-4,vy0:3,vx1:0,vy1:-1,vx2:6,vy2:0,vx3:6,vy3:-1,vx4:0,vy4:0,vx5:0,vy5:0,vx6:-3,vy6:0,vx7:4,vy7:-2,vx8:0,vy8:-1,vx9:-1,vy9:1,vx10:-1,vy10:1,vx11:5,vy11:6,vx12:4,vy12:4,vx13:1,vy13:0,vx14:0,vy14:0,vx15:-2,vy15:0};
const cl=(c,d)=>Math.max(0,Math.min(255,c+d));
export function draw(ctx,W,H,over){
  const P=Object.assign({},DEF,over||{});
  ctx.save();ctx.translate(430+P.bx,130+P.by);ctx.scale(P.sx,P.sy);ctx.translate(-430,-130);
  // 下縁: 白裏地の帯と緑の縁(着物の下に敷く)
  const lower=[[438,186],[446,200],[470,210],[500,212],[530,210],[552,203],[561,196],[556,199],[530,205],[500,207],[470,205],[450,196],[440,182]];
  lower.forEach((q,i)=>{if(i<6)q[1]+=P.lw;});
  sm(ctx,lower,'#EFE8DC');
  line(ctx,[[441,196],[455,205],[480,209],[510,210],[540,206],[559,196]].map(q=>[q[0],q[1]+P.gl]),'#4E9A6A',2);
  // 赤い着物 一枚の布
  const body0=[[430,152],[432,140],[443,130],[460,129],[476,136],[490,150],[512,158],[536,166],[550+P.tipx*0.5,182+P.tipy*0.5],[560+P.tipx,196+P.tipy],[548,204],[520,202],[490,204],[462,202],[440,194],[430,176]];
  const body=body0.map((q,i)=>[q[0]+P['vx'+i],q[1]+P['vy'+i]]);
  ctx.save();
  sm(ctx,body,`rgb(${cl(194,P.dl)},${cl(58,P.dl)},${cl(43,P.dl)})`);
  ctx.clip();
  // 右へ向けて深い赤
  const g=ctx.createLinearGradient(430,130,555,205);
  g.addColorStop(0,'rgba(217,80,58,0.45)');g.addColorStop(0.45,'rgba(194,58,43,0)');g.addColorStop(1,'rgba(140,42,34,0.5)');
  ctx.fillStyle=g;ctx.fillRect(425,125,140,85);
  ctx.fillStyle=`rgba(70,20,15,${P.dark})`;ctx.fillRect(425,125,140,85);
  if(P.hl){
  sm(ctx,[[434,150],[446,134],[460,134],[452,150],[444,170]],'rgba(217,80,58,0.7)');
  sm(ctx,[[500,168],[520,168],[540,180],[524,186]],'rgba(217,80,58,0.5)');
  }
  if(P.wrink){
  [[[436,148],[442,172],[458,192]],[[468,140],[484,160],[506,176],[540,190]],[[490,190],[520,194],[550,198]],[[504,160],[524,172],[548,186]]].forEach(l=>line(ctx,l,'rgba(140,42,34,0.8)',1.1));
  [[[448,150],[452,176],[466,196]],[[494,172],[514,184],[536,196]]].forEach(l=>line(ctx,l,'rgba(110,28,22,0.5)',2.2));
  }
  // 紋: 金朱の小さな輪(疎ら)、青輪も少し
  seed=31;
  for(let y=136+P.mpy;P.motif&&y<206;y+=P.mstep)for(let x=432+P.mph+((y/P.mstep|0)%2)*P.mstep/2;x<562;x+=P.mstep){
    if(rnd()<0.25)continue;
    const j=(rnd()-0.5)*1.5, blue=((x*7+y*3)%6<1);
    ctx.strokeStyle=blue?'rgba(60,70,150,0.8)':'rgba(224,160,64,0.85)';
    ctx.lineWidth=0.7;ctx.beginPath();ctx.arc(x+j,y+j,2,0,7);ctx.stroke();
  }
  ctx.restore();
  sm(ctx,body,null,'rgba(90,18,14,0.8)',0.7);
  // 左縁の白裏
  line(ctx,[[433,148],[432,160],[436,178]],'#EFE8DC',1.6);
  ctx.restore();
  ctx.save();ctx.translate(570+P.fx,170+P.fy);ctx.scale(P.fs,P.fs);ctx.translate(-570,-170);
  ctx.globalAlpha=0.55*P.blood;
  [[575,192,22,6,0],[560,186,12,5,0.3],[590,180,9,4,0.2]].forEach(q=>{ctx.fillStyle='#C8542A';ctx.beginPath();ctx.ellipse(q[0]+P.bpx,q[1]+P.bpy,q[2],q[3],q[4],0,7);ctx.fill();});
  ctx.globalAlpha=1;
  const heel=[[550,168],[554,158],[564,154],[574,157],[578,166],[576,178],[570,188],[560,190],[553,182]];
  sm(ctx,heel,`rgb(${cl(190,P.fdl)},${cl(132,P.fdl)},${cl(80,P.fdl)})`,'#6a3418',0.8);
  sm(ctx,[[576,170],[582,158],[590,150],[596,156],[592,168],[584,178]],'#B87C4A','#6a3418',0.6);
  for(let k=0;P.toes&&k<5;k++){const x=578+k*3.6+P.tdx,y=154+k*1.8+P.tdy;
    ctx.strokeStyle='#6a3418';ctx.lineWidth=0.6;ctx.beginPath();ctx.ellipse(x+1,y+3,2,3.2,0.5,0,7);ctx.stroke();}
  line(ctx,[[559,176],[566,184],[572,182]],'rgba(110,50,20,0.5)',0.6);
  line(ctx,[[555,166],[552,175],[554,184]],'#1a1410',0.9);
  ctx.restore();
  // 血痕(細い筋と小さな飛沫)
  seed=3;
  for(let i=0;i<30;i++){
    const x=432+rnd()*140,y=125+rnd()*90;
    ctx.fillStyle=rnd()<0.6?'#B8281F':'#9a2418';ctx.globalAlpha=0.6+rnd()*0.3;
    ctx.beginPath();ctx.ellipse(x,y,0.6+rnd()*1.3,0.5+rnd()*1,rnd()*3,0,7);ctx.fill();}
  ctx.globalAlpha=1;
  for(let i=0;i<10;i++){const x=470+rnd()*100,y=190+rnd()*20;
    line(ctx,[[x,y],[x+5+rnd()*5,y-2-rnd()*3]],'rgba(184,40,31,0.8)',0.8);}
}
