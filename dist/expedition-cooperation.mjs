import {resourceAssignments,resourceAssignmentsView} from './expedition-resource-check.mjs';
import {POS,SKILLS,roomsFor,resolveHeroPlan,roomTimeBudget} from './expedition-data.mjs';
import {commandCost} from './expedition-media.mjs';
import {validate} from './expedition-engine.mjs';
import {deploymentPreview} from './expedition-deployment.mjs';

// Static candidates only. No simulation, RNG, resource spending or guild writes.
export function cooperationCheck(config,scope=''){
 validate(config);
 const rooms=roomsFor(config);
 if(scope&&!rooms.some(r=>r.id===scope))throw Error('房间不属于当前路线');
 return rooms.filter(r=>!scope||r.id===scope).map(room=>{
  const preview=deploymentPreview(config,room.id),plans=config.heroes.map(h=>resolveHeroPlan(h,room.id));
  const inRange=(actor,target,h)=>target==='all'||(target==='self'?h.id===actor.id:h.pos===target);
  const healers=plans.filter(h=>h.healing.enabled).map(h=>({id:h.id,target:h.healing.target,threshold:h.healing.threshold,priority:h.healing.priority||'lowest',recipients:plans.filter(t=>inRange(h,h.healing.target,t)).map(t=>t.id)}));
  const healing=plans.map(h=>({id:h.id,healers:healers.filter(a=>a.recipients.includes(h.id)).map(a=>a.id)}));
  const duplicates=[];
  for(let i=0;i<preview.coverage.length;i++)for(const b of preview.coverage.slice(i+1)){
   const a=preview.coverage[i],overlap=a.recipients.filter(id=>b.recipients.includes(id));
   if(!SKILLS[a.skill].cleanse&&a.actor!==b.actor&&a.skill===b.skill&&overlap.length)duplicates.push({skill:a.skill,actors:[a.actor,b.actor],recipients:overlap});
  }
  const herbUsers=plans.map(h=>({id:h.id,skills:[...new Set([...h.prep,...h.main].map(r=>r.skill).filter(id=>SKILLS[id].item==='herb').concat(h.healing.enabled?['heal']:[]))]})).filter(h=>h.skills.length);
  const coverage=preview.coverage.map(r=>{const actor=plans.find(h=>h.id===r.actor),command=actor.prep[r.row],cost=commandCost(actor,command);return {...r,order:preview.order.indexOf(r.actor)+1,mode:command.mode,mana:cost.mana,resource:cost.resource,...(cost.medium!=='standard'?{amount:cost.amount,medium:cost.medium}:{})};});
  return {roomId:room.id,name:room.name,units:preview.units,coverage,healers,healing,duplicates,herbUsers,herb:config.supplies.herb,resources:resourceAssignments(plans,config.supplies),roundLimit:config.expedition==='scarcity'?roomTimeBudget(config,room.id):null};
 });
}

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cooperationView(rooms,{actual=false}={}){
 return `<section class="cooperation-check"><h3>战前协作核对</h3><p>静态条件提示：${actual?'按公会资产及已应用伙伴职责检查实际指令。':'按准备页草稿检查；公会的伙伴职责可能覆盖这些指令，请再核对实际出征队伍。'}候选表示正式队员在各房间的配置范围，不代表实际施放、治疗次数或通关预测。</p>${rooms.map(room=>{
  const name=id=>esc(room.units.find(u=>u.id===id)?.name||id),names=ids=>ids.map(name).join('、')||'无';
  const missing=room.healing.filter(h=>!h.healers.length),overlap=room.healing.filter(h=>h.healers.length>1);
  const support=`<details class="cooperation-support"><summary>全部辅助候选与单次用料 · ${room.coverage.length} 条</summary><div class="table-scroll"><table><thead><tr><th>预备顺序 / 指令</th><th>队员 / 技能</th><th>正式队员候选</th><th>单次用料</th><th>模式 / 调整</th></tr></thead><tbody>${room.coverage.map(r=>`<tr data-cooperation-skill="${esc(r.skill)}" data-cooperation-actor="${esc(r.actor)}"><td>${r.order} / 第${r.row+1}条</td><th>${name(r.actor)} / ${SKILLS[r.skill].name}</th><td>${names(r.recipients)}${SKILLS[r.skill].cleanse?'（施放时须有负面效果）':''}</td><td>${r.mana}法力 / ${r.resource?(r.amount??1)+{herb:'药草',rune:'符纸',arrow:'箭矢'}[r.resource]:'无材料'}</td><td>${{round:'每回合一次',once:'本房一次',repeat:'持续检查',cycle:'轮转'}[r.mode]}<br><button data-cooperation-edit="${esc(r.actor)}" data-cooperation-room="${esc(room.roomId)}" data-cooperation-row="${r.row}">调整${name(r.actor)}第${r.row+1}条预备</button></td></tr>`).join('')}</tbody></table></div><small>顺序是配置的回合前队员顺序，不是预计施放时刻。每人每回合只执行一条可用预备指令；表中各条不保证同时或全部执行，数量不求和为预计消耗。护印含延迟效果，实际生效与强度请追溯战报。</small></details>`;
  return `<details class="review-room" ${rooms.length===1?'open':''}><summary>${esc(room.name)} · 救护 ${room.healers.length} 人 · 药草使用者 ${room.herbUsers.length} 人${room.roundLimit?` · 限时${room.roundLimit}回合`: ''}</summary>${room.roundLimit?`<p class="ready-diff">本房最多${room.roundLimit}回合，限时内未清敌将止步；救护与增益不能代替及时完成战斗。这里不预测是否来得及。</p>`:''}<p>出发共享药草 ${room.herb} 份；跨房间继承，抵达本房余量需看战报。</p>${['insight','mastery'].map(skill=>{const rows=room.coverage.filter(r=>r.skill===skill);return `<p><b>${SKILLS[skill].name}</b>：${rows.length?rows.map(r=>`${name(r.actor)} → ${names(r.recipients)}（预备第${r.row+1}条）`).join('；'):'未配置此辅助'}</p>`;}).join('')}${support}${resourceAssignmentsView(room.resources,{roomId:room.roomId,name:id=>room.units.find(u=>u.id===id)?.name||id})}<p>救护分工：${room.healers.map(h=>`${name(h.id)} → ${POS[h.target]||{all:'全队',self:'自身'}[h.target]} / ≤${Math.round(h.threshold*100)}% / ${h.priority==='self_first'?'优先自保':'最低生命比例'}（候选：${names(h.recipients)}）`).join('；')||'未启用自动救护'}</p><p>救护范围重叠：${names(overlap.map(h=>h.id))}；无救护范围：${names(missing.map(h=>h.id))}。重叠不代表重复治疗，实际在各自行动点重新选择伤员。</p><p>共享药草配置：${room.herbUsers.map(h=>`${name(h.id)}（${h.skills.map(s=>SKILLS[s].name).join('、')}）`).join('；')||'无'}。药膳、药敷与救护共用库存；同名增益仍在时跳过，不按人数预扣。</p>${room.duplicates.map(d=>`<p class="ready-warnings">${names(d.actors)} 的${SKILLS[d.skill].name}候选重叠：${names(d.recipients)}；同名效果互斥，请核对分工。</p>`).join('')}<div class="bar">${room.units.map(u=>`<button data-cooperation-edit="${esc(u.id)}" data-cooperation-room="${esc(room.roomId)}">调整${esc(u.name)} · ${POS[u.pos]}</button>`).join('')}</div></details>`;
 }).join('')}<small>不模拟法力、耗材、指令轮转、同名效果先后、倒下或召唤物；不自动消费资产或修改配置。实际支援与用料可在出征后的逐房账本核对。</small></section>`;
}
