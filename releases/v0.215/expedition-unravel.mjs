// A single existing skill/source group, in recorded application order.
// Gear, intrinsic attributes and event rewards are not skill buffs.
import {SKILLS} from './expedition-data.mjs';
export function removableBuffs(unit){
 const eligible=(unit.effects||[]).filter(e=>!e.harmful&&e.value>0&&SKILLS[e.skill]?.kind==='buff'&&e.source);
 const first=eligible[0];return first?(unit.effects||[]).filter(e=>!e.harmful&&e.skill===first.skill&&e.source===first.source):[];
}
export function removedBuffRecord(effect){return {effectId:effect.id,skill:effect.skill,name:effect.name,component:effect.component,stat:effect.stat,value:effect.value,source:effect.source,sourceName:effect.sourceName,active:effect.active!==false,scope:effect.scope};}

export function dispelRule(removed){return '命中后只移除本记录列出的同技能/同来源一组'+(removed.some(e=>e.value<0)?'增益及其伴随代价组件':'正面组件')+'（含待生效）；本次攻防与已排定行动不回滚，不退款，不阻止之后重新施放。';}
