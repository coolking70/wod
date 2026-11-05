import {crossRouteProfiles,EARLY_ROUTES} from './cross-route-cases.mjs';
import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';
import {guildConfig} from '../dist/expedition-guild.mjs';import {swapCompanion} from '../dist/expedition-roster.mjs';import {setCompanion} from '../dist/expedition-command.mjs';
import {clone} from '../dist/expedition-data.mjs';import {simulate,RULESET} from '../dist/expedition-engine.mjs';import {personalReport} from '../dist/expedition-personal.mjs';import {careerXp} from '../dist/expedition-growth.mjs';
const profiles=crossRouteProfiles(),routes=EARLY_ROUTES,cases={original:null,scholar:['b','mira'],herbalist:['b','orin']},rows=[];
for(const [profile,base] of Object.entries(profiles))for(const [route,make] of Object.entries(routes))for(const [key,swap] of Object.entries(cases)){
 let g=clone(base);const tactics=make();if(swap)g=swapCompanion(g,tactics,...swap);g=setCompanion(g,'d',key==='scholar'?'ward':'measured');if(key==='scholar')g=setCompanion(g,'mira','measured');if(key==='herbalist')g=setCompanion(g,'orin','slowcare');const config=guildConfig(g,tactics),before=clone(g);
 for(const [group,start,count] of [['discovery',201,4],['confirmation',301,8]]){
  const samples=[];
  for(let seed=start;seed<start+count;seed++){
   config.seed=seed;const r=simulate(config),observer=swap?.[1]||'d',p=personalReport(r,observer),party=new Set(config.heroes.map(h=>h.id)),skips=r.events.filter(e=>party.has(e.actor)&&e.type==='skip'&&e.detail.reason==='耗材耗尽'),byResource={};
   for(const e of skips){const item=e.detail.skill;byResource[item]=(byResource[item]||0)+1;}
   samples.push({seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,cleared:r.rooms.filter(x=>x.won).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),stoppedRoom:r.rooms.find(x=>!x.won)?.name||null,stopReason:r.rooms.find(x=>!x.won)?.stopReason||null,supplies:r.supplies,resourceSkips:skips.length,skippedSkills:byResource,observer,personal:{damage:p.total.damage,healing:p.total.healing,passiveHealing:p.total.passiveHealing,healingBlocks:p.total.healingBlocks,supplies:p.supplies,issues:p.issues.map(x=>({reason:x.reason,skill:x.skill,count:x.count}))},rooms:r.rooms.map(x=>({name:x.name,won:x.won,rounds:x.rounds,roundLimit:x.roundLimit||null,stopReason:x.stopReason||null,supplies:x.supplies}))});
  }
  const wins=samples.filter(s=>s.won),row={profile,route,key,group,summary:{runs:count,wins:wins.length,allAlive:wins.filter(s=>s.alive===6).length,successfulRounds:wins.length?wins.reduce((n,s)=>n+s.rounds,0)/wins.length:null,resourceSkips:samples.reduce((n,s)=>n+s.resourceSkips,0)},samples};rows.push(row);console.log(profile,route,key,group,JSON.stringify(row.summary));
 }
 assert.deepEqual(g,before);
}
writeFileSync('docs/V63_CROSS_ROUTE_CHECKS.json',JSON.stringify({ruleset:RULESET,note:'Fixed three cases across classic, adapted archive and adapted scarcity; newly recruited versus normally trained early candidates. All cases carried from discovery to confirmation, including failures. No balance changes or injected assets. Roster/roles change together; same seeds do not isolate one skill or guarantee equal random streams. Matched founder combat assets are unchanged by unspent XP.',profiles:Object.fromEntries(Object.entries(profiles).map(([key,g])=>[key,{completed:g.next-1,members:g.members.map(m=>({id:m.id,earned:careerXp(m),available:m.xp,training:m.training,advancement:m.advancement,unlocked:m.unlocked}))}])),rows},null,2)+'\n');
