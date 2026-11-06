// No rolls or writes here: the engine pays and records one attempt per source/round.
export const INTERCEPTION={skill:'interpose',cost:2,types:['melee','ranged']};
export function interceptionCandidate(target,units,type,round,used){
 const effect=(target.effects||[]).find(e=>e.skill===INTERCEPTION.skill&&e.stat==='cover'&&e.active!==false);if(!effect)return null;
 const guardian=units.find(u=>u.id===effect.source);let reason=null;
 if(!INTERCEPTION.types.includes(type))reason='援护不接法术或心理攻击';
 else if(!guardian||guardian.hp<=0||guardian.side!==target.side)reason='援护者已倒下或不在同队';
 else if(guardian.mechanism)reason='机关不能执行援护';
 else if(guardian.id===target.id)reason='不能援护自己';
 else if(used.get(guardian.id)===round)reason='援护者本回合已经尝试过';
 else if(guardian.mp<INTERCEPTION.cost)reason='援护者法力不足2';
 return {effect,guardian,reason};
}
