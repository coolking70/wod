// Optional, original status mechanics. They use existing effect identity,
// attack checks and round expiry; no extra roll or hidden turn cancellation.
export const WEAKENING={skill:'dissonance',name:'挫志',stat:'skill',value:-3,duration:1};
export const signed=n=>(n>=0?'+':'')+n;
export function cleansableEffects(unit){return (unit.effects||[]).filter(e=>e.harmful===true);}
export function activeWeakening(unit){return (unit.effects||[]).find(e=>e.skill===WEAKENING.skill&&e.harmful&&e.active!==false);}
export function canWeaken(skill,grade,target){return !!(skill.weakening&&grade!=='闪避'&&target.hp>0&&!activeWeakening(target));}
export function effectValue(effect){return effect.stat==='healingBlock'?'本回合后续自动救护受限':`${effect.component||effect.name||'效果'} · ${{skill:'攻击技能等级',defense:'全防御检定'}[effect.stat]||effect.stat} ${signed(effect.value)}`;}
