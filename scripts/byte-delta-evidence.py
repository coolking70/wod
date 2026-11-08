"""Lossless developer-evidence wrapper. Recreates the ORIGINAL ZIP bytes, not a new ZIP.
Inputs are explicit immutable master files. Existing destinations are never overwritten.
Uses Git binary patches only for a single fixed scratch filename; no shell invocation.
"""
from pathlib import Path,PurePosixPath
import argparse,hashlib,io,json,os,re,shutil,stat,struct,subprocess,tempfile,zipfile
FORMAT='wod-byte-delta-evidence';VERSION=1;INDEX='DELTA_INDEX.json';MAX_CP=128*1024**2;MAX_LITERAL=128*1024**2;MAX_INDEX=8*1024**2

def digest(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1024**2),b''):h.update(b)
 return h.hexdigest()
def datahash(data):return hashlib.sha256(data).hexdigest()
def require(ok,message):
 if not ok:raise ValueError(message)
def integer(v):return type(v)is int

def regular(p):
 p=Path(p);require(p.is_file()and not p.is_symlink(),'Expected regular input file');return p

def fresh_target(p):
 p=Path(p).absolute();require(p.parent.is_dir()and p.parent.resolve()==p.parent,'Explicit existing real destination directory required')
 if p.exists()or p.is_symlink():raise FileExistsError('Existing destination is preserved')
 return p

def stage_index(z):
 names=z.namelist();require(len(names)==len(set(names)),'Duplicate source ZIP entries');matches=[n for n in names if n.endswith('/.stage-evidence-index.json')];require(len(matches)==1,'Expected original checkpoint-stage master');require(z.getinfo(matches[0]).file_size<=16*1024**2,'Oversize stage index');x=json.loads(z.read(matches[0]));require(x['format']=='wod-checkpoint-stage'and x['version']==1,'Unsupported original stage format');return x

def version_key(name):
 m=re.fullmatch(r'browser-v(\d+)(?:-[a-z0-9-]+)?\.zip',Path(name).name);return int(m[1])if m else None

def patch_valid(data):
 require(len(data)<=MAX_CP,'Oversize binary patch');lines=data.splitlines();require(len(lines)>4,'Incomplete binary patch');require(lines[0]==b'diff --git a/checkpoint.zip b/checkpoint.zip','Unsafe patch path');require(re.fullmatch(rb'index [0-9a-f]{40}\.\.[0-9a-f]{40} 100644',lines[1])is not None,'Unsupported patch index/mode');require(lines[2]==b'GIT binary patch','Expected Git binary data');i=3;blocks=0
 while i<len(lines):
  if not lines[i]:i+=1;continue
  require(re.fullmatch(rb'(?:literal|delta) [0-9]+',lines[i])is not None,'Unexpected patch instruction');i+=1;count=0
  while i<len(lines)and lines[i]:
   line=lines[i];require(6<=len(line)<=66 and (65<=line[0]<=90 or 97<=line[0]<=122)and all(33<=b<=126 for b in line),'Invalid binary encoding line');count+=1;i+=1
  require(count>0,'Empty binary block');blocks+=1
 require(1<=blocks<=2,'Unexpected binary block count');return True

def git_patch(before,after,scratch):
 with tempfile.TemporaryDirectory(prefix='wod-byte-diff-',dir=scratch)as tmp:
  t=Path(tmp);(t/'old.zip').write_bytes(before);(t/'new.zip').write_bytes(after);p=subprocess.run(['git','-c','gc.auto=0','-c','maintenance.auto=false','diff','--no-index','--no-ext-diff','--no-textconv','--binary','--','old.zip','new.zip'],cwd=t,capture_output=True);require(p.returncode==1,'Binary diff failed');data=p.stdout.replace(b'diff --git a/old.zip b/new.zip',b'diff --git a/checkpoint.zip b/checkpoint.zip',1);patch_valid(data);return data

def apply_patch(before,patch,scratch):
 patch_valid(patch)
 with tempfile.TemporaryDirectory(prefix='wod-byte-apply-',dir=scratch)as tmp:
  t=Path(tmp);subprocess.run(['git','-c','gc.auto=0','-c','maintenance.auto=false','init','-q','-b','restore-unborn',str(t)],capture_output=True,check=True);p=t/'checkpoint.zip';p.write_bytes(before);q=t/'binary.patch';q.write_bytes(patch)
  for flags in [['--check'],[]]:subprocess.run(['git','-c','gc.auto=0','-c','maintenance.auto=false','apply',*flags,str(q)],cwd=t,capture_output=True,check=True)
  require(p.stat().st_size<=MAX_CP,'Patched checkpoint exceeds limit');return p.read_bytes()

def zip_entry(z,name):
 info=z.getinfo(name);require(info.file_size<=MAX_CP,'Oversize base checkpoint');return z.read(name)

def info_write(z,name,data):
 info=zipfile.ZipInfo(name,date_time=(2000,1,1,0,0,0));info.create_system=3;info.external_attr=0o100600<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data,compresslevel=3)

def pack(target_archive,base_archive,destination,*,scratch='/tmp',max_wrapper_bytes=300*1024**2,progress=None):
 target=regular(target_archive);base=regular(base_archive);dest=fresh_target(destination);target_hash=digest(target);base_hash=digest(base);st=target.stat();base_st=base.stat();require(stat.S_IMODE(st.st_mode)<=0o777,'Unsupported special target mode');parts=[];counts={'delta':0,'copy':0,'literalCheckpoint':0};current=0
 with tempfile.TemporaryDirectory(prefix='wod-byte-pack-',dir=dest.parent)as tmp:
  pending=Path(tmp)/'wrapper.zip'
  with zipfile.ZipFile(base)as old,zipfile.ZipFile(target)as original,zipfile.ZipFile(pending,'x',zipfile.ZIP_DEFLATED,compresslevel=3)as wrapper,target.open('rb')as raw:
   oi=stage_index(old);ni=stage_index(original);choices={}
   for c in oi['containers']:
    key=version_key(c['entry'])
    if key is not None:choices.setdefault(key,[]).append(c)
   for key in choices:choices[key].sort(key=lambda c:(not c['entry'].endswith('-final.zip'),c['entry']))
   ranges=[]
   for c in ni['containers']:
    info=original.getinfo(c['entry']);require(info.compress_type==zipfile.ZIP_STORED and info.file_size==info.compress_size==c['bytes']<=MAX_CP,'Checkpoint container must be bounded and stored verbatim');raw.seek(info.header_offset);header=raw.read(30);require(len(header)==30 and header[:4]==b'PK\x03\x04','Invalid local ZIP header');name_len,extra_len=struct.unpack('<HH',header[26:30]);name=raw.read(name_len).decode('utf-8'if info.flag_bits&0x800 else'cp437');require(name==c['entry'],'ZIP local name mismatch');offset=info.header_offset+30+name_len+extra_len;ranges.append((offset,c))
   ranges.sort(key=lambda a:a[0]);require(len(ranges)>0,'No original checkpoints')
   def emit(data,kind='literal',**extra):
    nonlocal current
    row={'offset':current,'bytes':len(data),'sha256':datahash(data),'kind':kind,**extra};current+=len(data);parts.append(row);return row
   def literal_region(start,end):
    require(start==current and end>=start,'Overlapping original ZIP ranges');raw.seek(start)
    while current<end:
     data=raw.read(min(MAX_LITERAL,end-current));require(data,'Truncated original ZIP');row=emit(data);row['entry']=f'parts/{len(parts):05d}.bin';info_write(wrapper,row['entry'],data)
   for number,(offset,c)in enumerate(ranges,1):
    literal_region(current,offset);raw.seek(offset);data=raw.read(c['bytes']);require(len(data)==c['bytes']and datahash(data)==c['sha256'],'Current checkpoint bytes changed');candidates=choices.get(version_key(c['entry']),[]);row=None
    if candidates:
     ref=candidates[0];before=zip_entry(old,ref['entry']);require(len(before)==ref['bytes']and datahash(before)==ref['sha256'],'Base checkpoint differs');shared={'baseEntry':ref['entry'],'baseBytes':len(before),'baseSHA256':ref['sha256'],'checkpointEntry':c['entry']}
     if before==data:row=emit(data,'copy',**shared);counts['copy']+=1
     else:
      patch=git_patch(before,data,scratch)
      if len(patch)<len(data):
       row=emit(data,'delta',**shared);row.update(entry=f'parts/{len(parts):05d}.patch',patchBytes=len(patch),patchSHA256=datahash(patch));info_write(wrapper,row['entry'],patch);counts['delta']+=1
    if row is None:
     row=emit(data,checkpointEntry=c['entry']);row['entry']=f'parts/{len(parts):05d}.bin';info_write(wrapper,row['entry'],data);counts['literalCheckpoint']+=1
    require(pending.stat().st_size<=max_wrapper_bytes,'Wrapper exceeds declared budget; original masters remain intact')
    if progress:progress({'processed':number,'total':len(ranges),'counts':dict(counts),'wrapperBytesSoFar':pending.stat().st_size})
   literal_region(current,st.st_size);manifest={'format':FORMAT,'version':VERSION,'base':{'name':base.name,'bytes':base_st.st_size,'sha256':base_hash},'target':{'name':target.name,'bytes':st.st_size,'sha256':target_hash,'mode':stat.S_IMODE(st.st_mode),'mtimeNs':st.st_mtime_ns},'checkpointCount':len(ranges),'counts':counts,'parts':parts};info_write(wrapper,INDEX,(json.dumps(manifest,sort_keys=True,separators=(',',':'))+'\n').encode())
  require(pending.stat().st_size<=max_wrapper_bytes,'Wrapper exceeds declared final budget');require(digest(target)==target_hash and target.stat().st_mtime_ns==st.st_mtime_ns and digest(base)==base_hash and base.stat().st_mtime_ns==base_st.st_mtime_ns,'Input master changed during packing')
  with pending.open('rb')as f:os.fsync(f.fileno())
  os.link(pending,dest)
 return {'passed':True,'wrapper':str(dest),'bytes':dest.stat().st_size,'sha256':digest(dest),'originalMasterBytes':st.st_size,'originalMasterSHA256':target_hash,'baseMasterSHA256':base_hash,'checkpointCount':len(ranges),'counts':counts,'sourceFilesRemoved':False,'originalOuterZIPBytesPreservedByRecipe':True}

def read_manifest(z):
 names=z.namelist();require(len(names)==len(set(names))and INDEX in names,'Duplicate or missing wrapper entries');require(z.getinfo(INDEX).file_size<=MAX_INDEX,'Oversize wrapper index');m=json.loads(z.read(INDEX));require(m['format']==FORMAT and m['version']==VERSION,'Unsupported wrapper format');require(isinstance(m['parts'],list)and 0<len(m['parts'])<=10000,'Invalid part count');entries={INDEX};offset=0;cp_count=0;counts={'delta':0,'copy':0,'literalCheckpoint':0}
 for row in m['parts']:
  require(integer(row['offset'])and row['offset']==offset and integer(row['bytes'])and row['bytes']>0,'Noncontiguous part ranges');offset+=row['bytes'];require(re.fullmatch('[0-9a-f]{64}',row['sha256'])is not None,'Invalid target digest');require(row['kind']in['literal','copy','delta'],'Invalid part kind')
  if row['kind']=='literal':require(row['bytes']<=MAX_LITERAL,'Oversize literal part')
  else:
   require(row['bytes']<=MAX_CP and integer(row['baseBytes'])and 0<row['baseBytes']<=MAX_CP,'Oversize checkpoint');p=PurePosixPath(row['baseEntry']);require(not p.is_absolute()and'..'not in p.parts and'\\'not in row['baseEntry'],'Unsafe base entry');require(re.fullmatch('[0-9a-f]{64}',row['baseSHA256'])is not None,'Invalid base digest')
  if 'checkpointEntry'in row:
   require(isinstance(row['checkpointEntry'],str)and row['checkpointEntry'],'Invalid checkpoint label');cp_count+=1;counts['literalCheckpoint'if row['kind']=='literal'else row['kind']]+=1
  else:require(row['kind']=='literal','Checkpoint reference lacks identity')
  if row['kind']!='copy':
   entry=row['entry'];require(re.fullmatch(r'parts/\d{5}\.(bin|patch)',entry)is not None and entry not in entries,'Unsafe or duplicate part entry');entries.add(entry);info=z.getinfo(entry)
   if row['kind']=='literal':require(info.file_size==row['bytes'],'Literal size differs')
   else:require(integer(row['patchBytes'])and 0<row['patchBytes']<=MAX_CP and info.file_size==row['patchBytes']and re.fullmatch('[0-9a-f]{64}',row['patchSHA256'])is not None,'Invalid patch metadata')
 require(integer(m['target']['bytes'])and offset==m['target']['bytes']and integer(m['checkpointCount'])and 0<cp_count==m['checkpointCount']and counts==m['counts'],'Incomplete target ranges/checkpoints');require(set(names)==entries,'Unexpected wrapper payloads');require(integer(m['target']['mode'])and 0<=m['target']['mode']<=0o777 and integer(m['target']['mtimeNs'])and m['target']['mtimeNs']>=0,'Invalid target metadata');return m

def restore(wrapper_archive,base_archive,destination,expected_wrapper_sha256,*,scratch='/tmp',reserve_bytes=1024**3,max_target_bytes=8*1024**3,progress=None):
 require(integer(reserve_bytes)and reserve_bytes>=0,'Invalid reserve');wrapper=regular(wrapper_archive);base=regular(base_archive);dest=fresh_target(destination);require(digest(wrapper)==expected_wrapper_sha256,'Wrapper SHA256 differs')
 with zipfile.ZipFile(wrapper)as z,zipfile.ZipFile(base)as old:
  m=read_manifest(z);require(base.stat().st_size==m['base']['bytes']and digest(base)==m['base']['sha256'],'Wrong base master');require(0<m['target']['bytes']<=max_target_bytes,'Target exceeds declared bound');require(shutil.disk_usage(dest.parent).free>m['target']['bytes']+reserve_bytes,'Insufficient reserved restore space')
  with tempfile.TemporaryDirectory(prefix='wod-byte-output-',dir=dest.parent)as tmp:
   output=Path(tmp)/'original.zip';h=hashlib.sha256()
   with output.open('xb')as f:
    for number,row in enumerate(m['parts'],1):
     if row['kind']=='literal':data=z.read(row['entry'])
     else:
      info=old.getinfo(row['baseEntry']);require(info.file_size==row['baseBytes'],'Wrong base checkpoint size');data=zip_entry(old,row['baseEntry']);require(datahash(data)==row['baseSHA256'],'Wrong base checkpoint SHA256')
      if row['kind']=='delta':
       patch=z.read(row['entry']);require(datahash(patch)==row['patchSHA256'],'Patch SHA256 differs');data=apply_patch(data,patch,scratch)
     require(len(data)==row['bytes']and datahash(data)==row['sha256'],'Restored part differs');f.write(data);h.update(data)
     if progress:progress({'processedParts':number,'totalParts':len(m['parts'])})
    f.flush();os.fsync(f.fileno())
   require(output.stat().st_size==m['target']['bytes']and h.hexdigest()==m['target']['sha256'],'Original master SHA256 differs');output.chmod(m['target']['mode']);os.utime(output,ns=(m['target']['mtimeNs'],m['target']['mtimeNs']));os.link(output,dest)
 return {'passed':True,'restored':str(dest),'bytes':dest.stat().st_size,'sha256':digest(dest),'originalOuterZIPByteExact':True,'modeAndMtimeNsExact':stat.S_IMODE(dest.stat().st_mode)==m['target']['mode']and dest.stat().st_mtime_ns==m['target']['mtimeNs'],'checkpointCount':m['checkpointCount'],'existingDestinationNeverOverwritten':True,'noOriginalInputRemoved':True}

if __name__=='__main__':
 parser=argparse.ArgumentParser();sub=parser.add_subparsers(dest='action',required=True);p=sub.add_parser('pack');p.add_argument('target');p.add_argument('base');p.add_argument('destination');p.add_argument('--max-wrapper-bytes',type=int,default=300*1024**2);p=sub.add_parser('restore');p.add_argument('wrapper');p.add_argument('base');p.add_argument('destination');p.add_argument('--sha256',required=True);p.add_argument('--reserve-bytes',type=int,default=1024**3);args=parser.parse_args()
 result=pack(args.target,args.base,args.destination,max_wrapper_bytes=args.max_wrapper_bytes)if args.action=='pack'else restore(args.wrapper,args.base,args.destination,args.sha256,reserve_bytes=args.reserve_bytes);print(json.dumps(result))
