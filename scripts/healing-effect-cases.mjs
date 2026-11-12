import {clone,returningTideConfig} from '../dist/expedition-data.mjs';
import {guildConfig,depart,pendingReport,pendingReward,claim,equip} from '../dist/expedition-guild.mjs';
import {effectPowerLoop,effectPowerInitialKeys} from './effect-power-cases.mjs';
export const healingEffectInitialKeys=()=>{const keys=effectPowerInitialKeys();keys['abbey-guild-v6']=JSON.stringify(effectPowerLoop().final);return keys;};
let cache;
export function healingEffectLoop(){
 if(cache)return clone(cache);
 const prior=effectPowerLoop(),start=prior.final,source=returningTideConfig(),oldAccessory=start.members.find(m=>m.id==='f').gear.accessory,purchased=equip(start,'f','carecase'),control=equip(purchased,'f',oldAccessory),controlReport=pendingReport(depart(control,source)),runs=[];let g=purchased;
 for(let i=0;i<2;i++){if(i===1)g=equip(g,'f',oldAccessory);const before=clone(g),preparation=guildConfig(g,source),pending=depart(g,source),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({before,preparation,pending,report,reward,claimed:clone(g)});}
 return clone(cache={start,source,oldAccessory,purchased,control,controlReport,runs,final:g,limits:'Exact earned normal12 continues predetermined13/14 on existing returningtide. F pays60gold once for optional carecase;14 free returns old owned accessory. No training, extra rewards, roles or route changes. Same-paid seed13 old-accessory comparison unclaimed; changed actions/RNG/HP/initiative prevent isolated causal or balance claims. Viewports repeat the same two deterministic reports, not independent combat samples. Only structural rank/effect separation has official indexed evidence; all concrete gear values/order authored.'});
}
