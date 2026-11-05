import {HEROES,SKILLS,roomsFor,clone} from './expedition-data.mjs';
import {historyConfig,validateGuild} from './expedition-guild.mjs';
import {rosterConfig} from './expedition-roster.mjs';import {readiness} from './expedition-readiness.mjs';import {validate} from './expedition-engine.mjs';
import {lockedSkills} from './expedition-growth.mjs';import {configurationChanges} from './expedition-review.mjs';
export const PERSONAL_TACTIC_FIELDS=['attackOrder','pos','trained','attribute','defenseFocus','defenses','itemPolicy','healing','prep','main'];
// A stale-preview check, not an authentication token. Source assets are never copied.
export function historyTacticPreview(g,tactics,{historyId,sourceId,targetId,copyRooms=false}){
 validateGuild(g);validate(tactics);if(typeof copyRooms!=='boolean')throw Error('逐房复制选项无效');
 const historical=historyConfig(g,historyId),source=historical.heroes.find(h=>h.id===sourceId),member=g.members.find(m=>m.id===targetId),definition=id=>HEROES.find(h=>h.id===id);
 if(!source||!member||!g.lineup.includes(targetId))throw Error('请选择历史队员和当前出战目标');
 if(definition(sourceId).classId!==definition(targetId).classId)throw Error('只能复用同职业队员的战术');
 const actual=readiness(g,tactics).config.heroes.find(h=>h.id===targetId),before=rosterConfig(g,tactics),slot=before.heroes.findIndex(h=>h.id===targetId);before.heroes[slot]=clone(actual);
 const config=clone(before),target=config.heroes[slot],reasons=[],sameRoute=historical.expedition===tactics.expedition;
 for(const key of PERSONAL_TACTIC_FIELDS){if(source[key]===undefined)delete target[key];else target[key]=clone(source[key]);}
 const roomScope=[...new Set([...roomsFor(historical),...roomsFor(tactics)].map(r=>r.id))],ignoredRooms=Object.keys(source.overrides).filter(id=>!roomScope.includes(id));
 if(copyRooms&&sameRoute)target.overrides={...Object.fromEntries(Object.entries(target.overrides).filter(([id])=>!roomScope.includes(id))),...clone(Object.fromEntries(Object.entries(source.overrides).filter(([id])=>roomScope.includes(id))))};
 if(copyRooms&&!sameRoute)reasons.push('路线不同，只能复制默认战术并保留当前逐房覆盖');
 const guild=clone(g),roleChanged=Boolean(guild.command&&targetId!==guild.command.heroId&&(guild.command.companions[targetId]||'custom')!=='custom');if(roleChanged)guild.command.companions[targetId]='custom';
 validate(config);const locked=lockedSkills(member,target);if(locked.length)reasons.push('目标尚未学习课程：'+locked.map(id=>SKILLS[id].name).join('、'));
 if(g.pending)reasons.push('请先领取远征结算');
 const changes=configurationChanges(before,config);if(!changes.length&&!roleChanged)reasons.push('战术与目标当前配置一致');
 const check=readiness(guild,config).heroes.find(h=>h.id===targetId);
 const signature=JSON.stringify([historyId,sourceId,targetId,copyRooms,historical,member,g.lineup,g.command,g.pending,tactics]);
 return {historyId,sourceId,targetId,copyRooms,sameRoute,roomScope,ignoredRooms,sourceName:definition(sourceId).name,targetName:definition(targetId).name,sourceRoute:historical.expedition,targetRoute:tactics.expedition,allowed:!reasons.length,reasons,changes,roleChanged,signature,guild,config,warnings:check.warnings,targetWarnings:check.targetWarnings};
}
export function reuseHistoryTactic(g,tactics,request){
 if(typeof request?.signature!=='string')throw Error('战术复用缺少预览快照');const p=historyTacticPreview(g,tactics,request);
 if(p.signature!==request.signature)throw Error('战术复用预览已过期，请重新预览');if(!p.allowed)throw Error(p.reasons.join('；'));
 return {guild:p.guild,config:p.config};
}
