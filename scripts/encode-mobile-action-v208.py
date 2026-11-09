from pathlib import Path
import os,sys,json,hashlib
from PIL import Image,ImageChops,ImageStat
root=Path(sys.argv[1]).resolve()
assert root==Path(os.environ['WOD_EVIDENCE_DIR']).resolve()
meta=json.loads((root/'frame-metadata.json').read_text());assert len(meta['frames'])==8 and sum(meta['delaysMs'])==900
images=[]
for row in meta['frames']:
 p=root/row['name'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'];images.append(Image.open(p).convert('RGBA'))
assert len({im.size for im in images})==1 and all(im.getextrema()[3]==(255,255)for im in images)
width,height=images[0].size;sheet=Image.new('RGBA',(width*8,height))
for i,im in enumerate(images):sheet.paste(im,(i*width,0))
png=root/'mobile-action-actual731.png'
with png.open('xb')as f:sheet.save(f,format='PNG',optimize=True)
held=Image.open(png).convert('RGBA')
for i,im in enumerate(images):assert held.crop((i*width,0,(i+1)*width,height)).tobytes()==im.tobytes()
# One shared palette prevents per-frame palette changes. RGBA sprite cells stay exact.
palette=sheet.convert('RGB').quantize(colors=256);frames=[im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE)for im in images]
gif=root/'mobile-action-actual731.gif'
with gif.open('xb')as f:frames[0].save(f,format='GIF',save_all=True,append_images=frames[1:],loop=0,duration=meta['delaysMs'],disposal=2,optimize=False)
decoded=Image.open(gif);assert decoded.n_frames==8
errors=[];durations=[];unique=set()
for i,im in enumerate(images):
 decoded.seek(i);rgb=decoded.convert('RGB');unique.add(hashlib.sha256(rgb.tobytes()).hexdigest());errors.append(sum(ImageStat.Stat(ImageChops.difference(im.convert('RGB'),rgb)).mean)/3);durations.append(decoded.info['duration'])
assert len(unique)==8 and durations==meta['delaysMs']
data=dict(passed=True,frames=8,width=width,height=height,durationMs=sum(durations),frameDurations=durations,opaqueGIF=True,sharedPalette256=True,RGBAAllEightSpriteCellsExact=True,GIFRGBMeanAbsoluteErrorByFrame=errors,framesActuallyDistinct=True,noNewIndependentMotionOrImagegenClaim=True,files=[dict(path=str(p),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest())for p in [gif,png]])
with(root/'encoded-art-check.json').open('x')as f:json.dump(data,f,indent=2)
print(json.dumps(data))
