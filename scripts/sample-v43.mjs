import {writeFileSync} from 'node:fs';
import {harborConfig} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {applyHarborTactics} from '../dist/expedition-harbor-tactics.mjs';
const rows=[];
for(const pass of ['upper','lower'])for(const plan of ['baseline','roles','spread']){
 const samples=[];for(let seed=1;seed<=12;seed++){
  let c=harborConfig();c.seed=seed;c.harbor={pass,task:'adaptive',difficulty:'storm'};if(plan!=='baseline')c=applyHarborTactics(c,plan);
  const r=simulate(c);samples.push({seed,won:r.won,survivors:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),hp:r.party.reduce((n,u)=>n+u.hp,0),supplies:r.supplies,nodes:r.rooms.map(x=>x.node),enemyHealing:r.events.filter(e=>e.type==='heal'&&e.units.find(u=>u.id===e.actor)?.side==='enemy').reduce((n,e)=>n+e.detail.actual,0)});
 }
 const summary={wins:samples.filter(s=>s.won).length,full:samples.filter(s=>s.won&&s.survivors===6).length,meanRounds:samples.reduce((n,s)=>n+s.rounds,0)/12,meanHp:samples.reduce((n,s)=>n+s.hp,0)/12,meanEnemyHealing:samples.reduce((n,s)=>n+s.enemyHealing,0)/12};
 rows.push({pass,plan,summary,samples});console.log(pass,plan,summary);
}
writeFileSync('docs/V43_STORM_SAMPLES.json',JSON.stringify({sampleCount:72,seeds:12,note:'Same starting equipment, training and supplies. Compare tactics only. Diagnostic samples, not a guarantee.',rows},null,2));
