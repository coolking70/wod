import {writeFileSync} from 'node:fs';
import {harborConfig} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
const rows=[];
for(const pass of ['adaptive','upper','lower'])for(const task of ['adaptive','seal','salvage','conserve'])for(const profile of ['starter','resistant']){
 const samples=[];
 for(let seed=1;seed<=8;seed++){
  const c=harborConfig();c.harbor={pass,task};c.seed=seed;
  // Experimental comparison, not a claim that a fresh guild owns these items.
  if(profile==='resistant')for(const h of c.heroes.slice(2,5))h.gear.accessory='saltseal';
  const r=simulate(c);samples.push({seed,won:r.won,survivors:r.party.filter(h=>h.hp>0).length,nodes:r.rooms.map(x=>x.node),sealed:r.events.some(e=>e.type==='branch'&&e.detail.check?.success),hp:r.party.reduce((n,h)=>n+h.hp,0),rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),supplies:r.supplies});
 }
 rows.push({pass,task,profile,wins:samples.filter(x=>x.won).length,full:samples.filter(x=>x.won&&x.survivors===6).length,samples});
}
const result={sampleCount:192,seeds:8,note:'Deterministic diagnostic samples; resistant profile is an experimental equipment comparison, not fresh guild inventory. Not a statistical balance guarantee.',rows};
writeFileSync('docs/V42_HARBOR_SAMPLES.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(rows.map(({samples,...r})=>({...r,paths:[...new Set(samples.map(s=>s.nodes.join('/')))],seals:samples.filter(s=>s.sealed).length})),null,2));
