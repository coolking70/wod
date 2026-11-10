import {hospiceConfig} from './expedition-data.mjs';
export const HOSPICE_GOALS=[{id:'cargo',name:'封存物资完整归航',rule:'清场且六人存活，带回至少4符纸与4箭矢。'},{id:'handoff',name:'准时交接',rule:'同时完成封存物资目标，三房战斗累计不超过15回合。'}];
export function contractPlan(kind){
 if(!['sustained','opening','frugal'].includes(kind))throw Error('未知交接方案');
 const c=hospiceConfig('source');
 if(kind!=='sustained'){
  for(const h of c.heroes.filter(h=>['b','c'].includes(h.id)))for(const plan of [h,...Object.values(h.overrides)]){if(kind==='opening')plan.main[0].mode='once';else plan.main=plan.main.slice(1);}
  // Protection has an opportunity cost too: one opening ward in every room.
  c.heroes.find(h=>h.id==='d').prep[0].mode='once';
 }
 return c;
}
export function contractResult(report){
 if(report.config.expedition!=='hospice')return null;
 const rounds=report.rooms.reduce((n,r)=>n+r.rounds,0),alive=report.party.filter(u=>u.hp>0).length;
 const cargo=report.won&&alive===6&&report.supplies.rune>=4&&report.supplies.arrow>=4;
 return {rounds,alive,cargo,handoff:cargo&&rounds<=15};
}
export function contractFrame(report,event){
 if(report.config.expedition!=='hospice'||!event)return null;
 const rounds=report.rooms.slice(0,event.roomIndex).reduce((n,r)=>n+r.rounds,0)+event.round;
 const alive=event.units.filter(u=>u.side==='party'&&!u.owner&&u.hp>0).length;
 const reserve=event.supplies.rune>=4&&event.supplies.arrow>=4;
 const completed=event.type==='victory'&&event.roomIndex===2;
 const stopped=event.type==='defeat';
 const cargo=completed&&alive===6&&reserve;
 return {rounds,alive,rune:event.supplies.rune,arrow:event.supplies.arrow,cargoStatus:cargo?'已达成':stopped||alive<6||!reserve?'未达成，当前远征已无法满足':'待归航',handoffStatus:cargo&&rounds<=15?'已达成':stopped||alive<6||!reserve||rounds>15?'未达成，当前远征已无法满足':'待交接'};
}
