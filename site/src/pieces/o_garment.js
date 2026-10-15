export const name='o_garment';
let seed=5;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
function sm(ctx,P,fill,stroke,lw){const n=P.length;ctx.beginPath();
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(i===0){const l=P[n-1];ctx.moveTo((l[0]+a[0])/2,(l[1]+a[1])/2);}
    ctx.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
  ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
export function draw(ctx,W,H){
  // 赤い着物
  const body=[[430,152],[433,140],[444,131],[462,130],[480,138],[498,152],[520,162],[546,176],[560,194],[548,203],[520,201],[490,205],[462,204],[440,196],[430,178]];
  ctx.save();
  sm(ctx,body,'#C93C2C');
  ctx.clip();
  const g=ctx.createLinearGradient(430,130,550,205);
  g.addColorStop(0,'rgba(216,69,47,0.55)');g.addColorStop(0.5,'rgba(190,50,38,0.25)');g.addColorStop(1,'rgba(216,70,45,0.55)');
  ctx.fillStyle=g;ctx.fillRect(425,125,140,85);
  // 暗い襞
  ctx.strokeStyle='rgba(120,24,18,0.55)';ctx.lineWidth=0.8;
  [[[436,150],[444,176],[462,196]],[[470,142],[486,166],[512,184],[545,196]],[[462,160],[490,176],[520,192]]].forEach(l=>{ctx.beginPath();l.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();});
  // 小紋: 小さな丸紋(青/淡赤)
  seed=31;
  for(let y=134;y<206;y+=8)for(let x=430+((y/8|0)%2)*6;x<562;x+=12){
    const j=(rnd()-0.5)*2;
    ctx.strokeStyle=((x*7+y*3)%5<1)?'rgba(70,80,150,0.75)':'rgba(240,150,110,0.4)';
    ctx.lineWidth=0.7;ctx.beginPath();ctx.arc(x+j,y+j,2.2,0,7);ctx.stroke();
    ctx.fillStyle='rgba(235,170,120,0.35)';ctx.fillRect(x+j-0.4,y+j-0.4,0.9,0.9);
  }
  ctx.restore();
  sm(ctx,body,null,'rgba(100,20,14,0.8)',0.8);
  // 裾の縁(緑)
  ctx.strokeStyle='#2E9A6A';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(500,205);ctx.quadraticCurveTo(535,206,556,196);ctx.stroke();
  // 足先・足裏 (着物の下)
  seed=9;
  sm(ctx,[[494,176],[502,166],[516,162],[530,166],[538,176],[536,190],[524,198],[506,198],[496,190]],'#E0A060','#7a3a1a',0.7);
  sm(ctx,[[504,172],[518,168],[530,172],[528,186],[514,192],[504,186]],'#D88A4A');
  ctx.strokeStyle='#8a4a22';ctx.lineWidth=0.6;
  [[535,176,538,166],[529,172,531,163],[522,169,523,161],[515,168,515,161],[508,169,507,163]].forEach(f=>{ctx.beginPath();ctx.moveTo(f[0],f[1]);ctx.lineTo(f[2],f[3]);ctx.stroke();});
  ctx.beginPath();ctx.moveTo(506,182);ctx.quadraticCurveTo(518,176,530,184);ctx.stroke();
  // 周辺の血痕
  seed=3;
  for(let i=0;i<34;i++){
    const x=430+rnd()*140,y=120+rnd()*100;
    ctx.fillStyle=rnd()<0.6?'#C8302A':'#9a2418';ctx.globalAlpha=0.55+rnd()*0.3;
    ctx.beginPath();ctx.ellipse(x,y,0.8+rnd()*2.2,0.6+rnd()*1.6,rnd()*3,0,7);ctx.fill();}
  ctx.globalAlpha=1;
}
