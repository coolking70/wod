// Read-only support cues; recipients are recorded results, never predicted coverage.
import {groupActions} from './expedition-report.mjs';
const kinds=new Set(['effect','activate','expire','heal']);
const stats={defense:'全防御检定',int:'智力',skill:'攻击技能等级',defenseSkill:'防御技能等级',armor:'护甲',actions:'行动次数',str:'力量',dex:'灵巧',agi:'敏捷',wil:'意志',cha:'魅力'};
export function supportFrame(group){
 const last=group.events.at(-1),name=id=>last.units.find(u=>u.id===id)?.name||id;
 const changes=group.events.filter(e=>kinds.has(e.type)).flatMap(e=>e.targets.map(target=>{
 const d=e.detail,state=e.type==='heal'?'治疗':e.type==='expire'?'到期':e.type==='activate'?'开始生效':d.active===false?'等待生效':'获得增益';
 const value=e.type==='heal'?`恢复 ${d.actual} 生命`:e.type==='expire'?`${d.component||'效果'}结束`:`${d.component||'效果'} · ${stats[d.stat]||d.stat} +${d.value}`;
 const timing=e.type==='effect'&&d.active===false?`第${d.activateRound}回合生效`:d.expires?`第${d.expires}回合末到期`:d.scope==='expedition'?'远征有效':d.scope==='battle'?'本房间有效':'';
 return {eventId:e.id,from:e.actor,to:target,source:name(e.actor),recipient:name(target),state,value,timing,kind:e.type,pending:d.active===false};
 }));
 return {changes,sources:[...new Set(changes.map(c=>c.from))],recipients:[...new Set(changes.map(c=>c.to))],counts:Object.fromEntries(last.units.map(u=>[u.id,{active:u.effects.filter(e=>e.active!==false).length,pending:u.effects.filter(e=>e.active===false).length}]))};
}
export function supportMoments(events,roomIndex){return groupActions(events).filter(g=>g.roomIndex===roomIndex&&g.events.some(e=>kinds.has(e.type))).map(g=>({start:g.start,end:g.end,round:g.round,label:g.events.find(e=>e.type==='cast')?.text||g.events.find(e=>kinds.has(e.type)).text}));}
