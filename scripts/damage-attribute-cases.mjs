import fs from 'node:fs';
import {clone} from '../dist/expedition-data.mjs';
import {equip,train,guildConfig,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
export const damageAttributeSourceKeys=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/v231-earned-eight.json',import.meta.url),'utf8'));
let cache;
export function damageAttributeLoop(){
 if(cache)return clone(cache);
 const keys=damageAttributeSourceKeys(),start=JSON.parse(keys['abbey-guild-v6']),source=JSON.parse(keys['abbey-expedition-v40']),oldBow=start.members.find(m=>m.id==='b').gear.weapon,purchased=equip(start,'b','drawbow'),paid=train(purchased,'b','attr:per'),dexAlternative=train(purchased,'b','attr:dex'),control=equip(paid,'b',oldBow),controlReport=pendingReport(depart(control,source)),runs=[];let g=paid;
 // Counters9/10, purchased weapon and one PER rank were locked before simulation.
 // Same paid assets in the unclaimed seed9 control; no seed search or reward reuse.
 for(let i=0;i<2;i++){
  if(i)g=equip(g,'b',oldBow);
  const before=clone(g),preparation=guildConfig(g,source),pending=depart(g,source),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({before,preparation,pending,report,reward,claimed:clone(g)});
 }
 return clone(cache={start,source,oldBow,purchased,paid,dexAlternative,control,controlReport,runs,final:g,limits:'Earned eight-run fixture continues normal9/10. Bow costs60gold and PER rank20earnedXP; normal10 freely reequips owned original bow. Unclaimed seed9 control has identical paid ownership and training. Different initiative and RNG consumption prevent assigning outcome changes to damage alone. Six viewport repeats reuse the same input, not six balance samples. Optional bow and all numerical formulas are project adaptations; original-page indexing only supports separate hit/damage attributes.'});
}
