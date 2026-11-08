import fs from 'node:fs';
import {clone} from '../dist/expedition-data.mjs';
import {guildConfig,historyReport,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
export const recoverySourceKeys=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/v169-preparation-state.json',import.meta.url),'utf8'));
let cache;
export function preparationRecoveryLoop(){
 if(cache)return clone(cache);
 const keys=recoverySourceKeys(),start=JSON.parse(keys['abbey-guild-v6']),source=JSON.parse(keys['abbey-expedition-v40']),history117=historyReport(start,117);let g=start;const runs=[];
 // Both next counters predeclared, same actual plan; no training, tuning or seed search.
 for(let i=0;i<2;i++){
  const preparation=guildConfig(g,source);preparation.seed=source.seed;
  const pending=depart(g,preparation),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({preparation,pending,report,reward,claimed:g});
 }
 return clone(cache={start,source,history117,loaded:history117.config,desktop:runs[0].claimed,final:g,finalSource:source,runs});
}
