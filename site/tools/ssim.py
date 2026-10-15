# usage: python3 tools/ssim.py out/shot.png [x0 y0 x1 y1]   (領域省略=全体+既定ピース)
import sys, numpy as np
from PIL import Image
def g(p): return np.asarray(Image.open(p).convert('L'),dtype=np.float64)
def box(a,k=7):
    c=np.cumsum(np.cumsum(np.pad(a,((1,0),(1,0))),0),1)
    return (c[k:,k:]-c[:-k,k:]-c[k:,:-k]+c[:-k,:-k])/(k*k)
def ssim(a,b):
    C1,C2=(0.01*255)**2,(0.03*255)**2
    ma,mb=box(a),box(b); va=box(a*a)-ma*ma; vb=box(b*b)-mb*mb; cv=box(a*b)-ma*mb
    return float((((2*ma*mb+C1)*(2*cv+C2))/((ma*ma+mb*mb+C1)*(va+vb+C2))).mean())
R=g('ref/reference.jpg'); S=g(sys.argv[1])
REG={'全体':(0,0,680,247),'背景':(0,0,680,247),'雲':(0,0,680,45),'鬼(左頭)':(0,25,140,150),'大鬼':(220,60,510,210),'武者左':(190,95,330,210),'武者右':(410,35,650,195)}
if len(sys.argv)>2: REG={'指定':tuple(map(int,sys.argv[2:6]))}
for k,(x0,y0,x1,y1) in REG.items():
    r,s=R[y0:y1,x0:x1],S[y0:y1,x0:x1]
    print(f'{k:8s} SSIM={ssim(r,s):.3f}  MAE={np.abs(r-s).mean():.1f}')
