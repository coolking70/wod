import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as data from '../dist/expedition-data.mjs';
import {simulate,RULESET} from '../dist/expedition-engine.mjs';
import {disruptionFixture} from './disruption-cases.mjs';
import {personalReport} from '../dist/expedition-personal.mjs';
import {newGuild,guildConfig} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
const rows=[];
for(const kind of ['early','late','miss','absorbed','expiry','double','enemy','item']){
 const f=disruptionFixture(kind),r=simulate(f.config,f.options),again=simulate(f.config,f.options);assert.deepEqual(again,r);
 const effects=r.events.filter(e=>e.type==='effect'&&e.detail.harmful),blocked=r.events.filter(e=>e.type==='skip'&&e.detail.healingBlock);
 for(const e of blocked){const origin=effects.find(o=>o.detail.effectId===e.detail.healingBlock.effectId);assert.ok(origin&&origin.id<e.id);assert.equal(origin.actor,e.detail.healingBlock.source);assert.ok(origin.targets.includes(e.actor));}
 rows.push({kind,applied:effects.length,blocked:blocked.length,heals:r.events.filter(e=>e.type==='heal').length,remainingRunes:r.supplies.rune,sourceEvents:effects.map(e=>e.id),blockedEvents:blocked.map(e=>e.id)});
}
const guild=setCompanion(selectHero(newGuild(),'c'),'d','suppress'),c=guildConfig(guild,data.hospiceConfig('front'));c.seed=1;const real=simulate(c),personal=personalReport(real,'d');
const playable={route:'hospice',seed:1,training:c.heroes.find(h=>h.id==='d').training,won:real.won,rooms:real.rooms.length,alive:real.party.filter(u=>u.hp>0).length,applied:personal.total.controlApplications,blocked:personal.total.healingBlocks};
let unchanged=null;
if(process.argv[2]){
 const reference=resolve(process.argv[2]),oldEngine=await import(pathToFileURL(resolve(reference,'dist/expedition-engine.mjs')).href),oldData=await import(pathToFileURL(resolve(reference,'dist/expedition-data.mjs')).href);
 const configurations=[['classic',()=>data.defaults(),()=>oldData.defaults()],['harbor',()=>data.harborConfig(),()=>oldData.harborConfig()],['veteran',()=>data.trialConfig('veteran','adapted'),()=>oldData.trialConfig('veteran','adapted')]];
 const cases=[];
 for(const [name,make,oldMake] of configurations)for(const seed of [1,3,731]){
  const config=make(),oldConfig=oldMake();config.seed=oldConfig.seed=seed;assert.deepEqual(config,oldConfig);
  const current=simulate(config),previous=oldEngine.simulate(oldConfig);
  for(const field of ['events','rooms','stats','supplies','won','config','version'])assert.deepEqual(current[field],previous[field],name+':'+seed+':'+field);
  const party=structuredClone(current.party);for(const u of party)delete u.skills.suppress;assert.deepEqual(party,previous.party);
  cases.push({route:name,seed,events:current.events.length,won:current.won});
 }
 unchanged={referenceCommit:'990fca06b669b5b23e569bc821fa54b225840c12',count:cases.length,cases,note:'All event streams, snapshots, outcomes, configs, resources and statistics match. RULESET changes to 0.49; the party skill inventory adds suppress capability for scholars only.'};
 console.log('Old-config exact event equivalence:',cases.length);
}
writeFileSync('docs/V49_CHECKS.json',JSON.stringify({ruleset:RULESET,note:'Boundary fixtures use explicit test-only attributes and are not progression, rewards or balance samples. Playable case is a single normal hospice run, not a win-rate estimate.',rows,playable,unchanged},null,2)+'\n');
console.log('Playable skill case:',JSON.stringify(playable));
