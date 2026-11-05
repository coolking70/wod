import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {defaults,harborConfig,trialConfig} from '../dist/expedition-data.mjs';import {simulate,RULESET} from '../dist/expedition-engine.mjs';
import {seerGuild} from './seer-cases.mjs';import {setCompanion} from '../dist/expedition-command.mjs';
let unchanged=null;
if(process.argv[2]){const old=await import(pathToFileURL(resolve(process.argv[2],'dist/expedition-engine.mjs')).href);let count=0;for(const make of [defaults,harborConfig,()=>trialConfig('veteran','adapted')])for(const seed of [1,3,731]){const config=make();config.seed=seed;assert.deepEqual(simulate(config),old.simulate(config));count++;}unchanged={reference:'3ee8714',count,excluded:[]};}
const backup=resolve(process.env.WOD_SEER_GUILD||'/tmp/wod-v68-seer.json');writeFileSync(backup,JSON.stringify(setCompanion(seerGuild(),'d','seer'),null,2));
writeFileSync('docs/V68_CHECKS.json',JSON.stringify({ruleset:RULESET,normalEarnedFixture:'seerGuild() plus explicit seer role; no asset injection',unchanged,note:'No reference argument means old-report equivalence is null, not verified. No old sample matrices rerun.'},null,2)+'\n');console.log('Normal fixture saved; full old reports equal:',unchanged?.count??'not run');
