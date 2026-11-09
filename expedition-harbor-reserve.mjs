export const HARBOR_RESERVE={none:'不预留符纸',seal:'为第三场预留2符纸'};
export const harborReserve=c=>c.harbor?.reserve||'none';
export function harborReserveFloor(c,roomIndex){return c.expedition==='harbor'&&harborReserve(c)==='seal'&&['adaptive','seal'].includes(c.harbor.task)&&roomIndex>=0&&roomIndex<2?2:0;}
export function reserveBlock(c,roomIndex,unit,skill,stock,payment={resource:skill.item,amount:1}){
 const floor=harborReserveFloor(c,roomIndex);
 return floor&&unit.side==='party'&&payment.resource==='rune'&&stock.rune>=payment.amount&&stock.rune-payment.amount<floor?{resource:'rune',floor,available:stock.rune,releaseRoom:2}:null;
}
export function reserveSummary(report){
 const skips=report.events.filter(e=>e.type==='skip'&&e.detail.reservation),decision=report.events.find(e=>e.type==='branch'&&e.roomIndex===2);
 return {policy:harborReserve(report.config),skips:skips.length,firstSkip:skips[0]?.id??null,replaced:skips.filter(e=>e.detail.reserveOutcome?.type==='cast').length,failedActions:new Set(skips.filter(e=>e.detail.reserveOutcome?.type==='failed').map(e=>e.detail.reserveOutcome.eventId)).size,arrivalRunes:decision?.detail.suppliesBefore.rune??null,attempted:!!decision?.detail.check,success:!!decision?.detail.check?.success,released:!!decision?.detail.reserveReleased};
}
export function reserveActionText(events){
 const reserved=events.filter(e=>e.type==='skip'&&e.detail.reservation);if(!reserved.length)return '';
 const reasons=reserved.map(e=>e.text).join('；'),outcomes=[...new Set(reserved.map(e=>e.detail.reserveOutcome?.eventId).filter(Boolean))].map(id=>events.find(e=>e.id===id)).filter(Boolean);
 return reasons+'。'+(outcomes.length?'本次后续：'+outcomes.map(e=>e.text).join('；'):'当前步骤尚无后备施法记录，请继续或查看行动证据。');
}
export function harborReserveComparison(a,b){
 if(a.config.expedition!=='harbor'||b.config.expedition!=='harbor')return '';
 const values=r=>{const s=reserveSummary(r);return [HARBOR_RESERVE[s.policy],s.skips,s.failedActions,s.arrivalRunes??'未抵达',s.attempted?(s.success?'成功':'失败'):'未检定'];},aa=values(a),bb=values(b);
 return '<h3>港口用料与解封对照</h3><table><thead><tr><th>观察项</th><th>A</th><th>B</th></tr></thead><tbody>'+['预留策略','预留跳过尝试','预留后普通行动空过','第三场进场符纸','解封结果'].map((name,i)=>`<tr><th>${name}</th><td>${aa[i]}</td><td>${bb[i]}</td></tr>`).join('')+'</tbody></table><p>预留只保护已有物资，不保证存活、检定成功或整体收益。请同时比较回合、剩余生命与补给。</p>';
}
