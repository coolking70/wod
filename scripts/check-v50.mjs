import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {simulate} from '../dist/expedition-engine.mjs';
import {defaults,harborConfig,trialConfig} from '../dist/expedition-data.mjs';
import {seerGuild,seerCase} from './seer-cases.mjs';
const g=seerGuild(),rows=[];
for(const mode of ['suppress','seer']){
 const samples=[];for(let seed=9;seed<=16;seed++){const c=seerCase(g,mode,seed),r=simulate(c);assert.deepEqual(simulate(c),r);samples.push({seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,r)=>n+r.rounds,0),remainingRune:r.supplies.rune,applied:r.events.filter(e=>e.type==='effect'&&e.detail.harmful).length,blocked:r.events.filter(e=>e.type==='skip'&&e.detail.healingBlock).length});}
 rows.push({mode,samples});
}
let equivalence=null;
if(process.argv[2]){
 const dir=resolve(process.argv[2]),old=await import(pathToFileURL(resolve(dir,'dist/expedition-engine.mjs')).href);
 const strip=r=>{r=structuredClone(r);for(const e of r.events)if(e.type==='initiative')e.detail.order=e.detail.order.map(({actor,value,ordinal,total})=>({actor,value,ordinal,total}));return r;};
 const cases=[];for(const make of [defaults,harborConfig,()=>trialConfig('veteran','adapted')])for(const seed of [1,3,731]){const c=make();c.seed=seed;assert.deepEqual(strip(simulate(c)),old.simulate(c));cases.push({route:c.expedition,seed});}equivalence={reference:'d6f77b8adb0ea7b696015d62c24172d5526b1a89',count:cases.length,cases,excluded:'Only newly recorded initiative identity, formula inputs and source trace; no draws, actions or outcomes change.'};
}
const result={note:'Two fixed situational roles; confirmation seeds 9-16 are separate from exploratory 1-8. Same learned guild assets, no training or gear grants. Counts are not prevented-healing estimates or general recommendations.',prerequisites:{completed:g.history.length,xp:g.members.find(m=>m.id==='d').xp,unlocked:g.members.find(m=>m.id==='d').unlocked},rows,equivalence};writeFileSync('docs/V50_CHECKS.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
