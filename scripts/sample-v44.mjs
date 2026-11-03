import {writeFileSync} from 'node:fs';
import {harborConfig} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {applyHarborTactics} from '../dist/expedition-harbor-tactics.mjs';
import {reserveSummary} from '../dist/expedition-harbor-reserve.mjs';
const rows=[];
for(const pass of ['upper','lower'])for(const reserve of ['none','seal']){
 const samples=[];for(let seed=1;seed<=16;seed++){
  let c=harborConfig();c.seed=seed;c.harbor={pass,task:'seal',difficulty:'storm',reserve};c=applyHarborTactics(c,'roles');const r=simulate(c),s=reserveSummary(r);
  samples.push({seed,won:r.won,survivors:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),hp:r.party.reduce((n,u)=>n+u.hp,0),supplies:r.supplies,...s});
 }
 const summary={wins:samples.filter(s=>s.won).length,full:samples.filter(s=>s.won&&s.survivors===6).length,attempts:samples.filter(s=>s.attempted).length,seals:samples.filter(s=>s.success).length,tempo:samples.filter(s=>s.won&&s.survivors===6&&s.rounds<=28).length,meanRounds:samples.reduce((n,s)=>n+s.rounds,0)/16,meanHp:samples.reduce((n,s)=>n+s.hp,0)/16};rows.push({pass,reserve,summary,samples});console.log(pass,reserve,summary);
}
writeFileSync('docs/V44_RESERVE_SAMPLES.json',JSON.stringify({sampleCount:64,seeds:16,note:'Same starting roster, equipment, training, supplies and roles tactics. Only reserve differs within each route. Fixed seal policy; diagnostic sample, not a guarantee.',rows},null,2));
