import {HEROES,SKILLS,clone,roomsFor,resolveHeroPlan} from './expedition-data.mjs';
import {validate} from './expedition-engine.mjs';import {validateGuild} from './expedition-guild.mjs';
import {rosterConfig} from './expedition-roster.mjs';import {readiness} from './expedition-readiness.mjs';
import {lockedSkills} from './expedition-growth.mjs';import {configurationChanges,describeConfigValue} from './expedition-review.mjs';
const FIELDS=['prep','main','healing'];
// Adopt only commands, after materializing the target's actual managed plan.
// A single-room adoption must not turn other rooms into the ignored draft.
export function draftCommandPreview(g,tactics,{targetId,roomId=''}){
 validateGuild(g);validate(tactics);
 const source=tactics.heroes.find(h=>h.id===targetId),member=g.members.find(m=>m.id===targetId),room=roomsFor(tactics).find(r=>r.id===roomId);
 if(!source||!member||!g.lineup.includes(targetId))throw Error('请选择草稿与公会均出战的队员');
 if(typeof roomId!=='string'||roomId&&!room)throw Error('房间不属于当前准备路线');
 const before=rosterConfig(g,tactics),slot=before.heroes.findIndex(h=>h.id===targetId),actual=readiness(g,tactics).config.heroes.find(h=>h.id===targetId);before.heroes[slot]=clone(actual);
 const config=clone(before),target=config.heroes[slot],plan=resolveHeroPlan(source,roomId),destination=roomId?(target.overrides[roomId]??={}):target;
 for(const key of FIELDS)destination[key]=clone(plan[key]);
 const guild=clone(g),roleChanged=Boolean(guild.command&&targetId!==guild.command.heroId&&(guild.command.companions[targetId]||'custom')!=='custom');
 if(roleChanged)guild.command.companions[targetId]='custom';
 validate(config);const reasons=[],locked=lockedSkills(member,target);
 if(locked.length)reasons.push('目标尚未学习课程：'+locked.map(id=>SKILLS[id].name).join('、'));
 if(g.pending)reasons.push('请先领取远征结算');
 const changes=configurationChanges(before,config);if(!changes.length&&!roleChanged)reasons.push('草稿指令与当前实际配置一致');
 const check=readiness(guild,config).heroes.find(h=>h.id===targetId),oldPlan=resolveHeroPlan(actual,roomId),newPlan=resolveHeroPlan(target,roomId),commands=FIELDS.map(key=>({key,label:{prep:'预备指令',main:'普通指令',healing:'救护策略'}[key],before:describeConfigValue(key,oldPlan[key]),after:describeConfigValue(key,newPlan[key]),changed:JSON.stringify(oldPlan[key])!==JSON.stringify(newPlan[key])}));
 return {targetId,roomId,targetName:HEROES.find(h=>h.id===targetId).name,scopeName:room?.name||'默认指令',roleChanged,changes,commands,reasons,allowed:!reasons.length,warnings:check.warnings,signature:JSON.stringify([targetId,roomId,member,g.lineup,g.command,g.pending,g.next,tactics]),guild,config};
}
export function adoptDraftCommands(g,tactics,request){
 if(typeof request?.signature!=='string')throw Error('采用草稿指令缺少预览');
 const p=draftCommandPreview(g,tactics,request);
 if(p.signature!==request.signature)throw Error('草稿指令预览已过期，请重新预览');
 if(!p.allowed)throw Error(p.reasons.join('；'));
 return {guild:p.guild,config:p.config};
}
