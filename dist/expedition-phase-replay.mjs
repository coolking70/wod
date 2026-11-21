import {POS,SKILLS,TYPES} from './expedition-data.mjs';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const immune=types=>types.map(type=>TYPES[type]||type).join('、')||'无';
const orders=rows=>rows.map(row=>(SKILLS[row.skill]?.name||row.skill)+' → '+(POS[row.target]||row.target)).join('；')||'无';

// Only the selected, recorded phase step can show the comparison. Never look ahead.
export function phaseReplay(events,group){
 const event=group.events.find(row=>row.type==='health-phase'&&row.detail?.healthPhase);
 if(!event)return null;
 const phase=event.detail.healthPhase,at=events.indexOf(event);
 const valid=value=>Array.isArray(value?.immuneTo)&&value.immuneTo.every(t=>typeof t==='string')&&Array.isArray(value?.main)&&value.main.every(row=>typeof row?.skill==='string'&&typeof row.target==='string');
 if(at<0||!Number.isFinite(phase.hp)||!Number.isFinite(phase.maxHp)||!valid(phase.before)||!valid(phase.after))return null;
 const sourceIndex=Number.isInteger(phase.sourceEventId)?events.findIndex((row,i)=>i<at&&row.id===phase.sourceEventId&&typeof row.text==='string'&&row.roomIndex===event.roomIndex):-1;
 return {event,phase,sourceIndex,source:sourceIndex<0?null:events[sourceIndex]};
}

function sourceText(source){
 if(!source)return '';
 const d=source.detail,hasHp=Number.isFinite(d?.hpBefore)&&Number.isFinite(d?.hpAfter);
 return esc(source.text)+(hasHp?` · 生命 ${d.hpBefore} → ${d.hpAfter}`:'');
}

export function phaseReplayView(model){
 if(!model)return '';
 const {event,phase,source,sourceIndex}=model;
 const panel=(label,value)=>`<div><b>${label}</b><span>免疫：${esc(immune(value.immuneTo))}</span><span>普通指令：${esc(orders(value.main))}</span></div>`;
 return `<h3>${esc(event.text)}</h3><p>触发时生命 ${phase.hp}/${phase.maxHp} · 既定行动队列保留</p><div class="phase-replay-compare">${panel('转变前',phase.before)}${panel('转变后',phase.after)}</div>${source?`<p>触发：${sourceText(source)}</p><button type="button" data-phase-source="${sourceIndex}">查看触发记录 #${source.id}</button>`:''}`;
}

export function phaseSourceView(source){
 return `<section class="phase-source-record" tabindex="-1" aria-label="触发生命阶段的原记录"><h3>触发记录 #${source.id}</h3><p>${sourceText(source)}</p><button type="button" data-phase-return>返回阶段变化</button></section>`;
}
