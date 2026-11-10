import {adventureConfig,chapterEnding} from '../dist/expedition-adventure.mjs';
import {clone,row} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {withObjective} from '../dist/expedition-goal-data.mjs';
import {depart,pendingReport,pendingReward,claim,train} from '../dist/expedition-guild.mjs';
import {targetPickLoop} from './target-pick-cases.mjs';
export function returningTideLoop(){
 const earned=targetPickLoop().final;let guild=clone(earned);
 for(const [id,key]of[['b','skill:pierce'],['d','skill:ward'],['f','skill:heal']])guild=train(guild,id,key);
 const prepared=clone(guild),config=withObjective(adventureConfig('returningtide'),'clear');config.heroes.find(h=>h.id==='b').main=[row('pierce','healer'),row('shot','rear')];config.heroes.find(h=>h.id==='d').main=[row('spark','rear')];
 const runs=[];
 for(let i=0;i<2;i++){
  const before=clone(guild),pending=depart(before,i===0?config:withObjective(config,'reserve')),report=pendingReport(pending),reward=pendingReward(pending);guild=claim(pending);runs.push({before,pending,report,reward,claimed:clone(guild),ending:chapterEnding(report)});
 }
 return {earned,prepared,config,runs,final:guild};
}
export function returningTideConfirmations(){return[731,732].map(seed=>{const config=adventureConfig('returningtide');config.seed=seed;const report=simulate(config);return {seed,report,ending:chapterEnding(report)};});}
