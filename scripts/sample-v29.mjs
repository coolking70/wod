import {writeFileSync} from 'node:fs';
import {trialConfig} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
const rows=[];
for(const route of ['seasoned','veteran'])for(const plan of ['front','roles','adapted','runeSaver']){const samples=[];for(let seed=1;seed<=16;seed++){const c=trialConfig(route,plan==='runeSaver'?'adapted':plan);if(plan==='runeSaver'){const h=c.heroes.find(h=>h.id==='c');for(const p of [h,...Object.values(h.overrides)])if(p.main)p.main=p.main.map(r=>r.skill==='lance'?{...r,skill:'tidebolt'}:r);}c.seed=seed;const r=simulate(c);samples.push({seed,won:r.won,survivors:r.party.filter(h=>h.hp>0).length,rooms:r.rooms.length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),hp:r.party.reduce((n,h)=>n+h.hp,0),mp:r.party.reduce((n,h)=>n+h.mp,0),supplies:r.supplies});}const summary={wins:samples.filter(r=>r.won).length,full:samples.filter(r=>r.won&&r.survivors===6).length,meanRounds:samples.reduce((n,r)=>n+r.rounds,0)/16,meanHp:samples.reduce((n,r)=>n+r.hp,0)/16};rows.push({route,plan,summary,samples});console.log(route,plan,summary);}
writeFileSync('dist/samples-v29.json',JSON.stringify({seeds:16,rows},null,2));
