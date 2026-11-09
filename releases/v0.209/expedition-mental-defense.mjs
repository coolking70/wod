// Historical social-parade structure is a direction, not current-server rules.
// Access, base rank, formula and cost below are this project's ordinary defence.
export const COMPOSURE=Object.freeze({name:'定心自守',primary:'wil',secondary:'cha',cost:2,types:Object.freeze(['mental'])});
export const MENTAL_DEFENSE_RULE='未另选心理防御时跟随法术选择。定心自守以意志×2＋魅力＋实时防御等级×2作检定，每次支付2法力，不占普通行动；与心智抵抗分别培养。法力不足回退原自然防御；自然防御仍用意志与智力，心理抗性另行减伤。分房覆盖整组防御，恢复联动不删除已培养等级。';
export const independentMentalDefense=u=>Object.hasOwn(u.defenses||{},'mental');
export function validateMentalDefense(defenses,definitions){
 if(!Object.hasOwn(defenses,'mental'))return;
 const choice=defenses.mental;
 if(typeof choice!=='string'||!Object.hasOwn(definitions,choice)||!definitions[choice].types.includes('mental'))throw Error('心理防御选择无效');
}
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function mentalDefensePreparationView(plan,profile){
 if(!independentMentalDefense(plan))return '';
 const p=profile,name=p.mentalDefense?.name||p.name;
 return `<p class="ready-mental-defense" data-mental-choice="${esc(plan.defenses.mental)}">心理独立：${esc(name)} · 出发等级${esc(p.level)}（培养${esc(p.training)}／专修${esc(p.specialization)}） · 每次${esc(p.cost)}法力。按公会实际装备与培养、满法力且无临时效果核对；实战状态会改变检定，缺蓝回退自然防御。</p>`;
}
export function mentalDefenseEvidenceView(group){
 const events=group?.events||[group],checks=events.filter(e=>e?.type==='defend'&&e.detail?.attackType==='mental'&&e.detail.mentalDefense);
 if(!checks.length)return '';
 return '<section class="mental-defense-proof"><h3>心理独立防御 · 实际检定与支付</h3><p>只读本次已结算记录；防御不是治疗或普通行动，心理抗性仍另算。</p>'+checks.map(e=>{const d=e.detail,name=e.units?.find(u=>u.id===e.actor)?.name||e.actor;return `<article data-mental-defense-event="${esc(e.id)}"><b>${esc(name)} · ${esc(d.name)}</b><p>已选${esc(d.mentalDefense.name)}${d.reason?'，'+esc(d.reason)+'，回退'+esc(d.name):''}；${esc(d.primary==='wil'?'意志':d.primary)}${esc(d.primaryValue)}×2＋${esc(d.secondary==='cha'?'魅力':d.secondary==='int'?'智力':d.secondary)}${esc(d.secondaryValue)}＋等级${esc(d.level)}×2＋全防御${esc(d.bonus)}＝均值${esc(d.mean)}，实掷${esc(d.roll)}。</p><p>等级：基础${d.skill==='natural'?0:6}＋专修${esc(d.specialization)}＋培养${esc(d.training)}＋装备${esc(d.equipment||0)}＋临时${esc(d.temporaryLevel)}；法力${esc(d.mpBefore)}→${esc(d.mpAfter)}，实付${esc(d.cost)}，不占普通行动。</p></article>`;}).join('')+'</section>';
}
