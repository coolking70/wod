import {commandCost} from './expedition-media.mjs';
import {roleTargetCandidates} from './expedition-target-check.mjs';
import {clone,SKILLS,HEROES,roomsFor,resolveHeroPlan,gearSupports,gearRequirementName,POS} from './expedition-data.mjs';
import {applyAdvancementAsset,skillManaCost} from './expedition-advancement-data.mjs';
import {isAdvanced} from './expedition-growth.mjs';
import {commandConfig,validateCommand} from './expedition-command.mjs';
import {buildParty,chooseTargets} from './expedition-engine.mjs';
export function companionPreview(g,tactics,id,mode,roomId=''){
 if(!g.command||id===g.command.heroId||!HEROES.some(h=>h.id===id))throw Error('请选择伙伴');
 const candidate=clone(g);candidate.command.companions[id]=mode;validateCommand(candidate.command);
 const config=commandConfig(candidate,tactics),room=roomsFor(config).find(r=>r.id===roomId)||roomsFor(config)[0];
 if(roomId&&room.id!==roomId)throw Error('未知房间');
 for(const h of config.heroes){const m=g.members.find(m=>m.id===h.id);h.gear=clone(m.gear);h.training=clone(m.training);applyAdvancementAsset(h,m);}
 const party=buildParty(config).map(u=>({...u,...resolveHeroPlan(config.heroes.find(h=>h.id===u.id),room.id)})),actor=party.find(h=>h.id===id),enemies=room.enemies.map(u=>({...u,side:'enemy'}));
 const rows=['prep','main'].flatMap(phase=>actor[phase].map(r=>{
  const s=SKILLS[r.skill],payment=commandCost(actor,r),warnings=[];let candidates=[];
  if(isAdvanced(r.skill)&&!g.members.find(m=>m.id===id).unlocked.includes(r.skill))warnings.push('尚未永久学习'+s.name+'，请先在公会学习；当前不可按此职责出征');
  if(s.requiresGear&&!gearSupports(actor.gear,s.requiresGear))warnings.push('缺少'+gearRequirementName(s.requiresGear));
  if(payment.resource&&config.supplies[payment.resource]<payment.amount)warnings.push(payment.medium==='standard'?'出发补给中此耗材为0':'出发补给不足本次所需'+payment.amount+'份');
  if(s.kind==='buff'&&!s.recall)candidates=chooseTargets(actor,s.cover?party.filter(t=>t.id!==actor.id):party,s,r.target).map(u=>u.name);
  if(s.recall)warnings.push('仅召回自己当时存活的召唤物；无目标免费跳过，实际召回占本次预备且不返还原消耗');
  if(s.kind==='attack'){
   if(['healer','summoner'].includes(r.target))candidates=roleTargetCandidates(enemies,r.target).map(u=>u.name);
   else {const chosen=chooseTargets(actor,[...party,...enemies],s,r.target);candidates=(s.mode==='all'?chosen:enemies.filter(u=>u.pos===chosen[0]?.pos&&u.hp>0)).map(u=>u.name);}
   if(!candidates.length)warnings.push('本房初始敌人无此目标，将检查下一条指令');
  }
  return {phase,skill:r.skill,name:s.name,mode:r.mode,target:POS[r.target]||{self:'自身',all:'全队',healer:'治疗者',summoner:'召唤者'}[r.target],kind:s.recall?'recall':s.kind,candidates,max:s.max,cost:payment.mana,item:payment.resource,...(payment.medium!=='standard'?{itemAmount:payment.amount,medium:payment.medium}:{}),warnings};
 }));
 return {roomId:room.id,roomName:room.name,rows,healing:clone(actor.healing),heroId:g.command.heroId};
}
