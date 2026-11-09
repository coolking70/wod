from pathlib import Path
from PIL import Image,ImageChops
import os,json,hashlib,shutil
source=Path(os.environ['WOD_ART_INPUT']);out=Path(os.environ['WOD_EVIDENCE_DIR']);m=json.load(open(source/'inkcaster-art-source.json'));assert m['passed']and m['plantedFootExact']and m['sourceEvents']==[253,255]
def sha(p):
 with Path(p).open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def save_image(p,image,**kw):
 with p.open('xb')as f:image.save(f,**kw);f.flush();os.fsync(f.fileno())
images=[];rows=[]
for row in m['frames']:
 p=source/row['file'];assert sha(p)==row['sha256'];im=Image.open(p).convert('RGBA');assert im.size==(336,328)and im.getchannel('A').getextrema()==(0,255);box=im.getchannel('A').getbbox();assert 0<box[0]<box[2]<336 and 0<box[1]<box[3]<328;images.append(im);rows.append(dict(frame=row['frame'],nativeSampleMs=row['nativeSampleMs'],durationMs=row['durationMs'],alphaBBox=box,RGBAFrameSHA256=hashlib.sha256(im.tobytes()).hexdigest()))
assert len(images)==len({r['RGBAFrameSHA256']for r in rows})==8
sheet=Image.new('RGBA',(2688,328))
for i,im in enumerate(images):sheet.paste(im,(i*336,0))
sheet_path=out/'inkcaster-cast128.png';gif_path=out/'inkcaster-cast128.gif';save_image(sheet_path,sheet,format='PNG',optimize=True)
with Image.open(sheet_path)as decoded:
 for i,im in enumerate(images):assert decoded.crop((i*336,0,(i+1)*336,328)).convert('RGBA').tobytes()==im.tobytes()
palette=sheet.convert('RGB').quantize(colors=255,method=Image.Quantize.MEDIANCUT);pal=(palette.getpalette()+[0]*768)[:768];pal[765:768]=[255,0,255];palette.putpalette(pal);encoded=[]
for im in images:
 q=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE);q.putpalette(pal);q.paste(255,mask=im.getchannel('A').point(lambda a:255 if a<128 else 0));encoded.append(q)
save_image(gif_path,encoded[0],format='GIF',save_all=True,append_images=encoded[1:],duration=[r['durationMs']for r in rows],loop=0,transparency=255,background=255,disposal=2,optimize=False)
decoded=[]
with Image.open(gif_path)as v:
 assert v.n_frames==8
 for i in range(8):
  v.seek(i);im=v.convert('RGBA');assert ImageChops.difference(im.getchannel('A'),images[i].getchannel('A').point(lambda a:255 if a>=128 else 0)).getbbox()is None;decoded.append(dict(frame=i,durationMs=v.info['duration'],RGBAFrameSHA256=hashlib.sha256(im.tobytes()).hexdigest()))
assert sum(r['durationMs']for r in decoded)==900 and len({r['RGBAFrameSHA256']for r in decoded})==8
for name in ['inkcaster-cast128.svg','inkcaster-cast128-static.png']:
 with(source/name).open('rb')as a,(out/name).open('xb')as b:shutil.copyfileobj(a,b);b.flush();os.fsync(b.fileno())
with(source/'settled-poster.png').open('rb')as a,(out/'inkcaster-cast128-poster.png').open('xb')as b:shutil.copyfileobj(a,b);b.flush();os.fsync(b.fileno())
files=[dict(file=p.name,bytes=p.stat().st_size,sha256=sha(p))for p in sorted(out.iterdir())if p.is_file()];r=dict(passed=True,sourceEvidence=str(source),source=m,frames=rows,decoded=decoded,eightDistinctDecodedFrames=True,durationMs=900,sheetFullRGBAExact=True,binaryGIFAlphaDecodedExact=True,files=files,limits=['Native SVG locally sampled then encoded, no imagegen or direct GIF generation service.','Shared256color palette andbinaryalpha losepartialtransparency; PNGsheet retains exactRGBA.','Eightframes approximate continuousnative900ms and cannotexactseek; productionusesnativeSVG notthisloop.'])
with(out/'inkcaster-art-encoded.json').open('x')as f:json.dump(r,f,indent=2);f.flush();os.fsync(f.fileno())
print(json.dumps(dict(passed=True,files=files,frames=8,durationMs=900)))
