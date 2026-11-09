import {validateGuild} from './expedition-guild.mjs';
import {isRelic} from './expedition-loot.mjs';
import {clone,HEROES,GEAR} from './expedition-data.mjs';

// Shared loot only. Personal shop purchases keep their existing ownership rule.
export function lootReturnStatus(g,heroId,gearId){
 validateGuild(g);
 const member=typeof heroId==='string'?g.members.find(m=>m.id===heroId):null;
 const relic=typeof gearId==='string'&&isRelic(gearId),owned=Boolean(member&&member.owned.includes(gearId));
 const worn=Boolean(member&&Object.values(member.gear).includes(gearId));
 const sets=(member?.equipmentSets||[]).filter(s=>Object.values(s.gear).includes(gearId)).map(s=>({slot:s.slot,name:s.name}));
 const before=typeof gearId==='string'&&Object.hasOwn(g.warehouse,gearId)?g.warehouse[gearId]:0,reasons=[];
 if(g.pending)reasons.push('当前远征待结算，请先领取');
 if(!member)reasons.push('没有这名公会队员');
 if(!relic)reasons.push('只有共享战利品遗物可回仓，个人商店装备保留原规则');
 if(member&&!owned)reasons.push('此人未持有该遗物');
 if(worn)reasons.push('当前正在穿戴，请先换下');
 if(sets.length)reasons.push('配装栏'+sets.map(s=>s.slot+'「'+s.name+'」').join('、')+'仍引用，请先更新或删除相应配装栏');
 if(!Number.isSafeInteger(before+1))reasons.push('仓库库存超过安全计数范围');
 return {heroId,gearId,heroName:HEROES.find(h=>h.id===heroId)?.name||'',gearName:typeof gearId==='string'?GEAR[gearId]?.name||'未知装备':'未知装备',available:reasons.length===0,reason:reasons.join('；'),worn,sets,warehouseBefore:before,warehouseAfter:reasons.length?before:before+1};
}

export function returnLoot(g,heroId,gearId){
 const status=lootReturnStatus(g,heroId,gearId);if(!status.available)throw Error(status.reason);
 const n=clone(g),member=n.members.find(m=>m.id===heroId);
 member.owned=member.owned.filter(id=>id!==gearId);n.warehouse[gearId]=status.warehouseAfter;
 return validateGuild(n);
}
