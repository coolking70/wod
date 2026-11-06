import {effectValue} from './expedition-afflictions.mjs';
// Read-only support cues; recipients are recorded results, never predicted coverage.
import {groupActions} from './expedition-report.mjs';
const kinds=new Set(['ward-link','ward-release','effect','cleanse','dispel','activate','expire','heal']);
const stats={cover:'援护许可',regeneration:'每回合缓释恢复',defense:'全防御检定',int:'智力',skill:'攻击技能等级',defenseSkill:'防御技能等级',armor:'护甲',actions:'行动次数',str:'力量',dex:'灵巧',agi:'敏捷',wil:'意志',cha:'魅力'};
export function supportFrame(group){
 const last=group.events.at(-1),name=id=>last.units.find(u=>u.id===id)?.name||id;
 const changes=group.events.filter(e=>kinds.has(e.type)).flatMap(e=>e.targets.map(target=>{
 const d=e.detail,harmful=Boolean(e.type==='dispel'||d.harmful||d.stat==='healingBlock'),state=e.type==='ward-link'?'机关护壁建立':e.type==='ward-release'?'机关护壁解除':e.type==='dispel'?'破印':e.type==='cleanse'?'净化':e.type==='heal'?(d.passive?'缓释恢复':'治疗'):e.type==='expire'?'到期':e.type==='activate'?'开始生效':harmful?(d.component||'负面')+'已附着':d.active===false?'等待生效':'获得增益';
 const value=e.type==='ward-link'?'护甲 +'+d.armor:e.type==='ward-release'?'当前总护甲 '+d.armorBefore+' → '+d.armorAfter:['cleanse','dispel'].includes(e.type)?d.removed.map(effectValue).join('；'):e.type==='heal'?`恢复 ${d.actual} 生命`:e.type==='expire'?`${d.component||'效果'}结束`:harmful?effectValue(d):`${d.component||'效果'} · ${stats[d.stat]||d.stat} +${d.value}`;
 const timing=e.type==='ward-link'?'来源机关存活期间':e.type==='ward-release'?'立即解除，旧受击不回滚':e.type==='effect'&&d.active===false?`第${d.activateRound}回合生效`:d.expires?`第${d.expires}回合末到期`:d.scope==='expedition'?'远征有效':d.scope==='battle'?'本房间有效':'';
 return {eventId:e.id,from:e.actor,to:target,source:name(e.actor),recipient:name(target),state,value,timing,kind:e.type,harmful,pending:d.active===false};
 }));
 return {changes,sources:[...new Set(changes.map(c=>c.from))],recipients:[...new Set(changes.map(c=>c.to))],harmfulRecipients:[...new Set(changes.filter(c=>c.harmful).map(c=>c.to))],counts:Object.fromEntries(last.units.map(u=>[u.id,{active:u.effects.filter(e=>e.active!==false&&!e.harmful).length,pending:u.effects.filter(e=>e.active===false&&!e.harmful).length,harmful:u.effects.filter(e=>e.active!==false&&e.harmful).length}]))};
}
export function supportMoments(events,roomIndex){return groupActions(events).filter(g=>g.roomIndex===roomIndex&&g.events.some(e=>kinds.has(e.type))).map(g=>({start:g.start,end:g.end,round:g.round,label:g.events.find(e=>e.type==='cast')?.text||g.events.find(e=>kinds.has(e.type)).text}));}
