import './capture-bootstrap.cjs';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {resolve} from 'node:path';
import {foundryProfiles} from './foundry-cases.mjs';import {foundryConfig} from '../dist/expedition-data.mjs';import {depart,pendingReward,claim,assignLoot,validateGuild} from '../dist/expedition-guild.mjs';
import {simulate} from '../dist/expedition-engine.mjs';import {pathToFileURL} from 'node:url';
let g=foundryProfiles().trained;const records=[];
for(const [index,plan] of ['shelter','split','split'].entries()){
 const pending=depart(g,foundryConfig(plan)),reward=pendingReward(pending);assert.equal(reward.cleared,4);assert.deepEqual(reward.foundry.earned,[['home'],['blueprints'],[]][index]);assert.equal(reward.gold,[240,170,150][index]);records.push({seed:g.next,plan,reward});g=claim(pending);if(index===0)g=assignLoot(g,'b','bellowscoat');if(index===1)g=assignLoot(g,'b','kilngauge');
}
assert.deepEqual([...g.foundry.claimed].sort(),['blueprints','home']);validateGuild(JSON.parse(JSON.stringify(g)));
let combatUnchanged=null;if(process.argv[2]){const old=await import(pathToFileURL(resolve(process.argv[2],'dist/expedition-engine.mjs')).href);let count=0;for(const plan of ['plain','split','shelter'])for(const seed of [3,101,208]){const c=foundryConfig(plan);c.seed=seed;assert.deepEqual(simulate(c),old.simulate(c));count++;}combatUnchanged={reference:'881d1858ae6119f475b498e0674d0afac7e9df47',count,excluded:[]};}
writeFileSync(resolve(process.env.WOD_FOUNDRY_COMPLETED_GUILD||(process.env.WOD_EVIDENCE_DIR+'/wod-v72-earned-contracts.json')),JSON.stringify(g,null,2));writeFileSync('docs/V72_PROGRESSION.json',JSON.stringify({note:'Normal settlements, training, three foundry departures and explicit equipment assignment; no injected XP, loot, completion or seed counter. No reference argument means combatUnchanged is null.',records,claimed:g.foundry.claimed,warehouse:g.warehouse,combatUnchanged},null,2)+'\n');console.log('Normal two-goal progression and no-repeat settlement passed; foundry full combat reports equal:',combatUnchanged?.count??'not run');
