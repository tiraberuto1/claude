import json,re,sys
r=json.load(open(sys.argv[1]))['final']
def rd(x):
    if isinstance(x,float): return round(x,3)
    if isinstance(x,list): return [rd(i) for i in x]
    if isinstance(x,dict): return {k:rd(v) for k,v in x.items()}
    return x
lit=json.dumps(rd(r),separators=(',',':'))
s=open('src/pieces/s_right.js').read()
s=re.sub(r"export const params=\{.*?\};\n","export const params="+lit+";\n",s,count=1,flags=re.S)
open('src/pieces/s_right.js','w').write(s)
