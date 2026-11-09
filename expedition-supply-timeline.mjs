const names={herb:'药草',rune:'符纸',arrow:'箭矢'},valid=n=>Number.isSafeInteger(n)&&n>=0,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cause(e,resource,before,after){
 const d=e.detail||{},delta=after-before,amount=d.itemAmount===undefined?1:d.itemAmount,actor=e.units?.find(u=>u.id===e.actor);
 if(e.type==='cast'&&actor?.side==='party'&&d.item===resource&&valid(amount)&&amount>0&&delta===-amount)return{kind:'cast',label:'施放支付',actor:actor.name};
 if(['branch','encounter','rescue'].includes(e.type)&&valid(d.suppliesBefore?.[resource])&&valid(d.suppliesAfter?.[resource])&&d.suppliesBefore[resource]===before&&d.suppliesAfter[resource]===after)return{kind:'event',label:delta>0?'事件补入':'事件支出',actor:null};
 return{kind:'unknown',label:'快照变化 · 原因未核实',actor:null};
}
// Cursor is an array index, never an event ID. Read only the selected prefix;
// deltas and balances are facts even when their explicit cause is not verified.
export function supplyTimeline(report,cursor,resource='herb',limit=12){
 if(!Array.isArray(report?.events)||!Number.isInteger(cursor)||cursor<0||cursor>=report.events.length||!Object.hasOwn(names,resource)||!Number.isInteger(limit)||limit<1||limit>50)return null;
 const now=report.events[cursor],current=now?.supplies?.[resource];if(!valid(current))return null;
 let start=null,last=null,gap=false,gaps=0,lastZero=null;const rows=[],ids=new Set();
 for(let i=0;i<=cursor;i++){
  const e=report.events[i];if(!Number.isSafeInteger(e?.id)||ids.has(e.id))return null;ids.add(e.id);const n=e.supplies?.[resource];
  if(!valid(n)){if(start)gap=true;continue;}
  if(!start){start={value:n,eventId:e.id,eventIndex:i};last=n;continue;}
  if(gap)gaps++;const delta=n-last;
  if(delta!==0){const reason=gap?{kind:'unknown',label:'记录间隔 · 原因未核实',actor:null}:cause(e,resource,last,n),r={eventId:e.id,eventIndex:i,roomIndex:e.roomIndex,round:e.round,phase:e.phase,text:e.text,before:last,after:n,delta,...reason};rows.push(r);if(delta<0&&n===0)lastZero=r;}
  last=n;gap=false;
 }
 if(!start)return null;const received=rows.reduce((n,r)=>n+Math.max(0,r.delta),0),spent=rows.reduce((n,r)=>n+Math.max(0,-r.delta),0);
 if(!valid(received)||!valid(spent)||!valid(start.value+received))return null;
 return{resource,name:names[resource],cursor,eventId:now.id,value:current,start,received,spent,balanced:start.value+received-spent===current,unknown:rows.filter(r=>r.kind==='unknown').length,gaps,total:rows.length,lastZero,rows:rows.slice(-limit)};
}
const icons={herb:'<path d="M12 22V11M12 15C3 15 3 6 4 4C11 4 14 8 12 15ZM12 19C21 19 22 10 20 8C14 9 11 13 12 19Z"/>',rune:'<path d="M6 3H17L21 7V23H6ZM17 3V8H21M10 10L16 16M16 10L10 16M10 20H17"/>',arrow:'<path d="M5 22L21 4M15 5L22 3L21 10M5 15V22H12M8 18L14 18M9 11L10 17"/>'};
export function supplyIcon(resource){return Object.hasOwn(icons,resource)?`<svg class="supply-icon supply-${resource}" viewBox="0 0 26 26" aria-hidden="true" focusable="false">${icons[resource]}</svg>`:'';}
export function supplySummaryView(supplies){return Object.entries(names).map(([key,name])=>`<button type="button" data-supply-resource="${key}" aria-label="${name}${valid(supplies?.[key])?supplies[key]:'未知'}，查看截至当前步的共享补给去向">${supplyIcon(key)}${name} ${valid(supplies?.[key])?supplies[key]:'?'}</button>`).join(' · ');}
export function supplyTimelineView(t){
 if(!t)return'<p>当前补给快照不完整，无法核对去向。</p>';
 const where=r=>(valid(r.roomIndex)?r.roomIndex+1:'?')+'房 · 第'+(valid(r.round)?r.round:'?')+'回合',total=t.start.value+t.received,used=total?Math.min(100,100*t.spent/total):0,remaining=total?Math.min(100,100*t.value/total):0,button=(r,marker,text)=>`<button type="button" data-supply-source="${r.eventIndex}" data-supply-event="${r.eventId}" data-supply-marker="${marker}">${text}</button>`;
 return`<div class="supply-choices" role="group" aria-label="选择共享材料">${Object.entries(names).map(([key,name])=>`<button type="button" data-supply-resource="${key}" aria-pressed="${key===t.resource}">${supplyIcon(key)}${name}</button>`).join('')}</div><h3>${t.name} · 当前 ${t.value}</h3><p>首次可见 ${t.start.value} ＋ 已补入 ${t.received} − 已流出 ${t.spent} ＝ 当前 ${t.value}</p><svg class="supply-balance supply-${t.resource}" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect class="supply-empty" width="100" height="8" rx="2"/><rect class="supply-spent" width="${used}" height="8"/><rect class="supply-left" x="${used}" width="${remaining}" height="8"/></svg><p class="muted">截至当前回放快照；最近 ${t.rows.length}/${t.total} 次变化。材料由全队共享、跨房间继承。群体效果和缓释恢复不会重复记为支付；未支付的跳过不记作消耗。</p>${t.lastZero?`<p class="supply-zero">${button(t.lastZero,'zero',`最近一次降为0 · ${where(t.lastZero)} · 原记录 ${t.lastZero.eventId}`)}</p>`:t.start.value===0?'<p class="supply-zero">首次可见已经为0，不能定位此前是否发生过支付。</p>':''}${t.unknown||t.gaps?'<p class="supply-unknown">存在记录间隔或未核实原因；差额照实保留，不推测是哪位队员支付。</p>':''}<div class="supply-rows">${t.rows.map(r=>button(r,'row',`<small>${where(r)} · ${esc(r.phase)} · ${r.label}${r.actor?' · '+esc(r.actor):''}</small><b>${r.before} → ${r.after}（${r.delta>0?'+':''}${r.delta}）</b><span>${esc(r.text)}</span>`)).join('')||'<p>此时尚无已记录的补给变化。</p>'}</div><small>点击变化可查看原记录并返回。流出量不等于浪费；最后一份材料的支付不等于失败原因。此处不改变补给、指令或奖励。</small>`;
}
