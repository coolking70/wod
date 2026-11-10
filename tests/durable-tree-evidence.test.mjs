import test from'node:test';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';import{resolve}from'node:path';
const setup=`import sys,importlib.util,tempfile,json,os,zipfile,hashlib,stat
from pathlib import Path
sys.dont_write_bytecode=True
s=importlib.util.spec_from_file_location('tree',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
t=tempfile.TemporaryDirectory(prefix='wod-tree-test-');base=Path(t.name);a=base/'a';a.mkdir();(a/'empty').mkdir();(a/'one').write_bytes(b'precise bytes');(a/'two').write_bytes(b'precise bytes');(a/'three').write_bytes(bytes(range(256)));os.chmod(a,0o750);os.utime(a/'one',ns=(1660000000123456789,1660000000123456789));os.utime(a/'two',ns=(1660000000987654321,1660000000987654321));os.utime(a/'empty',ns=(1650000000123456789,1650000000123456789));archive=base/'snapshot.zip'
def raises(kind,fn):
 try:fn()
 except kind:return
 raise AssertionError('Expected rejection')
def rewrite(name,mutate):
 dest=base/name
 with zipfile.ZipFile(archive)as z,zipfile.ZipFile(dest,'x')as out:
  for info in z.infolist():out.writestr(info,mutate(info.filename,z.read(info.filename)))
 return dest
`;
function run(code){return execFileSync('python3',['-B','-c',setup+'\n'+code,resolve('scripts/durable-tree-evidence.py')],{encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});}
test('deduplicates identical content while preserving per-file and empty-directory metadata',()=>{run(`before=m.inventory(a);p=m.pack({'original':str(a)},archive);assert p['files']==3 and p['uniqueObjects']==2;out=base/'out';m.restore(archive,'original',out,p['sha256']);after=m.inventory(out);assert after['files']==before['files'] and after['directories']==before['directories'];assert(out/'empty').is_dir();assert(out/'one').stat().st_mtime_ns==1660000000123456789;assert(out/'two').stat().st_mtime_ns==1660000000987654321;assert m.inventory(a)==before`);});
test('multiple namespaces share objects without mixing paths, ownership metadata or bytes',()=>{run(`b=base/'b';b.mkdir();(b/'one').write_bytes(b'different');(b/'shared').write_bytes(b'precise bytes');p=m.pack({'first':str(a),'second':str(b)},archive);assert p['files']==5 and p['uniqueObjects']==3;out=base/'out';m.restore(archive,'second',out,p['sha256']);assert(out/'one').read_bytes()==b'different';assert set(x.name for x in out.iterdir())=={'one','shared'};bindings=m.bindings(archive,p['sha256']);assert bindings[str(a/'one')]['sha256']==bindings[str(b/'shared')]['sha256']`);});
test('existing archives and restore targets are preserved before any overwrite',()=>{run(`archive.write_bytes(b'keep');raises(FileExistsError,lambda:m.pack({'one':str(a)},archive));assert archive.read_bytes()==b'keep';valid=base/'valid.zip';p=m.pack({'one':str(a)},valid);out=base/'out';out.mkdir();(out/'sentinel').write_text('keep');raises(FileExistsError,lambda:m.restore(valid,'one',out,p['sha256']));assert(out/'sentinel').read_text()=='keep'`);});
test('source and destination symlinks are rejected without changing originals',()=>{run(`(a/'link').symlink_to(a/'one');raises(ValueError,lambda:m.pack({'one':str(a)},archive));assert not archive.exists();(a/'link').unlink();link=base/'parent';link.symlink_to(a,target_is_directory=True);raises(ValueError,lambda:m.pack({'one':str(a)},link/'snapshot.zip'));assert(a/'one').read_bytes()==b'precise bytes'`);});
test('malformed relative paths and missing parent directories fail before restore writes',()=>{run(`m.pack({'one':str(a)},archive)
def bad_path(name,data):
 if name!=m.INDEX:return data
 x=json.loads(data);x['roots']['one']['files'][0]['relative']='../outside';return json.dumps(x).encode()
bad=rewrite('path.zip',bad_path);out=base/'out';raises(ValueError,lambda:m.restore(bad,'one',out,m.sha(bad)));assert not out.exists() and not(base/'outside').exists()`);});
test('tampered object bytes and unbound extra members cannot be treated as proven content',()=>{run(`m.pack({'one':str(a)},archive);bad=rewrite('content.zip',lambda name,data:b'changed'if name.startswith('objects/')else data);out=base/'out';raises(ValueError,lambda:m.restore(bad,'one',out,m.sha(bad)));assert not out.exists();extra=base/'extra.zip'
with zipfile.ZipFile(archive)as z,zipfile.ZipFile(extra,'x')as q:
 for info in z.infolist():q.writestr(info,z.read(info.filename))
 q.writestr('unexpected',b'x')
raises(ValueError,lambda:m.inspect(extra))`);});
test('archive hash binding rejects a changed snapshot even if its internal index is valid',()=>{run(`p=m.pack({'one':str(a)},archive);out=base/'out';raises(ValueError,lambda:m.restore(archive,'one',out,'0'*64));assert not out.exists();assert m.sha(archive)==p['sha256']`);});
test('overlapping source namespaces and destination-inside-source cannot publish snapshots',()=>{run(`raises(ValueError,lambda:m.pack({'one':str(a)},a/'nested.zip'));assert not(a/'nested.zip').exists();raises(ValueError,lambda:m.pack({'one':str(a),'child':str(a/'empty')},archive));assert not archive.exists()`);});
test('special modes and symlink ZIP objects are rejected by validation',()=>{run(`os.chmod(a/'one',0o4600);raises(ValueError,lambda:m.pack({'one':str(a)},archive));os.chmod(a/'one',0o600);m.pack({'one':str(a)},archive);bad=base/'link.zip'
with zipfile.ZipFile(archive)as z,zipfile.ZipFile(bad,'x')as q:
 for info in z.infolist():
  if info.filename.startswith('objects/'):info.external_attr=0o120777<<16
  q.writestr(info,z.read(info.filename))
raises(ValueError,lambda:m.inspect(bad))`);});

test('catalogue keeps original file metadata verifiable after a proven duplicate is retired',()=>{run(`p=m.pack({'one':str(a)},archive);index=m.inspect(archive);rows=[dict(path=str(a/r['relative']),**r)for r in index['roots']['one']['files']];out=base/'out';m.restore(archive,'one',out,p['sha256']);cat=base/'catalog.json'
with zipfile.ZipFile(archive)as z:indexsha=hashlib.sha256(z.read(m.INDEX)).hexdigest()
cat.write_text(json.dumps(dict(format='wod-tree-retention-catalog',version=1,archive=dict(path=str(archive),bytes=archive.stat().st_size,sha256=p['sha256']),indexSHA256=indexsha)));(a/'one').unlink();spec=importlib.util.spec_from_file_location('bindings',Path(sys.argv[1]).with_name('protected-evidence-bindings.py'));checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker);result=checker.verify(rows,None,None,[dict(path=str(cat),sha256=m.sha(cat))]);assert result['physicalFiles']==2 and result['originalTreeFiles']==1;bad=[dict(r)for r in rows];bad[0]['mode']^=1;raises(ValueError,lambda:checker.verify(bad,None,None,[dict(path=str(cat),sha256=m.sha(cat))]));assert not(a/'one').exists()`);});
test('catalogue and its index checksum are explicit inputs, not guessed from missing paths',()=>{run(`p=m.pack({'one':str(a)},archive);cat=base/'catalog.json';cat.write_text(json.dumps(dict(format='wod-tree-retention-catalog',version=1,archive=dict(path=str(archive),bytes=archive.stat().st_size,sha256=p['sha256']),indexSHA256='0'*64)));raises(ValueError,lambda:m.catalog_bindings(cat,m.sha(cat)));raises(ValueError,lambda:m.catalog_bindings(cat,'0'*64))`);});
