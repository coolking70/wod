import {equipmentTotals} from './expedition-equipment.mjs';
export const OFFBEAT={skill:'offbeat',name:'迟拍',stat:'extraActionLimit',limit:1};
export const OFFBEAT_RULE='只选择当前已拥有额外普通行动、且没有迟拍（含待生效）的存活敌人。命中且目标存活后，迟拍在下一回合开始生效，仅该回合少排至多1次额外普通行动；保留基础行动，不重排或取消当前已确定队列。可净化，不叠加/刷新，来源倒下不自动解除；若到时已无额外行动则不减少。费用、伤害和期限是项目暂定设计。';
export function actionBonus(unit){const gear=equipmentTotals(unit.gear);return (unit.attrs.actions??0)+(gear.bonus.actions||0)+(unit.effects||[]).reduce((n,e)=>n+(e.active!==false&&e.stat==='actions'?e.value:0),0);}
export const existingOffbeat=unit=>(unit.effects||[]).find(e=>e.skill===OFFBEAT.skill&&e.stat===OFFBEAT.stat);
export const offbeatEligible=unit=>unit.hp>0&&Math.max(0,Math.floor(1+actionBonus(unit)))>1&&!existingOffbeat(unit);
export function ordinaryActionDecision(unit){const actions=actionBonus(unit),before=Math.max(0,Math.floor(1+actions)),effect=existingOffbeat(unit),active=effect&&effect.active!==false,removed=active?Math.min(OFFBEAT.limit,Math.max(0,before-1)):0;return {actions,count:before-removed,trace:active?{target:unit.id,name:unit.name,source:effect.source,effectId:effect.id,before,removed,after:before-removed,rule:OFFBEAT_RULE}:null};}
export function offbeatTargetCheck(actor,units,target){return {requested:target,selected:[],candidates:units.filter(u=>u.side!==actor.side).map(u=>({id:u.id,name:u.name,bonus:actionBonus(u),count:Math.max(0,Math.floor(1+actionBonus(u))),reason:u.hp<=0?'已倒下':existingOffbeat(u)?'已有迟拍（含待生效）':!offbeatEligible(u)?'当前无额外行动':'可迟拍'})),rule:OFFBEAT_RULE};}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function offbeatEvidenceView(event,origins=new Map()){
 const c=event?.detail?.offbeatSelection,limits=event?.detail?.actionLimits;
 return (c?`<section class="offbeat-target-proof"><h3>迟拍目标检查</h3><ul>${c.candidates.map(u=>`<li>${esc(u.name)}：当前${u.count}次普通行动，${esc(u.reason)}。</li>`).join('')}</ul><p>实际选中：${c.selected.map(u=>esc(u.name)).join('、')||'无，免费检查后备'}。资格还须符合本条阵位/职责/个人优先范围，命中和后续生效另看记录。</p><small>${OFFBEAT_RULE}</small></section>`:'')+(limits?`<section class="offbeat-queue-proof"><h3>本回合迟拍结算</h3>${limits.map(l=>{const origin=origins.get(l.effectId),matched=origin&&origin.source===l.source&&origin.targets.includes(l.target);return `<p>${esc(l.name)}：原可排${l.before}次 → 本回合${l.after}次，少排${l.removed}次额外行动。${matched?`<button data-offbeat-origin="${origin.index}">查看迟拍命中来源</button>`:''}</p>`;}).join('')}<small>这是实际队列数量记录，不换算少受伤害、阻止攻击或胜负贡献。${OFFBEAT_RULE}</small></section>`:'');
}
