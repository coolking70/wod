export const HEALING_BLOCK_STAT='healingBlock';
export const HEALING_BLOCK_REASON='本回合禁疗，继续普通指令';
export function activeHealingBlock(unit){return unit.effects?.find(e=>e.stat===HEALING_BLOCK_STAT&&e.active!==false);}
export function healingBlockTrace(unit){const effect=activeHealingBlock(unit);return effect?{effectId:effect.id,source:effect.source,target:unit.id,component:effect.component||'禁疗'}:null;}
export function canApplyHealingBlock(skill,grade,target){return !!(skill.healingBlock&&grade!=='闪避'&&target.hp>0&&target.skills?.heal!==undefined&&!activeHealingBlock(target));}
