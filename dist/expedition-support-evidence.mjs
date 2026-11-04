import {ATTR,HEROES,SKILLS,roomsFor} from './expedition-data.mjs';

export const SUPPORT_FIELDS={cast:'施放均值',attack:'攻击均值',defense:'防御均值',armor:'原始护甲'};
const stats={...ATTR,skill:'攻击技能等级',defense:'全防御检定',defenseSkill:'防御技能等级',armor:'护甲',actions:'行动次数'};
const key=(room,actor,cast)=>JSON.stringify([room,actor,cast]);
const skillWeight=(skill,stat)=>{const s=SKILLS[skill];return s?(stat===s.primary?2:0)+(stat===s.secondary?1:0)+(s.kind==='attack'&&stat==='skill'?2:0):0;};
const defenseWeight=(profile,stat)=>profile?(stat===profile.primary?2:0)+(stat===profile.secondary?1:0)+(stat==='defense'?1:0)+(stat==='defenseSkill'&&profile.skill&&profile.skill!=='natural'?2:0):0;

// Read only recorded identities and active snapshots. Never replay a fight without a buff.
export function supportEvidence(report){
 const ids=new Set(report.config.heroes.map(h=>h.id)),names=new Map();
 for(const e of report.events)for(const u of e.units||[])if(!names.has(u.id))names.set(u.id,u.name);
 const name=id=>names.get(id)||HEROES.find(h=>h.id===id)?.name||id;
 const actors=report.config.heroes.map(h=>({id:h.id,name:name(h.id),role:HEROES.find(t=>t.id===h.id)?.role||''}));
 const rooms=report.rooms.map((r,i)=>({index:i,roomId:r.id||roomsFor(report.config)[i]?.id||null,name:r.name,casts:[],skips:[]}));
 const casts=new Map(),origins=new Map(),ambiguous=new Set(),seenUses=new Set();let unlinkedReferences=0;
 report.events.forEach((e,index)=>{
  if(!ids.has(e.actor)||SKILLS[e.detail?.skill]?.kind!=='buff'||!rooms[e.roomIndex])return;
  if(e.type==='cast'){
   const d=e.detail,c={eventId:e.id,index,roomIndex:e.roomIndex,actor:e.actor,name:name(e.actor),skill:d.skill,round:e.round,mana:Number.isFinite(d.mpBefore)&&Number.isFinite(d.mpAfter)?d.mpBefore-d.mpAfter:null,item:d.item||null,targets:[...new Set(e.targets)],effects:[],uses:[]};
   rooms[e.roomIndex].casts.push(c);const k=key(e.roomIndex,e.actor,d.cast);if(!casts.has(k))casts.set(k,[]);casts.get(k).push(c);
  }
  if(e.type==='skip'){
   const rows=rooms[e.roomIndex].skips,d=e.detail;let row=rows.find(x=>x.actor===e.actor&&x.skill===d.skill&&x.reason===d.reason);
   if(!row){row={actor:e.actor,name:name(e.actor),skill:d.skill,reason:d.reason,count:0,firstEvent:e.id};rows.push(row);}row.count++;
  }
 });
 report.events.forEach((e,index)=>{
  if(e.type!=='effect'||!ids.has(e.actor)||!e.detail?.effectId||e.targets.length!==1)return;
  const candidates=casts.get(key(e.roomIndex,e.actor,e.detail.cast)),c=candidates?.length===1?candidates[0]:null;
  if(!c||c.index>=index||e.detail.skill!==c.skill||!c.targets.includes(e.targets[0]))return;
  const d=e.detail,origin={id:d.effectId,eventId:e.id,index,source:e.actor,recipient:e.targets[0],skill:d.skill,component:d.component||SKILLS[d.skill]?.name||d.skill,stat:d.stat,value:d.value,scope:d.scope,roomIndex:e.roomIndex,waiting:d.active===false,cast:c};
  if(origins.has(origin.id)){ambiguous.add(origin.id);return;}
  origins.set(origin.id,origin);c.effects.push({id:origin.id,eventId:e.id,recipient:origin.recipient,name:name(origin.recipient),component:origin.component,stat:origin.stat,value:origin.value,waiting:origin.waiting});
 });
 const record=(e,index,recipient,sources,kind,weight,recorded)=>{
  if(!Number.isFinite(recorded))return;
  for(const source of sources||[]){
   const coefficient=weight(source.stat);if(!coefficient)continue;
   const origin=origins.get(source.effectId),snapshot=e.units?.find(u=>u.id===recipient)?.effects?.find(f=>f.id===source.effectId);
   if(!origin||ambiguous.has(source.effectId)||origin.index>=index||origin.source!==source.source||origin.recipient!==recipient||origin.stat!==source.stat||origin.value!==source.value||!Number.isFinite(source.value)||!snapshot||snapshot.active===false||snapshot.source!==source.source||snapshot.stat!==source.stat||snapshot.value!==source.value||(origin.roomIndex!==e.roomIndex&&origin.scope!=='expedition')){unlinkedReferences++;continue;}
   const identity=JSON.stringify([source.effectId,e.id,kind,recipient]);if(seenUses.has(identity))continue;seenUses.add(identity);
   origin.cast.uses.push({eventId:e.id,index,roomIndex:e.roomIndex,roomName:report.rooms[e.roomIndex]?.name||'',round:e.round,kind,recipient,name:name(recipient),skill:e.detail.skill,checkName:kind==='defense'?(e.detail.defenseProfile?.name||'防御检定'):kind==='armor'?'承受'+(SKILLS[e.detail.skill]?.name||e.detail.skill):(SKILLS[e.detail.skill]?.name||e.detail.skill),component:origin.component,stat:source.stat,value:source.value,coefficient,term:source.value*coefficient,recorded,originEvent:origin.eventId,effectId:source.effectId});
  }
 };
 report.events.forEach((e,index)=>{
  const d=e.detail||{};
  // Attack casts are represented by their real per-target checks, not counted twice.
  if(e.type==='cast'&&SKILLS[d.skill]?.kind!=='attack')record(e,index,e.actor,d.sources,'cast',stat=>skillWeight(d.skill,stat),d.mean);
  if(e.type==='attack'){
   record(e,index,e.actor,d.sources,'attack',stat=>skillWeight(d.skill,stat),d.attackMean);
   record(e,index,e.targets[0],d.targetSources,'defense',stat=>defenseWeight(d.defenseProfile,stat),d.defenseMean);
   record(e,index,e.targets[0],d.targetSources,'armor',stat=>stat==='armor'?1:0,d.armorBefore);
  }
 });
 const totals={casts:0,applications:0,components:0,links:0,skips:0};
 for(const room of rooms){for(const c of room.casts){c.effects=c.effects.filter(e=>!ambiguous.has(e.id));totals.casts++;totals.applications+=c.targets.length;totals.components+=c.effects.length;totals.links+=c.uses.length;}totals.skips+=room.skips.reduce((n,s)=>n+s.count,0);}
 return {actors,rooms,totals,unlinkedReferences};
}

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function supportEvidenceView(data,actor='all'){
 if(actor!=='all'&&!data.actors.some(a=>a.id===actor))actor='all';
 const matches=c=>actor==='all'||c.actor===actor,rooms=data.rooms.map(r=>({...r,casts:r.casts.filter(matches),skips:r.skips.filter(matches)})).filter(r=>r.casts.length||r.skips.length);
 const actorName=id=>esc(data.actors.find(a=>a.id===id)?.name||id),names=ids=>ids.map(actorName).join('、');
 return `<p class="eyebrow">已发生的协作 / 从辅助追到检定</p><h2>这次辅助，后来用在了哪里？</h2><p>查看正式队员实际施放的辅助、实际受益者，以及后续记录中采用该效果的字段。这里只解释已记录公式的加法项，不计算额外伤害、避免伤害或胜负贡献。</p><label>查看施放者<select id="support-evidence-actor"><option value="all" ${actor==='all'?'selected':''}>全部出战队员</option>${data.actors.map(a=>`<option value="${esc(a.id)}" ${actor===a.id?'selected':''}>${esc(a.name)} · ${esc(a.role)}</option>`).join('')}</select></label>${rooms.map(room=>`<details class="review-room" data-support-room="${room.index}"><summary>${esc(room.name)} · 成功辅助 ${room.casts.length} 次 · 跳过尝试 ${room.skips.reduce((n,s)=>n+s.count,0)} 次</summary>${room.casts.map(c=>`<details class="support-cast" data-support-cast="${c.eventId}" data-support-actor="${esc(c.actor)}" data-support-skill="${esc(c.skill)}"><summary>${esc(c.name)} · ${SKILLS[c.skill].name} · 第${c.round}回合 · ${c.targets.length} 名实际受益者 · ${c.uses.length} 项后续字段记录</summary><p>本次支付 ${c.mana??'未记录'} 法力${c.item?' / 1'+{herb:'药草',rune:'符纸',arrow:'箭矢'}[c.item]:' / 无材料'}。群体受益与护印组件不重复计费。</p><p>正式队员受益者：${names(c.targets.filter(id=>data.actors.some(a=>a.id===id)))||'无'}${c.targets.some(id=>!data.actors.some(a=>a.id===id))?'；另含召唤物，详见施放记录':''}。</p><div class="bar"><button data-support-evidence-event="${c.eventId}">查看这次施放</button>${room.roomId?`<button data-support-evidence-edit="${esc(room.roomId)}:${esc(c.actor)}">从本房调整${esc(c.name)}</button>`:''}</div><ul>${c.effects.map(e=>`<li>${esc(e.name)}：${esc(e.component)} · ${esc(stats[e.stat]||e.stat)} +${e.value}${e.waiting?'（施放时等待生效）':''}</li>`).join('')||'<li>无可唯一匹配的效果明细。</li>'}</ul>${c.uses.length?`<label>选择一条后续检定或护甲记录<select data-support-evidence-record><option value="">${c.uses.length} 项字段记录；选择后定位行动证据</option>${c.uses.map(u=>`<option value="${u.eventId}">${esc(u.roomName)} · 第${u.round}回合 · ${esc(u.name)} / ${esc(u.checkName)} · ${SUPPORT_FIELDS[u.kind]} ${u.recorded}：${esc(stats[u.stat]||u.stat)} +${u.value} × ${u.coefficient} → 加法项 +${u.term}</option>`).join('')}</select></label>`:'<p>本索引没有后续字段记录；不等于辅助无效。行动次数、先攻、机关和其他未索引环节仍需查看原始战报。</p>'}</details>`).join('')}${room.skips.length?`<details><summary>辅助跳过尝试 · 不等于行动空过</summary><ul>${room.skips.map(s=>`<li>${esc(s.name)} · ${SKILLS[s.skill].name}：${esc(s.reason)} ×${s.count} <button data-support-evidence-event="${s.firstEvent}">查看首次尝试</button></li>`).join('')}</ul></details>`:''}</details>`).join('')||'<p>当前筛选没有成功辅助或辅助跳过记录。</p>'}<p class="muted">来自完整已结算战报，不随播放位置变化。只索引施放均值、攻击均值、防御均值和原始护甲；均值字段采用加成，也可能因固定效果、取整或其他规则而不改变最终结果。原始护甲可能被破甲或其他规则处理，不能当作实际减伤。攻击施放与逐目标检定不重复索引，多个字段也不等于多次行动。来源或生效快照不完整时不猜测关联。</p>`;
}
