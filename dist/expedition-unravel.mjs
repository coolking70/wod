// A single existing skill/source group, in recorded application order.
// Gear, intrinsic attributes and event rewards are not skill buffs.
import {SKILLS} from './expedition-data.mjs';
export function removableBuffs(unit){
 const eligible=(unit.effects||[]).filter(e=>!e.harmful&&e.value>0&&SKILLS[e.skill]?.kind==='buff'&&e.source);
 const first=eligible[0];return first?eligible.filter(e=>e.skill===first.skill&&e.source===first.source):[];
}
export function removedBuffRecord(effect){return {effectId:effect.id,skill:effect.skill,name:effect.name,component:effect.component,stat:effect.stat,value:effect.value,source:effect.source,sourceName:effect.sourceName,active:effect.active!==false,scope:effect.scope};}
