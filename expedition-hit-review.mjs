import{TYPES}from'./expedition-data.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e9;
// One recorded HP attack in this room/prefix, without gear inference or new rolls.
export function hitReview(report,unitId,eventId){
 const end=report.events.findIndex(e=>e.id===eventId);if(end<0)return null;const now=report.events[end],unit=now.units.find(u=>u.id===unitId);
 if(!unit||unit.side!=='party'||unit.owner||!report.config.heroes.some(h=>h.id===unitId))return null;
 const event=report.events.slice(0,end+1).findLast(e=>e.roomIndex===now.roomIndex&&e.type==='attack'&&e.targets.includes(unitId));if(!event)return null;
 const d=event.detail||{},base={unit:unit.name,eventId:event.id,text:event.text,roomIndex:event.roomIndex,round:event.round,attackType:TYPES[d.attackType]||'未知',damageType:TYPES[d.damageType||d.attackType]||'未知'};
 if(d.grade==='闪避')return{...base,complete:false,reason:'本条为闪避，零伤害应结合原攻防检定查看；不把它解释为抗性减免。'};
 if(d.damageParts||d.manaShield||d.mechanismHit)return{...base,complete:false,reason:'该条含分段伤害、护盾或机制结算，请查看原攻击明细；不把主段抗性当作总伤害原因。'};
 const fields=['unresisted','resistanceDelta','resistance','damage','actual','overkill','hpBefore','hpAfter'];
 if(!fields.every(k=>number(d[k]))||['unresisted','damage','actual','overkill','hpBefore','hpAfter'].some(k=>d[k]<0)||d.unresisted-d.resistanceDelta!==d.damage||d.actual+d.overkill!==d.damage||d.hpBefore-d.hpAfter!==d.actual)return{...base,complete:false,reason:'原记录缺少一致的完整拆解字段，请查看原攻击明细；不补算未记录的数据。'};
 return{...base,complete:true,unresisted:d.unresisted,resistance:d.resistance,resistanceDelta:d.resistanceDelta,damage:d.damage,actual:d.actual,overkill:d.overkill,hpBefore:d.hpBefore,hpAfter:d.hpAfter};
}
export function hitReviewView(review){
 if(!review)return'';const source=`<button type="button" data-hit-review-event="${esc(review.eventId)}">查看原攻击记录 ${esc(review.eventId)}</button>`,title=`<h4>最近一次生命攻击 · 第${esc(review.round)}回合</h4>`;
 if(!review.complete)return`<section class="hit-review">${title}<p>${esc(review.text)}</p><p>${esc(review.reason)}</p>${source}</section>`;
 const delta=review.resistanceDelta<0?'使伤害增加 '+(-review.resistanceDelta):review.resistanceDelta>0?'使伤害减少 '+review.resistanceDelta:'未改变取整伤害',width=review.damage?320*review.actual/review.damage:0;
 return`<section class="hit-review">${title}<p>${esc(review.attackType)}检定 / ${esc(review.damageType)}伤害；本条${esc(review.damageType)}抗性 ${review.resistance}%。</p><p>抗性前取整 ${review.unresisted} → 抗性${delta} → 结算伤害 ${review.damage}。</p><svg class="hit-review-bar" viewBox="0 0 320 16" aria-hidden="true" focusable="false"><rect class="hit-review-track" width="320" height="16" rx="3"/><rect class="hit-review-loss" width="${width}" height="16"/><rect class="hit-review-overflow" x="${width}" width="${review.damage?320-width:0}" height="16"/></svg><p>生命损失 ${review.actual} · 溢出 ${review.overkill}；HP ${review.hpBefore} → ${review.hpAfter}。</p><p class="muted">只拆解本房已发生的这一条记录；不代表之后的生命，也不预测换装结果。其他效果或装备是否造成差异需另行核查。</p>${source}</section>`;
}
