import {clone,dullcourtConfig} from '../dist/expedition-data.mjs';
import {guildConfig,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
import {damageAttributeLoop,damageAttributeSourceKeys} from './damage-attribute-cases.mjs';
export const effectPowerInitialKeys=()=>{const keys=damageAttributeSourceKeys();keys['abbey-guild-v6']=JSON.stringify(damageAttributeLoop().final);return keys;};
let cache;
export function effectPowerLoop(){
 if(cache)return clone(cache);
 const prior=damageAttributeLoop(),start=prior.final,sourceGuarded=dullcourtConfig('guarded'),sourceCleanse=dullcourtConfig('cleanse'),controlReport=pendingReport(depart(start,sourceCleanse)),runs=[];let g=start;
 for(const source of [sourceGuarded,sourceCleanse]){const before=clone(g),preparation=guildConfig(g,source),pending=depart(g,source),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({before,source,preparation,pending,report,reward,claimed:clone(g)});}
 return clone(cache={start,priorReports:prior.runs.map(r=>r.report),sourceGuarded,sourceCleanse,controlReport,runs,final:g,limits:'Exact earned normal10 continues predeclared11/12. No new training, equipment or synthetic assets. Normal11 uses default guarded preparation; normal12 changes only D default prep to ordinary cleanse/front then ward fallback. Unclaimed seed11 cleanse comparison reuses identical assets. Different action/RNG flows preclude isolated avoided-damage claims. Fixed two-run results and viewport copies are not balance or win-rate estimates. New skill, route and damage-modifier ordering are authored adaptations; only structural rank/effect distinction has indexed official-page support.'});
}
