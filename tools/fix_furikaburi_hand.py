"""振りかぶり v1 から、鞘をつかむ余分な手を消す（D15）。
使い方: python3 -I tools/fix_furikaburi_hand.py 58 29（鞘の延長に使う、ずらす量 x y）。opencv-python-headless が必要。
result2.png ができる。そのあと tools/remove_checker_bg.py で背景を透過にする。
手の跡は、鞘の続き・袖・鎧の絵を近くから写して埋めている（新しく描いていない）。
"""
import numpy as np, cv2
from PIL import Image
im=np.array(Image.open('/home/user/claude/docs/asset-requests/deliveries/005/raiko_attack_2_furikaburi_v1_original.webp').convert('RGB'))
H,W=im.shape[:2]
x0,x1,y0,y1=722,800,655,752
box=np.zeros((H,W),np.uint8);box[y0:y1,x0:x1]=1
r,g,b=[im[:,:,i].astype(int) for i in range(3)]
skin=(r>190)&(g>150)&(b>115)&(r-b>25)&(r>=g)
m=(skin&(box>0)).astype(np.uint8)*255
m=cv2.dilate(m,np.ones((5,5),np.uint8),iterations=2)
cv2.imwrite('mask.png',m)
out=cv2.inpaint(cv2.cvtColor(im,cv2.COLOR_RGB2BGR),m,7,cv2.INPAINT_TELEA)
out=cv2.cvtColor(out,cv2.COLOR_BGR2RGB)
Image.fromarray(out).crop((600,540,1000,860)).resize((1000,800),Image.LANCZOS).save('z2.png')
Image.fromarray(out).save('inpaint.png')

# 鞘の続きを延ばして重ねる
import sys
sx,sy=int(sys.argv[1]),int(sys.argv[2])
poly=np.array([(728,679),(792,712),(792,742),(728,710)],np.int32)
pm=np.zeros((H,W),np.uint8);cv2.fillPoly(pm,[poly],255)
res=out.copy()
ys,xs=np.where(pm>0)
res[ys,xs]=im[ys+sy,xs+sx]
# 手の跡が残るところ（帯の外）は上の inpaint 結果のまま
Image.fromarray(res).save('result.png')
Image.fromarray(res).crop((600,540,1000,860)).resize((1000,800),Image.LANCZOS).save('z3.png')

mm=m>0
yy,xx=np.mgrid[0:H,0:W]
top=679+(xx-728)*(712-679)/(792-728.0)
above=mm&(yy<top)&(pm==0)
below=mm&(yy>top+28)&(pm==0)
res2=res.copy()
a=above&(xx>=748)
res2[a]=im[np.where(a)[0]-38,np.where(a)[1]]
b=below
res2[b]=im[np.where(b)[0]+45,np.where(b)[1]]
Image.fromarray(res2).save('result2.png')
Image.fromarray(res2).crop((600,540,1000,860)).resize((1000,800),Image.LANCZOS).save('z4.png')
