import './capture-bootstrap.cjs';
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';
import {crossRouteProfiles,EARLY_ROUTES} from './cross-route-cases.mjs';import {swapCompanion} from '../dist/expedition-roster.mjs';import {setCompanion} from '../dist/expedition-command.mjs';import {guildConfig} from '../dist/expedition-guild.mjs';import {clone} from '../dist/expedition-data.mjs';import {careerXp} from '../dist/expedition-growth.mjs';import {simulate,RULESET} from '../dist/expedition-engine.mjs';
const profiles=crossRouteProfiles(),prior=JSON.parse(readFileSync('docs/V63_CROSS_ROUTE_CHECKS.json','utf8'));assert.equal(prior.ruleset,RULESET);const cases={scholarSame:{out:'d',incoming:'mira',role:'measured'},medicSame:{out:'f',incoming:'orin',role:'medic'},slowSame:{out:'f',incoming:'orin',role:'slowcare'}},rows=[];
for(const [profile,base] of Object.entries(profiles)){
 const members=base.members.map(m=>({id:m.id,earned:careerXp(m),available:m.xp,training:m.training,advancement:m.advancement,unlocked:m.unlocked}));assert.deepEqual(members,prior.profiles[profile].members,'Reused original baseline must have identical actual member assets.');
 for(const [route,make] of Object.entries(EARLY_ROUTES))for(const [key,entry] of Object.entries(cases)){
  const tactics=make();let g=swapCompanion(base,tactics,entry.out,entry.incoming);g=setCompanion(g,entry.incoming,entry.role);const config=guildConfig(g,tactics),before=clone(g);
  for(const [group,start,count] of [['discovery',201,4],['confirmation',301,8]]){
   const samples=[];for(let seed=start;seed<start+count;seed++){config.seed=seed;const r=simulate(config),skips=r.events.filter(e=>config.heroes.some(h=>h.id===e.actor)&&e.type==='skip'&&e.detail.reason==='耗材耗尽');samples.push({seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),cleared:r.rooms.filter(x=>x.won).length,stopReason:r.rooms.find(x=>!x.won)?.stopReason||null,resourceSkips:skips.length,supplies:r.supplies});}
   const wins=samples.filter(x=>x.won),summary={runs:count,wins:wins.length,allAlive:wins.filter(x=>x.alive===6).length,successfulRounds:wins.length?wins.reduce((n,x)=>n+x.rounds,0)/wins.length:null,resourceSkips:samples.reduce((n,x)=>n+x.resourceSkips,0)};rows.push({profile,route,key,group,replacement:entry,summary,samples});console.log(profile,route,key,group,JSON.stringify(summary));
  }
  assert.deepEqual(g,before);
 }
}
writeFileSync((process.env.WOD_EVIDENCE_DIR+'/wod-v64-recruited.json'),JSON.stringify(profiles.recruited,null,2));
writeFileSync('docs/V64_SAME_CLASS_CHECKS.json',JSON.stringify({ruleset:RULESET,note:'Same-profession replacement preserves the ranger slot; native personal equipment, training and position still apply and are not inherited. Same fixed seeds as V63 permit configuration comparison, not isolated causal attribution. All three cases retained in confirmation. No XP, fees, combat values or rewards changed. Original baseline outcomes reused only after exact profile/asset validation; V63 matrix not rerun.',newSamples:216,reusedOriginalBaseline:{source:'V63_CROSS_ROUTE_CHECKS.json',profilesExact:true,rows:prior.rows.filter(r=>r.key==='original')},rows},null,2)+'\n');
