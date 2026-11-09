import {harborAssessment} from './expedition-harbor-assessment.mjs';
export const HARBOR_EXCHANGE=['beaconrod','quaycoat','tidecompass'];
export const HARBOR_OBJECTIVES={storm:{name:'风暴归航',desc:'在风暴委托中通关盐风港',gold:80,charts:1},tempo:{name:'破浪疾行',desc:'风暴委托：六人生还，四场累计不超过28回合',gold:40,charts:1},stormseal:{name:'风暴解印',desc:'风暴委托：成功解封并通关',gold:40,charts:1},home:{name:'六人归航',desc:'通关盐风港且六人存活',gold:40,charts:1},seal:{name:'熄灭潮锁',desc:'成功解封并通关盐风港',gold:40,charts:0},salvage:{name:'药箱归岸',desc:'经由药仓并通关盐风港',gold:40,charts:0}};
export function harborReward(report,g){
 if(report.config.expedition!=='harbor')return null;
 const reached={...harborAssessment(report).goals,home:report.won&&report.party.every(u=>u.hp>0),seal:report.won&&report.events.some(e=>e.type==='branch'&&e.detail.check?.success),salvage:report.won&&report.rooms.some(r=>r.node==='salvage')};
 const earned=Object.keys(HARBOR_OBJECTIVES).filter(id=>reached[id]&&!g.harbor.claimed.includes(id));
 return {charts:(report.won?1:0)+earned.reduce((n,id)=>n+HARBOR_OBJECTIVES[id].charts,0),gold:earned.reduce((n,id)=>n+HARBOR_OBJECTIVES[id].gold,0),earned};
}
