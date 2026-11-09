const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>(n>=0?'+':'')+n;
export const MANA_REGENERATION_RULE='自然法力阶段在预备之后、先攻之前执行。基础+1与当时有效的法力回复修正相加，再按0至法力上限截断；不占行动、不重掷、不重复扣施法材料。负回复不是攻击、禁疗或每回合续付门槛；降到0不会自动解除原增益。只有仍存活单位参与，效果到期/破除后按剩余有效来源重新计算。技能和数值是项目改编。';
export function manaRegenerationProfile(unit,modifier,sources=[]){
 const before=unit.mp,max=unit.maxMp;
 if(!Number.isSafeInteger(before)||!Number.isSafeInteger(max)||before<0||max<before||!Number.isSafeInteger(modifier))throw Error('自然法力回复状态无效');
 const requested=1+modifier,after=Math.max(0,Math.min(max,before+requested));
 return {base:1,modifier,requested,before,after,max,actual:after-before,unapplied:Math.abs(requested-(after-before)),sources:structuredClone(sources),rule:MANA_REGENERATION_RULE};
}
export function manaRegenerationEvidenceView(event,origins=new Map()){
 const p=event.detail.manaRegeneration;if(!p)return '';
 return `<section class="mana-regeneration-proof"><h3>自然法力变化 · ${esc(signed(p.actual))}</h3><p>基础+${esc(p.base)}，有效修正${esc(signed(p.modifier))}，本次应变${esc(signed(p.requested))}；法力${esc(p.before)} → ${esc(p.after)}/${esc(p.max)}${p.unapplied?'，上下限截断'+esc(p.unapplied)+'未生效':''}。本次没有再次施法、扣材料或占用行动。</p>${p.sources.map(s=>{const origin=origins.get(s.effectId),at=origin?.index;return `<p>${esc(s.name)} · ${esc(s.component)} ${esc(signed(s.value))}；来源${esc(event.units?.find(u=>u.id===s.source)?.name||s.source)}${Number.isInteger(at)&&origin.source===s.source&&origin.targets.includes(event.actor)?` <button data-mana-regen-source="${at}">查看施放来源</button>`:''}</p>`;}).join('')}<small>${MANA_REGENERATION_RULE}</small></section>`;
}
