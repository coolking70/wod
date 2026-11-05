import {counterpointConfig} from '../dist/expedition-data.mjs';
import {offbeatLoop} from './offbeat-cases.mjs';
import {depart,pendingReport,pendingReward,claim,train} from '../dist/expedition-guild.mjs';
import {withObjective} from '../dist/expedition-goal-data.mjs';
export function counterpointLoop(){const start=offbeatLoop().final;let g=start,desktop;const runs=[];for(const [plan,goal] of [['tempo','clear'],['cleanse','survive'],['source','reserve']]){const config=withObjective(counterpointConfig(plan),goal),pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({plan,config,pending,report,reward,claimed:g});if(plan==='tempo'){g=train(g,'d','skill:ward');desktop=g;}}return {start,runs,desktop,final:g};}
