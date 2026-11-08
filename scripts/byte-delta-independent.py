"""Independent cold decoder for original-byte evidence wrappers.
Does not import byte-delta-evidence or read the original target. No retirement.
"""
from pathlib import Path
import argparse,hashlib,json,os,re,shutil,stat,subprocess,tempfile,zipfile

def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def check(value,why):
 if not value:raise ValueError(why)
def restore(wrapper,base,target,expected_sha,*,reserve=1024**3,scratch='/tmp'):
 wrapper,base,target=map(Path,[wrapper,base,target]);target=target.absolute()
 check(wrapper.is_file()and not wrapper.is_symlink()and base.is_file()and not base.is_symlink(),'Regular inputs required')
 check(not target.exists()and not target.is_symlink()and target.parent.resolve()==target.parent,'Fresh real destination required');check(sha(wrapper)==expected_sha,'Wrapper digest mismatch')
 with zipfile.ZipFile(wrapper)as z,zipfile.ZipFile(base)as old:
  names=z.namelist();check(len(names)==len(set(names))and z.getinfo('DELTA_INDEX.json').file_size<=8*1024**2,'Invalid wrapper entries');m=json.loads(z.read('DELTA_INDEX.json'));check((m['format'],m['version'])==('wod-byte-delta-evidence',1),'Unsupported wrapper');t=m['target'];check(type(t['bytes'])is int and 0<t['bytes']<=8*1024**3,'Invalid target size');check(type(reserve)is int and reserve>=0 and shutil.disk_usage(target.parent).free>t['bytes']+reserve,'Restore reserve insufficient');check(base.stat().st_size==m['base']['bytes']and sha(base)==m['base']['sha256'],'Base digest mismatch')
  entries={'DELTA_INDEX.json'};position=0;counts={'delta':0,'copy':0,'literalCheckpoint':0};cp=0
  check(isinstance(m['parts'],list)and 0<len(m['parts'])<=10000,'Invalid parts')
  with tempfile.TemporaryDirectory(prefix='wod-independent-output-',dir=target.parent)as tmp:
   output=Path(tmp)/'original.zip';h=hashlib.sha256()
   with output.open('xb')as out:
    for r in m['parts']:
     check(type(r['offset'])is int and r['offset']==position and type(r['bytes'])is int and 0<r['bytes']<=128*1024**2,'Invalid byte range');check(r['kind']in['literal','delta','copy'],'Unknown part type')
     if r['kind']=='literal':
      entry=r['entry'];check(re.fullmatch(r'parts/\d{5}\.bin',entry)and entry not in entries,'Unsafe literal');entries.add(entry);check(z.getinfo(entry).file_size==r['bytes'],'Literal length');data=z.read(entry)
     else:
      check('checkpointEntry'in r and type(r['baseBytes'])is int and 0<r['baseBytes']<=128*1024**2,'Invalid checkpoint identity');check(old.getinfo(r['baseEntry']).file_size==r['baseBytes'],'Base part length');data=old.read(r['baseEntry']);check(hashlib.sha256(data).hexdigest()==r['baseSHA256'],'Base part digest')
      if r['kind']=='delta':
       entry=r['entry'];check(re.fullmatch(r'parts/\d{5}\.patch',entry)and entry not in entries,'Unsafe patch');entries.add(entry);check(z.getinfo(entry).file_size==r['patchBytes']<=128*1024**2,'Patch length');patch=z.read(entry);check(hashlib.sha256(patch).hexdigest()==r['patchSHA256'],'Patch digest');lines=patch.splitlines();check(len(lines)>4 and lines[0]==b'diff --git a/checkpoint.zip b/checkpoint.zip'and re.fullmatch(rb'index [0-9a-f]{40}\.\.[0-9a-f]{40} 100644',lines[1])and lines[2]==b'GIT binary patch','Unsafe binary patch header');blocks=0;active=False;payload=0
       for line in lines[3:]+[b'']:
        if not line:
         if active:check(payload>0,'Empty patch block');active=False
        elif not active:check(re.fullmatch(rb'(literal|delta) [0-9]+',line),'Patch instruction');blocks+=1;active=True;payload=0
        else:check(6<=len(line)<=66 and (65<=line[0]<=90 or 97<=line[0]<=122)and all(33<=c<=126 for c in line),'Patch encoding');payload+=1
       check(1<=blocks<=2,'Patch block count')
       with tempfile.TemporaryDirectory(prefix='wod-independent-patch-',dir=scratch)as apply:
        p=Path(apply);subprocess.run(['git','-c','gc.auto=0','-c','maintenance.auto=false','init','-q','-b','restore-unborn',str(p)],capture_output=True,check=True);(p/'checkpoint.zip').write_bytes(data);(p/'part.patch').write_bytes(patch)
        for flags in[['--check'],[]]:subprocess.run(['git','-c','gc.auto=0','-c','maintenance.auto=false','apply',*flags,str(p/'part.patch')],cwd=p,capture_output=True,check=True)
        check((p/'checkpoint.zip').stat().st_size<=128*1024**2,'Patched output bound');data=(p/'checkpoint.zip').read_bytes()
     check(len(data)==r['bytes']and hashlib.sha256(data).hexdigest()==r['sha256'],'Restored part mismatch');out.write(data);h.update(data);position+=len(data)
     if 'checkpointEntry'in r:cp+=1;counts['literalCheckpoint'if r['kind']=='literal'else r['kind']]+=1
    out.flush();os.fsync(out.fileno())
   check(entries==set(names)and position==t['bytes']and cp==m['checkpointCount']and counts==m['counts'],'Incomplete ranges/entries/counters');check(h.hexdigest()==t['sha256'],'Original target digest mismatch');check(type(t['mode'])is int and 0<=t['mode']<=0o777 and type(t['mtimeNs'])is int and t['mtimeNs']>=0,'Invalid target metadata');output.chmod(t['mode']);os.utime(output,ns=(t['mtimeNs'],t['mtimeNs']));os.link(output,target)
 return {'passed':True,'restored':str(target),'bytes':position,'sha256':sha(target),'mode':stat.S_IMODE(target.stat().st_mode),'mtimeNs':target.stat().st_mtime_ns,'checkpoints':cp,'independentDecoder':True,'originalTargetNotAnInput':True}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('wrapper');p.add_argument('base');p.add_argument('target');p.add_argument('--sha256',required=True);a=p.parse_args();print(json.dumps(restore(a.wrapper,a.base,a.target,a.sha256)))
