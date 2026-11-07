import importlib.util,unittest,tempfile,zipfile,json,hashlib,io,os,stat,shutil,copy
from pathlib import Path
spec=importlib.util.spec_from_file_location('retention',Path(__file__).resolve().parents[1]/'scripts/retire-archived-evidence.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class RecoveryTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='wod-retention-test-',dir='/tmp');self.t=Path(self.tmp.name);self.base=self.t/'wod-evidence';self.root=self.base/'v999'/'acceptance';(self.root/'room').mkdir(parents=True);self.old=m.CACHE_BASES;m.CACHE_BASES=(self.base,);self.data={'room/report.json':b'{"createdAt":"2026-11-07T01:02:03Z","id":47,"failed":true}','room/state.bin':bytes(range(256))*3}
  for n,b in self.data.items():
   p=self.root/n;p.write_bytes(b);p.chmod(0o600);os.utime(p,ns=(1600000000123456789,1600000000123456789))
  for p in [self.root/'room',self.root]:p.chmod(0o700);os.utime(p,ns=(1600000000987654321,1600000000987654321))
  self.archive=self.t/'primary.zip';self.flat();self.plan=m.audit(self.archive,self.root,m.digest(self.archive))
 def tearDown(self):m.CACHE_BASES=self.old;self.tmp.cleanup()
 def flat(self):
  with zipfile.ZipFile(self.archive,'w',zipfile.ZIP_DEFLATED)as z:
   for n in self.data:z.write(self.root/n,'v999/acceptance/'+n)
 def test_01_flat_records_full_bytes_export_fields_and_current_ns(self):
  self.assertEqual(len(self.plan['files']),2);self.assertTrue(self.plan['legacyFlatCurrentNanosecondMetadataCapturedSeparately']);self.assertEqual(self.plan['files'][0]['mtimeNs'],1600000000123456789);self.assertEqual(self.plan['directories'][0]['mtimeNs'],1600000000987654321)
 def test_02_bad_archive_sha_rejected(self):
  with self.assertRaises(ValueError):m.audit(self.archive,self.root,'0'*64)
 def test_03_unique_unarchived_file_is_not_retired(self):
  (self.root/'unique.txt').write_text('keep')
  with self.assertRaises(ValueError):m.audit(self.archive,self.root,m.digest(self.archive))
  self.assertTrue((self.root/'unique.txt').exists())
 def test_04_missing_source_path_blocks_incomplete_plan(self):
  (self.root/'room/state.bin').unlink()
  with self.assertRaises(ValueError):m.audit(self.archive,self.root,m.digest(self.archive))
 def test_05_symlink_file_and_parent_are_rejected(self):
  p=self.root/'room/state.bin';p.unlink();p.symlink_to(self.t/'unrelated')
  with self.assertRaises(ValueError):m.audit(self.archive,self.root,m.digest(self.archive))
  a=self.t/'alias';a.symlink_to(self.base,target_is_directory=True)
  with self.assertRaises(ValueError):m.guard(a/'v999/acceptance')
 def test_06_source_checkout_and_unversioned_root_rejected(self):
  for p in [self.t,self.base/'acceptance',self.base/'notes/acceptance',self.base/'v999/source']:
   with self.assertRaises(ValueError):m.guard(p,False)
 def test_07_unsafe_archive_path_rejected(self):
  with zipfile.ZipFile(self.archive,'a')as z:z.writestr('../outside',b'bad')
  with self.assertRaises(ValueError):m.audit(self.archive,self.root,m.digest(self.archive))
 def test_08_missing_or_foreign_proof_preserves_all_files(self):
  for p in [{},{'passed':True,'files':2,'planSHA256':'0'*64}]:
   with self.assertRaises(ValueError):m.retire(self.plan,p,True)
  self.assertEqual(set(m.inventory(self.root)[0]),set(self.data))
 def test_09_modified_plan_invalidates_prior_physical_proof(self):
  proof=m.prove(self.plan);p=copy.deepcopy(self.plan);p['directories'][0]['mtimeNs']+=1
  with self.assertRaises(ValueError):m.retire(p,proof,True)
  self.assertTrue(self.root.exists())
 def test_10_changed_content_blocks_before_any_unlink(self):
  proof=m.prove(self.plan);(self.root/'room/state.bin').write_bytes(b'changed')
  with self.assertRaises(ValueError):m.retire(self.plan,proof,True)
  self.assertEqual((self.root/'room/report.json').read_bytes(),self.data['room/report.json'])
 def test_11_changed_mode_or_ns_blocks_retirement(self):
  proof=m.prove(self.plan);p=self.root/'room/state.bin';p.chmod(0o644)
  with self.assertRaises(ValueError):m.retire(self.plan,proof,True)
  p.chmod(0o600);os.utime(p,ns=(1600000000123456790,1600000000123456790))
  with self.assertRaises(ValueError):m.retire(self.plan,proof,True)
 def test_12_nested_original_container_bytes_and_metadata(self):
  buf=io.BytesIO()
  with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED)as z:
   for n,b in self.data.items():z.writestr('browser-v999/'+n,b)
  raw=buf.getvalue();entry='v999/checkpoints/browser-v999.zip';rows=[]
  for n,b in self.data.items():
   s=m.statrow(self.root/n);rows.append({'path':'acceptance/'+n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'container':entry,'entry':'browser-v999/'+n,'sources':[{'root':'raw','path':str(self.root/n),'mode':s['mode'],'mtimeNs':s['mtimeNs']}]})
  index={'format':'wod-checkpoint-stage','version':1,'prefix':'v999','containers':[{'entry':entry,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}],'objects':rows}
  with zipfile.ZipFile(self.archive,'w')as z:z.writestr(entry,raw);z.writestr('v999/.stage-evidence-index.json',json.dumps(index))
  p=m.audit(self.archive,self.root,m.digest(self.archive));self.assertEqual(p['archiveKind'],'nested-v1');proof=m.prove(p);self.assertEqual(proof['files'],2)
 def test_13_changed_existing_restore_target_never_overwritten(self):
  target=self.t/'restore';(target/'room').mkdir(parents=True);f=target/'room/report.json';f.write_bytes(b'user change')
  with self.assertRaises(ValueError):m.extract(self.plan,target)
  self.assertEqual(f.read_bytes(),b'user change');self.assertFalse((target/'room/state.bin').exists())
 def test_14_dry_run_leaves_cache_and_archive_exact(self):
  proof=m.prove(self.plan);before=m.digest(self.archive);r=m.retire(self.plan,proof);self.assertTrue(r['dryRun']);self.assertEqual(m.digest(self.archive),before);self.assertTrue(self.root.exists())
 def test_15_actual_retirement_and_full_restore_preserve_all_file_and_directory_metadata(self):
  proof=m.prove(self.plan);self.assertFalse(proof['originalCacheReadForRestore']);self.assertTrue(proof['allFilesPhysicallyRestoredIndividually']);r=m.retire(self.plan,proof,True);self.assertFalse(r['dryRun']);self.assertFalse(self.root.exists());self.assertEqual(m.digest(self.archive),self.plan['archiveSHA256']);m.extract(self.plan,self.root)
  files,dirs=m.inventory(self.root);self.assertEqual(dirs,self.plan['directories'])
  for row in self.plan['files']:self.assertEqual(m.statrow(files[row['relative']]),{k:row[k]for k in ['bytes','mode','mtimeNs']});self.assertEqual(files[row['relative']].read_bytes(),self.data[row['relative']])
 def test_16_modified_archive_blocks_prove_and_keeps_original_cache(self):
  with self.archive.open('ab')as f:f.write(b'changed')
  with self.assertRaises(ValueError):m.prove(self.plan)
  self.assertTrue(self.root.exists());self.assertEqual((self.root/'room/state.bin').read_bytes(),self.data['room/state.bin'])
 def test_17_snapshot_covers_originally_unarchived_png_and_nanosecond_metadata(self):
  image=self.root/'unique.png';image.write_bytes(b'PNG-original-failure');p=self.t/'snapshot.zip';r=m.snapshot(self.root,p);self.assertEqual(r['files'],3);self.assertEqual(r['images'],1);plan=m.audit(p,self.root,r['archiveSHA256']);self.assertEqual(plan['archiveKind'],'snapshot-v1');self.assertEqual(len(plan['files']),3)
 def test_18_snapshot_restores_alone_after_original_cache_and_plan_are_gone(self):
  p=self.t/'snapshot.zip';r=m.snapshot(self.root,p);plan=m.audit(p,self.root,r['archiveSHA256']);proof=m.prove(plan);m.retire(plan,proof,True);del plan;del proof;m.restore_snapshot(p,r['archiveSHA256'],self.root)
  for n,b in self.data.items():self.assertEqual((self.root/n).read_bytes(),b);self.assertEqual((self.root/n).stat().st_mtime_ns,1600000000123456789)
 def test_19_changed_snapshot_sha_prevents_standalone_restore(self):
  p=self.t/'snapshot.zip';r=m.snapshot(self.root,p)
  with p.open('ab')as f:f.write(b'changed')
  with self.assertRaises(ValueError):m.restore_snapshot(p,r['archiveSHA256'],self.t/'restore')
  self.assertFalse((self.t/'restore').exists());self.assertTrue(self.root.exists())
 def test_20_snapshot_never_overwrites_existing_target_or_writes_inside_cache(self):
  p=self.t/'keep.zip';p.write_bytes(b'user data')
  with self.assertRaises(ValueError):m.snapshot(self.root,p)
  self.assertEqual(p.read_bytes(),b'user data')
  with self.assertRaises(ValueError):m.snapshot(self.root,self.root/'bad.zip')
  self.assertFalse((self.root/'bad.zip').exists())
 def test_21_low_disk_refuses_snapshot_and_restore_before_creating_output(self):
  from unittest.mock import patch
  from types import SimpleNamespace
  with patch.object(m.shutil,'disk_usage',return_value=SimpleNamespace(free=0)):
   with self.assertRaises(ValueError):m.snapshot(self.root,self.t/'no-space.zip')
   with self.assertRaises(ValueError):m.extract(self.plan,self.t/'no-space-restore')
  self.assertFalse((self.t/'no-space.zip').exists());self.assertFalse((self.t/'no-space-restore').exists());self.assertTrue(self.root.exists())
if __name__=='__main__':unittest.main(verbosity=2)
