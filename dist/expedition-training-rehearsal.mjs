import {clone,HEROES,TYPES,ATTR} from './expedition-data.mjs';
import {guildConfig,applyTrainingPlan} from './expedition-guild.mjs';
import {quoteTrainingPlan} from './expedition-training-plan.mjs';
import {simulate,buildParty,defenseProfile,current} from './expedition-engine.mjs';
import {personalReport} from './expedition-personal.mjs';
// Two independent simulations of actual assets; neither run is a guild departure.
export function rehearseTrainingPlan(g,tactics,id,plan){
 if(!g.lineup.includes(id))throw Error('该队员当前未出战，请先安排出战再试演培养草案');
 const next=applyTrainingPlan(g,id,plan),member=g.members.find(m=>m.id===id),quote=quoteTrainingPlan(member,plan.target,{expected:plan.expected}),seed=(g.next-1)%999999+1;
 const before=guildConfig(g,tactics),after=guildConfig(next,tactics);before.seed=seed;after.seed=seed;
 const configs={before,after},reports={},summary={},units={};
 for(const key of ['before','after']){
  units[key]=buildParty(configs[key]).find(u=>u.id===id);
  const report=simulate(configs[key]);if(g.command)report.perspective=clone(g.command);reports[key]=report;
  const personal=personalReport(report,id);
  summary[key]={won:report.won,cleared:report.rooms.filter(r=>r.won).length,rooms:report.rooms.length,rounds:report.rooms.reduce((n,r)=>n+r.rounds,0),alive:report.party.filter(u=>u.hp>0).length,personal:{...personal.total,supplies:personal.supplies,issues:personal.issues},supplies:{...report.supplies}};
 }
 const skills=Object.keys(units.before.skills).map(skill=>({skill,before:units.before.skills[skill],after:units.after.skills[skill]})).filter(r=>r.before!==r.after);
 const defenses=Object.keys(TYPES).map(type=>{const a=defenseProfile(units.before,type),b=defenseProfile(units.after,type);return {type,defense:a.skill,before:a.level,after:b.level};}).filter(r=>r.before!==r.after);
 const attributes=Object.keys(ATTR).map(key=>({key,before:current(units.before,key),after:current(units.after,key)})).filter(r=>r.before!==r.after),resources=['maxHp','maxMp'].map(key=>({key,before:units.before[key],after:units.after[key]})).filter(r=>r.before!==r.after);
 return {id,name:HEROES.find(h=>h.id===id).name,seed,quote,skills,defenses,...(attributes.length||resources.length?{attributes,resources}:{}),summary,reports};
}
