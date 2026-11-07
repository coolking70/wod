const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={cast:'施法支付',defend:'防御支付',intercept:'援护支付',initiative:'先攻支付',windup:'蓄能预付',shield:'护盾吸收支付',drain:'被削减法力',regen:'自然法力变化',transfer:'友方法力转入',item:'随身道具恢复',encounter:'机关检定损失',release:'蓄能释放 · 不重复支付',unknown:'快照变化 · 原因未核实'};
const finite=n=>Number.isFinite(n)&&n>=0;

// Read recorded snapshots, never recompute combat or inspect events after the cursor.
// A cause is credited only when its explicit metadata agrees with both snapshots.
function cause(e,id,before,after){
 const d=e.detail||{},own=e.actor===id,target=e.targets?.includes(id),delta=after-before;
 const pair=(a,b)=>finite(a)&&finite(b)&&a===before&&b===after;
 if(own&&pair(d.mpBefore,d.mpAfter)){
  if(e.type==='cast'&&delta<=0)return d.channel&&delta===0?'release':'cast';
  if(['defend','intercept','initiative-check','windup-start'].includes(e.type)&&d.cost===-delta&&delta<=0)return {'defend':'defend','intercept':'intercept','initiative-check':'initiative','windup-start':'windup'}[e.type];
 }
 if(target&&e.type==='attack'&&pair(d.manaShield?.mpBefore,d.manaShield?.mpAfter)&&d.manaShield.paid===-delta&&delta<=0)return 'shield';
 if(target&&e.type==='mana-damage'&&pair(d.mpBefore,d.mpAfter)&&d.actual===-delta&&delta<=0)return 'drain';
 if(target&&e.type==='mana-transfer'&&pair(d.targetBefore,d.targetAfter)&&d.actual===delta&&delta>=0)return 'transfer';
 if(own&&e.type==='regen'&&pair(d.before,d.after)&&(!d.manaRegeneration||d.manaRegeneration.actual===delta))return 'regen';
 if(own&&e.type==='item'&&d.resource==='mp'&&pair(d.before,d.after)&&d.actual===delta&&delta>=0)return 'item';
 if(own&&target&&e.type==='encounter'&&d.encounter==='sunken-bell'&&d.status==='failure'&&d.manaLoss===-delta&&delta<=0)return 'encounter';
 return 'unknown';
}

export function manaTimeline(report,unitId,eventId,limit=12){
 if(!report?.events||!Number.isInteger(limit)||limit<1)return null;
 const end=report.events.findIndex(e=>e.id===eventId);if(end<0)return null;
 const now=report.events[end],unit=now.units?.find(u=>u.id===unitId);if(!unit||!finite(unit.mp)||!finite(unit.maxMp))return null;
 let start=null,last=null,gap=false,gaps=0;const rows=[],totals={},roomIndex=now.roomIndex;
 for(let i=0;i<=end;i++){
  const e=report.events[i];if(e.roomIndex!==roomIndex)continue;
  const u=e.units?.find(u=>u.id===unitId);
  if(!u||!finite(u.mp)){if(last)gap=true;continue;}
  if(!start){start={mp:u.mp,eventId:e.id,eventIndex:i,entry:e.type==='room'};last=u;continue;}
  if(gap)gaps++;
  const delta=u.mp-last.mp,kind=gap?'unknown':cause(e,unitId,last.mp,u.mp);
  if(delta!==0||kind==='release'){
   const r={eventId:e.id,eventIndex:i,round:e.round,phase:e.phase,kind,label:labels[kind],text:e.text,before:last.mp,after:u.mp,delta};
   rows.push(r);totals[kind]=(totals[kind]||0)+delta;
  }
  last=u;gap=false;
 }
 if(!start)return null;
 const received=rows.reduce((n,r)=>n+Math.max(0,r.delta),0),spent=rows.reduce((n,r)=>n+Math.max(0,-r.delta),0);
 return {unitId,unit:unit.name,roomIndex,eventId,mp:unit.mp,maxMp:unit.maxMp,start,received,spent,balanced:start.mp+received-spent===unit.mp,gaps,totals,total:rows.length,unknown:rows.filter(r=>r.kind==='unknown').length,rows:rows.slice(-limit)};
}

export function manaTimelineView(t){
 if(!t)return '';
 return `<details class="mana-timeline"><summary>法力去向 · 当前 MP ${t.mp}/${t.maxMp}</summary><p><b>${esc(t.unit)}</b> · ${t.start.entry?'本房入场':'本房首次可见'} ${t.start.mp} ＋ 流入 ${t.received} − 流出 ${t.spent} ＝ 当前 ${t.mp}</p><p class="muted">只看本房截至当前快照的变化；最近 ${t.rows.length}/${t.total} 条。施法、防御、被削蓝与护盾支付分列；流出不等于施法贡献。召唤物首次可见的法力不记作补给收益。${t.unknown||t.gaps?'存在未核实变化或记录间断，保留快照差额，不推测原因。':''}</p><div class="mana-timeline-list">${t.rows.map(r=>`<button data-mana-event="${r.eventIndex}" data-mana-kind="${r.kind}"><small>第${r.round}回合 · ${esc(r.phase)} · ${r.label}</small><b>MP ${r.before} → ${r.after}（${r.delta>0?'+':''}${r.delta}）</b><span>${esc(r.text)}</span></button>`).join('')||'<p>此时尚无已记录的法力变化。</p>'}</div><small>点击逐条查看依据，可返回此处；不会读取之后的行动，也不推算尚未发生的消耗。</small></details>`;
}
