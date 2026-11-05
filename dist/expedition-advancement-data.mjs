import {HEROES,SKILLS} from './expedition-data.mjs';
export const ADVANCEMENT_COST=80;
export const ADVANCEMENT_REQUIRED_XP=300;
// Original project paths, separate from ordinary skill availability.
export const ADVANCEMENTS={
 wardcraft:{name:'结界研修',classId:'scholar',desc:'潮纹屏障的全防御加成额外+2；普通控场技能仍可使用。',effect:{ward:{defense:2}}},
 sigilcraft:{name:'制符研修',classId:'scholar',desc:'截疗符法力消耗6→4，仍用1符纸；屏障和其他普通技能保留。',mana:{suppress:-2}},
 emergency:{name:'急救研修',classId:'herbalist',desc:'草药救护法力消耗5→4，仍用1药草且占普通行动；药敷技能保留。',mana:{heal:-1}},
 apothecary:{name:'调剂研修',classId:'herbalist',desc:'缓释药敷每次固定恢复8→10，其余时序、药草和救急限制不变。',effect:{slowcare:{regeneration:2}}}
};
export function advancementOptions(id){const classId=HEROES.find(h=>h.id===id)?.classId;return Object.entries(ADVANCEMENTS).filter(([,v])=>v.classId===classId);}
export function advancementOf(unit){const id=typeof unit.advancement==='string'?unit.advancement:unit.advancement?.path,entry=Object.hasOwn(ADVANCEMENTS,id)?ADVANCEMENTS[id]:null,classId=unit.classId||HEROES.find(h=>h.id===unit.id)?.classId;return entry&&entry.classId===classId?{id,...entry}:null;}
export function skillManaCost(unit,skill){return Math.max(0,SKILLS[skill].cost+(advancementOf(unit)?.mana?.[skill]||0));}
export function advancementEffectBonus(unit,skill,stat){return advancementOf(unit)?.effect?.[skill]?.[stat]||0;}
export function advancementTrace(unit,skill){const a=advancementOf(unit);if(!a||(!a.mana?.[skill]&&!a.effect?.[skill]))return null;return {path:a.id,name:a.name,baseMana:SKILLS[skill].cost,mana:skillManaCost(unit,skill),effectBonus:a.effect?.[skill]||{}};}
export function applyAdvancementAsset(hero,member){if(member.advancement)hero.advancement=member.advancement.path;else delete hero.advancement;}
