// Match recorded effect identity, not name/amount guesses. No combat re-evaluation.
import {ATTR,SKILLS} from './expedition-data.mjs';
const stats={...ATTR,defense:'全防御检定',skill:'攻击技能等级',defenseSkill:'防御技能等级',armor:'护甲',actions:'行动次数',healingBlock:'自动救护禁疗'};
export function effectOrigins(events){const origins=new Map();events.forEach((e,index)=>{if(e.type==='effect'&&e.detail.effectId)origins.set(e.detail.effectId,{index,source:e.actor,targets:e.targets});});return origins;}
export function sourceTrace(group,origins){
 const attacks=group.events.filter(e=>e.type==='attack'),events=attacks.length?attacks:group.events.filter(e=>e.type==='cast');
 return events.map(e=>{
 const name=id=>e.units.find(u=>u.id===id)?.name||id;
 const sources=(items,recipient,side)=>(items||[]).map(s=>{const origin=origins.get(s.effectId),matched=origin&&origin.source===s.source&&origin.targets.includes(recipient)&&origin.index<group.start;
 return {side,recipient:name(recipient),source:name(s.source),name:s.component||s.name,stat:stats[s.stat]||s.stat,value:s.value,origin:matched?origin.index:null};});
 return {eventId:e.id,title:e.type==='attack'?`${name(e.actor)} → ${name(e.targets[0])}`:`${name(e.actor)} · ${SKILLS[e.detail.skill]?.name||'施放'}`,check:e.type==='attack'?`攻击均值 ${e.detail.attackMean} / 实掷 ${e.detail.attack}；防御均值 ${e.detail.defenseMean} / 实掷 ${e.detail.defense}；${e.detail.grade}，实扣生命 ${e.detail.actual}`:`施放均值 ${e.detail.mean}`,effects:[...sources(e.detail.sources,e.actor,'施放者'),...sources(e.detail.targetSources,e.targets[0],'防御者')]};
 });
}
