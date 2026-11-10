import {equipmentGoalStatus} from './expedition-equipment-goal.mjs';
import {lootReturnStatus} from './expedition-loot-transfer.mjs';

// Read-only discovery of existing copies. Returning and assigning remain separate explicit actions.
export function equipmentGoalTransfers(g){
 const goal=equipmentGoalStatus(g);
 return !goal||goal.state==='owned'?[]:goal.otherOwners.map(id=>({...lootReturnStatus(g,id,goal.gearId),targetHeroId:goal.heroId,targetHeroName:goal.heroName}));
}
export function equipmentGoalOwner(g,id){
 const owner=equipmentGoalTransfers(g).find(row=>row.heroId===id);
 if(!owner)throw Error('当前寻物目标或持有人已变化，请重新核对');
 return owner;
}
