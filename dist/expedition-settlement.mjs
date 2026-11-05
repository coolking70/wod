import {HOSPICE_GOALS,contractResult} from './expedition-contract.mjs';
// Read-only projections of recorded outcomes; no simulation or random draws.
export const SUPPLY_NAMES={herb:'药草',rune:'符纸',arrow:'箭矢'};
export {GOALS} from './expedition-goal-data.mjs';
import {GOALS} from './expedition-goal-data.mjs';
export function settlementGoals(report){
 const values={clear:report.won,survive:report.won&&report.party.filter(u=>u.hp>0).length===6,reserve:report.won&&report.supplies.rune>=2&&report.supplies.arrow>=2};
 const contract=contractResult(report);return [...GOALS.map(g=>({...g,done:Boolean(values[g.id])})),...(contract?HOSPICE_GOALS.map(g=>({...g,done:contract[g.id]})):[])];
}
export function supplyLedger(report){
 const rows=Object.entries(SUPPLY_NAMES).map(([key,name])=>({key,name,start:report.config.supplies[key],gained:0,spent:0,end:report.config.supplies[key]}));
 const entries=[];
 for(const e of report.events){
  if(!e.supplies)continue;
  const changes=[];
  for(const r of rows){const delta=e.supplies[r.key]-r.end;if(delta){changes.push({key:r.key,name:r.name,delta});r.gained+=Math.max(0,delta);r.spent+=Math.max(0,-delta);}r.end=e.supplies[r.key];}
  if(changes.length)entries.push({eventId:e.id,roomIndex:e.roomIndex,round:e.round,text:e.text,changes});
 }
 return {rows,entries};
}
export function tideFrame(report,event){
 if(report.config.expedition!=='scarcity'||!event)return null;
 const limit=report.rooms[event.roomIndex]?.roundLimit;
 if(!limit)return null;
 const sealed=event.type==='defeat'&&report.rooms[event.roomIndex].stopReason==='潮水封路';
 const settled=['victory','defeat'].includes(event.type);
 const elapsed=Math.min(limit,Math.max(0,event.round-(event.detail?.withdrawal?1:(settled||event.phase==='回合结束')?0:1)));
 return {limit,elapsed,remaining:limit-elapsed,sealed,status:sealed?'潮水封路':event.detail?.withdrawal?'按计划撤退':event.type==='victory'?'本房肃清':event.type==='defeat'?'队伍倒下':'潮位推进',ratio:elapsed/limit};
}
