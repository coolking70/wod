"""Losslessly checkpoint a completed evidence directory, without removing its files."""
from pathlib import Path
import hashlib,json,os,sys,tempfile,zipfile

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def archive(root,target):
 root=Path(root).resolve();target=Path(target).resolve()
 if not root.is_dir() or root==target or root in target.parents:raise ValueError('Archive destination must be outside the evidence directory')
 if target.exists():raise FileExistsError('Evidence checkpoint already exists; use a fresh destination, original checkpoint and source preserved')
 files=sorted(p for p in root.rglob('*')if p.is_file() or p.is_symlink())
 if any(p.is_symlink()for p in files):raise ValueError('Evidence symlinks require explicit handling; nothing archived or removed')
 manifest=[]
 for p in files:
  st=p.stat();manifest.append({'path':str(p.relative_to(root)),'bytes':st.st_size,'sha256':sha(p),'mtimeNs':st.st_mtime_ns})
 if any(r['path']=='.wod-evidence-manifest.json'for r in manifest):raise ValueError('Reserved archive manifest already exists; source preserved')
 target.parent.mkdir(parents=True,exist_ok=True)
 handle,temp=tempfile.mkstemp(prefix=target.name+'.pending-',dir=target.parent);os.close(handle);temp=Path(temp)
 try:
  with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=3)as z:
   for row in manifest:z.write(root/row['path'],root.name+'/'+row['path'])
   z.writestr(root.name+'/.wod-evidence-manifest.json',json.dumps({'format':'wod-complete-evidence','version':1,'files':manifest},ensure_ascii=False,indent=2)+'\n')
  with zipfile.ZipFile(temp)as z:
   if z.testzip()is not None:raise ValueError('Evidence archive CRC verification failed')
   for row in manifest:
    if hashlib.sha256(z.read(root.name+'/'+row['path'])).hexdigest()!=row['sha256']:raise ValueError('Evidence archive content mismatch: '+row['path'])
    st=(root/row['path']).stat()
    if st.st_size!=row['bytes'] or st.st_mtime_ns!=row['mtimeNs'] or sha(root/row['path'])!=row['sha256']:raise ValueError('Evidence changed while archiving: '+row['path'])
  os.replace(temp,target)
 except BaseException:
  if temp.exists():temp.unlink()
  raise
 return {'passed':True,'archive':str(target),'archiveSHA256':sha(target),'files':len(manifest),'rawBytes':sum(r['bytes']for r in manifest),'archiveBytes':target.stat().st_size,'allFileHashesAndCRCVerified':True,'sourceFilesRemoved':False}

if __name__=='__main__':print(json.dumps(archive(sys.argv[1],sys.argv[2]),ensure_ascii=False))
