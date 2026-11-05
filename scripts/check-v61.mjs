import assert from 'node:assert/strict';import {writeFileSync,mkdirSync} from 'node:fs';import {resolve,dirname} from 'node:path';
import {trainedReserveGuild,RESERVE_CASES,reserveCase,reserveRoute} from './trained-reserve-cases.mjs';import {guildConfig} from '../dist/expedition-guild.mjs';import {simulate,RULESET} from '../dist/expedition-engine.mjs';import {personalReport} from '../dist/expedition-personal.mjs';import {careerXp} from '../dist/expedition-growth.mjs';import {clone} from '../dist/expedition-data.mjs';
const {guild,trainingRuns}=trainedReserveGuild(),original=clone(guild),rows=[];
for(const group of ['discovery','confirmation'])for(const route of ['hospice','storm'])for(const [key,entry] of Object.entries(RESERVE_CASES)){
 const config=guildConfig(reserveCase(guild,reserveRoute(route),key),reserveRoute(route)),samples=[];
 const start=group==='discovery'?33:101,count=group==='discovery'?8:16;
 for(let seed=start;seed<start+count;seed++){
  config.seed=seed;const r=simulate(config),id=entry.swap?.[1]||'d',p=personalReport(r,id);samples.push({seed,won:r.won,alive:r.party.filter(u=>u.hp>0).length,rooms:r.rooms.filter(x=>x.won).length,rounds:r.rooms.reduce((n,x)=>n+x.rounds,0),supplies:{...r.supplies},observer:id,damage:p.total.damage,healing:p.total.healing,passiveHealing:p.total.passiveHealing,healingBlocks:p.total.healingBlocks,issues:p.issues.map(x=>({reason:x.reason,skill:x.skill,count:x.count}))});
 }
 const wins=samples.filter(x=>x.won);rows.push({group,route,key,name:entry.name,summary:{runs:samples.length,wins:wins.length,allAlive:samples.filter(x=>x.won&&x.alive===6).length,successfulRounds:wins.length?wins.reduce((n,x)=>n+x.rounds,0)/wins.length:null},samples});
 console.log(group,route,key,JSON.stringify(rows.at(-1).summary));
}
assert.deepEqual(guild,original);
const earnedPath=resolve(process.env.WOD_EARNED_GUILD||'/tmp/wod-v61-trained-roster.json');mkdirSync(dirname(earnedPath),{recursive:true});writeFileSync(earnedPath,JSON.stringify(guild,null,2));
writeFileSync('docs/V61_RESERVE_CHECKS.json',JSON.stringify({ruleset:RULESET,note:'Every XP, course, training rank and advancement comes from normal guild transactions. No balance values changed. All six cases fixed before discovery and all carried to confirmation, including failures. Roster comparisons also change roles and damage distribution; equal seeds do not guarantee identical random streams. Not a profession ranking or universal recommendation.',prerequisites:{completed:guild.next-1,trainingRuns,members:guild.members.map(m=>({id:m.id,earned:careerXp(m),available:m.xp,training:m.training,unlocked:m.unlocked,advancement:m.advancement}))},rows},null,2)+'\n');
