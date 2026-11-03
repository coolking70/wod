import {writeFileSync} from 'node:fs';
import {harborConfig,defaultHero} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {applyHarborTactics} from '../dist/expedition-harbor-tactics.mjs';
import {reserveSummary} from '../dist/expedition-harbor-reserve.mjs';
const rows=[];
for(const lineup of ['founders','doubleScholar','doubleHealer'])for(const trained of [false,true])for(const pass of ['upper','lower']){
 const samples=[];
 for(let seed=1;seed<=8;seed++){
  let c=harborConfig();c.seed=seed;c.harbor={pass,task:'seal',difficulty:'storm',reserve:'seal'};
  const outgoing=lineup==='doubleScholar'?'b':lineup==='doubleHealer'?'e':null,incoming=lineup==='doubleScholar'?'mira':'orin';
  if(outgoing){c.heroes=c.heroes.map(h=>h.id===outgoing?defaultHero(incoming):h);c.prepOrder=c.prepOrder.map(id=>id===outgoing?incoming:id);}
  for(const h of c.heroes)h.training=trained?{['skill:'+h.trained]:2,['defense:'+h.defenseFocus]:2}:{};
  c=applyHarborTactics(c,'roles');const r=simulate(c),s=reserveSummary(r),ids=new Set(c.heroes.map(h=>h.id));
  samples.push({seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),hp:r.party.reduce((n,u)=>n+u.hp,0),failed:r.events.filter(e=>e.type==='failed'&&ids.has(e.actor)).length,shortages:r.events.filter(e=>e.type==='skip'&&ids.has(e.actor)&&['法力不足','耗材耗尽'].includes(e.detail.reason)).length,sealed:s.success,supplies:r.supplies});
 }
 const summary={wins:samples.filter(s=>s.won).length,full:samples.filter(s=>s.won&&s.alive===6).length,tempo:samples.filter(s=>s.won&&s.alive===6&&s.rounds<=28).length,seals:samples.filter(s=>s.sealed).length,...Object.fromEntries(['rounds','hp','failed','shortages'].map(k=>[k,samples.reduce((n,s)=>n+s[k],0)/samples.length]))};
 rows.push({lineup,trained,pass,summary,samples});console.log(lineup,trained,pass,JSON.stringify(summary));
}
writeFileSync('docs/V45_ROSTER_SAMPLES.json',JSON.stringify({sampleCount:96,seeds:8,note:'Laboratory configurations, not granted guild assets. Same starting equipment and supplies. Training uses 6 points per hero: specialization +2 and defense focus +2. Roster changes also change default tactics and specialization; not an isolated class-effect estimate.',rows},null,2));
