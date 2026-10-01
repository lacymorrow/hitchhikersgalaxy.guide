import os,sys
from PIL import Image, ImageChops
rows=[]
for f in sorted(os.listdir("before")):
    if not os.path.exists("after/"+f): continue
    a=Image.open("before/"+f).convert("L"); b=Image.open("after/"+f).convert("L")
    w=max(a.width,b.width); h=max(a.height,b.height)
    A=Image.new("L",(w,h),128); A.paste(a,(0,0)); B=Image.new("L",(w,h),128); B.paste(b,(0,0))
    d=ImageChops.difference(A,B).point(lambda v:255 if v>24 else 0)
    pct=100*sum(1 for v in d.getdata() if v)/(w*h)
    rows.append((pct,f,a.size,b.size))
for r in sorted(rows,reverse=True): print(f"{r[0]:6.2f}% {r[1]:34s} {r[2]} -> {r[3]}")
