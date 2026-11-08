from pathlib import Path
import importlib.util,json,tempfile,unittest,sys,shutil,stat,os,zipfile,hashlib
sys.dont_write_bytecode=True
HERE=Path(__file__).parent
def module(name):
 spec=importlib.util.spec_from_file_location(name.replace('-','_'),HERE/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
fixtures=module('byte-delta-evidence-tests');store=module('durable-evidence-store');independent=module('byte-delta-independent')
class StoreTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  fixtures.DeltaTests.setUpClass();cls.f=fixtures.DeltaTests;cls.root=cls.f.root/'durable';cls.root.mkdir();cls.logical=cls.root/'missing-original.zip';cls.wrapper=cls.root/'wrapper.zip';shutil.copy2(cls.f.wrapper,cls.wrapper);cls.proof=cls.root/'proof.json';decoded=cls.root/'independent.zip';independent.restore(cls.wrapper,cls.f.base,decoded,store.sha(cls.wrapper));assert decoded.read_bytes()==cls.f.current.read_bytes();assert fixtures.stage.verify(decoded)['passed']
  for root in['raw','checkpoints','evidence']:
   output=cls.root/('whole-'+root);assert fixtures.stage.restore(decoded,root,output)['passed']
  st=decoded.stat();cls.proof.write_text(json.dumps({'passed':True,'target':{'sha256':store.sha(decoded)},'wrapper':{'sha256':store.sha(cls.wrapper)},'independentColdDecoderPassed':True,'threeWholeRootsReadBack':True}))
  def row(p):return {'path':str(p),'bytes':p.stat().st_size,'sha256':store.sha(p)}
  cls.row={'logicalPath':str(cls.logical),'bytes':st.st_size,'sha256':store.sha(decoded),'mode':stat.S_IMODE(st.st_mode),'mtimeNs':st.st_mtime_ns,'wrapper':row(cls.wrapper),'base':row(cls.f.base),'verification':row(cls.proof)};cls.catalog=cls.root/'catalog.json';cls.catalog.write_text(json.dumps({'format':'wod-durable-evidence-catalog','version':1,'entries':{str(cls.logical):cls.row}}));cls.catalogHash=store.sha(cls.catalog)
 @classmethod
 def tearDownClass(cls):fixtures.DeltaTests.tearDownClass()
 def restore(self,catalog=None,h=None,expected=None):return store.materialized(self.logical,expected or self.row['sha256'],catalog=catalog or self.catalog,catalog_sha256=h or self.catalogHash)
 def mutant(self,change):
  p=self.root/(self._testMethodName+'.json');x=json.loads(self.catalog.read_text());change(x['entries'][str(self.logical)]);p.write_text(json.dumps(x));return p
 def test_01_missing_original_restored_without_historical_writes(self):
  with self.restore()as p:self.assertEqual(p.read_bytes(),self.f.current.read_bytes());held=p
  self.assertFalse(held.exists());self.assertFalse(self.logical.exists())
 def test_02_corrupt_catalog_hash_refused(self):
  with self.assertRaises(ValueError):
   with self.restore(h='0'*64):pass
 def test_03_wrong_logical_identity_refused(self):
  p=self.mutant(lambda r:r.update(logicalPath='/tmp/another-original.zip'))
  with self.assertRaises(ValueError):
   with self.restore(p,store.sha(p)):pass
 def test_04_wrong_expected_target_digest_refused(self):
  with self.assertRaises(ValueError):
   with self.restore(expected='0'*64):pass
 def test_05_base_digest_refused(self):
  p=self.mutant(lambda r:r['base'].update(sha256='0'*64))
  with self.assertRaises(ValueError):
   with self.restore(p,store.sha(p)):pass
 def test_06_wrapper_digest_refused(self):
  p=self.mutant(lambda r:r['wrapper'].update(sha256='0'*64))
  with self.assertRaises(ValueError):
   with self.restore(p,store.sha(p)):pass
 def test_07_missing_proof_refused(self):
  p=self.mutant(lambda r:r['verification'].update(path=str(self.root/'none.json')))
  with self.assertRaises(ValueError):
   with self.restore(p,store.sha(p)):pass
 def test_08_metadata_diff_refused(self):
  p=self.mutant(lambda r:r.update(mtimeNs=r['mtimeNs']+1))
  with self.assertRaises(ValueError):
   with self.restore(p,store.sha(p)):pass
 def test_09_existing_different_original_preserved(self):
  p=self.root/'user-file.bin';p.write_bytes(b'keep-user-original')
  with self.assertRaises(ValueError):
   with store.materialized(p,self.row['sha256']):pass
  self.assertEqual(p.read_bytes(),b'keep-user-original')
 def test_10_independent_decoder_existing_destination_refused(self):
  p=self.root/'user-output.bin';p.write_bytes(b'keep-user-output')
  with self.assertRaises(ValueError):independent.restore(self.wrapper,self.f.base,p,store.sha(self.wrapper))
  self.assertEqual(p.read_bytes(),b'keep-user-output')
 def test_11_independent_decoder_wrong_hash_leaves_no_output(self):
  p=self.root/'wrong-hash.zip'
  with self.assertRaises(ValueError):independent.restore(self.wrapper,self.f.base,p,'0'*64)
  self.assertFalse(p.exists())
 def test_12_independent_decoder_reserve_leaves_no_output(self):
  p=self.root/'reserve.zip'
  with self.assertRaises(ValueError):independent.restore(self.wrapper,self.f.base,p,store.sha(self.wrapper),reserve=10**15)
  self.assertFalse(p.exists())
 def test_13_verify_manifest_keeps_logical_identity(self):
  r=store.verify_rows([{'path':str(self.logical),**{k:self.row[k]for k in['sha256','bytes','mode','mtimeNs']}}],catalog=self.catalog,catalog_sha256=self.catalogHash);self.assertEqual(r['logicalOriginalsReconstructed'],[str(self.logical)]);self.assertFalse(self.logical.exists())
 def test_14_missing_original_without_catalog_refused(self):
  with self.assertRaises(ValueError):
   with store.materialized(self.logical,self.row['sha256']):pass
 def corrupt_wrapper(self,change):
  p=self.root/(self._testMethodName+'-wrapper.zip')
  with zipfile.ZipFile(self.wrapper)as z:rows={n:z.read(n)for n in z.namelist()}
  m=json.loads(rows['DELTA_INDEX.json']);change(m,rows);rows['DELTA_INDEX.json']=json.dumps(m).encode()
  with zipfile.ZipFile(p,'x')as z:
   for n,data in rows.items():fixtures.codec.info_write(z,n,data)
  target=self.root/(self._testMethodName+'-out.zip')
  with self.assertRaises(ValueError):independent.restore(p,self.f.base,target,store.sha(p))
  self.assertFalse(target.exists())
 def test_15_independent_noncontiguous_ranges_refused(self):self.corrupt_wrapper(lambda m,r:m['parts'][0].update(offset=1))
 def test_16_independent_wrong_checkpoint_count_refused(self):self.corrupt_wrapper(lambda m,r:m.update(checkpointCount=0))
 def test_17_independent_unsafe_patch_header_refused(self):
  def mutate(m,r):
   p=next(p for p in m['parts']if p['kind']=='delta');r[p['entry']]=r[p['entry']].replace(b'a/checkpoint.zip',b'a/escape.zip');p['patchBytes']=len(r[p['entry']]);p['patchSHA256']=hashlib.sha256(r[p['entry']]).hexdigest()
  self.corrupt_wrapper(mutate)
 def test_18_independent_wrong_original_digest_refused(self):self.corrupt_wrapper(lambda m,r:m['target'].update(sha256='0'*64))
 def test_19_independent_untracked_payload_refused(self):self.corrupt_wrapper(lambda m,r:r.update({'untracked.bin':b'x'}))
 def test_20_independent_literal_corruption_refused(self):
  def mutate(m,r):
   p=next(p for p in m['parts']if p['kind']=='literal');r[p['entry']]=b'X'+r[p['entry']][1:]
  self.corrupt_wrapper(mutate)
if __name__=='__main__':unittest.main(verbosity=2)
