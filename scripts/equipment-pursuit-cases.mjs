import {breakwaterLoop} from './breakwater-cases.mjs';
import {confluenceConfig} from '../dist/expedition-data.mjs';
import {setEquipmentGoal,depart,pendingReport,pendingReward,claim,assignLoot} from '../dist/expedition-guild.mjs';
export function equipmentPursuitLoop(){
 const start=breakwaterLoop().final,runs=[];let g=start,desktop;
 for(const heroId of ['f','e']){const selected=setEquipmentGoal(g,heroId,'triagepin'),config=confluenceConfig(),pending=depart(selected,config),report=pendingReport(pending),reward=pendingReward(pending),claimed=claim(pending);g=assignLoot(claimed,heroId,'triagepin');runs.push({heroId,selected,config,pending,report,reward,claimed,assigned:g});if(heroId==='f')desktop=g;}
 return {start,runs,desktop,final:g};
}
