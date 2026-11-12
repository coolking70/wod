import {clone,sporegroveConfig} from '../dist/expedition-data.mjs';
import {train,lowerTraining,guildConfig,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
import {healingEffectLoop,healingEffectInitialKeys} from './healing-effect-cases.mjs';
export const passiveInitialKeys=()=>{const keys=healingEffectInitialKeys();keys['abbey-guild-v6']=JSON.stringify(healingEffectLoop().final);return keys;};
let cache;
export function passiveTrainingLoop(){
 if(cache)return clone(cache);
 const start=healingEffectLoop().final,source=sporegroveConfig(),purchased=train(start,'a','passive:health'),control=lowerTraining(purchased,'a','passive:health'),controlReport=pendingReport(depart(control,source)),runs=[];let g=purchased;
 for(let i=0;i<2;i++){if(i===1)g=lowerTraining(g,'a','passive:health');const before=clone(g),preparation=guildConfig(g,source),pending=depart(g,source),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({before,preparation,pending,report,reward,claimed:clone(g)});}
 return clone(cache={start,source,purchased,control,controlReport,runs,final:g,limits:'Actual14 continues normal15/16 on existing sporegrove. A pays20XP for permanent passive1;16 refunds exact20XP, other training/gear/tactics preserved. Same-earned15 refunded-passive comparison unclaimed; one sequence is not a win-rate or isolated RNG causal estimate. No new route/gear/currency or tuning after first run. Passive health structure has indexed historical official support only; name/all-hero access/+4/20-40-60 are project rules. Close old version pages before loading new campaign.'});
}
