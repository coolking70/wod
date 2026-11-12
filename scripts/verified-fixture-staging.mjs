import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const digest=p=>{const h=createHash('sha256'),fd=fs.openSync(p,'r'),b=Buffer.alloc(1024*1024);try{for(let n;(n=fs.readSync(fd,b,0,b.length,null));)h.update(b.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');};
const fail=s=>{throw Error('Verified fixture staging: '+s);};
function absolute(p){if(typeof p!=='string'||!path.isAbsolute(p)||path.resolve(p)!==p)fail('explicit canonical absolute path required');return p;}
function regular(p){const s=fs.lstatSync(p,{bigint:true});if(!s.isFile()||s.isSymbolicLink())fail('regular source file required');return s;}
function noLinks(p,stop){for(let q=p;;q=path.dirname(q)){const s=fs.lstatSync(q);if(s.isSymbolicLink())fail('symbolic link refused');if(q===stop)break;if(q===path.dirname(q))fail('outside expected root');}}
function checked(p,r){const s=regular(p);if(Number(s.size)!==r.bytes||Number(s.mode&0o777n)!==r.mode||s.mtimeNs.toString()!==r.mtimeNs||digest(p)!==r.sha256)fail('source or staged bytes/mode/ns changed: '+p);return s;}
export function stageVerifiedFixtures({manifestPath,manifestSHA256,out,sourceRoot,versions}){
 absolute(manifestPath);absolute(out);absolute(sourceRoot);if(!/^[a-f0-9]{64}$/.test(manifestSHA256||''))fail('explicit manifest SHA256 required');regular(manifestPath);if(digest(manifestPath)!==manifestSHA256)fail('manifest digest differs');if(fs.statSync(manifestPath).size>25*1024**2)fail('oversize manifest');const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(m.format!=='wod-verified-complete-browser-fixtures'||m.version!==2||JSON.stringify(m.registry)!==JSON.stringify(versions)||new Set(versions).size!==versions.length)fail('complete ordered registry differs');
 const original=absolute(m.originalRoot);if(fs.realpathSync(original)!==original||fs.realpathSync(out)!==out||fs.realpathSync(sourceRoot)!==sourceRoot||out===original||out.startsWith(original+path.sep)||original.startsWith(out+path.sep))fail('roots overlap or alias');if(fs.readdirSync(out).length)fail('new owned case root must be empty');
 if(!Array.isArray(m.files)||!m.files.length||m.files.length>10000||!Array.isArray(m.compatibleRuntime)||!m.compatibleRuntime.length)fail('bounded complete manifest required');
 for(const r of m.compatibleRuntime){if(typeof r.path!=='string'||r.path.split('/').some(x=>!x||x==='.'||x==='..')||path.isAbsolute(r.path))fail('runtime path escapes');const p=path.join(sourceRoot,r.path);noLinks(p,sourceRoot);if(!regular(p).isFile()||Number(fs.statSync(p).size)!==r.bytes||digest(p)!==r.sha256)fail('fixture generator or product source changed: '+r.path);}
 const names=new Set(),rows=[];let total=0;
 for(const r of m.files){if(typeof r.relative!=='string'||path.isAbsolute(r.relative)||r.relative.split('/').some(x=>!x||x==='.'||x==='..')||!versions.some(v=>r.relative.startsWith('browser-v'+v+'/'))||names.has(r.relative)||!Number.isSafeInteger(r.bytes)||r.bytes<0||r.bytes>512*1024**2||!Number.isInteger(r.mode)||r.mode<0||r.mode>0o777||!/^\d+$/.test(r.mtimeNs)||!/^[a-f0-9]{64}$/.test(r.sha256))fail('invalid, duplicate or escaping input binding');names.add(r.relative);const source=path.join(original,r.relative),target=path.join(out,r.relative);if(r.path!==source)fail('original absolute path differs');noLinks(source,original);const stat=checked(source,r);if(stat.dev!==fs.statSync(out,{bigint:true}).dev)fail('shared-input mode requires the same filesystem; no unbudgeted copy fallback');rows.push({...r,source,target});total+=r.bytes;}
 if(total>6*1024**3)fail('input total exceeds bound');
 // Exclusive links share immutable input bytes only. Existing capture guards
 // continue to reject every attempt to overwrite these already-present files.
 // This is not an OS security boundary: verify both names again after all GUI.
 for(const r of rows){fs.mkdirSync(path.dirname(r.target),{recursive:true});fs.linkSync(r.source,r.target);checked(r.source,r);checked(r.target,r);const a=fs.statSync(r.source,{bigint:true}),b=fs.statSync(r.target,{bigint:true});if(a.ino!==b.ino||a.dev!==b.dev)fail('physical input sharing did not occur');}
 return {manifestPath,manifestSHA256,originalRoot:original,stagedRoot:out,versions,rows,files:rows.length,logicalInputBytes:total,physicalPayloadCopiedBytes:0,sourceAndTargetBeforeGUIExact:true,noCLIRegeneration:true,noOverwriteOrFallbackCopy:true};
}
export function verifyStagedFixtures(staged){for(const r of staged.rows){checked(r.source,r);checked(r.target,r);}return {passed:true,manifestPath:staged.manifestPath,manifestSHA256:staged.manifestSHA256,files:staged.files,allSourceAndStagedBytesModesNsExactAfterGUI:true,sharedReadOnlyInputConventionNotOSIsolation:true};}
