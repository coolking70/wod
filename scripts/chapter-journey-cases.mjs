import {officialLoop} from './official-loop-cases.mjs';
import {adventureConfig} from '../dist/expedition-adventure.mjs';
import {clone,row} from '../dist/expedition-data.mjs';
import {depart,pendingReport,pendingReward,claim,train} from '../dist/expedition-guild.mjs';
export function chapterJourneyLoop(){
 const start=officialLoop().final,runs=[];let guild=clone(start);
 const config=adventureConfig('returningtide');
 const pending=depart(guild,config),report=pendingReport(pending),reward=pendingReward(pending);guild=claim(pending);runs.push({before:clone(start),config:clone(config),pending,report,reward,claimed:clone(guild)});
 const beforeTraining=clone(guild);
 for(const [id,key]of [['b','skill:pierce'],['d','skill:ward'],['f','skill:heal']])guild=train(guild,id,key);
 const prepared=clone(guild),retry=adventureConfig('returningtide');retry.heroes.find(h=>h.id==='b').main=[row('pierce','healer'),row('shot','rear')];retry.heroes.find(h=>h.id==='d').main=[row('spark','rear')];
 const next=depart(guild,retry),nextReport=pendingReport(next),nextReward=pendingReward(next);guild=claim(next);runs.push({before:clone(prepared),config:clone(retry),pending:next,report:nextReport,reward:nextReward,claimed:clone(guild)});
 return {start,runs,beforeTraining,prepared,config:retry,final:guild,limits:'Only normal departures5 and6, earned assets and three explicit training purchases. Repeated viewport contexts are not independent balance samples; no seed search or counterfactual reward claims.'};
}
