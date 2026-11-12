import {GEAR,SLOTS} from './expedition-equipment.mjs';
import {SKILLS} from './expedition-data.mjs';
export const DIRECT_HEALING_RULE='调护药匣仅令已学单救与同位合剂的每名实际受疗者治疗量＋5：先按原技能均值×0.7或×0.45向下取整，再加效果，最后按缺血量截断。技能等级、均值、治疗阈值、伤员选择与合剂人数检查保持原规则；不增加行动、不减免法力或药草。缓释药敷、药瓶/药匣道具、法力恢复、伤害与其他支援不受影响。饰品以体质−2、敏捷−2换取治疗强度；原版公开条目支持效果与等级分开，具体装备、数值和顺序为项目改编。';
export function directHealingSources(gear){
 const ids=typeof gear==='string'?[gear]:Object.keys(SLOTS).map(slot=>gear?.[slot]);
 return ids.flatMap(id=>{const item=Object.hasOwn(GEAR,id)?GEAR[id]:null;if(!item||!Object.hasOwn(item,'directHealingPower'))return [];const value=item.directHealingPower;if(!Number.isSafeInteger(value)||value<=0)throw Error('治疗效果装备定义无效');return [{gearId:id,gearName:item.name,slot:item.slot,value}];});
}
export const directHealingPower=gear=>directHealingSources(gear).reduce((n,s)=>n+s.value,0);
export function directHealingAdjustment(unit,skillId,base,skillLevel,mean){
 if(!['heal','groupheal'].includes(skillId)||SKILLS[skillId]?.kind!=='heal')return null;
 const sources=directHealingSources(unit.gear);if(!sources.length)return null;
 if(![base,skillLevel,mean].every(Number.isSafeInteger)||base<0)throw Error('治疗效果结算无效');
 const bonus=sources.reduce((n,s)=>n+s.value,0);return {base,bonus,total:base+bonus,skillLevel,mean,sources};
}
export function directHealingSummary(gear){const n=directHealingPower(gear);return n?'单救/合剂治疗量 +'+n+'（效果另加，不加技能等级；实际受缺血量截断）':'';}
export function directHealingPreparationView(gear){const text=directHealingSummary(gear);return text?'<section class="healing-effect-preparation"><h4>治疗效果与技能等级分开</h4><p>'+text+'</p><small>'+DIRECT_HEALING_RULE+'</small></section>':'';}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function directHealingEvidenceView(group){
 const events=Array.isArray(group?.events)?group.events:[group],rows=events.filter(e=>e?.type==='heal'&&e.detail?.healingEffect);if(!rows.length)return '';
 const body=rows.map(e=>{const d=e.detail,t=d.healingEffect;if(!t||typeof t!=='object'||Array.isArray(t)||!Array.isArray(t.sources)||!t.sources.length||t.sources.some(s=>!s||typeof s!=='object'||Array.isArray(s)))return '';return '<article data-healing-effect="'+esc(e.id)+'"><b>'+esc(e.text)+'</b><p>实际技能等级 '+esc(t.skillLevel)+'、技能均值 '+esc(t.mean)+'；原基础治疗 '+esc(t.base)+' ＋ 装备效果 '+esc(t.bonus)+' → 治疗量 '+esc(t.total)+'。实际恢复 '+esc(d.actual)+' / 过量治疗 '+esc(d.overheal)+'。</p><p>来源：'+t.sources.map(s=>esc(s.gearName)+'（'+esc(s.gearId)+'） +'+esc(s.value)).join('；')+'。加成后的名义治疗量不等于实际恢复；本条不能推算整队避免伤害或胜率。</p></article>';}).join('');return body?'<section class="healing-effect-proof"><h3>直接治疗效果</h3>'+body+'<small>'+DIRECT_HEALING_RULE+'</small></section>':'';
}
