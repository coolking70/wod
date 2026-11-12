// Historical WoD describes non-damaging debuff attacks. All concrete rules here
// (name, access,4MP, fixed-12 and duration) are this project's adaptation.
export const TAUNT=Object.freeze({skill:'taunt',name:'动摇',stat:'attackMean',value:-12,duration:1});
export const CONTROL_RULE='心理攻防命中后附动摇：之后攻击均值−12，当前与下一回合有效；不扣生命、不掷伤害，不降低治疗、辅助、防御或先攻。不叠加或刷新，来源倒下不撤销，可净化；类型免疫或已有动摇者先排除，无候选免费后备。不是强制换目标、沉默或取消行动，已完成检定与队列不回滚。';
export const activeControl=u=>(u.effects||[]).find(e=>e.stat===TAUNT.stat&&e.harmful===true&&e.active!==false);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function controlEvidenceView(group){
 const events=group?.events||[group],rows=events.filter(e=>e?.type==='control'&&!e.detail?.effectDampening||['attack','mana-damage','cast'].includes(e?.type)&&e.detail?.sources?.some(s=>s.stat===TAUNT.stat));if(!rows.length)return '';
 return '<section class="control-proof"><h3>无伤削弱 · 实际攻防与后续影响</h3>'+rows.map(e=>{const d=e.detail;if(e.type==='control')return `<article data-control-event="${esc(e.id)}"><b>${esc(e.text)}</b><p>攻击均值${esc(d.attackMean)} / 实掷${esc(d.attack)}，${esc(d.defenseProfile.name)}均值${esc(d.defenseMean)} / 实掷${esc(d.defense)}；防御支付${esc(d.defenseProfile.cost)}法力。</p><p>生命${esc(d.hpBefore)}→${esc(d.hpAfter)}；未掷伤害，不套用护甲或伤害抗性。${d.applied?'命中附动摇−12，命中级别不增强固定削弱。':'被防御抵抗，未附状态；施法与防御费用不退。'}</p></article>`;const sources=d.sources.filter(s=>s.stat===TAUNT.stat);return `<article data-control-use="${esc(e.id)}"><p>本次${e.type==='cast'?'施放':'攻击'}均值${esc(d.attackMean??d.mean)}已计入${sources.map(s=>esc(s.component||s.name)+' '+esc(s.value)+'（来源'+esc(s.sourceName||s.source)+'；效果'+esc(s.effectId)+'）').join('、')}。这里只解释记录中的均值项，不推算避免伤害。</p></article>`;}).join('')+`<small>${CONTROL_RULE}</small></section>`;
}
