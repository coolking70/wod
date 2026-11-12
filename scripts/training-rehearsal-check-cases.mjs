import {clone} from '../dist/expedition-data.mjs';
import {adventureConfig} from '../dist/expedition-adventure.mjs';
import {applyTrainingPlan,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
import {quoteTrainingPlan} from '../dist/expedition-training-plan.mjs';
import {rehearseTrainingPlan} from '../dist/expedition-training-rehearsal.mjs';
import {passiveOpportunityLoop,passiveOpportunityInitialKeys} from './passive-opportunity-cases.mjs';
let cache;
export function trainingRehearsalCheckLoop(){if(cache)return clone(cache);let g=passiveOpportunityLoop().final;const start=clone(g),runs=[];for(const id of[19,20]){const before=clone(g),source=adventureConfig('sporegrove'),member=g.members.find(m=>m.id==='a'),target={...member.training};delete target['passive:health'];if(id===20)target['attr:con']=1;const quote=quoteTrainingPlan(member,target),trial=rehearseTrainingPlan(g,source,'a',quote),applied=applyTrainingPlan(g,'a',quote),pending=depart(applied,source),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({id,before,source,quote,trial,applied,pending,report,reward,claimed:clone(g)});}return clone(cache={start,runs,final:g});}
export function trainingRehearsalCheckInitialKeys(){const keys=passiveOpportunityInitialKeys();keys['abbey-guild-v6']=JSON.stringify(trainingRehearsalCheckLoop().start);return keys;}
