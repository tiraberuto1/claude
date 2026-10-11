"""斬り下ろしの頭を、構えの頭（絵巻らしい顔）に差し替える（D15）。
使い方: python3 -I tools/swap_head_kirioroshi.py 0.95 -6 575 390  → swapped.png
引数: 倍率 回転(度・時計回りが正) 首元の中心x 首元のy
"""
import sys
from PIL import Image, ImageDraw, ImageFilter
D='/home/user/claude/docs/asset-requests/deliveries/005/'
a=Image.open(D+'raiko_attack_1_kamae_v1_original.webp').convert('RGBA')
b=Image.open(D+'raiko_attack_3_kirioroshi_v1_original.webp').convert('RGBA')
S=2
# panel coords -> orig. kamae panel origin (450,100); kirioroshi (420,120)
def ka(p): return (450+p[0]/S,100+p[1]/S)
def ki(p): return (420+p[0]/S,120+p[1]/S)
# 1) old head erase polygon (kirioroshi, panel coords of right half minus 700)
old=[(110,300),(100,200),(150,110),(240,30),(330,30),(430,60),(430,150),(430,250),(430,330),(405,400),(330,440),(230,470),(150,430)]
mask=Image.new('L',b.size,0);ImageDraw.Draw(mask).polygon([ki(p) for p in old],fill=255)
bb=b.copy();bb.paste((0,0,0,0),(0,0),mask)
# 2) new head cut from kamae (panel coords)
new=[(185,470),(180,330),(190,250),(235,205),(240,170),(290,110),(300,80),(410,85),(420,160),(480,170),(485,180),(430,230),(500,330),(515,400),(490,440),(420,460),(380,495),(300,500),(230,495)]
m2=Image.new('L',a.size,0);ImageDraw.Draw(m2).polygon([ka(p) for p in new],fill=255)
m2=m2.filter(ImageFilter.GaussianBlur(1))
head=a.copy();head.putalpha(Image.composite(a.split()[3],Image.new('L',a.size,0),m2))
bbx=head.getbbox();head=head.crop(bbx)
scale=float(sys.argv[1]);rot=float(sys.argv[2]);cx=float(sys.argv[3]);cy=float(sys.argv[4])
head=head.resize((int(head.width*scale),int(head.height*scale)),Image.LANCZOS)
head=head.rotate(-rot,expand=True,resample=Image.BICUBIC)
# anchor: bottom-center of head at (cx,cy)
out=bb.copy()
out.alpha_composite(head,(int(cx-head.width/2),int(cy-head.height)))
out.save('swapped.png')
g=Image.new('RGBA',out.size,(120,170,120,255));g.alpha_composite(out);g.crop((420,100,770,440)).resize((700,680)).save('swapped_view.png')
