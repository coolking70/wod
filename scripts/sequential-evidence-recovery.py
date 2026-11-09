"""Bounded, quiescent acceptance recovery with two independent physical proofs.
Keeps the master and all original checkpoint ZIPs. Retires only a fully bound
acceptance duplicate after two all-file physical proofs, then restores the whole
raw root. No cross-process lock; interrupted runs have an explicit recovery plan.
"""
from pathlib import Path,PurePosixPath
import argparse,hashlib,importlib.util,io,json,os,shutil,stat,tempfile,zipfile,sys
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent

def module(name,file):
 spec=importlib.util.spec_from_file_location(name,HERE/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
stage=module('stage_recovery','archive-stage-evidence.py');retention=module('acceptance_recovery','retire-archived-evidence.py')
MIN_RESERVE=100*1024**2

def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def safe(s):
 p=PurePosixPath(s)
 if not s or p.is_absolute()or any(x in ['','..','.','.git']for x in s.split('/'))or'\\'in s:raise ValueError('Unsafe evidence path')
 return s
def metadata(p):
 s=Path(p).lstat()
 if not stat.S_ISREG(s.st_mode):raise ValueError('Regular evidence file required')
 return {'bytes':s.st_size,'mode':stat.S_IMODE(s.st_mode),'mtimeNs':s.st_mtime_ns}
def write(path,value):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
 with path.open('x')as f:f.write(json.dumps(value,ensure_ascii=False,indent=2)+'\n');f.flush();os.fsync(f.fileno())
 retention.sync_directory(path.parent)
def protect(rows,cache):
 for r in rows:
  p=Path(r['path']);assert p==p.resolve()and not p.is_relative_to(cache),'Protected data inside acceptance; refuse retirement';assert sha(p)==r['sha256'],str(p)
def checkpoint_sources(index):
 rows=[]
 for c in index['containers']:
  for s in c['sources']:
   p=Path(s['path']);assert s['root']=='checkpoints'and p==p.resolve()and p.is_relative_to(Path(index['roots']['checkpoints']));assert metadata(p)=={'bytes':c['bytes'],'mode':s['mode'],'mtimeNs':s['mtimeNs']}and sha(p)==c['sha256'],'Original checkpoint changed';rows.append({'path':str(p),'sha256':c['sha256'],**metadata(p)})
 assert rows;return rows

def indexed_rows(index,label):
 rows={};original=Path(index['roots'][label]);assert original==original.resolve()
 for r in [*index['objects'],*index['containers']]:
  for src in r['sources']:
   if src['root']!=label:continue
   p=Path(src['path']);assert p==p.resolve()and p.is_relative_to(original);rel=safe(p.relative_to(original).as_posix());assert rel not in rows;assert 0<=src['mode']<=0o7777 and isinstance(src['mtimeNs'],int);rows[rel]={'bytes':r['bytes'],'sha256':r['sha256'],'mode':src['mode'],'mtimeNs':src['mtimeNs']}
 assert rows;return rows

def verify_indexed_root(target,label,index):
 target=Path(target);expected=indexed_rows(index,label);actual={p.relative_to(target).as_posix():p for p in target.rglob('*')if p.is_file()};assert set(actual)==set(expected)and not any(p.is_symlink()for p in target.rglob('*'))
 for rel,r in expected.items():assert metadata(actual[rel])=={k:r[k]for k in ['bytes','mode','mtimeNs']}and sha(actual[rel])==r['sha256']
 return {'passed':True,'files':len(actual),'allContentModesAndFileNsIndependentlyReadBack':True,'directoryNsNotIndexedForThisRoot':True}

def independent_catalogue(archive,plan,include_raw_metadata=False):
 """Separate index/ZIP traversal; no retention catalogue/extract/prove calls."""
 cache=Path(plan['root']);rows={};extra={};containers={}
 with zipfile.ZipFile(archive)as z:
  names=z.namelist();assert len(names)==len(set(names))and z.testzip()is None;ix=[n for n in names if n.endswith('/.stage-evidence-index.json')];assert len(ix)==1;x=json.loads(z.read(ix[0]));assert x['format']=='wod-checkpoint-stage'and x['version']==1 and x['prefix']==cache.parent.name and Path(x['roots']['raw'])==cache.parent
  for c in x['containers']:
   assert c['bytes']<=128*1024**2;safe(c['entry']);data=z.read(c['entry']);assert len(data)==c['bytes']and hashlib.sha256(data).hexdigest()==c['sha256'];containers[c['entry']]=c
   with zipfile.ZipFile(io.BytesIO(data))as inner:assert inner.testzip()is None
  for o in x['objects']:
   for s in o['sources']:
    if s['root']!='raw':continue
    p=Path(s['path']);assert p==p.resolve()and p.is_relative_to(cache.parent),'Raw evidence outside indexed root'
    if not p.is_relative_to(cache):
     assert include_raw_metadata,'Raw evidence outside acceptance; sequential workflow cannot claim full raw coverage';rel=safe(p.relative_to(cache.parent).as_posix());assert rel not in extra;extra[rel]={'relative':rel,'container':o['container'],'entry':safe(o['entry']),'bytes':o['bytes'],'sha256':o['sha256'],'mode':s['mode'],'mtimeNs':s['mtimeNs']};continue
    rel=safe(p.relative_to(cache).as_posix());assert rel not in rows;rows[rel]={'relative':rel,'container':o['container'],'entry':safe(o['entry']),'bytes':o['bytes'],'sha256':o['sha256'],'mode':s['mode'],'mtimeNs':s['mtimeNs']}
 assert set(rows)=={r['relative']for r in plan['files']}
 for r in plan['files']:assert all(r[k]==v for k,v in rows[r['relative']].items()),'Plan/index omission or metadata mismatch'
 return {**{('acceptance/'+k):{**r,'relative':'acceptance/'+k}for k,r in rows.items()},**extra}if include_raw_metadata else rows

def independent_physical_proof(archive,plan,scratch,hook=lambda phase:None,include_raw_metadata=False):
 assert sha(archive)==plan['archiveSHA256'];rows=independent_catalogue(archive,plan,include_raw_metadata);done=[]
 with tempfile.TemporaryDirectory(prefix='wod-independent-physical-',dir=scratch)as tmp,zipfile.ZipFile(archive)as outer:
  root=Path(tmp)/('raw'if include_raw_metadata else'acceptance');root.mkdir();inner=None;active=None
  try:
   for r in sorted(rows.values(),key=lambda r:(r['container']or'',r['relative'])):
    if r['container']!=active:
     if inner:inner.close()
     active=r['container'];inner=zipfile.ZipFile(io.BytesIO(outer.read(active)))if active else None
    p=root/r['relative'];p.parent.mkdir(parents=True,exist_ok=True)
    with(inner or outer).open(r['entry'])as src,p.open('xb')as dest:shutil.copyfileobj(src,dest,1048576);dest.flush();os.fsync(dest.fileno())
    p.chmod(r['mode']);os.utime(p,ns=(r['mtimeNs'],r['mtimeNs']));assert metadata(p)=={k:r[k]for k in ['bytes','mode','mtimeNs']}and sha(p)==r['sha256'];hook('independent-file-physically-restored');done.append(r['relative']);p.unlink()
   for d in sorted(plan['directories'],key=lambda d:len(Path(d['relative']).parts),reverse=True):
    p=(root/'acceptance'if include_raw_metadata else root)/d['relative'];p.mkdir(parents=True,exist_ok=True);p.chmod(d['mode']);os.utime(p,ns=(d['mtimeNs'],d['mtimeNs']));s=p.stat();assert stat.S_IMODE(s.st_mode)==d['mode']and s.st_mtime_ns==d['mtimeNs']
  finally:
   if inner:inner.close()
 assert set(done)==set(rows)and sha(archive)==plan['archiveSHA256'];return {'passed':True,'independentImplementation':True,'files':len(done),'bytes':sum(r['bytes']for r in rows.values()),'directories':len(plan['directories']),'planSHA256':retention.signature(plan),'archiveSHA256':plan['archiveSHA256'],'allFilesPhysicallyRestoredIndividually':True,'allContentModesMtimeNsExact':True,'simultaneousFullDirectoryClaimed':False,'originalCacheReadForData':False}

def verify_whole_raw(target,plan,raw_metadata):
 root=Path(target)/'acceptance';actual={};dirs={}
 for p in [root,*sorted(root.rglob('*'))]:
  assert not p.is_symlink()
  if p.is_file():actual[p.relative_to(root).as_posix()]=p
  elif p.is_dir():dirs[''if p==root else p.relative_to(root).as_posix()]={'mode':stat.S_IMODE(p.stat().st_mode),'mtimeNs':p.stat().st_mtime_ns}
  else:raise ValueError('Unsupported restored node')
 assert set(actual)=={r['relative']for r in plan['files']}
 for r in plan['files']:assert metadata(actual[r['relative']])=={k:r[k]for k in ['bytes','mode','mtimeNs']}and sha(actual[r['relative']])==r['sha256']
 assert dirs=={d['relative']:{k:d[k]for k in ['mode','mtimeNs']}for d in plan['directories']};s=Path(target).stat();assert stat.S_IMODE(s.st_mode)==raw_metadata['mode']and s.st_mtime_ns==raw_metadata['mtimeNs'];return {'passed':True,'files':len(actual),'directories':len(dirs),'wholeRootSimultaneouslyPresentAndIndependentlyReadBack':True,'allContentModesAndFileDirectoryNsExact':True}

def raw_directories(root):
 rows=[]
 for p in [Path(root),*sorted(Path(root).rglob('*'))]:
  assert not p.is_symlink(),'Symlink in raw evidence'
  if p.is_dir():s=p.stat();rows.append({'relative':p.relative_to(root).as_posix(),'mode':stat.S_IMODE(s.st_mode),'mtimeNs':s.st_mtime_ns})
 return rows

def extra_raw_rows(index,cache):
 return {k:r for k,r in indexed_rows(index,'raw').items()if not(Path(index['roots']['raw'])/k).is_relative_to(cache)}

def verify_extra_sources(index,cache,rows):
 root=Path(index['roots']['raw']);actual={}
 for p in root.rglob('*'):
  assert not p.is_symlink(),'Symlink in raw evidence'
  if p.is_file()and not p.is_relative_to(cache):actual[p.relative_to(root).as_posix()]=p
 assert set(actual)==set(rows),'Unindexed or missing raw metadata; originals retained'
 for rel,r in rows.items():assert metadata(actual[rel])=={k:r[k]for k in ['bytes','mode','mtimeNs']}and sha(actual[rel])==r['sha256'],'Raw metadata changed'

def prove_extra_raw(archive,index,cache,scratch):
 # Primary proof complements retention.prove, which intentionally covers acceptance only.
 rows=extra_raw_rows(index,cache);done=[]
 with tempfile.TemporaryDirectory(prefix='wod-primary-extra-raw-',dir=scratch)as tmp,zipfile.ZipFile(archive)as outer:
  for rel,r in rows.items():
   source=next(o for o in index['objects']if any(s['root']=='raw'and Path(s['path'])==cache.parent/rel for s in o['sources']));assert source['container']is None,'Extra raw container requires explicit supported extraction';p=Path(tmp)/rel;p.parent.mkdir(parents=True,exist_ok=True)
   with outer.open(source['entry'])as a,p.open('xb')as b:shutil.copyfileobj(a,b);b.flush();os.fsync(b.fileno())
   p.chmod(r['mode']);os.utime(p,ns=(r['mtimeNs'],r['mtimeNs']));assert metadata(p)=={k:r[k]for k in ['bytes','mode','mtimeNs']}and sha(p)==r['sha256'];done.append(rel);p.unlink()
 return {'passed':True,'files':len(done),'bytes':sum(r['bytes']for r in rows.values()),'allExtraRawFilesPhysicallyRestoredIndividually':True,'originalSourceNotReadForDecode':True,'rows':rows}

def verify_whole_raw_with_metadata(target,plan,raw_meta,index,directories):
 for d in sorted(directories,key=lambda d:len(Path(d['relative']).parts),reverse=True):
  p=Path(target)/d['relative'];p.mkdir(parents=True,exist_ok=True);p.chmod(d['mode']);os.utime(p,ns=(d['mtimeNs'],d['mtimeNs']))
 full=verify_indexed_root(target,'raw',index);assert raw_directories(target)==directories
 acceptance=verify_whole_raw(target,plan,raw_meta)
 return {**acceptance,'files':full['files'],'directories':len(directories),'allRootMetadataFilesIncluded':True,'independentFullIndexedReadback':full}

def capacity(raw_bytes,checkpoint_bytes,evidence_bytes,largest_file,reserve=1024**3):
 assert reserve>=MIN_RESERVE and all(isinstance(n,int)and n>=0 for n in [raw_bytes,checkpoint_bytes,evidence_bytes,largest_file]);return {'tmpRequired':raw_bytes+max(checkpoint_bytes,evidence_bytes,largest_file)+reserve,'oldTwoRawCopiesRequired':2*raw_bytes+reserve,'reserve':reserve,'allOriginalCPAndMasterRemainUntilWholeRootProof':True}

def remaining_capacity(cache,scratch,plan,budget):
 same_volume=Path(cache).stat().st_dev==Path(scratch).stat().st_dev;files=[Path(cache)/r['relative']for r in plan['files']];allocated=sum(p.stat().st_blocks*512 for p in files);raw_bytes=sum(r['bytes']for r in plan['files']);credit=raw_bytes if same_volume and allocated>=raw_bytes and all(p.stat().st_nlink==1 for p in files)else 0
 # Planning peak includes the raw tree; at runtime that tree already occupies
 # this volume. Never credit sparse/shared files or a different filesystem.
 needed=max(budget['tmpRequired']-raw_bytes-budget['reserve'],raw_bytes-credit)+budget['reserve'];return {**budget,'sameFilesystem':same_volume,'alreadyAllocatedExclusiveRawCredit':credit,'allocatedRawBytes':allocated,'additionalRequiredNow':needed}

def pointer_path(cache,plan,output):return Path(cache).parent/('ACCEPTANCE_RETIRED_'+retention.signature(plan)[:12]+'_'+hashlib.sha256(str(Path(output).absolute()).encode()).hexdigest()[:8]+'.json')

def run(archive,expected_sha,cache,output,protected=(),scratch='/tmp',reserve=1024**3,_hook=lambda phase:None,include_raw_metadata=False):
 archive=Path(archive).absolute();cache=retention.guard(cache);output=Path(output).absolute();scratch=Path(scratch).absolute();assert archive==archive.resolve()and output==output.resolve()and scratch==scratch.resolve()and not output.exists()and not output.is_relative_to(cache)and not archive.is_relative_to(cache)and not scratch.is_relative_to(cache);assert sha(archive)==expected_sha
 protect(protected,cache);stage.verify(archive,True)
 with zipfile.ZipFile(archive)as z:index=stage.read_index(z)
 checkpoints=checkpoint_sources(index);assert set(Path(index['roots']['checkpoints']).glob('*.zip'))=={Path(r['path'])for r in checkpoints};indexed_rows(index,'evidence');indexed_rows(index,'checkpoints');plan=retention.audit(archive,cache,expected_sha);independent_catalogue(archive,plan,include_raw_metadata);extras=extra_raw_rows(index,cache)if include_raw_metadata else{};directory_rows=raw_directories(cache.parent)if include_raw_metadata else None;verify_extra_sources(index,cache,extras)if include_raw_metadata else None;evidence_bytes=sum(o['bytes']for o in index['objects']for s in o['sources']if s['root']=='evidence');raw_bytes=sum(r['bytes']for r in indexed_rows(index,'raw').values())if include_raw_metadata else sum(r['bytes']for r in plan['files']);cp_bytes=sum(c['bytes']for c in checkpoints);largest=max(r['bytes']for r in indexed_rows(index,'raw').values())if include_raw_metadata else max(r['bytes']for r in plan['files']);budget=remaining_capacity(cache,scratch,plan,capacity(raw_bytes,cp_bytes,evidence_bytes,largest,reserve));assert shutil.disk_usage(scratch).free>budget['additionalRequiredNow'],'Insufficient sequential recovery capacity including reserve';raw_stat=cache.parent.stat();raw_meta={'mode':stat.S_IMODE(raw_stat.st_mode),'mtimeNs':raw_stat.st_mtime_ns};pointer=pointer_path(cache,plan,output);assert not pointer.exists(),'Retirement pointer already exists; refuse before mutation';output.mkdir();write(output/'PLAN.json',plan);write(output/'BINDING.json',{'archive':str(archive),'archiveSHA256':expected_sha,'cache':str(cache),'retirementPointer':str(pointer),'rawRootMetadata':raw_meta,'originalCheckpoints':checkpoints,'protectedFiles':list(protected),'capacity':budget,'quiescentNotCrossProcessLock':True,'includeRawMetadata':include_raw_metadata,'allRawDirectoryMetadata':directory_rows,'extraRawRows':extras});events=[]
 def event(name):events.append(name);write(output/(str(len(events)).zfill(2)+'-'+name+'.json'),{'event':name,'archiveSHA256':expected_sha,'planSHA256':retention.signature(plan)});_hook(name)
 event('bound')
 first=retention.prove(plan);extra_proof=prove_extra_raw(archive,index,cache,scratch)if include_raw_metadata else{'passed':True,'files':0};write(output/'EXTRA_RAW_PROOF.json',extra_proof);write(output/'STREAM_PROOF.json',first);event('first-all-file-physical-proof')
 second=independent_physical_proof(archive,plan,scratch,_hook,include_raw_metadata=include_raw_metadata);write(output/'INDEPENDENT_PROOF.json',second);assert first['passed']and second['passed']and second['independentImplementation']and first['allFilesPhysicallyRestoredIndividually']and second['allFilesPhysicallyRestoredIndividually'];assert first['files']+extra_proof['files']==second['files']==len(plan['files'])+len(extras)and first['planSHA256']==second['planSHA256']==retention.signature(plan);event('second-independent-all-file-physical-proof')
 restores={}
 for root in ['checkpoints','evidence']:
  with tempfile.TemporaryDirectory(prefix='wod-sequential-'+root+'-',dir=scratch)as t:restores[root]=stage.restore(archive,root,t);assert restores[root]['passed'];restores[root]['independentReadback']=verify_indexed_root(t,root,index)
  event(root+'-whole-root-restored')
 protect(protected,cache);assert sha(archive)==expected_sha;assert checkpoint_sources(index)==checkpoints;assert retention.retire(plan,first,False)['dryRun'];event('before-raw-duplicate-retirement');protect(protected,cache);assert sha(archive)==expected_sha;assert checkpoint_sources(index)==checkpoints
 if include_raw_metadata:
  verify_extra_sources(index,cache,extras);assert raw_directories(cache.parent)==directory_rows,'Raw directory metadata changed before retirement'
 retired=retention.retire(plan,first,True);write(output/'RAW_RETIREMENT.json',retired);write(pointer,{'passed':True,'archive':str(archive),'archiveSHA256':expected_sha,'plan':str(output/'PLAN.json'),'planSHA256':retention.signature(plan),'twoIndependentAllFilePhysicalProofsBeforeRetirement':True,'allOriginalCheckpointsKept':True,'restoreCommand':['python3',str(HERE/'retire-archived-evidence.py'),'restore',str(output/'PLAN.json'),'--target',str(cache)]});event('raw-duplicates-retired-with-master-and-original-CP-kept')
 assert shutil.disk_usage(scratch).free>raw_bytes+reserve,'Space changed after duplicate retirement; original master and every checkpoint remain; recover using PLAN when capacity is available'
 with tempfile.TemporaryDirectory(prefix='wod-sequential-whole-raw-',dir=scratch)as tmp:
  target=Path(tmp)/'raw';target.mkdir()
  if include_raw_metadata:
   restores['raw']=stage.restore(archive,'raw',target);whole=verify_whole_raw_with_metadata(target,plan,raw_meta,index,directory_rows)
  else:
   restores['raw']=retention.extract(plan,target/'acceptance');target.chmod(raw_meta['mode']);os.utime(target,ns=(raw_meta['mtimeNs'],raw_meta['mtimeNs']));whole=verify_whole_raw(target,plan,raw_meta)
  _hook('whole-raw-simultaneously-present')
 event('whole-raw-restored-and-independently-verified');protect(protected,cache);assert sha(archive)==expected_sha and checkpoint_sources(index)==checkpoints;assert not cache.exists();result={'passed':True,'archive':str(archive),'archiveSHA256':expected_sha,'plan':str(output/'PLAN.json'),'planSHA256':retention.signature(plan),'proofOrder':events,'planFileSHA256':sha(output/'PLAN.json'),'proofImplementations':{'first':{'source':str(HERE/'retire-archived-evidence.py'),'sha256':sha(HERE/'retire-archived-evidence.py')},'independent':{'source':str(Path(__file__).resolve()),'sha256':sha(__file__),'separateCatalogueExtractionAndPhysicalReadback':True}},'twoIndependentAllFilePhysicalProofsBeforeRawRetirement':True,'allThreeRootsPhysicallyRestored':True,'wholeRawRestoredAfterRawDuplicateRetirement':True,'rawCoverageScope':'All original master-indexed raw bytes including opted-in top-level metadata, all indexed file modes/ns and recorded raw directories; late retirement pointers are preserved separately.','includeRawMetadata':include_raw_metadata,'extraRawPhysicalProof':extra_proof,'threeWholeRootsBeforeAnyDuplicateRetirement':False,'originalMasterAndEveryCheckpointStillExactAndRetained':True,'restores':restores,'independentWholeRawReadback':whole,'allOriginalFileBytesModesNsAndRawDirectoryMetadataVerified':True,'rawPointer':str(pointer),'rawRetirement':retired,'protectedFiles':len(protected),'capacity':budget,'quiescentNotCrossProcessLock':True};write(output/'RESULT.json',result);return result

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('archive');p.add_argument('cache');p.add_argument('output');p.add_argument('--expected-sha',required=True);p.add_argument('--protected-manifest',required=True);p.add_argument('--scratch',default='/tmp');p.add_argument('--include-raw-metadata',action='store_true');a=p.parse_args();protected=json.loads(Path(a.protected_manifest).read_text())['protectedFiles'];print(json.dumps(run(a.archive,a.expected_sha,a.cache,a.output,protected,a.scratch,include_raw_metadata=a.include_raw_metadata),ensure_ascii=False))
