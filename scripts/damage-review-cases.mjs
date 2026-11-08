import fs from 'node:fs';
import {clone,survivalConfig} from '../dist/expedition-data.mjs';
import {guildConfig,historyReport,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
export const damageReviewSourceKeys=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/v175-preparation-state.json',import.meta.url),'utf8'));
import {simulate} from '../dist/expedition-engine.mjs';
let cache;
export function damageReviewLoop(){
 if(cache)return clone(cache);
 const keys=damageReviewSourceKeys(),start=JSON.parse(keys['abbey-guild-v6']),source=JSON.parse(keys['abbey-expedition-v40']),history124=historyReport(start,124);let g=start;const runs=[];
 // Next counter predeclared, same actual plan; no training, tuning or seed search.
 for(let i=0;i<1;i++){
  const preparation=guildConfig(g,source);preparation.seed=source.seed;
  const pending=depart(g,preparation),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({preparation,pending,report,reward,claimed:g});
 }
 const survivalSource=survivalConfig('baseline');survivalSource.seed=731;const survival=simulate(survivalSource);return clone(cache={start,source,history124,loaded:history124.config,desktop:runs[0].claimed,final:g,finalSource:source,survivalSource,survival,runs});
}
