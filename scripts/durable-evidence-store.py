"""Resolve a retired logical master from an explicit immutable durable catalog.
No deletion, catalog mutation, implicit downloads or writes into historical deliveries.
"""
from pathlib import Path
from contextlib import contextmanager
import argparse,hashlib,importlib.util,json,os,re,stat,tempfile,zipfile

def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def require(v,why):
 if not v:raise ValueError(why)
def regular(p):
 p=Path(p);require(p.is_file()and not p.is_symlink(),'Expected regular file');return p
def checked_file(row):
 p=regular(row['path']);require(p.stat().st_size==row['bytes']and sha(p)==row['sha256'],'Durable dependency differs');return p

def load_record(logical,catalog,catalog_sha256,expected_sha256):
 logical=Path(logical).absolute();catalog=regular(catalog).absolute();require(sha(catalog)==catalog_sha256,'Catalog SHA256 differs');c=json.loads(catalog.read_text());require(c['format']=='wod-durable-evidence-catalog'and c['version']==1,'Unsupported catalog');row=c['entries'][str(logical)];require(row['logicalPath']==str(logical)and row['sha256']==expected_sha256 and re.fullmatch('[0-9a-f]{64}',expected_sha256),'Logical target digest differs')
 for n in['wrapper','base','verification']:checked_file(row[n])
 wrapper=Path(row['wrapper']['path']);proof=Path(row['verification']['path']);require(wrapper.is_relative_to(catalog.parent)and proof.is_relative_to(catalog.parent),'Nonlocal durable wrapper/proof');verified=json.loads(proof.read_text());require(verified['passed']and verified['target']['sha256']==row['sha256']and verified['wrapper']['sha256']==row['wrapper']['sha256']and verified['independentColdDecoderPassed']and verified['threeWholeRootsReadBack'],'Incomplete retirement verification')
 with zipfile.ZipFile(wrapper)as z:
  require(z.getinfo('DELTA_INDEX.json').file_size<=8*1024**2,'Oversize index');m=json.loads(z.read('DELTA_INDEX.json'));require(m['format']=='wod-byte-delta-evidence'and m['version']==1,'Unsupported wrapper');require(all(m['target'][k]==row[k]for k in['bytes','sha256','mode','mtimeNs']),'Catalog target metadata differs');require(m['base']['sha256']==row['base']['sha256']and m['base']['bytes']==row['base']['bytes'],'Catalog base differs')
 return row

@contextmanager
def materialized(logical,expected_sha256,*,catalog=None,catalog_sha256=None,scratch='/tmp'):
 logical=Path(logical).absolute()
 if logical.exists()or logical.is_symlink():
  regular(logical);require(sha(logical)==expected_sha256,'Existing original differs');yield logical;return
 require(catalog is not None and catalog_sha256 is not None,'Missing original requires explicit catalog and its SHA256');row=load_record(logical,catalog,catalog_sha256,expected_sha256)
 spec=importlib.util.spec_from_file_location('byte_delta_codec',Path(__file__).with_name('byte-delta-evidence.py'));codec=importlib.util.module_from_spec(spec);spec.loader.exec_module(codec)
 with tempfile.TemporaryDirectory(prefix='wod-materialized-original-',dir=scratch)as tmp:
  target=Path(tmp)/Path(row['logicalPath']).name;result=codec.restore(row['wrapper']['path'],row['base']['path'],target,row['wrapper']['sha256'],scratch=scratch);require(result['passed']and sha(target)==expected_sha256 and stat.S_IMODE(target.stat().st_mode)==row['mode']and target.stat().st_mtime_ns==row['mtimeNs'],'Recovered original differs');yield target

def verify_rows(rows,*,catalog=None,catalog_sha256=None,scratch='/tmp'):
 count=0;reconstructed=[]
 for r in rows:
  existed=Path(r['path']).exists()
  with materialized(r['path'],r['sha256'],catalog=catalog,catalog_sha256=catalog_sha256,scratch=scratch)as p:
   require('bytes'not in r or p.stat().st_size==r['bytes'],'Original size differs');require('mode'not in r or stat.S_IMODE(p.stat().st_mode)==r['mode'],'Original mode differs');require('mtimeNs'not in r or p.stat().st_mtime_ns==r['mtimeNs'],'Original time differs')
  count+=1
  if not existed:reconstructed.append(r['path'])
 return {'passed':True,'verifiedFiles':count,'logicalOriginalsReconstructed':reconstructed,'historicalFilesOrManifestsNotWritten':True}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('original');p.add_argument('--sha256',required=True);p.add_argument('--catalog');p.add_argument('--catalog-sha256');p.add_argument('--target',required=True);a=p.parse_args();dest=Path(a.target).absolute();require(dest.parent.is_dir()and dest.parent.resolve()==dest.parent and not dest.exists()and not dest.is_symlink(),'Fresh real target required')
 with materialized(a.original,a.sha256,catalog=a.catalog,catalog_sha256=a.catalog_sha256)as source:
  import shutil
  require(shutil.disk_usage(dest.parent).free>source.stat().st_size+1024**3,'Destination reserve insufficient')
  with tempfile.TemporaryDirectory(prefix='wod-original-copy-',dir=dest.parent)as tmp:
   pending=Path(tmp)/'original.zip'
   with source.open('rb')as src,pending.open('xb')as out:shutil.copyfileobj(src,out);out.flush();os.fsync(out.fileno())
   st=source.stat();pending.chmod(stat.S_IMODE(st.st_mode));os.utime(pending,ns=(st.st_mtime_ns,st.st_mtime_ns));require(sha(pending)==a.sha256,'Destination mismatch');os.link(pending,dest)
 print(json.dumps({'passed':True,'restored':str(dest),'sha256':sha(dest),'historicalOriginalNotOverwritten':True}))
