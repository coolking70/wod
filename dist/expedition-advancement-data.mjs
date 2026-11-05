import {HEROES,SKILLS} from './expedition-data.mjs';
export const ADVANCEMENT_COST=80;
export const ADVANCEMENT_REQUIRED_XP=300;
// Project-specific advancement values; ordinary skills remain independently available.
export const ADVANCEMENTS={
 shieldcraft:{name:'盾阵研修',classId:'guardian',desc:'守势法力消耗3→2；进攻技能仍可自由使用。',mana:{guard:-1}},
 breachcraft:{name:'破阵研修',classId:'guardian',desc:'盾缘重击法力消耗3→2；装备与目标限制不变。',mana:{shieldbash:-1}},
 huntercraft:{name:'猎弓研修',classId:'ranger',desc:'破甲重箭法力消耗4→3，仍用1箭矢；齐射保留。',mana:{pierce:-1}},
 volleycraft:{name:'齐射研修',classId:'ranger',desc:'齐射法力消耗5→4，仍用1箭矢；单体追击保留。',mana:{volley:-1}},
 evoker:{name:'凝潮研修',classId:'tidecaller',desc:'凝潮长枪法力消耗9→7，符纸仍1；其他法术保留。',mana:{lance:-2}},
 summoner:{name:'唤潮研修',classId:'tidecaller',desc:'唤潮卫法力消耗10→8，仍用1符纸并遵守存活召唤限制。',mana:{sentinel:-2}},
 mentor:{name:'启蒙研修',classId:'bard',desc:'灵感启蒙的智力加成额外+2；节拍等普通技能保留。',effect:{insight:{int:2}}},
 tempo:{name:'急行研修',classId:'bard',desc:'急行节拍法力消耗8→6，覆盖与行动次数不变。',mana:{rhythm:-2}},
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
