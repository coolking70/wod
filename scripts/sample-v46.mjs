import {writeFileSync} from 'node:fs';
import {simulate,RULESET} from '../dist/expedition-engine.mjs';
import {resourceLedger} from '../dist/expedition-resource-ledger.mjs';
import {reserveSummary} from '../dist/expedition-harbor-reserve.mjs';
import {COMPANION_CASES,companionCase} from './companion-cases.mjs';

export function companionSample(r){
 const ids=new Set(r.config.heroes.map(h=>h.id)),ledger=resourceLedger(r),own=r.events.filter(e=>ids.has(e.actor)),reserve=reserveSummary(r);
 return {seed:r.config.seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),hp:r.party.reduce((n,u)=>n+u.hp,0),failureRoom:r.won?null:r.rooms.at(-1).name,
  supplies:r.supplies,branches:r.events.filter(e=>e.type==='branch').map(e=>({roomIndex:e.roomIndex,node:e.detail.node,sealed:e.detail.sealed??null,success:e.detail.check?.success??null})),sealed:reserve.success,sealAttempted:reserve.attempted,
  failed:own.filter(e=>e.type==='failed').length,shortages:own.filter(e=>e.type==='skip'&&['法力不足','耗材耗尽'].includes(e.detail.reason)).length,reserved:reserve.skips,
  enemyHealing:r.events.filter(e=>e.type==='heal'&&!ids.has(e.actor)&&e.units.find(u=>u.id===e.actor)?.side==='enemy').reduce((n,e)=>n+e.detail.actual,0),
  support:ledger.map(room=>({room:room.name,coverage:['insight','mastery'].map(skill=>({skill,recipients:[...new Set(r.events.filter(e=>e.roomIndex===room.roomIndex&&e.type==='effect'&&e.detail.skill===skill&&ids.has(e.actor)).flatMap(e=>e.targets))]})),actors:room.actors.map(a=>({id:a.id,herb:a.spent.herb,shortages:a.shortages,failed:a.failed,healing:own.filter(e=>e.roomIndex===room.roomIndex&&e.actor===a.id&&e.type==='heal').reduce((n,e)=>n+e.detail.actual,0)}))}))};
}
export function companionSummary(samples){
 const won=samples.filter(s=>s.won),avg=(rows,k)=>rows.length?rows.reduce((n,s)=>n+s[k],0)/rows.length:null;
 return {count:samples.length,wins:won.length,full:won.filter(s=>s.alive===6).length,tempo:won.filter(s=>s.alive===6&&s.rounds<=28).length,winRounds:avg(won,'rounds'),winSupplies:Object.fromEntries(['herb','rune','arrow'].map(k=>[k,won.length?won.reduce((n,s)=>n+s.supplies[k],0)/won.length:null])),allRounds:avg(samples,'rounds'),shortages:avg(samples,'shortages'),failed:avg(samples,'failed'),enemyHealing:avg(samples,'enemyHealing'),sealAttempts:samples.filter(s=>s.sealAttempted).length,seals:samples.filter(s=>s.sealed).length,failureRooms:Object.fromEntries([...new Set(samples.map(s=>s.failureRoom).filter(Boolean))].map(room=>[room,samples.filter(s=>s.failureRoom===room).length]))};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const rows=[];
 for(const [kind,name] of Object.entries(COMPANION_CASES))for(const trained of [false,true])for(const pass of ['upper','lower']){
  const samples=Array.from({length:8},(_,i)=>companionSample(simulate(companionCase(kind,trained,pass,i+1))));
  const summary=companionSummary(samples);rows.push({kind,name,trained,pass,summary,samples});console.log(kind,trained,pass,JSON.stringify(summary));
 }
 writeFileSync('docs/V46_COOPERATION_SAMPLES.json',JSON.stringify({ruleset:RULESET,sampleCount:rows.reduce((n,r)=>n+r.samples.length,0),seeds:[1,2,3,4,5,6,7,8],note:'Laboratory only; no guild assets granted. Compare within the same roster/training/pass. Success-only efficiency and supplies use null when no wins. Common seeds do not couple RNG draws after action changes. Zones cover center/rear and leave front/side positions without rescue. See V46_COOPERATION.md for scope and limitations.',rows},null,2)+'\n');
}
