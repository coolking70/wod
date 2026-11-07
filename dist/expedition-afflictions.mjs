// Optional, original status mechanics. They use existing effect identity,
// attack checks and round expiry; no extra roll or hidden turn cancellation.
export const WEAKENING={skill:'dissonance',name:'挫志',stat:'skill',value:-3,duration:1};
export const signed=n=>(n>=0?'+':'')+n;
export function cleansableEffects(unit){return (unit.effects||[]).filter(e=>e.harmful===true);}
export function activeWeakening(unit){return (unit.effects||[]).find(e=>e.skill===WEAKENING.skill&&e.harmful&&e.active!==false);}
export function canWeaken(skill,grade,target){return !!(skill.weakening&&grade!=='闪避'&&target.hp>0&&!activeWeakening(target));}
export function effectValue(effect){const label=effect.component||effect.name||'效果',stats={weaponDamage:'持械附加法术伤害基值',skill:'攻击技能等级',defense:'全防御检定',defenseSkill:'防御技能等级',manaRegen:'自然法力回复修正',armor:'护甲',actions:'行动次数',regeneration:'每回合缓释恢复',str:'力量',con:'体质',int:'智力',dex:'灵巧',cha:'魅力',agi:'敏捷',per:'感知',wil:'意志'};return (effect.stat==='focusMark'?`${label} · 对方合法单体攻击优先`:effect.stat==='extraActionLimit'?`${label} · ${effect.active===false?'下回合':'本回合'}最多少1次额外行动（保留基础）`:effect.stat==='corrosion'?`${label} · 每回合持续伤害基值${effect.value}`:effect.stat==='healingBlock'?'本回合后续自动救护受限':effect.stat==='cover'?`${label} · 援护许可`:`${label} · ${stats[effect.stat]||effect.stat} ${signed(effect.value)}`)+(effect.active===false?'（待生效）':'');}
