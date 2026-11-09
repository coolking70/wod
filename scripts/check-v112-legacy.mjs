import './capture-bootstrap.cjs';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {adventureConfig,ADVENTURES} from '../dist/expedition-adventure.mjs';import {simulate} from '../dist/expedition-engine.mjs';import {HEROES,clone} from '../dist/expedition-data.mjs';
const ref=resolve(process.argv[2]),oldData=await import(pathToFileURL(resolve(ref,'dist/expedition-adventure.mjs')).href),old=await import(pathToFileURL(resolve(ref,'dist/expedition-engine.mjs')).href),rows=[];
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
for(const a of ADVENTURES)for(const seed of [1,731]){
 const c=adventureConfig(a.id),before=oldData.adventureConfig(a.id);c.seed=seed;before.seed=seed;assert.deepEqual(c,before,a.id+' config');
 const current=simulate(c),prior=old.simulate(before),normalized=clone(current),allowed=[];
 for(const u of normalized.party){const template=HEROES.find(h=>h.id===u.id);if(template?.classId!=='herbalist')continue;const oldUnit=prior.party.find(h=>h.id===u.id),h=c.heroes.find(h=>h.id===u.id);assert.equal(Object.hasOwn(oldUnit.skills,'groupheal'),false);const expected=template.base+(h.trained==='groupheal'?3:0)+(h.training['skill:groupheal']||0);assert.equal(u.skills.groupheal,expected);allowed.push({path:'party.'+u.id+'.skills.groupheal',before:'absent',after:expected});delete u.skills.groupheal;}
 assert.equal(allowed.length,1);assert.deepEqual(normalized,prior,a.id+'/'+seed+' full report after exact verified catalog addition');rows.push({route:a.id,seed,allowed,priorSha256:hash(prior),currentSha256:hash(current),normalizedSha256:hash(normalized)});
}
writeFileSync(process.argv[3],JSON.stringify({reference:execFileSync('git',['rev-parse','HEAD'],{cwd:ref,encoding:'utf8'}).trim(),count:rows.length,rawFullEqual:false,normalizedFullEqual:true,allowedDifference:'Only exactly checked new herbalist groupheal skill catalog level; no config, event, RNG, outcome, resource or statistic differences.',rows},null,2));console.log(rows.length+' full reports equal after exact catalog addition check');
