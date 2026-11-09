import './capture-bootstrap.cjs';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {defaults,harborConfig,trialConfig} from '../dist/expedition-data.mjs';import {simulate,RULESET} from '../dist/expedition-engine.mjs';
import {advancementReadyGuild} from './advancement-cases.mjs';import {chooseAdvancement,guildConfig} from '../dist/expedition-guild.mjs';import {advancementOptions} from '../dist/expedition-advancement-data.mjs';import {experienceLedger} from '../dist/expedition-growth.mjs';import {PROGRESSION_RULES} from '../dist/expedition-progression-rules.mjs';
if(!process.argv[2])throw Error('Pass a v0.57 reference worktree; equivalence is required.');
const old=await import(pathToFileURL(resolve(process.argv[2],'dist/expedition-engine.mjs')).href);let unchanged=0;
const compare=c=>{assert.deepEqual(simulate(c),old.simulate(c));unchanged++;};
for(const make of [defaults,harborConfig,()=>trialConfig('veteran','adapted')])for(const seed of [1,3,731]){const c=make();c.seed=seed;compare(c);}
const base=advancementReadyGuild(),rows=[];for(const id of ['a','b','c','d','e','f'])for(const [path] of advancementOptions(id)){const g=chooseAdvancement(base,id,path),c=guildConfig(g,defaults());compare(c);const l=experienceLedger(g.members.find(m=>m.id===id));assert.equal(l.earned,l.available+l.training+l.courses+l.advancement);rows.push({id,path,ledger:l});}
writeFileSync('docs/V58_CHECKS.json',JSON.stringify({ruleset:RULESET,progressionProfile:PROGRESSION_RULES.id,referenceServer:PROGRESSION_RULES.referenceServer,unchanged:{reference:'a533454',reports:unchanged,excluded:[]},rows},null,2)+'\n');console.log('Complete report equivalence:',unchanged,'including all twelve advancement paths; XP partition conserved.');
