import {positionOnlyLabel} from './expedition-position-only.mjs';
import {targetCountLabel} from './expedition-target-count.mjs';
import {scheduleLabel} from './expedition-schedule.mjs';
import {stockFloorLabel} from './expedition-stock-floor.mjs';
import {mediumLabel} from './expedition-media-data.mjs';
import {SKILLS} from './expedition-data.mjs';
import {skillManaCost} from './expedition-advancement-data.mjs';
import {commandCost} from './expedition-media.mjs';
export const RESOURCE_NAMES={herb:'药草',rune:'符纸',arrow:'箭矢'};
// Configured uses only: rows are not casts, demand estimates or guaranteed fallbacks.
export function resourceAssignments(plans,stock){
 const result=Object.fromEntries(Object.keys(RESOURCE_NAMES).map(item=>[item,{item,stock:stock[item],actors:[],rows:[]}]));
 for(const actor of plans){
  for(const phase of ['prep','main'])actor[phase].forEach((command,row)=>{
   const s=SKILLS[command.skill],payment=commandCost(actor,command);if(!payment.resource)return;
   const group=result[payment.resource],fallbacks=actor[phase].slice(row+1).map((r,i)=>({skill:r.skill,row:row+i+1,mode:r.mode,...(r.medium?{medium:r.medium}:{})})).filter(r=>!commandCost(actor,r).resource);
   group.rows.push({actor:actor.id,phase,row,skill:command.skill,mode:command.mode,...(command.onlyPosition?{positionText:positionOnlyLabel(command)}:{}),...(command.minTargets?{countText:targetCountLabel(command)}:{}),...(command.roundWindow?{scheduleText:scheduleLabel(command)}:{}),mana:payment.mana,...(command.keepStock?{floorText:stockFloorLabel(command)}:{}),...(payment.medium!=='standard'?{amount:payment.amount,medium:payment.medium}:{}),fallbacks});if(!group.actors.includes(actor.id))group.actors.push(actor.id);
  });
  if(actor.healing.enabled){const group=result.herb;if(actor.healing.groupAid)group.rows.push({actor:actor.id,phase:'healing',row:null,skill:'groupheal',mode:'conditional',mana:skillManaCost(actor,'groupheal'),amount:2,fallbacks:actor.main.map((r,row)=>({skill:r.skill,row,mode:r.mode})).filter(r=>!commandCost(actor,actor.main[r.row]).resource)});group.rows.push({actor:actor.id,phase:'healing',row:null,skill:'heal',mode:'conditional',mana:skillManaCost(actor,'heal'),fallbacks:actor.main.map((r,row)=>({skill:r.skill,row,mode:r.mode})).filter(r=>!commandCost(actor,actor.main[r.row]).resource)});if(!group.actors.includes(actor.id))group.actors.push(actor.id);}
 }
 return Object.values(result);
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resourceAssignmentsView(resources,{roomId,name}){
 return `<details class="cooperation-resources"><summary>共享材料与后续指令 · ${resources.reduce((n,r)=>n+r.rows.length,0)} 条配置</summary><p>显示出发库存和本房实际指令，单次支付量按技能媒介列出，心诵技能不占共享材料。配置条数不是施放次数，不能相加为预计总消耗；材料跨房继承，本房抵达余量请看战报。</p>${resources.map(group=>`<h4>${RESOURCE_NAMES[group.item]} · 出发${group.stock}份 · ${group.actors.length}位使用者</h4>${group.rows.length?`<div class="table-scroll"><table><thead><tr><th>队员 / 配置</th><th>单次用料</th><th>无材料的后续指令</th><th>调整</th></tr></thead><tbody>${group.rows.map(r=>`<tr data-resource-actor="${esc(r.actor)}" data-resource-skill="${r.skill}" data-resource-phase="${r.phase}"><th>${esc(name(r.actor))} · ${r.phase==='prep'?'预备第'+(r.row+1)+'条':r.phase==='main'?'普通第'+(r.row+1)+'条':'条件救护'}<br>${SKILLS[r.skill].name}${r.skill==='groupheal'?'<small>最紧急伤员同位至少2名达阈值；不足人数/资源则尝试单救</small>':''}${esc(r.scheduleText||'')}${esc(r.countText||'')}${esc(r.positionText||'')}</th><td>${r.mana}法力 / ${r.amount??1}${RESOURCE_NAMES[group.item]}${esc(r.floorText||'')}</td><td>${r.fallbacks.length?r.fallbacks.map(f=>`${SKILLS[f.skill].name}${mediumLabel(f)}（${f.row+1}）`).join('、'):'未配置'}</td><td><button data-cooperation-edit="${esc(r.actor)}" data-cooperation-room="${esc(roomId)}" ${r.row===null?'':`data-cooperation-row="${r.row}" data-cooperation-phase="${r.phase}"`}>调整${r.phase==='healing'?'救护':'此条指令'}</button></td></tr>`).join('')}</tbody></table></div>`:'<p>本房未配置该材料技能。</p>'}`).join('')}<small>“后续”只表示同阶段排在后面的无材料指令；救护行列出普通指令。目标、装备、法力、模式和战中状态仍须满足，不保证实际执行。窄屏可横向滚动表格查看全部列。不会自动改配或预扣资源。</small></details>`;
}
