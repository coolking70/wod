import {SKILLS,POS} from './expedition-data.mjs';
import {skillManaCost} from './expedition-advancement-data.mjs';
export const GROUP_AID_RULE='先沿既有最低生命比例/优先自保策略找到最紧急伤员，只看其所在阵位达到治疗阈值的存活友方，至少2名才用合剂，最多3名；不跨位凑数，不复活。人数、法力或药草不足时尝试原单体救护。合剂占一次普通行动，支付10法力/2药草，每人恢复floor(本技能均值×0.45)，不推进普通指令；禁疗和道具优先照旧。具体参数为项目暂定改编。';
export function validateGroupAid(healing,template){if(!Object.hasOwn(healing,'groupAid'))return;if(typeof healing.groupAid!=='boolean'||!template.skills.includes('groupheal'))throw Error('同位合剂仅药师可配置，须为布尔值');}
export function groupAidCandidates(actor,units,target,lead){
 if(!lead||lead.hp<=0||lead.hp/lead.maxHp>actor.healing.threshold)return [];
 return units.filter(u=>u.side===actor.side&&u.hp>0&&u.hp<u.maxHp&&u.hp/u.maxHp<=actor.healing.threshold&&u.pos===lead.pos&&(target==='all'||(target==='self'?u.id===actor.id:u.pos===target))).sort((a,b)=>(Number(b.id===lead.id)-Number(a.id===lead.id)||a.hp/a.maxHp-b.hp/b.maxHp)).slice(0,SKILLS.groupheal.max);
}
export function groupAidDecision(actor,units,stock,lead){
 const candidates=groupAidCandidates(actor,units,actor.healing.target,lead),mana=skillManaCost(actor,'groupheal'),herb=SKILLS.groupheal.itemAmount;
 const reason=!actor.healing.enabled?'自动救护已关闭':actor.skills?.groupheal===undefined?'没有同位合剂技能':!lead||lead.hp/lead.maxHp>actor.healing.threshold?'没有达到阈值的优先伤员':candidates.length<2?'优先伤员同阵位不足2名达阈值伤员':actor.mp<mana?'合剂法力不足':stock.herb<herb?'合剂药草不足':'满足同位合剂条件';
 const use=reason==='满足同位合剂条件';
 return {chosenSkill:use?'groupheal':'heal',leadId:lead?.id||null,position:lead?.pos||null,candidates:candidates.map(u=>({id:u.id,name:u.name,hp:u.hp,maxHp:u.maxHp})),selected:use?candidates.map(u=>u.id):[],reason,groupCost:{mp:mana,herb},fallback:!use,rule:GROUP_AID_RULE};
}
export const groupAidLabel=healing=>healing?.groupAid?' · 同位合剂优先（不足2人或资源时单救）':'';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function groupAidEvidenceView(d){const g=d?.groupAid;if(!g)return '';return `<section class="group-aid-proof"><h4>同位合剂检查</h4><p>${esc(g.reason)}；优先伤员所在${POS[g.position]||'阵位未确定'}，达阈值候选${g.candidates.map(u=>esc(u.name)).join('、')||'无'}。${g.fallback?'本次按原单体救护条件处理，是否执行仍看实际治疗决策。':'本次选择同位合剂，最多3人，共付'+g.groupCost.mp+'法力/'+g.groupCost.herb+'药草，仍可能被禁疗或道具优先打断。'}</p><small>${GROUP_AID_RULE}</small></section>`;}
