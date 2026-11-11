"""Recover recorded file bindings into a fresh tree; never write an original namespace.

Records without original mode/time retain that uncertainty. This format does not claim
original directory metadata, a transaction lock, or completeness outside its entries.
"""
from pathlib import Path,PurePosixPath
import hashlib,json,os,shutil,stat,subprocess,zipfile,uuid
INDEX='FILE_BINDINGS.json';FORMAT='wod-recorded-file-bindings';MAX_FILES=20000;MAX_BYTES=4*1024**3
def sha(p):
 with Path(p).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def origin(value):
 if not isinstance(value,str) or '\\'in value or '\0'in value:raise ValueError('Invalid original path')
 p=PurePosixPath(value)
 if not p.is_absolute() or value.startswith('//') or p.as_posix()!=value or '..'in p.parts or len(p.parts)<3:raise ValueError('Canonical absolute original file path required')
 return value
def fresh(p):
 p=Path(p).absolute()
 if p!=p.resolve() or not p.parent.is_dir() or p.exists() or p.is_symlink():raise ValueError('Fresh real destination required')
 return p
def record(p):
 p=Path(p);s=p.lstat()
 if not stat.S_ISREG(s.st_mode) or p!=p.resolve():raise ValueError('Real regular dependency required')
 return dict(path=str(p),bytes=s.st_size,sha256=sha(p),mode=stat.S_IMODE(s.st_mode),mtimeNs=s.st_mtime_ns)
def checked(r):
 a=record(r['path'])
 if any(a[k]!=r[k] for k in ['bytes','sha256','mode','mtimeNs'] if k in r):raise ValueError('Dependency differs')
 return Path(r['path'])
def validate(index):
 if index.get('format')!=FORMAT or index.get('version')!=1 or not 0<len(index['entries'])<=MAX_FILES:raise ValueError('Unsupported file map')
 seen=set();used=set()
 for r in index['entries']:
  p=origin(r['path']);h=r['sha256']
  if p in seen or set(r)-{'path','bytes','sha256','mode','mtimeNs'} or not isinstance(h,str) or len(h)!=64 or any(c not in '0123456789abcdef' for c in h):raise ValueError('Invalid or duplicate binding')
  seen.add(p);used.add(h);obj=index['objects'][h]
  if set(obj)-{'bytes','external'} or type(obj['bytes'])is not int or not 0<=obj['bytes']<=MAX_BYTES or ('bytes'in r and (type(r['bytes'])is not int or r['bytes']!=obj['bytes'])):raise ValueError('Object size mismatch')
  if 'mode'in r and (type(r['mode'])is not int or not 0<=r['mode']<=0o777):raise ValueError('Invalid mode')
  if 'mtimeNs'in r and (type(r['mtimeNs'])is not int or r['mtimeNs']<0):raise ValueError('Invalid timestamp')
 if used!=set(index['objects']) or sum(o['bytes'] for o in index['objects'].values())>MAX_BYTES:raise ValueError('Unexpected or oversized objects')
 return index
def inspect(archive,expected_sha):
 archive=Path(archive)
 if archive.is_symlink() or sha(archive)!=expected_sha:raise ValueError('Archive digest differs')
 with zipfile.ZipFile(archive) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or z.getinfo(INDEX).file_size>32*1024**2:raise ValueError('Duplicate entries or oversized index')
  index=validate(json.loads(z.read(INDEX)));expected={INDEX}
  for h,o in index['objects'].items():
   if 'external'in o:
    p=checked(o['external'])
    if p.stat().st_size!=o['bytes'] or o['external']['sha256']!=h:raise ValueError('External object differs')
   else:
    n='objects/'+h;expected.add(n);i=z.getinfo(n)
    if i.flag_bits&1 or i.file_size!=o['bytes'] or stat.S_IFMT(i.external_attr>>16)!=stat.S_IFREG:raise ValueError('Invalid object member')
    with z.open(n) as f:
     if hashlib.file_digest(f,'sha256').hexdigest()!=h:raise ValueError('Object digest differs')
  if set(names)!=expected:raise ValueError('Unexpected archive entries')
 return index
def pack(entries,sources,destination,external=None):
 destination=fresh(destination);external=external or {};objects={}
 for r in entries:
  h=r['sha256']
  if h in objects:continue
  p=checked(sources[h]);s=record(p)
  if s['sha256']!=h:raise ValueError('Source digest differs')
  objects[h]=dict(bytes=s['bytes'],**({'external':record(checked(external[h]))} if h in external else {}))
 index=validate(dict(format=FORMAT,version=1,entries=entries,objects=objects,originalDirectoryMetadataClaimed=False))
 if any(destination==Path(r['path']) or destination.is_relative_to(Path(r['path'])) for r in entries):raise ValueError('Destination overlaps original file')
 candidate=destination.parent/(destination.name+'.pending-'+uuid.uuid4().hex)
 with zipfile.ZipFile(candidate,'x',zipfile.ZIP_DEFLATED,compresslevel=3) as z:
  for h,o in objects.items():
   if 'external'in o:continue
   p=checked(sources[h]);info=zipfile.ZipInfo('objects/'+h,date_time=(2000,1,1,0,0,0));info.create_system=3;info.external_attr=0o100600<<16;info.compress_type=zipfile.ZIP_DEFLATED
   with p.open('rb') as a,z.open(info,'w') as b:shutil.copyfileobj(a,b)
   checked(sources[h])
  z.writestr(INDEX,json.dumps(index,ensure_ascii=False,separators=(',',':'))+'\n')
 with candidate.open('rb') as f:os.fsync(f.fileno())
 candidateRecord=record(candidate);inspect(candidate,candidateRecord['sha256']);os.link(candidate,destination);candidate.unlink()
 fd=os.open(destination.parent,os.O_RDONLY|os.O_DIRECTORY);os.fsync(fd);os.close(fd)
 result=record(destination);inspect(destination,result['sha256']);return result
def verify_tree(target,index):
 target=Path(target);wanted={r['path'].lstrip('/') for r in index['entries']};actual={p.relative_to(target).as_posix() for p in target.rglob('*') if p.is_file()}
 if actual!=wanted or any(p.is_symlink() for p in target.rglob('*')):raise ValueError('Restored file set differs')
 for r in index['entries']:
  a=record(target/r['path'].lstrip('/'))
  if any(a[k]!=r[k] for k in ['bytes','sha256','mode','mtimeNs'] if k in r):raise ValueError('Restored recorded field differs')
 return dict(passed=True,files=len(wanted),allRecordedFileFieldsExact=True,metadataOriginallyUnrecorded=sum('mode'not in r or 'mtimeNs'not in r for r in index['entries']),originalDirectoryMetadataClaimed=False)
def restore(archive,expected_sha,target,decoder='primary'):
 index=inspect(archive,expected_sha);target=fresh(target)
 if any(target==Path(r['path']) or target.is_relative_to(Path(r['path'])) or Path(r['path']).is_relative_to(target) for r in index['entries']):raise ValueError('Original namespace is forbidden')
 if decoder not in ['primary','independent-native']:raise ValueError('Unknown decoder')
 cache=target.parent/(target.name+'-objects')
 if cache.exists():raise ValueError('Fresh native cache required')
 target.mkdir()
 if decoder=='independent-native':
  cache.mkdir();members=['objects/'+h for h,o in index['objects'].items() if 'external'not in o]
  if members:subprocess.run(['unzip','-qq',str(archive),*members,'-d',str(cache)],check=True,capture_output=True)
 with zipfile.ZipFile(archive) as z:
  for r in index['entries']:
   h=r['sha256'];o=index['objects'][h];p=target/r['path'].lstrip('/');p.parent.mkdir(parents=True,exist_ok=True)
   src=checked(o['external']) if 'external'in o else cache/'objects'/h if decoder=='independent-native' else None
   if src is not None:
    with src.open('rb') as a,p.open('xb') as b:shutil.copyfileobj(a,b);b.flush();os.fsync(b.fileno())
   else:
    with z.open('objects/'+h) as a,p.open('xb') as b:shutil.copyfileobj(a,b);b.flush();os.fsync(b.fileno())
   if 'mode'in r:p.chmod(r['mode'])
   if 'mtimeNs'in r:os.utime(p,ns=(r['mtimeNs'],r['mtimeNs']))
 result=verify_tree(target,index);result['decoder']=decoder;return result
def catalog_bindings(path,expected_sha):
 if sha(path)!=expected_sha:raise ValueError('Catalog digest differs')
 c=json.loads(Path(path).read_text())
 if c.get('format')!='wod-file-binding-catalog' or c.get('version')!=1:raise ValueError('Unsupported catalog')
 decoders=set()
 for r in c['proofs']:
  p=checked(r);proof=json.loads(p.read_text())
  if not proof.get('passed') or not proof.get('allRecordedFileFieldsExact') or proof.get('archiveSHA256')!=c['archive']['sha256']:raise ValueError('Incomplete cold proof')
  decoders.add(proof.get('decoder'))
 if decoders!={'primary','independent-native'}:raise ValueError('Independent cold proofs required')
 archive=checked(c['archive']);index=inspect(archive,c['archive']['sha256'])
 if any(json.loads(Path(r['path']).read_text()).get('files')!=len(index['entries']) for r in c['proofs']):raise ValueError('Cold proof scope differs')
 return {r['path']:{**r,'bytes':index['objects'][r['sha256']]['bytes']} for r in index['entries']}
