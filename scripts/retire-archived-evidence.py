"""Recoverable acceptance-cache retirement. Immutable ZIP + audited metadata remain.
Plan, physically prove recovery, then explicitly apply; never overwrite changed data.
"""
from pathlib import Path,PurePosixPath
import argparse,hashlib,io,json,os,re,shutil,stat,tempfile,zipfile
CACHE_BASES=(Path('/workspace/wod-evidence'),Path('/tmp/wod-evidence'))
def digest(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def signature(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def safe(name,empty=False):
 p=PurePosixPath(name)
 if (not name and not empty)or p.is_absolute()or'..'in p.parts or'\\'in name or any(x in ['.git','.']for x in name.split('/')):raise ValueError('Unsafe relative path')
 return name
def guard(root,exists=True):
 p=Path(root).absolute()
 if p!=p.resolve()or p.name!='acceptance'or not re.fullmatch(r'v[0-9]+',p.parent.name)or p.parent.parent not in [b.resolve()for b in CACHE_BASES]:raise ValueError('Only canonical versioned acceptance-cache roots are allowed')
 if exists and not p.is_dir():raise ValueError('Acceptance cache is absent')
 return p
def statrow(p):
 s=p.stat()
 if not stat.S_ISREG(s.st_mode):raise ValueError('Non-regular evidence file')
 return{'bytes':s.st_size,'mode':stat.S_IMODE(s.st_mode),'mtimeNs':s.st_mtime_ns}
def inventory(root):
 dirs=[];files={}
 for p in [root,*sorted(root.rglob('*'))]:
  if p.is_symlink()or'.git'in p.parts:raise ValueError('Symlink or Git directory in cache')
  if p.is_dir():
   s=p.stat();dirs.append({'relative':str(p.relative_to(root))if p!=root else'','mode':stat.S_IMODE(s.st_mode),'mtimeNs':s.st_mtime_ns})
  elif p.is_file():files[str(p.relative_to(root))]=p
  else:raise ValueError('Unsupported cache entry')
 return files,dirs
def catalogue(archive,root):
 result={};version=root.parent.name
 with zipfile.ZipFile(archive)as outer:
  names=outer.namelist()
  if len(names)!=len(set(names))or any(not safe(n.rstrip('/'))for n in names):raise ValueError('Invalid archive entries')
  if outer.testzip()is not None:raise ValueError('Archive CRC failed')
  ix=[n for n in names if n.endswith('/.stage-evidence-index.json')]
  if ix:
   if len(ix)!=1:raise ValueError('Ambiguous stage index')
   x=json.loads(outer.read(ix[0]));assert x['format']=='wod-checkpoint-stage'and x['version']==1 and x['prefix']==version
   containers={c['entry']:c for c in x['containers']};inner=None;active=None
   try:
    # Check all original container bytes, even containers with no selected file.
    for c in containers.values():
     b=outer.read(c['entry']);assert len(b)==c['bytes']and hashlib.sha256(b).hexdigest()==c['sha256']
     with zipfile.ZipFile(io.BytesIO(b))as z:assert z.testzip()is None
    selected=[]
    for r in x['objects']:
     for s in r['sources']:
      p=Path(s['path'])
      if s['root']=='raw'and p.is_relative_to(root):selected.append((r,s,p.relative_to(root).as_posix()))
    for r,s,rel in sorted(selected,key=lambda v:(v[0]['container']or'',v[2])):
     safe(rel);assert rel not in result
     if active!=r['container']:
      if inner:inner.close()
      active=r['container'];inner=zipfile.ZipFile(io.BytesIO(outer.read(active)))if active else None
     z=inner or outer;b=z.read(r['entry']);assert len(b)==r['bytes']and hashlib.sha256(b).hexdigest()==r['sha256']
     result[rel]={'relative':rel,'container':r['container'],'entry':r['entry'],'bytes':r['bytes'],'sha256':r['sha256'],'indexedMode':s['mode'],'indexedMtimeNs':s['mtimeNs'],'zipDateTime':list(z.getinfo(r['entry']).date_time)}
   finally:
    if inner:inner.close()
   kind='nested-v1'
  else:
   prefix=version+'/acceptance/'
   for n in names:
    if not n.startswith(prefix)or n.endswith('/'):continue
    rel=n[len(prefix):];safe(rel);assert rel not in result;info=outer.getinfo(n);b=outer.read(n)
    result[rel]={'relative':rel,'container':None,'entry':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'zipDateTime':list(info.date_time),'zipExternalAttr':info.external_attr}
   kind='legacy-flat'
   meta=version+'/.cache-source-metadata.json'
   if meta in names:
    original=json.loads(outer.read(meta));assert original['format']=='wod-acceptance-snapshot'and original['version']==1 and original['root']==str(root);indexed={r['relative']:r for r in original['files']};assert len(indexed)==len(original['files'])and indexed.keys()==result.keys()
    for rel,r in result.items():
     v=indexed[rel];assert v['bytes']==r['bytes']and v['sha256']==r['sha256'];r.update({'indexedMode':v['mode'],'indexedMtimeNs':v['mtimeNs']})
    kind='snapshot-v1'
 if not result:raise ValueError('No selected acceptance evidence in archive')
 return kind,result

def sync_directory(path):
 fd=os.open(path,os.O_RDONLY|getattr(os,'O_DIRECTORY',0))
 try:os.fsync(fd)
 finally:os.close(fd)
def newjson(path,x,root):
 path=Path(path).absolute()
 if path.is_relative_to(root)or path.exists()or path!=path.resolve():raise ValueError('Metadata destination must be new and outside cache')
 path.parent.mkdir(parents=True,exist_ok=True)
 with path.open('x')as f:
  f.write(json.dumps(x,ensure_ascii=False,indent=2)+'\n');f.flush();os.fsync(f.fileno())
 sync_directory(path.parent)
def audit(archive,root,expected_sha):
 root=guard(root);archive=Path(archive).resolve()
 if archive.is_relative_to(root)or not re.fullmatch('[a-f0-9]{64}',expected_sha)or digest(archive)!=expected_sha:raise ValueError('Immutable archive SHA mismatch')
 kind,index=catalogue(archive,root);actual,dirs=inventory(root)
 if actual.keys()!=index.keys():raise ValueError('Cache/archive path sets differ; unique or missing files are retained')
 rows=[]
 for rel,p in actual.items():
  a=statrow(p);r=index[rel]
  if a['bytes']!=r['bytes']or digest(p)!=r['sha256']or statrow(p)!=a:raise ValueError('Cache content changed or differs from archive')
  if kind!='legacy-flat'and(a['mode']!=r['indexedMode']or a['mtimeNs']!=r['indexedMtimeNs']):raise ValueError('Indexed original metadata differs')
  rows.append({**r,**a})
 return{'format':'wod-cache-retirement','version':1,'root':str(root),'archive':str(archive),'archiveSHA256':expected_sha,'archiveKind':kind,'files':sorted(rows,key=lambda r:r['relative']),'directories':dirs,'legacyFlatCurrentNanosecondMetadataCapturedSeparately':kind=='legacy-flat','allArchiveCRCChecked':True}
def snapshot(root,target):
 root=guard(root);target=Path(target).absolute()
 if target!=target.resolve()or target.is_relative_to(root)or target.exists():raise ValueError('Snapshot must be new and outside cache')
 files,dirs=inventory(root);rows=[]
 for rel,p in sorted(files.items()):
  info=statrow(p);rows.append({'relative':safe(rel),**info,'sha256':digest(p)});assert statrow(p)==info
 base=target.parent
 while not base.exists():base=base.parent
 if shutil.disk_usage(base).free<sum(r['bytes']for r in rows)+100*1024**2:raise ValueError('Insufficient conservative snapshot space')
 target.parent.mkdir(parents=True,exist_ok=True);meta={'format':'wod-acceptance-snapshot','version':1,'root':str(root),'files':rows,'directories':dirs,'capturesCurrentAvailableEvidenceOnly':True}
 with tempfile.NamedTemporaryFile(prefix='.wod-snapshot-',suffix='.zip',dir=target.parent,delete=False)as f:staging=Path(f.name)
 try:
  with zipfile.ZipFile(staging,'w',zipfile.ZIP_DEFLATED,compresslevel=3)as z:
   for r in rows:z.write(files[r['relative']],root.parent.name+'/acceptance/'+r['relative'])
   z.writestr(root.parent.name+'/.cache-source-metadata.json',json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
  kind,index=catalogue(staging,root);assert kind=='snapshot-v1';current,nowDirs=inventory(root);assert current.keys()==files.keys()and nowDirs==dirs
  for r in rows:
   p=current[r['relative']];assert statrow(p)=={k:r[k]for k in ['bytes','mode','mtimeNs']}and digest(p)==r['sha256'];v=index[r['relative']];assert all(v[k]==r[k]for k in ['bytes','sha256'])and v['indexedMode']==r['mode']and v['indexedMtimeNs']==r['mtimeNs']
  # link is exclusive: a concurrently created target is never overwritten.
  with staging.open('rb')as f:os.fsync(f.fileno())
  os.link(staging,target);sync_directory(target.parent)
 finally:staging.unlink(missing_ok=True)
 return{'passed':True,'archive':str(target),'archiveSHA256':digest(target),'archiveBytes':target.stat().st_size,'files':len(rows),'logicalBytes':sum(r['bytes']for r in rows),'images':sum(r['relative'].endswith('.png')for r in rows),'sourceCacheUnchanged':True,'allContentAndNanosecondMetadataIncluded':True}
def restore_snapshot(archive,expected_sha,target):
 archive=Path(archive).resolve()
 if digest(archive)!=expected_sha:raise ValueError('Snapshot SHA mismatch')
 with zipfile.ZipFile(archive)as z:
  names=[n for n in z.namelist()if n.endswith('/.cache-source-metadata.json')];assert len(names)==1;meta=json.loads(z.read(names[0]));root=guard(meta['root'],False)
 kind,rows=catalogue(archive,root);assert kind=='snapshot-v1'
 files=[{**rows[r['relative']],**r}for r in meta['files']];p={'format':'wod-cache-retirement','version':1,'root':str(root),'archive':str(archive),'archiveSHA256':expected_sha,'archiveKind':kind,'files':files,'directories':meta['directories'],'allArchiveCRCChecked':True}
 return extract(p,target)

def validate_plan(p):
 assert p['format']=='wod-cache-retirement'and p['version']==1;root=guard(p['root'],False);archive=Path(p['archive'])
 if archive.resolve()!=archive or archive.is_relative_to(root)or digest(archive)!=p['archiveSHA256']:raise ValueError('Archive changed')
 kind,rows=catalogue(archive,root);assert kind==p['archiveKind'];files=p['files'];assert len(files)==len({r['relative']for r in files})and{r['relative']for r in files}==set(rows)
 for r in files:
  safe(r['relative']);assert all(r[k]==v for k,v in rows[r['relative']].items());assert 0<=r['mode']<=0o7777 and isinstance(r['mtimeNs'],int)
 dirs=p['directories'];assert len(dirs)==len({d['relative']for d in dirs})and any(d['relative']==''for d in dirs)
 for d in dirs:safe(d['relative'],True);assert 0<=d['mode']<=0o7777 and isinstance(d['mtimeNs'],int)
 return root,archive

def extract(p,target,streaming=False):
 target=Path(target).absolute();assert target==target.resolve(),'Restore path uses a symlink';root,archive=validate_plan(p);expected={r['relative']:r for r in p['files']};existing={}
 if target.exists():
  if not target.is_dir():raise ValueError('Restore destination is not a directory')
  existing,_=inventory(target)
  if not existing.keys()<=expected.keys():raise ValueError('Unrelated existing restore files')
  for rel,f in existing.items():
   r=expected[rel]
   if statrow(f)!={k:r[k]for k in ['bytes','mode','mtimeNs']}or digest(f)!=r['sha256']:raise ValueError('Changed existing target; no overwrite')
 if streaming and existing:raise ValueError('Streaming proof requires empty target')
 missing=[r for r in p['files']if r['relative']not in existing];need=max([r['bytes']for r in missing]or[0])if streaming else sum(r['bytes']for r in missing);base=target
 while not base.exists():base=base.parent
 if shutil.disk_usage(base).free<need+100*1024**2:raise ValueError('Insufficient recovery space')
 for d in p['directories']:(target/d['relative']).mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(archive)as outer:
  inner=None;active=None
  try:
   for r in sorted(missing,key=lambda r:(r['container']or'',r['relative'])):
    if active!=r['container']:
     if inner:inner.close()
     active=r['container'];inner=zipfile.ZipFile(io.BytesIO(outer.read(active)))if active else None
    f=target/r['relative'];f.parent.mkdir(parents=True,exist_ok=True)
    with(inner or outer).open(r['entry'])as src,f.open('xb')as dst:shutil.copyfileobj(src,dst)
    assert f.stat().st_size==r['bytes']and digest(f)==r['sha256'];f.chmod(r['mode']);os.utime(f,ns=(r['mtimeNs'],r['mtimeNs']));assert statrow(f)=={k:r[k]for k in ['bytes','mode','mtimeNs']}
    if streaming:f.unlink()
  finally:
   if inner:inner.close()
 for d in sorted(p['directories'],key=lambda d:len(Path(d['relative']).parts),reverse=True):
  f=target/d['relative'];f.chmod(d['mode']);os.utime(f,ns=(d['mtimeNs'],d['mtimeNs']));s=f.stat();assert stat.S_IMODE(s.st_mode)==d['mode']and s.st_mtime_ns==d['mtimeNs']
 assert digest(archive)==p['archiveSHA256'];return{'passed':True,'files':len(p['files']),'bytes':sum(r['bytes']for r in p['files']),'directories':len(p['directories']),'allContentModesMtimeNsExact':True,'streaming':streaming,'originalCacheReadForRestore':False}
def prove(p):
 with tempfile.TemporaryDirectory(prefix='wod-retention-recovery-',dir='/tmp')as t:r=extract(p,t,True)
 return{**r,'planSHA256':signature(p),'archiveSHA256':p['archiveSHA256'],'allFilesPhysicallyRestoredIndividually':True,'simultaneousFullDirectoryClaimed':False}
def retire(p,proof,apply=False):
 root,archive=validate_plan(p)
 if not proof.get('passed')or proof.get('planSHA256')!=signature(p)or proof.get('archiveSHA256')!=p['archiveSHA256']or not proof.get('allFilesPhysicallyRestoredIndividually')or proof.get('files')!=len(p['files']):raise ValueError('A matching full physical recovery proof is required')
 root=guard(root);actual,dirs=inventory(root);expected={r['relative']:r for r in p['files']}
 if actual.keys()!=expected.keys()or dirs!=p['directories']:raise ValueError('Cache topology or directory metadata changed; no retirement')
 for rel,f in actual.items():
  r=expected[rel]
  if statrow(f)!={k:r[k]for k in ['bytes','mode','mtimeNs']}or digest(f)!=r['sha256']:raise ValueError('Cache changed; no retirement')
 result={'passed':True,'dryRun':not apply,'files':len(actual),'logicalBytes':sum(r['bytes']for r in p['files']),'archive':str(archive),'archiveSHA256':p['archiveSHA256'],'planSHA256':signature(p),'uniqueEvidenceRemoved':False,'allPhysicalRecoveryAndPreflightPassed':True}
 if apply:
  with archive.open('rb')as f:os.fsync(f.fileno())
  for f in actual.values():f.unlink()
  for d in sorted(p['directories'],key=lambda d:len(Path(d['relative']).parts),reverse=True):(root/d['relative']).rmdir()
 return result
if __name__=='__main__':
 parser=argparse.ArgumentParser();sub=parser.add_subparsers(dest='action',required=True);q=sub.add_parser('plan');q.add_argument('archive');q.add_argument('root');q.add_argument('--expected-sha',required=True);q.add_argument('--out',required=True)
 for name in ['prove','restore','retire']:
  q=sub.add_parser(name);q.add_argument('plan');q.add_argument('--out'if name=='prove'else'--target'if name=='restore'else'--proof',required=True)
  if name=='retire':q.add_argument('--apply',action='store_true');q.add_argument('--receipt')
 q=sub.add_parser('snapshot');q.add_argument('root');q.add_argument('target');q=sub.add_parser('restore-snapshot');q.add_argument('archive');q.add_argument('--expected-sha',required=True);q.add_argument('--target',required=True)
 a=parser.parse_args()
 if a.action=='snapshot':r=snapshot(a.root,a.target)
 elif a.action=='restore-snapshot':r=restore_snapshot(a.archive,a.expected_sha,a.target)
 elif a.action=='plan':p=audit(a.archive,a.root,a.expected_sha);newjson(a.out,p,Path(p['root']));r={'passed':True,'plan':a.out,'files':len(p['files']),'logicalBytes':sum(x['bytes']for x in p['files'])}
 else:
  p=json.loads(Path(a.plan).read_text());root=guard(p['root'],False)
  if a.action=='prove':r=prove(p);newjson(a.out,r,root)
  elif a.action=='restore':r=extract(p,a.target)
  else:
   receipt=Path(a.receipt or str(a.plan)+'.retired.json').absolute();pointer=root.parent/('ACCEPTANCE_RETIRED_'+signature(p)[:12]+'.json')
   if a.apply and(receipt.exists()or receipt.is_relative_to(root)or receipt!=receipt.resolve()or pointer.exists()):raise ValueError('Retirement metadata must be new and outside cache')
   before={b:shutil.disk_usage(b).free for b in ['/workspace','/tmp']};r=retire(p,json.loads(Path(a.proof).read_text()),a.apply)
   if a.apply:
    r.update({'beforeFreeBytes':before,'afterFreeBytes':{b:shutil.disk_usage(b).free for b in before},'plan':str(Path(a.plan).resolve()),'proof':str(Path(a.proof).resolve()),'restoreCommand':['python3',str(Path(__file__).resolve()),'restore',str(Path(a.plan).resolve()),'--target',str(root)]});newjson(receipt,r,root);newjson(pointer,r,root)
 print(json.dumps(r,ensure_ascii=False))
