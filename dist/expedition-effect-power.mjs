// Indexed official skill text distinguishes effect-height modifiers from ranks.
// Enemy skill, applicability, costs, values and ordering here are project design.
export const POWER_DAMP=Object.freeze({skill:'bluntgrip',name:'削势',stat:'physicalPower',value:-4,duration:1});
export const POWER_DAMP_RULE='钝锋擒制按近战攻防检定，命中才附削势，当前与下一回合有效；不扣生命、不掷伤害、不降低技能等级或命中均值。后续近战/远程的普通物理生命伤害投点−4，最低0，再按原命中品质、护甲、穿甲、抗性和护盾结算。法术/心理/疾病、削蓝、机关拆解、治疗和淬药魔法附段不受影响。不叠加、不刷新，来源倒下不撤销，可预备净化；无未削势的合法目标时免费检查后备。装备和永久资产不变，所有数值与顺序为项目改编。';
export const activePowerDamp=u=>(u.effects||[]).find(e=>e.stat===POWER_DAMP.stat&&e.harmful===true&&e.active!==false);
export function powerDamageAdjustment(unit,skill,rolled){
 if(skill.kind!=='attack'||!['melee','ranged'].includes(skill.type)||!['melee','ranged'].includes(skill.damageType||skill.type)||skill.nonDamaging||skill.manaDamage||skill.disarm)return null;
 const sources=(unit.effects||[]).filter(e=>e.stat===POWER_DAMP.stat&&e.harmful===true&&e.active!==false);if(!sources.length)return null;
 if(!Number.isSafeInteger(rolled)||rolled<0||sources.some(e=>!Number.isSafeInteger(e.value)||e.value>=0))throw Error('物理威力修正记录无效');
 const modifier=sources.reduce((n,e)=>n+e.value,0),after=Math.max(0,rolled+modifier);
 return {before:rolled,modifier,after,applied:after-rolled,clamped:rolled+modifier<0,sources:sources.map(e=>({effectId:e.id,skill:e.skill,source:e.source,sourceName:e.sourceName,component:e.component,value:e.value,controlEventId:e.controlEventId})),rule:POWER_DAMP_RULE};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function powerDampeningEvidenceView(group){
 const events=Array.isArray(group?.events)?group.events:[group],rows=events.filter(e=>e?.detail&&(e.type==='control'&&e.detail.effectDampening||e.type==='attack'&&e.detail.powerAdjustment));if(!rows.length)return '';
 return '<section class="power-dampening-proof"><h3>削势 · 威力与技能等级分开</h3>'+rows.map(e=>{const d=e.detail;if(e.type==='control')return '<article data-power-control="'+esc(e.id)+'"><b>'+esc(e.text)+'</b><p>'+esc(d.attackType==='melee'?'近战':'攻击')+'均值 '+esc(d.attackMean)+' / 实掷 '+esc(d.attack)+'，防御均值 '+esc(d.defenseMean)+' / 实掷 '+esc(d.defense)+'；防御支付 '+esc(d.defenseProfile?.cost)+' 法力。生命 '+esc(d.hpBefore)+' → '+esc(d.hpAfter)+'。</p><p>'+(d.applied?'实际附削势；没有伤害投点、护甲减伤或技能降级。':esc(d.blockedReason||'被防御抵抗，未附状态')+'；已付施法与防御费用不退。')+'</p></article>';
 const t=d.powerAdjustment;if(!t||!Array.isArray(t.sources)||t.sources.some(s=>!s||typeof s!=='object'||Array.isArray(s)))return '';return '<article data-power-use="'+esc(e.id)+'"><b>'+esc(e.text)+'</b><p>实际技能等级 '+esc(d.skillLevel)+'、命中均值 '+esc(d.attackMean)+' 沿原检定。原物理伤害投点 '+esc(t.before)+' ＋ 威力修正 '+esc(t.modifier)+' → '+esc(t.after)+(t.clamped?'（最低0）':'')+'，再按原品质、防护和剩余生命结算。'+(d.grade==='闪避'?'本次闪避，没有产生伤害；不能把活动削势当成避免伤害。':'这不是最终减伤或避免伤害的反事实估计。')+'</p><p>当时来源：'+t.sources.map(s=>esc(s.sourceName||s.source)+' · '+esc(s.component)+' '+esc(s.value)+'，效果 '+esc(s.effectId)+' / 原控制事件 '+esc(s.controlEventId)).join('；')+'</p></article>';}).join('')+'<small>'+POWER_DAMP_RULE+'</small></section>';
}
