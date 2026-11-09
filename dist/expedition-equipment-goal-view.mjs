import {GEAR,HEROES} from './expedition-data.mjs';
import {SLOTS} from './expedition-equipment.mjs';
import {equipmentGoalStatus,relicCollection,equipmentSources} from './expedition-equipment-goal.mjs';
import {equipmentStats,equipmentImpact} from './expedition-equipment-view.mjs';
import {gearDifference} from './expedition-loot.mjs';
import {equipmentGoalTransfers} from './expedition-equipment-goal-transfer.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function transferView(g){
 const rows=equipmentGoalTransfers(g);if(!rows.length)return '';
 return `<section class="equipment-goal-transfers" aria-label="寻物遗物的队友持有情况"><p><img src="assets/items/relic-relay-v216.svg" width="72" height="24" alt="" aria-hidden="true" style="vertical-align:middle"> 队友持有 → 明确回仓 → 分配给寻物队员</p><p>查看只定位持有人。正在穿戴或被配装册引用时须先自行处理；回仓和分配各需明确操作。</p><ul>${rows.map(r=>`<li><p>${esc(r.heroName)} · ${r.available?'当前可预览回仓':esc(r.reason)}</p><button data-equipment-goal-owner="${r.heroId}">查看${esc(r.heroName)}的${esc(r.gearName)}与回仓条件</button></li>`).join('')}</ul></section>`;
}
const names=ids=>ids.map(id=>HEROES.find(h=>h.id===id).name).join('、');
export function equipmentGoalView(g,config){
 const p=equipmentGoalStatus(g);if(!p)return '';
 const m=g.members.find(m=>m.id===p.heroId),plan=config?.heroes.find(h=>h.id===p.heroId)||m.tactics,impact=equipmentImpact(plan,m.gear,p.gearId),worn=m.gear[GEAR[p.gearId].slot]===p.gearId;
 return `<section class="guild-panel equipment-goal" data-equipment-goal-state="${p.state}"><p class=eyebrow>本次寻物 / 归指定队员持有才完成</p><h2>为${p.heroName}寻找${p.gearName}</h2><p class=equipment-goal-progress>${p.state==='owned'?'寻物完成 · 此人已持有'+(worn?'，当前已装备':'，可按需要换装'):p.state==='warehouse'?'仓库已有'+p.warehouse+'件 · 尚未分配给此人':'尚未取得 · 选择来源，按实际队伍准备'}。${p.otherOwners.length?'其他持有人：'+names(p.otherOwners)+'；闲置遗物可先回共享仓库，再明确分配。':''}</p><p>${equipmentStats(p.gearId)}</p><p>相对此人当前${SLOTS[GEAR[p.gearId].slot]}：${p.difference}</p>${impact.length?`<p class=gear-warning>${impact.join('；')}</p>`:''}<div class=bar><button data-equipment-goal-open=true>查看此人装备与寻访册</button>${p.state==='warehouse'?`<button data-equipment-goal-assign=true ${g.pending?'disabled':''}>分配1件给${p.heroName}并装备</button>`:p.state==='owned'&&!worn?`<button data-equipment-goal-wear=true ${g.pending?'disabled':''}>为${p.heroName}装备已持有遗物</button>`:''}<button data-equipment-goal-clear=true ${g.pending?'disabled':''}>结束此目标</button></div>${transferView(g)}<details class=equipment-goal-sources><summary>可获取来源与当前条件</summary>${p.sources.map(s=>`<p>${s.label}</p>${s.kind==='route'?`<button data-equipment-source-route="${s.route}">准备此来源路线 →</button>`:s.kind==='story'?`<button data-equipment-source-story="${s.book}">查看旅程条件与结局 →</button>`:['exchange','contract'].includes(s.kind)?'<button data-guild-tab="contracts">查看委托与兑换 →</button>':''}`).join('')}</details><small>寻物只记录你的选择，不增加奖励、改变掉落或自动领货。仓库到货仍须明确分配；已拥有不要求继续装备，目标可随时更换。出征待领取时暂停改目标与配装。</small></section>`;
}
export function equipmentCollectionView(g,id){
 const rows=relicCollection(g,id),m=g.members.find(m=>m.id===id),name=HEROES.find(h=>h.id===id).name;
 return `<section class="guild-panel relic-collection" data-guild-pane="equipment"><details><summary>遗物寻访册 · ${name}已持有${rows.filter(r=>r.owned).length}/${rows.length}件</summary><p>为一名已招募队员选择一件待寻遗物，全队同时保留一个目标；切换查看队员或切换本人不会更换目标。各部位是不同取舍，不按数值给出总战力排名。</p><div class=equipment-catalog>${rows.map(r=>`<article class=equipment-item data-collection-item="${r.gearId}"><div><small>${SLOTS[GEAR[r.gearId].slot]} · ${r.owned?'此人已持有':r.warehouse?'仓库待分配 ×'+r.warehouse:'此人尚未持有'}</small><h3>${GEAR[r.gearId].name}</h3><p>${equipmentStats(r.gearId)}</p><p>替换当前部位：${gearDifference(m.gear,r.gearId)}</p>${r.otherOwners.length?`<p>其他持有人：${names(r.otherOwners)}</p>`:''}<details><summary>查看全部来源</summary>${equipmentSources(r.gearId,g).map(s=>`<p>${s.label}</p>`).join('')}</details></div><button data-equipment-goal="${r.gearId}" ${g.pending||r.owned?'disabled':''}>${r.owned?'此人已持有':g.equipmentGoal?.heroId===id&&g.equipmentGoal.gearId===r.gearId?'当前寻物目标':'为'+name+'设为寻物目标'}</button></article>`).join('')}</div></details></section>`;
}
