from pathlib import Path
from PIL import Image,ImageChops
import json,hashlib,shutil,os
E=Path(os.environ.get('WOD_ART_DIR','/tmp/wod-herbalist-art-v189'));A=Path(__file__).resolve().parents[1]/'dist/assets/studies';s=json.load(open(E/'herbalist-motion-source.json'));assert s['passed'];images=[];rows=[];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in s['frames']:
 p=E/row['file'];assert sha(p)==row['sha256'];im=Image.open(p).convert('RGBA');assert im.size==(252,246)and im.getchannel('A').getextrema()==(0,255);box=im.getchannel('A').getbbox();assert 0<box[0]<box[2]<252 and 0<box[1]<box[3]<246;images.append(im);rows.append({'frame':row['frame'],'alphaBBox':box,'RGBAFrameSHA256':hashlib.sha256(im.tobytes()).hexdigest(),'durationMs':row['durationMs'],'nativeSampleMs':row['nativeSampleMs']})
assert len(images)==len({r['RGBAFrameSHA256']for r in rows})==8;gif=A/'v189-herbalist-aid.gif';sheet=A/'v189-herbalist-aid-sheet.png';poster=A/'v189-herbalist-aid-poster.png';assert not any(p.exists()for p in[gif,sheet,poster]);canvas=Image.new('RGBA',(1008,492))
for i,im in enumerate(images):canvas.paste(im,((i%4)*252,(i//4)*246))
canvas.save(sheet,optimize=True);shutil.copy2(E/'herbalist-settled-poster.png',poster);palette=canvas.convert('RGB').quantize(colors=255,method=Image.Quantize.MEDIANCUT);pal=(palette.getpalette()+[0]*768)[:768];pal[765:768]=[255,0,255];palette.putpalette(pal);encoded=[]
for im in images:
 q=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE);q.putpalette(pal);q.paste(255,mask=im.getchannel('A').point(lambda a:255 if a<128 else 0));encoded.append(q)
encoded[0].save(gif,save_all=True,append_images=encoded[1:],duration=[r['durationMs']for r in rows],loop=0,transparency=255,background=255,disposal=2,optimize=False);decoded=[]
with Image.open(gif)as v:
 assert v.n_frames==8
 for i in range(8):
  v.seek(i);im=v.convert('RGBA');assert ImageChops.difference(im.getchannel('A'),images[i].getchannel('A').point(lambda a:255 if a>=128 else 0)).getbbox()is None;decoded.append({'frame':i,'durationMs':v.info['duration'],'RGBAFrameSHA256':hashlib.sha256(im.tobytes()).hexdigest()})
assert sum(r['durationMs']for r in decoded)==900 and len({r['RGBAFrameSHA256']for r in decoded})==8
r={'passed':True,'nativeSource':s,'samePaletteAndBinaryAlphaDecodedExact':True,'eightDistinctDecodedFrames':True,'durationMs':900,'nativeGestureMs':900,'files':[{'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)}for p in[gif,sheet,poster]],'frames':rows,'decoded':decoded,'limits':['NativeSVG rendered andencoded locally, no newimagegen.','GIF900ms follows the exported centisecond intervals; eightframes approximate continuousSVG, not exactseekable playback.','Shared256color palette andbinaryalpha losepartialtransparency; PNGsheet preservesfullRGBA.','Onlypredeclared actualnormal137directaid records161/162, actual29/unreceived24; productioncurrentstep usesnativeSVG ratherthanthisindependentGIF.']};(E/'herbalist-motion-encoding.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'passed':True,'files':r['files'],'distinct':8,'durationMs':900}))
