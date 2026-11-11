import sys
sys.dont_write_bytecode=True
from pathlib import Path
import importlib.util,json,tempfile,unittest,hashlib,os,zipfile,uuid
ROOT=Path(__file__).resolve().parents[1]
def load(name):
 s=importlib.util.spec_from_file_location(name.replace('-','_'),ROOT/'scripts'/(name+'.py'));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
c=load('file-binding-evidence');checker=load('protected-evidence-bindings')
class FileBindings(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(prefix='wod-file-bindings-test-');self.p=Path(self.tmp.name);self.src=self.p/'source';self.src.write_bytes(b'actual retained bytes');self.h=c.sha(self.src);self.origin='/tmp/wod-unavailable-'+uuid.uuid4().hex+'/a.json';self.rows=[dict(path=self.origin,bytes=self.src.stat().st_size,sha256=self.h,mode=0o640,mtimeNs=1234567890123456789),dict(path=self.origin+'-copy',sha256=self.h)];self.archive=self.p/'bindings.zip';c.pack(self.rows,{self.h:c.record(self.src)},self.archive);self.ah=c.sha(self.archive)
 def tearDown(self):self.tmp.cleanup()
 def catalog(self):
  proofs=[]
  for decoder in ['primary','independent-native']:
   proof=c.restore(self.archive,self.ah,self.p/('restored-'+decoder),decoder);proof['archiveSHA256']=self.ah;p=self.p/(decoder+'.json');p.write_text(json.dumps(proof));proofs.append(c.record(p))
  cat=self.p/'catalog.json';cat.write_text(json.dumps(dict(format='wod-file-binding-catalog',version=1,archive=c.record(self.archive),proofs=proofs)));return c.record(cat)
 def test_two_decoders_restore_every_recorded_field_without_inventing_missing_metadata(self):
  cat=self.catalog();bindings=c.catalog_bindings(cat['path'],cat['sha256']);self.assertEqual(bindings[self.origin]['mtimeNs'],self.rows[0]['mtimeNs']);self.assertNotIn('mtimeNs',bindings[self.origin+'-copy']);self.assertNotIn('mode',bindings[self.origin+'-copy'])
 def test_default_verifier_stays_strict_and_explicit_catalog_recovers_only_known_bindings(self):
  cat=self.catalog()
  with self.assertRaises(Exception):checker.verify(self.rows,self.p/'absent',self.h)
  proof=checker.verify(self.rows,self.p/'absent',self.h,file_catalogs=[cat]);self.assertTrue(proof['passed']);self.assertEqual(proof['recoveredFileBindings'],2)
 def test_recorded_mode_or_timestamp_cannot_be_silently_weakened(self):
  cat=self.catalog();row=dict(self.rows[1],mode=0o640)
  with self.assertRaisesRegex(ValueError,'recorded file field'):checker.verify([row],self.p/'absent',self.h,file_catalogs=[cat])
 def test_actual_original_file_mutation_is_not_hidden_by_a_clean_alias(self):
  original=self.p/'real-original';row=dict(self.rows[0],path=str(original));a=self.p/'actual-alias.zip';c.pack([row],{self.h:c.record(self.src)},a)
  oldRows=self.rows;oldArchive=self.archive;oldAH=self.ah;self.rows=[row];self.archive=a;self.ah=c.sha(a);cat=self.catalog();original.write_bytes(b'changed')
  with self.assertRaisesRegex(ValueError,'Physical protected'):checker.verify([row],self.p/'absent',self.h,file_catalogs=[cat])
 def test_existing_destination_is_preserved(self):
  t=self.p/'existing';t.mkdir();(t/'keep').write_bytes(b'keep')
  with self.assertRaises(ValueError):c.restore(self.archive,self.ah,t)
  self.assertEqual((t/'keep').read_bytes(),b'keep')
 def test_external_dependency_is_read_only_and_metadata_bound(self):
  a=self.p/'external.zip';r=c.record(self.src);c.pack(self.rows,{self.h:r},a,external={self.h:r});h=c.sha(a);self.assertTrue(c.restore(a,h,self.p/'external-restored')['passed']);self.src.chmod(0o600 if r['mode']!=0o600 else 0o644)
  with self.assertRaisesRegex(ValueError,'Dependency differs'):c.inspect(a,h)
 def test_wrong_source_digest_fails_before_publication(self):
  r=dict(c.record(self.src),sha256='0'*64);dest=self.p/'wrong-source.zip'
  with self.assertRaises(ValueError):c.pack(self.rows,{self.h:r},dest)
  self.assertFalse(dest.exists())
 def test_traversal_noncanonical_paths_and_duplicate_origins_are_rejected(self):
  for bad in ['/tmp/../etc/passwd','/tmp//a','//tmp/a','relative','/tmp/a\\b','/tmp/a\0b']:
   with self.assertRaises(ValueError):c.origin(bad)
  with self.assertRaises(ValueError):c.pack([self.rows[0],self.rows[0]],{self.h:c.record(self.src)},self.p/'dup.zip')
 def test_payload_tampering_and_unlisted_members_are_rejected(self):
  with self.assertRaises(ValueError):c.inspect(self.archive,'0'*64)
  with zipfile.ZipFile(self.archive,'a') as z:z.writestr('unexpected',b'not in map')
  with self.assertRaisesRegex(ValueError,'Unexpected archive'):c.inspect(self.archive,c.sha(self.archive))
 def test_symlink_sources_are_rejected(self):
  link=self.p/'link';link.symlink_to(self.src)
  with self.assertRaises(ValueError):c.record(link)
 def test_cold_proofs_must_cover_the_same_archive_and_file_count(self):
  cat=self.catalog();p=self.p/'primary.json';x=json.loads(p.read_text());x['archiveSHA256']='0'*64;p.write_text(json.dumps(x));v=json.loads(Path(cat['path']).read_text());v['proofs'][0]=c.record(p);Path(cat['path']).write_text(json.dumps(v))
  with self.assertRaisesRegex(ValueError,'Incomplete cold'):c.catalog_bindings(cat['path'],c.sha(cat['path']))
 def test_cold_proof_scope_mismatch_is_rejected(self):
  cat=self.catalog();p=self.p/'primary.json';x=json.loads(p.read_text());x['files']=1;p.write_text(json.dumps(x));v=json.loads(Path(cat['path']).read_text());v['proofs'][0]=c.record(p);Path(cat['path']).write_text(json.dumps(v))
  with self.assertRaisesRegex(ValueError,'scope differs'):c.catalog_bindings(cat['path'],c.sha(cat['path']))
 def test_original_namespaces_cannot_be_used_as_restore_destinations(self):
  row=dict(self.rows[0],path=str(self.p/'old/file'));a=self.p/'namespace.zip';c.pack([row],{self.h:c.record(self.src)},a)
  with self.assertRaisesRegex(ValueError,'Original namespace'):c.restore(a,c.sha(a),self.p/'old')
if __name__=='__main__':unittest.main()
