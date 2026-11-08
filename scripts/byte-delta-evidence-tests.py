"""Small deterministic fixtures and corruption guards for original-master byte recovery."""
from pathlib import Path
import importlib.util,json,hashlib,unittest,tempfile,zipfile,random,os,stat,sys
sys.dont_write_bytecode=True
HERE=Path(__file__).parent

def module(name):
 spec=importlib.util.spec_from_file_location(name.replace('-','_'),HERE/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
codec=module('byte-delta-evidence');stage=module('archive-stage-evidence');checkpoint=module('archive-evidence')
class DeltaTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory(prefix='wod-delta-unit-',dir='/tmp');cls.root=Path(cls.tmp.name);data=random.Random(8173).randbytes(250000)
  def original(label,extra=False):
   root=cls.root/label;ev=root/'evidence';raw=root/'raw';cp=root/'checkpoints'
   for p in[ev,raw/'acceptance',cp]:p.mkdir(parents=True)
   (ev/'note.txt').write_text('original metadata and archive headers '+label)
   for case in([1,2]if extra else[1]):
    d=raw/'acceptance'/f'browser-v{case}-{label}';d.mkdir();(d/'data.bin').write_bytes(data);p=d/'report.json';p.write_text(json.dumps({'case':case,'label':label}));p.chmod(0o750);os.utime(p,ns=(1700000000123456789,1700000000123456789));checkpoint.archive(d,cp/(d.name+'.zip'))
   target=root/(label+'.zip');stage.package(ev,raw,cp,target,label);target.chmod(0o640);os.utime(target,ns=(1700000000234567891,1700000000234567891));return target
  cls.base=original('old');cls.current=original('new',True);cls.wrapper=cls.root/'thin.zip';cls.summary=codec.pack(cls.current,cls.base,cls.wrapper);cls.hash=codec.digest(cls.wrapper)
 @classmethod
 def tearDownClass(cls):cls.tmp.cleanup()
 def output(self):return self.root/(self._testMethodName+'.zip')
 def mutant(self,mutate):
  p=self.root/(self._testMethodName+'-mutated.zip')
  with zipfile.ZipFile(self.wrapper)as z:rows={n:z.read(n)for n in z.namelist()}
  m=json.loads(rows[codec.INDEX]);mutate(m,rows);rows[codec.INDEX]=(json.dumps(m,sort_keys=True,separators=(',',':'))+'\n').encode()
  with zipfile.ZipFile(p,'x')as z:
   for n,data in rows.items():codec.info_write(z,n,data)
  return p
 def rejects(self,p,base=None):
  with self.assertRaises((ValueError,KeyError,zipfile.BadZipFile)):codec.restore(p,base or self.base,self.output(),codec.digest(p))
  self.assertFalse(self.output().exists())
 def test_01_exact_original_outer_bytes_and_metadata(self):
  r=codec.restore(self.wrapper,self.base,self.output(),self.hash);self.assertTrue(r['passed']);self.assertEqual(self.output().read_bytes(),self.current.read_bytes());self.assertEqual(stat.S_IMODE(self.output().stat().st_mode),0o640);self.assertEqual(self.output().stat().st_mtime_ns,self.current.stat().st_mtime_ns);self.assertEqual(self.summary['checkpointCount'],2);self.assertEqual(self.summary['counts'],{'delta':1,'copy':0,'literalCheckpoint':1});self.assertTrue(stage.verify(self.output())['passed'])
 def test_02_deterministic_wrapper_bytes(self):
  codec.pack(self.current,self.base,self.output());self.assertEqual(self.output().read_bytes(),self.wrapper.read_bytes())
 def test_03_existing_destination_preserved(self):
  p=self.output();p.write_bytes(b'keep-original')
  with self.assertRaises(FileExistsError):codec.restore(self.wrapper,self.base,p,self.hash)
  self.assertEqual(p.read_bytes(),b'keep-original')
 def test_04_wrong_wrapper_hash_before_output(self):
  with self.assertRaises(ValueError):codec.restore(self.wrapper,self.base,self.output(),'0'*64)
  self.assertFalse(self.output().exists())
 def test_05_wrong_base_master_rejected(self):self.rejects(self.wrapper,self.current)
 def test_06_range_gap_rejected(self):self.rejects(self.mutant(lambda m,r:m['parts'][0].update(offset=1)))
 def test_07_target_digest_mismatch_rejected(self):self.rejects(self.mutant(lambda m,r:m['target'].update(sha256='0'*64)))
 def test_08_literal_corruption_rejected(self):
  def change(m,r):
   p=next(p for p in m['parts']if p['kind']=='literal');r[p['entry']]=b'X'+r[p['entry']][1:]
  self.rejects(self.mutant(change))
 def test_09_patch_corruption_rejected(self):
  def change(m,r):
   p=next(p for p in m['parts']if p['kind']=='delta');r[p['entry']]=b'X'+r[p['entry']][1:]
  self.rejects(self.mutant(change))
 def test_10_unexpected_payload_rejected(self):self.rejects(self.mutant(lambda m,r:r.update({'untracked.txt':b'extra'})))
 def test_11_counter_mismatch_rejected(self):self.rejects(self.mutant(lambda m,r:m.update(checkpointCount=3)))
 def test_12_patch_path_rejected_even_if_hash_updated(self):
  def change(m,r):
   p=next(p for p in m['parts']if p['kind']=='delta');r[p['entry']]=r[p['entry']].replace(b'a/checkpoint.zip',b'a/escape.zip',1);p['patchBytes']=len(r[p['entry']]);p['patchSHA256']=codec.datahash(r[p['entry']])
  self.rejects(self.mutant(change))
 def test_13_identical_checkpoint_copy_branch(self):
  p=self.root/'identical-wrapper.zip';x=codec.pack(self.base,self.base,p);self.assertEqual(x['counts']['copy'],1);codec.restore(p,self.base,self.output(),codec.digest(p));self.assertEqual(self.output().read_bytes(),self.base.read_bytes())
 def test_14_wrapper_budget_preserves_inputs_and_destination(self):
  before=(codec.digest(self.base),codec.digest(self.current))
  with self.assertRaises(ValueError):codec.pack(self.current,self.base,self.output(),max_wrapper_bytes=100)
  self.assertFalse(self.output().exists());self.assertEqual(before,(codec.digest(self.base),codec.digest(self.current)))
 def test_15_reserve_failure_preserves_destination(self):
  with self.assertRaises(ValueError):codec.restore(self.wrapper,self.base,self.output(),self.hash,reserve_bytes=10**15)
  self.assertFalse(self.output().exists())
 def test_16_unsafe_member_name_rejected(self):
  def change(m,r):
   p=next(p for p in m['parts']if p['kind']=='literal');r['../escape.bin']=r.pop(p['entry']);p['entry']='../escape.bin'
  self.rejects(self.mutant(change))
if __name__=='__main__':unittest.main(verbosity=2)
