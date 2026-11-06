import {POST_QUEST_ENDINGS,postQuestProgress} from './expedition-post-quest.mjs';
// Project-original collection goal. It never changes loot, ownership or rewards.
import {GEAR,HEROES,EXPEDITIONS} from './expedition-data.mjs';
import {ROUTE_REWARDS,isRelic,gearDifference} from './expedition-loot.mjs';
import {HARBOR_EXCHANGE} from './expedition-harbor-contract.mjs';
import {FOUNDRY_OBJECTIVES} from './expedition-foundry-contract.mjs';
import {CLOCKTOWER_STORY_ENDINGS,clocktowerStoryProgress} from './expedition-clocktower-story.mjs';
import {FOUNDRY_STORY_ENDINGS,foundryStoryProgress} from './expedition-foundry-story.mjs';
import {HARBOR_STORY_ENDINGS,harborStoryProgress} from './expedition-harbor-story.mjs';
export function validateEquipmentGoal(g){
 const goal=g?.equipmentGoal;if(goal===undefined)return;
 if(!goal||typeof goal!=='object'||Array.isArray(goal)||Object.keys(goal).sort().join(',')!=='gearId,heroId'||typeof goal.heroId!=='string'||!g.members?.some(m=>m.id===goal.heroId)||typeof goal.gearId!=='string'||!isRelic(goal.gearId))throw Error('寻物目标无效');
}
const stories=[['postquest','归信航程',POST_QUEST_ENDINGS,postQuestProgress],['clocktower','潮刻余响',CLOCKTOWER_STORY_ENDINGS,clocktowerStoryProgress],['harbor','灯塔来信',HARBOR_STORY_ENDINGS,harborStoryProgress],['foundry','铸库归航',FOUNDRY_STORY_ENDINGS,foundryStoryProgress]];
export function equipmentSources(id,g){
 if(!Object.hasOwn(GEAR,id))throw Error('装备无效');
 if(!isRelic(id))return [{kind:'shop',label:'营地商店 · 60金币'}];
 const result=[];
 for(const [book,name,endings,progress]of stories)for(const [ending,e]of Object.entries(endings))if(e.gear===id){
  const p=g?progress(g):null,state=!p?'三选一，一次':p.ending?(p.ending===ending?'该结局已领取':'已选其他结局，此来源关闭'):p.ready?(g.pending?'条件已满足，先领取当前远征结算':'条件已满足，仍需亲自选择结局'):'尚待完成旅程条件';
  result.push({kind:'story',book,ending,closed:Boolean(p?.ending),label:'单人旅程·'+name+'（'+state+'） · '+e.name});
 }
 for(const [key,o]of Object.entries(FOUNDRY_OBJECTIVES))if(o.gear===id)result.push({kind:'contract',key,label:'铸库一次性委托·'+o.name+'（'+(g?.foundry?.claimed.includes(key)?'已领取，不再发放':'满足委托并领取时定向获得')+'）'});
 if(HARBOR_EXCHANGE.includes(id))result.push({kind:'exchange',label:'港口委托 · 2张海图指定兑换'+(g?'（现有'+g.harbor.charts+'张，仍需手动兑换）':'')});
 for(const [route,r]of Object.entries(ROUTE_REWARDS))if(r.pool.includes(id)){
  const first=r.pool[0]===id,claimed=Boolean(g?.clears[route]>0),rule=g?(claimed?(r.pool.length===1?'重复通关领取必得':'重复通关掉落池，单次不保证此件'):first?'首次通关领取必得':'首通固定为'+GEAR[r.pool[0]].name+'；本件在重复通关掉落池，单次不保证'):(first?'首通必得；':'')+(r.pool.length===1?'重复通关必得':'重复通关掉落池，单次不保证');
  result.push({kind:'route',route,first,claimed,label:EXPEDITIONS[route].name+'（'+rule+'）'});
 }
 return result;
}
export function relicCollection(g,id){const m=g.members.find(m=>m.id===id);if(!m)throw Error('队员无效');return Object.keys(GEAR).filter(isRelic).map(gearId=>({gearId,owned:m.owned.includes(gearId),warehouse:g.warehouse[gearId]||0,otherOwners:g.members.filter(other=>other.id!==id&&other.owned.includes(gearId)).map(other=>other.id)}));}
export function equipmentGoalStatus(g){
 validateEquipmentGoal(g);if(!g.equipmentGoal)return null;
 const {heroId,gearId}=g.equipmentGoal,m=g.members.find(m=>m.id===heroId),row=relicCollection(g,heroId).find(r=>r.gearId===gearId);
 return {...row,heroId,heroName:HEROES.find(h=>h.id===heroId).name,gearName:GEAR[gearId].name,state:row.owned?'owned':row.warehouse>0?'warehouse':'seeking',difference:gearDifference(m.gear,gearId),sources:equipmentSources(gearId,g)};
}
