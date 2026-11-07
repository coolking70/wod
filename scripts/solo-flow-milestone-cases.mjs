import fs from 'node:fs';
import {clone,defaults} from '../dist/expedition-data.mjs';
import {newGuild,migrateGuild,depart,pendingReport,pendingReward,claim,assignLoot,train,claimHarborStory,learnAdvanced,historyReport} from '../dist/expedition-guild.mjs';
import {selectHero} from '../dist/expedition-command.mjs';
import {routeFocusPreparation} from '../dist/expedition-route-focus.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
import {ADVANCED,installAdvanced,experienceLedger} from '../dist/expedition-growth.mjs';
import {trainingUseInventory} from '../dist/expedition-training-use.mjs';

export const soloMilestoneSourceKeys=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/v167-preparation-state.json',import.meta.url),'utf8'));
let cache;
export function soloFlowMilestone(){
 if(cache)return clone(cache);
 let g=selectHero(migrateGuild(newGuild()),'a'),current=defaults();
 const start=clone(g),runs=[];let afterAssignment,desktop;
 for(const route of ['tutorial','classic','chapter','harbor']){
  // The real camp route loader preserves the player's free personal focus.
  // No seeded search, injected XP or synthetic grown-member fixtures.
  const preparation=routeFocusPreparation({getItem:()=>null},route,current,g,{seed:current.seed}).config;
  const pending=depart(g,preparation),report=pendingReport(pending),reward=pendingReward(pending);
  g=claim(pending);current=preparation;runs.push({route,preparation,pending,report,reward,claimed:g});
  if(route==='classic'){g=assignLoot(g,'a','reliquaryshield');afterAssignment=clone(g);g=train(g,'a','defense:parry');desktop=clone(g);}
 }
 const beforeEnding=clone(g),storyFinal=claimHarborStory(g,'light'),learned=learnAdvanced(storyFinal,'a');
 const sourceBeforeCourse=clone(current),resolved=readiness(learned,current).config,installed=installAdvanced(resolved,'a',ADVANCED.a);
 const lateKeys=soloMilestoneSourceKeys(),late=JSON.parse(lateKeys['abbey-guild-v6']);
 return clone(cache={start,runs,afterAssignment,desktop,beforeEnding,storyFinal,learned,sourceBeforeCourse,installed,ledger:experienceLedger(learned.members.find(m=>m.id==='a')),contextBefore:trainingUseInventory(resolved,'a'),contextAfter:trainingUseInventory(installed,'a'),late,lateSource:JSON.parse(lateKeys['abbey-expedition-v40']),lateHistory115:historyReport(late,115)});
}
