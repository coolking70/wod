import {confluenceConfig} from '../dist/expedition-data.mjs';
import {newGuild,depart,pendingReport,pendingReward,claim,assignLoot,train} from '../dist/expedition-guild.mjs';
import {selectHero} from '../dist/expedition-command.mjs';
import {withObjective} from '../dist/expedition-goal-data.mjs';
export function confluenceLoop(){let g=selectHero(newGuild(),'d'),desktop;const runs=[];for(const [plan,goal] of [['source','clear'],['suppress','survive'],['spread','reserve']]){const config=withObjective(confluenceConfig(plan),goal),pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({plan,config,pending,report,reward,claimed:g});if(plan==='source'){g=assignLoot(g,'f','triagepin');g=train(g,'d','skill:suppress');desktop=g;}}return {runs,desktop,final:g};}
