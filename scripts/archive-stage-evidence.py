"""Single durable evidence package: original checkpoint ZIP bytes plus remaining files.
No deletion. Restore only into an explicit target; mismatched existing files abort.
"""
from pathlib import Path,PurePosixPath
import argparse,hashlib,io,json,os,shutil,stat,tempfile,zipfile
INDEX='.stage-evidence-index.json'
def digest(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def datahash(data):return hashlib.sha256(data).hexdigest()
def safe(s):
 p=PurePosixPath(s)
 if p.is_absolute()or not p.parts or '..'in p.parts or '.'in p.parts:raise ValueError('Unsafe relative archive path')
 return s

def metadata(p,root):
 s=p.stat();return {'root':root,'path':str(p),'mode':stat.S_IMODE(s.st_mode),'mtimeNs':s.st_mtime_ns}
def read_index(z):
 names=z.namelist()
 if len(names)!=len(set(names)):raise ValueError('Duplicate ZIP entries')
 matches=[n for n in names if n.endswith('/'+INDEX)]
 if len(matches)!=1 or z.getinfo(matches[0]).file_size>16*1024**2:raise ValueError('Invalid evidence index')
 x=json.loads(z.read(matches[0]));assert x['format']=='wod-checkpoint-stage'and x['version']==1
 prefix=x['prefix'];safe(prefix);assert '/'not in prefix
 assert matches[0]==prefix+'/'+INDEX
 return x

def package(evidence,raw,checkpoints,target,prefix):
 roots={k:Path(v).resolve()for k,v in [('evidence',evidence),('raw',raw),('checkpoints',checkpoints)]};target=Path(target).resolve();safe(prefix);assert '/'not in prefix
 assert not target.exists()and all(target!=p and p not in target.parents for p in roots.values());objects={};containers=[];covered=set();late=[]
 def add(path,row,root):
  assert not path.is_symlink()and path.is_file();n=row['path'];safe(n)
  if n in objects:
   assert (objects[n]['bytes'],objects[n]['sha256'])==(row['bytes'],row['sha256']),'different duplicate '+n
   objects[n]['sources'].append(metadata(path,root))
  else:objects[n]={**row,'sources':[metadata(path,root)]}
  covered.add(str(path))
 for cp in sorted(roots['checkpoints'].glob('*.zip')):
  assert not cp.is_symlink();entry=prefix+'/checkpoints/'+cp.name
  with zipfile.ZipFile(cp)as z:
   assert z.testzip()is None;names=z.namelist();mnames=[n for n in names if n.endswith('/.wod-evidence-manifest.json')];assert len(mnames)==1
   lead=mnames[0].split('/')[0];safe(lead);assert mnames[0]==lead+'/.wod-evidence-manifest.json';m=json.loads(z.read(mnames[0]));folder=roots['raw']/'acceptance'/lead
   expected={lead+'/'+safe(r['path'])for r in m['files']}|{mnames[0]};assert len(names)==len(set(names))and set(names)==expected
   actual={str(p.relative_to(folder))for p in folder.rglob('*')if p.is_file()};assert actual=={r['path']for r in m['files']}
   for r in m['files']:
    p=folder/r['path'];assert p.stat().st_size==r['bytes']and digest(p)==r['sha256'];assert datahash(z.read(lead+'/'+r['path']))==r['sha256'];add(p,{'path':str(p.relative_to(roots['raw'])),'bytes':r['bytes'],'sha256':r['sha256'],'container':entry,'entry':lead+'/'+r['path']},'raw')
  containers.append({'entry':entry,'bytes':cp.stat().st_size,'sha256':digest(cp),'sources':[metadata(cp,'checkpoints')]});covered.add(str(cp))
 assert containers,'No completed checkpoints supplied'
 for label in ['evidence','raw']:
  for p in sorted(roots[label].rglob('*')):
   assert not p.is_symlink(),p
   if not p.is_file()or str(p)in covered:continue
   if p.name.startswith('packaging')or p.name=='CHECKPOINT_COPIES_RETIRED.json':late.append(str(p));continue
   n=str(p.relative_to(roots[label]));add(p,{'path':n,'bytes':p.stat().st_size,'sha256':digest(p),'container':None,'entry':prefix+'/'+safe(n)},label)
 x={'format':'wod-checkpoint-stage','version':1,'prefix':prefix,'roots':{k:str(v)for k,v in roots.items()},'objects':list(objects.values()),'containers':containers,'latePackagingFilesExcluded':late,'files':len(objects),'images':sum(r['path'].lower().endswith(('.png','.jpg','.webp','.jpeg'))for r in objects.values()),'originalCheckpointZIPBytesPreserved':True,'sourceFilesRemoved':False}
 target.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(target,'x',zipfile.ZIP_DEFLATED,compresslevel=3)as z:
  for c in containers:z.write(c['sources'][0]['path'],c['entry'],compress_type=zipfile.ZIP_STORED)
  for r in objects.values():
   if r['container']is None:z.write(r['sources'][0]['path'],r['entry'])
  z.writestr(prefix+'/'+INDEX,json.dumps(x,ensure_ascii=False,indent=2)+'\n')
 return verify(target,True)

def verify(archive,check_sources=False):
 with zipfile.ZipFile(archive)as outer:
  assert outer.testzip()is None;x=read_index(outer);expected={c['entry']for c in x['containers']}|{r['entry']for r in x['objects']if r['container']is None}|{x['prefix']+'/'+INDEX};assert set(outer.namelist())==expected
  containers={c['entry']:c for c in x['containers']};groups={k:[]for k in containers}
  for r in x['objects']:
   safe(r['path']);safe(r['entry'])
   if r['container']is None:
    assert outer.getinfo(r['entry']).file_size==r['bytes']and datahash(outer.read(r['entry']))==r['sha256']
   else:groups[r['container']].append(r)
   for s in r['sources']:
    assert s['root']in x['roots'];Path(s['path']).resolve().relative_to(Path(x['roots'][s['root']]).resolve())
    if check_sources:assert Path(s['path']).stat().st_size==r['bytes']and digest(s['path'])==r['sha256']
  for key,c in containers.items():
   assert c['bytes']<=128*1024**2 and outer.getinfo(key).file_size==c['bytes'];data=outer.read(key);assert datahash(data)==c['sha256']
   if check_sources:
    for s in c['sources']:assert digest(s['path'])==c['sha256']
   with zipfile.ZipFile(io.BytesIO(data))as z:
    assert z.testzip()is None;mnames=[n for n in z.namelist()if n.endswith('/.wod-evidence-manifest.json')];assert len(mnames)==1
    assert set(z.namelist())=={r['entry']for r in groups[key]}|set(mnames)
    m=json.loads(z.read(mnames[0]));lead=mnames[0].split('/')[0]+'/'
    assert {(lead+r['path'],r['bytes'],r['sha256'])for r in m['files']}=={(r['entry'],r['bytes'],r['sha256'])for r in groups[key]}
    for r in groups[key]:assert z.getinfo(r['entry']).file_size==r['bytes']and datahash(z.read(r['entry']))==r['sha256']
  return {'passed':True,'archive':str(Path(archive).resolve()),'archiveBytes':Path(archive).stat().st_size,'archiveSHA256':digest(archive),'files':len(x['objects']),'images':x['images'],'checkpoints':len(containers),'logicalBytes':sum(r['bytes']for r in x['objects']),'allOriginalZIPBytesSHAAndCRCVerified':True,'allInnerRawFilesSHAAndCRCVerified':True,'sourceFilesRechecked':check_sources,'sourceFilesRemoved':False}

def restore(archive,root,target=None,sample=False):
 verify(archive);rows=[]
 with zipfile.ZipFile(archive)as outer:
  x=read_index(outer);assert root in x['roots'];original=Path(x['roots'][root]).resolve()
  for r in [*x['objects'],*[{**c,'container':None}for c in x['containers']]]:
   for s in r['sources']:
    if s['root']==root:
     rel=Path(s['path']).resolve().relative_to(original);safe(rel.as_posix());rows.append((rel,r,s))
  assert rows
  if sample:
   ordered=sorted(rows,key=lambda a:a[1]['bytes'],reverse=True);rows=ordered[:2]+([next(a for a in rows if str(a[0]).endswith('.png'))]if any(str(a[0]).endswith('.png')for a in rows)else[]);rows=list({str(a[0]):a for a in rows}.values())
  def extract(dest):
   dest=Path(dest).resolve();need=sum(r['bytes']for _,r,_ in rows);base=dest
   while not base.exists():base=base.parent
   assert shutil.disk_usage(base).free>need+100*1024**2,'Insufficient restore space'
   for rel,r,_ in rows:
    p=(dest/rel).resolve();assert p.is_relative_to(dest),'Unsafe restore target through symlink'
    if p.exists():assert p.is_file()and digest(p)==r['sha256'],'Existing target differs; nothing overwritten'
   active_key=None;inner=None
   try:
    for rel,r,s in sorted(rows,key=lambda a:(a[1]['container']or'',str(a[0]))):
     p=(dest/rel).resolve()
     if p.exists():continue
     if r['container']!=active_key:
      if inner:inner.close()
      active_key=r['container'];inner=zipfile.ZipFile(io.BytesIO(outer.read(active_key)))if active_key else None
     p.parent.mkdir(parents=True,exist_ok=True)
     with (inner or outer).open(r['entry'])as src,p.open('xb')as dst:shutil.copyfileobj(src,dst)
     assert p.stat().st_size==r['bytes']and digest(p)==r['sha256'];p.chmod(s['mode']);os.utime(p,ns=(s['mtimeNs'],s['mtimeNs']));assert p.stat().st_mtime_ns==s['mtimeNs']
   finally:
    if inner:inner.close()
  if sample:
   with tempfile.TemporaryDirectory(prefix='wod-stage-restore-sample-',dir='/tmp')as t:extract(t)
  else:
   assert target,'Explicit restore target required';extract(target)
  return {'passed':True,'root':root,'sample':sample,'files':len(rows),'bytes':sum(r['bytes']for _,r,_ in rows),'contentModesAndMtimeNsRestored':True,'existingDifferentTargetsNeverOverwritten':True}

if __name__=='__main__':
 p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True);a=sub.add_parser('pack');a.add_argument('evidence');a.add_argument('raw');a.add_argument('checkpoints');a.add_argument('target');a.add_argument('--prefix',required=True);a=sub.add_parser('verify');a.add_argument('archive');a.add_argument('--check-sources',action='store_true');a=sub.add_parser('restore');a.add_argument('archive');a.add_argument('--root',choices=['raw','evidence','checkpoints'],required=True);a.add_argument('--target');a.add_argument('--sample-check',action='store_true');args=p.parse_args()
 if args.action=='pack':result=package(args.evidence,args.raw,args.checkpoints,args.target,args.prefix)
 elif args.action=='verify':result=verify(args.archive,args.check_sources)
 else:result=restore(args.archive,args.root,args.target,args.sample_check)
 print(json.dumps(result,ensure_ascii=False))
