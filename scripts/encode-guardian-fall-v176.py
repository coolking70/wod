from pathlib import Path
from PIL import Image,ImageChops
import argparse,json,hashlib,shutil
p=argparse.ArgumentParser();p.add_argument('evidence');a=p.parse_args();root=Path(a.evidence);source=json.load(open(root/'native-motion-source.json'));assert source['passed'];assets=Path('dist/assets/studies');gif=assets/'v176-guardian-fall.gif';sheet=assets/'v176-guardian-fall-sheet.png';poster=assets/'v176-guardian-fall-poster.png';assert not any(p.exists()for p in[gif,sheet,poster]);images=[];rows=[];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for row in source['frames']:
 f=root/row['file'];assert sha(f)==row['sha256'];im=Image.open(f).convert('RGBA');assert im.size==(240,264)and im.getchannel('A').getextrema()==(0,255);box=im.getchannel('A').getbbox();assert box[0]>0 and box[1]>0 and box[2]<240 and box[3]<264;images.append(im);rows.append({'frame':row['frame'],'alphaBBox':box,'durationMs':row['durationMs'],'RGBAFrameSHA256':hashlib.sha256(im.tobytes()).hexdigest()})
assert len(images)==8 and len({r['RGBAFrameSHA256']for r in rows})==8;canvas=Image.new('RGBA',(960,528));
for i,im in enumerate(images):canvas.paste(im,((i%4)*240,(i//4)*264))
canvas.save(sheet,optimize=True);shutil.copy2(root/source['frames'][-1]['file'],poster);palette=canvas.convert('RGB').quantize(colors=255,method=Image.Quantize.MEDIANCUT);pal=(palette.getpalette()+[0]*768)[:768];pal[765:768]=[255,0,255];palette.putpalette(pal);encoded=[]
for im in images:
 q=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE);q.putpalette(pal);q.paste(255,mask=im.getchannel('A').point(lambda v:255 if v<128 else 0));encoded.append(q)
durations=[r['durationMs']for r in rows];encoded[0].save(gif,save_all=True,append_images=encoded[1:],duration=durations,loop=0,transparency=255,background=255,disposal=2,optimize=False);decoded=[]
with Image.open(gif)as v:
 assert v.n_frames==8
 for i in range(8):
  v.seek(i);im=v.convert('RGBA');assert ImageChops.difference(im.getchannel('A'),images[i].getchannel('A').point(lambda x:255 if x>=128 else 0)).getbbox()is None;decoded.append({'frame':i,'durationMs':v.info['duration'],'RGBAFrameSHA256':hashlib.sha256(im.tobytes()).hexdigest()})
 assert sum(r['durationMs']for r in decoded)==900 and len({r['RGBAFrameSHA256']for r in decoded})==8
result={'passed':True,'sourceReportId':124,'sourceReportSHA256':source['review']['reportSHA256'],'nativeModelSameWeaponSideAndStyles':True,'eightDistinctFrames':True,'durationMs':900,'files':[{'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)}for p in[gif,sheet,poster]],'frames':rows,'decoded':decoded,'limitations':['SVGframesrenderedandencodedlocally, not imagegen/directGIFgeneration.','8GIFsamples andbinaryalpha approximate thecontinuousvectorpreview; PNGsheet retainssemitransparentedges.','Actualblockcheck, HPdamage anddown fromone recordedgroup; defaultposter issettledfallen. GIFloop repeatsone study, not resurrection.','Previewexports only; actualreplay detailusesnativeSVG/staticposecontrols.']};(root/'native-motion-encoding.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'passed':True,'files':result['files']}))
