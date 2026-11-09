import {HEROES,SKILLS,ATTR} from './expedition-data.mjs';
import {skillManaCost} from './expedition-advancement-data.mjs';
export const INITIATIVE_RULE='回合前与自然回复后、生成普通行动队列之前，每名存活单位独立选择先攻。自然先攻仍为敏捷×2＋感知，不收费。学者可将已学先觉阵用于个人先攻：按智力×2＋感知＋该普通技能实际等级×2检定，每回合支付一次标准法力，不占预备或普通行动、不附敏捷增益；同一回合额外行动共用该次基础实掷与原衰减。缺蓝时免费回退自然先攻，普通行动中的药瓶/援助不会重排已确定队列；已付费用不因未轮到行动而退回。逐房选择与继承沿原方案规则。技能复用、费用、均值及衰减为本项目暂定改编，不是原版现行数值。';
export function initiativeOptions(id){return{natural:'自然先攻 · 敏捷/感知',...(HEROES.find(h=>h.id===id)?.skills.includes('foresight')?{foresight:'先觉先攻 · 智力/感知/先觉阵等级'}:{})};}
export function validateInitiative(h,template){if(h.initiative===undefined)return;if(h.initiative!=='natural'&&(h.initiative!=='foresight'||!template.skills.includes('foresight')))throw Error('先攻选择与职业不匹配');}
export function validateEnemyInitiative(u){if(u.initiative!==undefined&&u.initiative!=='natural'&&(u.initiative!=='foresight'||u.skills?.foresight===undefined))throw Error('遭遇先攻技能无效');}
export function initiativeLabel(h){return h.initiative==='foresight'?'先觉先攻 · 每回合独立付费，缺蓝回自然先攻':'自然先攻 · 免费';}
export function initiativeProfile(u,{current,mean,skillBreakdown}){
 if(u.initiative!=='foresight')return null;const mana=skillManaCost(u,'foresight'),reason=u.skills?.foresight===undefined?'未掌握先觉阵':u.mp<mana?'法力不足':null,chosen=reason?'natural':'foresight',primary=reason?'agi':'int',value=reason?2*current(u,'agi')+current(u,'per'):mean(u,'foresight'),cost=reason?0:mana;
 return{requested:'foresight',chosen,name:reason?'自然先攻':'先觉先攻',skill:'foresight',skillName:SKILLS.foresight.name,reason,cost,requiredMana:mana,mpBefore:u.mp,mpAfter:u.mp-cost,primary,secondary:'per',primaryValue:current(u,primary),secondaryValue:current(u,'per'),mean:value,formula:reason?'敏捷 ×2 + 感知':'智力 ×2 + 感知 + 先觉阵实际等级 ×2',levelSources:reason?null:skillBreakdown(u,'foresight'),consumedAction:false,rule:INITIATIVE_RULE};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line=p=>`${esc(p.name)}：${ATTR[p.primary]}${p.primaryValue}×2＋感知${p.secondaryValue}${p.levelSources?'＋技能'+p.levelSources.total+'×2':''}＝均值${p.mean}；支付${p.cost}法力（${p.mpBefore}→${p.mpAfter}）${p.reason?'；'+esc(p.reason)+'，回退自然先攻':''}。`;
export function initiativeEvidenceView(e){const p=e?.detail?.initiative;if(p)return `<section class=initiative-proof><h3>个人先攻选择 · ${esc(p.name)}</h3><p>${line(p)}</p><small>${esc(p.rule)}</small></section>`;const rows=e?.type==='initiative'?e.detail.order.filter(o=>o.ordinal===1&&o.initiative):[];return rows.length?`<section class=initiative-proof><h3>本回合实际先攻选择</h3>${rows.map(o=>`<p>${esc(o.actor)} · ${line(o.initiative)}基础实掷${o.base}，额外行动沿原衰减。</p>`).join('')}</section>`:'';}
