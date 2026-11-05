import {stockFloorWarnings} from './expedition-stock-floor.mjs';
import {commandCost} from './expedition-media.mjs';
import {initialTargetWarnings} from './expedition-target-check.mjs';
import {applyAdvancementAsset} from './expedition-advancement-data.mjs';
import {equipmentName,sameEquipment} from './expedition-equipment.mjs';
import {commandConfig,setCompanion} from './expedition-command.mjs';
import {clone,HEROES,GEAR,SKILLS,DEFENSES,roomsFor,resolveHeroPlan,gearSupports,gearRequirementName,trainingCost} from './expedition-data.mjs';
import {validate,buildParty} from './expedition-engine.mjs';
import {validateGuild} from './expedition-guild.mjs';
import {lockedSkills} from './expedition-growth.mjs';
import {cooperationCheck} from './expedition-cooperation.mjs';
export function readiness(g,tactics,scope=''){
 validateGuild(g);validate(tactics);if(scope&&!roomsFor(tactics).some(r=>r.id===scope))throw Error('房间不属于当前路线');
 const actual=commandConfig(g,tactics);for(const h of actual.heroes){const m=g.members.find(m=>m.id===h.id);h.gear=clone(m.gear);h.training=clone(m.training);applyAdvancementAsset(h,m);}
 const party=buildParty(actual),errors=[];
 const heroes=actual.heroes.map(h=>{const m=g.members.find(m=>m.id===h.id),draft=tactics.heroes.find(x=>x.id===h.id)||h,plan=resolveHeroPlan(h,scope),unit=party.find(u=>u.id===h.id),warnings=[],targetWarnings=[];
 const locked=lockedSkills(m,h);if(locked.length)errors.push({id:h.id,text:'尚未学习：'+locked.map(s=>SKILLS[s].name).join('、')});
 const checks=scope?[{id:scope,plan}]:[{id:'',plan},...roomsFor(actual).map(r=>({id:r.id,plan:resolveHeroPlan(h,r.id)}))];
 for(const entry of checks){const where=entry.id?roomsFor(actual).find(r=>r.id===entry.id).name:'默认';
 for(const command of [...entry.plan.prep,...entry.plan.main]){const s=SKILLS[command.skill];if(s.requiresGear&&!gearSupports(h.gear,s.requiresGear))warnings.push(`${where}：${s.name}缺少${gearRequirementName(s.requiresGear)}`);const payment=commandCost(h,command);warnings.push(...stockFloorWarnings(command,payment,actual.supplies).map(w=>where+'：'+s.name+'，'+w));if(payment.resource&&actual.supplies[payment.resource]<payment.amount)warnings.push(`${where}：${s.name}所需${{herb:'药草',rune:'符纸',arrow:'箭矢'}[payment.resource]}${payment.medium==='standard'?'为0':'不足'+payment.amount+'份'}`);}
 for(const def of Object.values(entry.plan.defenses))if(DEFENSES[def]?.gear&&!gearSupports(h.gear,DEFENSES[def].gear))warnings.push(`${where}：${DEFENSES[def].name}缺少盾甲，将回退自然防御`);
 if(entry.plan.healing.enabled&&actual.supplies.herb===0)warnings.push(`${where}：救护已启用但药草为0`);
 if(entry.id)targetWarnings.push(...initialTargetWarnings(entry.plan,roomsFor(actual).find(r=>r.id===entry.id)));
 }
 return {id:h.id,name:HEROES.find(t=>t.id===h.id).name,role:HEROES.find(t=>t.id===h.id).role,gear:h.gear,gearName:equipmentName(h.gear),training:h.training,trainingSpent:trainingCost(h.training),advancement:h.advancement||null,gearChanged:!sameEquipment(draft.gear,h.gear),trainingChanged:JSON.stringify(draft.training)!==JSON.stringify(h.training),draftGearName:equipmentName(draft.gear),hp:unit.maxHp,mp:unit.maxMp,trained:h.trained,defenseFocus:h.defenseFocus,attribute:h.attribute,item:h.item,plan,targetWarnings,warnings:[...new Set(warnings)]};});
 return {config:actual,heroes,errors,canDepart:!g.pending&&!errors.length,pending:!!g.pending,scope,cooperation:cooperationCheck(actual,scope)};
}
// Materialize the current applied role before handing control to the editor.
// Locked skills remain visible so they can be removed; this does not authorize departure.
export function customizeForEditing(g,tactics,id,scope=''){
 if(g.pending)throw Error('请先领取远征结算，再调整伙伴职责');
 if(!g.lineup.includes(id))throw Error('只能编辑实际出战队员');
 const actual=readiness(g,tactics,scope).config,changed=Boolean(g.command&&id!==g.command.heroId&&g.command.companions[id]!=='custom');
 return {guild:changed?setCompanion(g,id,'custom'):clone(g),config:actual,changed};
}
