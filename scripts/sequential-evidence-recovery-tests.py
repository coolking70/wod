import unittest,tempfile,importlib.util,json,os,stat,shutil,zipfile,sys
sys.dont_write_bytecode=True
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('sequence',Path(__file__).with_name('sequential-evidence-recovery.py'));M=importlib.util.module_from_spec(spec);spec.loader.exec_module(M)
class Sequence(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='wod-sequence-test-',dir='/tmp');self.t=Path(self.tmp.name);self.base=self.t/'raw';self.raw=self.base/'v1';self.cache=self.raw/'acceptance';self.ev=self.t/'evidence';self.cp=self.t/'checkpoints';self.scratch=self.t/'scratch';self.out=self.t/'proof';self.archive=self.t/'master.zip';self.keep=self.t/'keep';self.keep.write_bytes(b'unique user evidence');self.original_bases=M.retention.CACHE_BASES;M.retention.CACHE_BASES=(self.base,)
  for p in [self.cache/'browser-v1',self.cache/'browser-v2',self.ev,self.cp,self.scratch]:p.mkdir(parents=True)
  self.build()
 def tearDown(self):M.retention.CACHE_BASES=self.original_bases;self.tmp.cleanup()
 def build(self,payload=1024):
  for j in [1,2]:
   d=self.cache/f'browser-v{j}'
   for i,n in enumerate(['report.json','frame.png']):
    p=d/n;p.write_bytes((('report-%d-'%j).encode()*((payload//9)+1))[:payload]);p.chmod(0o640);ns=1700000000000000000+j*10+i;os.utime(p,ns=(ns,ns))
   cp=self.cp/f'browser-v{j}.zip';cp.unlink(missing_ok=True)
   spec=importlib.util.spec_from_file_location('checkpoint',Path(__file__).with_name('archive-evidence.py'));a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a);a.archive(d,cp)
  (self.ev/'receipt.json').write_bytes(b'fixed original timestamp and ID, not fabricated');self.archive.unlink(missing_ok=True);M.stage.package(self.ev,self.raw,self.cp,self.archive,'v1');self.sha=M.sha(self.archive);self.protected=[{'path':str(self.keep),'sha256':M.sha(self.keep)}];self.cp_before={str(p):(M.sha(p),M.metadata(p))for p in self.cp.glob('*.zip')};self.source_before={str(p):(M.sha(p),M.metadata(p))for p in self.cache.rglob('*')if p.is_file()}
 def run_flow(self,**kw):return M.run(self.archive,self.sha,self.cache,self.out,self.protected,self.scratch,reserve=M.MIN_RESERVE,**kw)
 def intact(self,raw=True):
  self.assertEqual(self.keep.read_bytes(),b'unique user evidence');self.assertEqual(M.sha(self.archive),self.sha)
  for p,(h,m)in self.cp_before.items():self.assertEqual(M.sha(p),h);self.assertEqual(M.metadata(p),m)
  if raw:
   for p,(h,m)in self.source_before.items():self.assertEqual(M.sha(p),h);self.assertEqual(M.metadata(p),m)
 def assert_refused(self,fn):
  with self.assertRaises(Exception):fn()
  self.assertTrue(self.cache.exists())
 def test_success_two_independent_all_file_proofs_then_three_whole_roots_original_cp_master_kept(self):
  r=self.run_flow();self.assertTrue(r['passed']);self.assertFalse(self.cache.exists());self.intact(False);self.assertTrue(r['allThreeRootsPhysicallyRestored']);self.assertTrue(r['wholeRawRestoredAfterRawDuplicateRetirement']);self.assertFalse(r['threeWholeRootsBeforeAnyDuplicateRetirement']);self.assertEqual(r['independentWholeRawReadback']['files'],4);self.assertNotEqual(r['proofImplementations']['first']['sha256'],r['proofImplementations']['independent']['sha256']);self.assertTrue(Path(r['rawPointer']).is_file())
 def test_independent_proof_does_not_call_primary_extractor_or_primary_prove(self):
  p=M.retention.audit(self.archive,self.cache,self.sha)
  with patch.object(M.retention,'extract',side_effect=RuntimeError('primary prohibited')),patch.object(M.retention,'prove',side_effect=RuntimeError('primary prohibited')):r=M.independent_physical_proof(self.archive,p,self.scratch)
  self.assertTrue(r['passed']);self.assertEqual(r['files'],4);self.intact()
 def test_false_second_proof_refuses_before_any_retirement(self):
  real=M.independent_physical_proof
  def bad(*a,**kw):r=real(*a,**kw);r['passed']=False;return r
  with patch.object(M,'independent_physical_proof',side_effect=bad):self.assert_refused(self.run_flow)
  self.intact()
 def test_wrong_archive_sha_refused_without_output(self):
  self.assert_refused(lambda:M.run(self.archive,'0'*64,self.cache,self.out,self.protected,self.scratch));self.assertFalse(self.out.exists());self.intact()
 def test_changed_checkpoint_bytes_refused_even_master_still_valid(self):
  p=next(self.cp.glob('*.zip'));p.write_bytes(p.read_bytes()+b'x');self.assert_refused(self.run_flow);self.assertFalse(self.out.exists());self.assertEqual(self.keep.read_bytes(),b'unique user evidence')
 def test_changed_checkpoint_ns_refused_even_bytes_same(self):
  p=next(self.cp.glob('*.zip'));s=p.stat();os.utime(p,ns=(s.st_mtime_ns+1,s.st_mtime_ns+1));self.assert_refused(self.run_flow);self.assertFalse(self.out.exists())
 def test_unknown_raw_file_is_retained(self):
  p=self.cache/'unique.json';p.write_bytes(b'unarchived unique');self.assert_refused(self.run_flow);self.assertEqual(p.read_bytes(),b'unarchived unique')
 def test_changed_file_during_proofs_refuses_before_retirement(self):
  p=self.cache/'browser-v1/report.json'
  def hook(phase):
   if phase=='second-independent-all-file-physical-proof':p.write_bytes(b'concurrent unique edit')
  self.assert_refused(lambda:self.run_flow(_hook=hook));self.assertEqual(p.read_bytes(),b'concurrent unique edit');self.assertTrue((self.cache/'browser-v2/frame.png').exists())
 def test_changed_directory_metadata_refuses_without_unlink(self):
  def hook(phase):
   if phase=='second-independent-all-file-physical-proof':s=self.cache.stat();os.utime(self.cache,ns=(s.st_mtime_ns+1,s.st_mtime_ns+1))
  self.assert_refused(lambda:self.run_flow(_hook=hook));self.assertTrue((self.cache/'browser-v1/report.json').exists())
 def test_protected_file_inside_cache_is_never_retired(self):
  p=self.cache/'browser-v1/report.json';self.protected.append({'path':str(p),'sha256':M.sha(p)});self.assert_refused(self.run_flow);self.assertFalse(self.out.exists());self.intact()
 def test_protected_file_changed_during_proof_aborts_before_retirement(self):
  def hook(phase):
   if phase=='second-independent-all-file-physical-proof':self.keep.write_bytes(b'changed unique keep')
  self.assert_refused(lambda:self.run_flow(_hook=hook));self.assertEqual(self.keep.read_bytes(),b'changed unique keep')
 def test_archive_changed_after_proof_aborts_before_retirement(self):
  def hook(phase):
   if phase=='second-independent-all-file-physical-proof':self.archive.write_bytes(self.archive.read_bytes()+b'archive changed')
  self.assert_refused(lambda:self.run_flow(_hook=hook));self.assertTrue((self.cache/'browser-v1/report.json').exists())
 def test_evidence_whole_restore_failure_keeps_original_raw_cp_and_master(self):
  real=M.stage.restore
  def fail(a,root,*args,**kw):
   if root=='evidence':raise RuntimeError('evidence restore failure')
   return real(a,root,*args,**kw)
  with patch.object(M.stage,'restore',side_effect=fail):self.assert_refused(self.run_flow)
  self.intact()
 def test_checkpoint_whole_restore_failure_keeps_original_raw_cp_and_master(self):
  real=M.stage.restore
  def fail(a,root,*args,**kw):
   if root=='checkpoints':raise RuntimeError('checkpoint restore failure')
   return real(a,root,*args,**kw)
  with patch.object(M.stage,'restore',side_effect=fail):self.assert_refused(self.run_flow)
  self.intact()
 def test_fault_immediately_before_retirement_keeps_every_original(self):
  def hook(phase):
   if phase=='before-raw-duplicate-retirement':raise RuntimeError('crash before retirement')
  self.assert_refused(lambda:self.run_flow(_hook=hook));self.intact()
 def test_fault_after_retirement_keeps_cp_master_and_can_restore_exact_original_then_rerun(self):
  def hook(phase):
   if phase=='raw-duplicates-retired-with-master-and-original-CP-kept':raise RuntimeError('crash after retirement')
  with self.assertRaises(RuntimeError):self.run_flow(_hook=hook)
  self.assertFalse(self.cache.exists());self.intact(False);plan=json.loads((self.out/'PLAN.json').read_text());M.retention.extract(plan,self.cache);self.intact();self.out=self.t/'proof-after-recovery';r=self.run_flow();self.assertTrue(r['passed']);self.intact(False)
 def test_whole_raw_restore_failure_still_recoverable_from_original_cp_master(self):
  real=M.retention.extract
  def fail(plan,target,streaming=False):
   if not streaming:raise RuntimeError('whole restore failure')
   return real(plan,target,streaming)
  with patch.object(M.retention,'extract',side_effect=fail):
   with self.assertRaises(RuntimeError):self.run_flow()
  self.assertFalse(self.cache.exists());self.intact(False);M.retention.extract(json.loads((self.out/'PLAN.json').read_text()),self.cache);self.intact()
 def test_existing_run_bound_pointer_refuses_before_raw_retirement(self):
  plan=M.retention.audit(self.archive,self.cache,self.sha);pointer=M.pointer_path(self.cache,plan,self.out);pointer.write_bytes(b'unique preexisting pointer');self.assert_refused(self.run_flow);self.assertEqual(pointer.read_bytes(),b'unique preexisting pointer');self.assertFalse(self.out.exists());self.intact()
 def test_existing_proof_output_is_never_overwritten(self):
  self.out.mkdir();p=self.out/'keep';p.write_bytes(b'unique');self.assert_refused(self.run_flow);self.assertEqual(p.read_bytes(),b'unique');self.intact()
 def test_plan_omission_rejected_by_independent_archive_conservation(self):
  p=M.retention.audit(self.archive,self.cache,self.sha);p['files'].pop();self.assert_refused(lambda:M.independent_physical_proof(self.archive,p,self.scratch));self.intact()
 def test_raw_outside_acceptance_prevents_false_whole_raw_coverage_claim(self):
  p=self.raw/'unique-outside.json';p.write_bytes(b'also raw evidence');self.archive.unlink();M.stage.package(self.ev,self.raw,self.cp,self.archive,'v1');self.sha=M.sha(self.archive);self.assert_refused(self.run_flow);self.assertEqual(p.read_bytes(),b'also raw evidence')
 def test_symlink_root_and_symlink_restore_targets_refused(self):
  link=self.t/'alias';link.symlink_to(self.cache);self.assert_refused(lambda:M.run(self.archive,self.sha,link,self.out,self.protected,self.scratch));self.intact()
 def test_capacity_refusal_never_starts_physical_proof_or_deletion(self):
  usage=shutil._ntuple_diskusage(100000000,50000000,1)
  with patch.object(M.shutil,'disk_usage',return_value=usage):self.assert_refused(self.run_flow)
  self.assertFalse(self.out.exists());self.intact()
 def test_runtime_budget_credits_only_already_allocated_exclusive_files(self):
  plan=M.retention.audit(self.archive,self.cache,self.sha);raw=sum(r['bytes']for r in plan['files']);budget=M.capacity(raw,20,20,1024,M.MIN_RESERVE);now=M.remaining_capacity(self.cache,self.scratch,plan,budget);self.assertEqual(now['alreadyAllocatedExclusiveRawCredit'],raw);self.assertEqual(now['additionalRequiredNow'],M.MIN_RESERVE+1024);p=self.cache/'browser-v1/report.json';os.link(p,self.t/'shared-link');now=M.remaining_capacity(self.cache,self.scratch,plan,budget);self.assertEqual(now['alreadyAllocatedExclusiveRawCredit'],0);self.assertEqual(now['additionalRequiredNow'],M.MIN_RESERVE+raw)
 def test_capacity_drop_after_retirement_keeps_master_cp_and_plan_for_recovery(self):
  state={'retired':False};real=M.shutil.disk_usage
  def hook(phase):
   if phase=='raw-duplicates-retired-with-master-and-original-CP-kept':state['retired']=True
  def volume(path):return shutil._ntuple_diskusage(100,99,1)if state['retired']else real(path)
  with patch.object(M.shutil,'disk_usage',side_effect=volume):
   with self.assertRaises(AssertionError):self.run_flow(_hook=hook)
  self.assertFalse(self.cache.exists());self.intact(False);M.retention.extract(json.loads((self.out/'PLAN.json').read_text()),self.cache);self.intact()
 def test_old_two_raw_copy_budget_fails_but_sequential_real_physical_work_passes_bounded_space(self):
  self.build(12*1024**2);raw_bytes=sum(p.stat().st_size for p in self.cache.rglob('*')if p.is_file());cp_bytes=sum(p.stat().st_size for p in self.cp.glob('*.zip'));ev_bytes=sum(p.stat().st_size for p in self.ev.rglob('*')if p.is_file());budget=M.capacity(raw_bytes,cp_bytes,ev_bytes,12*1024**2,M.MIN_RESERVE);available=170*1024**2;self.assertGreater(budget['oldTwoRawCopiesRequired'],available);self.assertLess(budget['tmpRequired'],available);peak=[]
  def hook(phase):
   if phase in ['independent-file-physically-restored','whole-raw-simultaneously-present']:peak.append(sum(p.stat().st_size for p in self.t.rglob('*')if p.is_file()))
  def volume(path):
   free=available-raw_bytes if self.cache.exists()else available
   return shutil._ntuple_diskusage(200*1024**2,200*1024**2-free,free)
  with patch.object(M.shutil,'disk_usage',side_effect=volume):r=self.run_flow(_hook=hook)
  self.assertTrue(r['passed']);self.assertTrue(peak);self.assertLess(max(peak),2*raw_bytes);self.assertEqual(r['independentWholeRawReadback']['files'],4);self.intact(False)
if __name__=='__main__':unittest.main(verbosity=2)
