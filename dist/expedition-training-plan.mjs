import {HEROES,trainingOptions,MAX_TRAINING_RANK} from './expedition-data.mjs';
import {isAdvanced,growth} from './expedition-growth.mjs';
import {experienceForTraining,PROGRESSION_RULES} from './expedition-progression-rules.mjs';
// This snapshot detects stale drafts; it is not an authentication token.
export const trainingSnapshot=m=>JSON.stringify([PROGRESSION_RULES.id,m.id,m.classId,m.xp,Object.entries(m.training).sort(([a],[b])=>a.localeCompare(b)),[...m.unlocked].sort(),m.advancement||null]);
export function quoteTrainingPlan(member,target,{expected}={}){
 if(!HEROES.some(h=>h.id===member?.id))throw Error('队员无效');
 if(!target||typeof target!=='object'||Array.isArray(target)||![Object.prototype,null].includes(Object.getPrototypeOf(target)))throw Error('培养草案格式无效');
 const options=trainingOptions(member.id),next={},reasons=[],rows=[],current=trainingSnapshot(member),progress=growth(member);
 for(const [key,rank] of Object.entries(target)){
  if(!Object.hasOwn(options,key)||!Number.isSafeInteger(rank)||rank<0||rank>MAX_TRAINING_RANK)throw Error('培养草案项目或等级无效');
  if(rank)next[key]=rank;
 }
 let cost=0,refund=0;
 for(const [key,option] of Object.entries(options)){
  const before=member.training[key]||0,after=next[key]||0;if(before===after)continue;
  if(after>before&&option.kind==='skill'&&isAdvanced(option.id)&&(!member.unlocked.includes(option.id)||after>progress.advancedRank))reasons.push(option.name+'尚未学习或超过当前成长阶段上限');
  const delta=experienceForTraining({[key]:after})-experienceForTraining({[key]:before});if(delta>0)cost+=delta;else refund-=delta;
  rows.push({key,name:option.name,before,after,cost:Math.max(0,delta),refund:Math.max(0,-delta)});
 }
 if(expected!==undefined&&expected!==current)reasons.push('该队员成长已变化，请重新开始培养草案');
 if(!rows.length)reasons.push('尚未调整培养');
 // Compute the net atomically: intermediate refund totals must not round integers.
 const available=BigInt(member.xp)+BigInt(refund)-BigInt(cost),safe=available>=0n&&available<=BigInt(Number.MAX_SAFE_INTEGER);
 if(available<0n)reasons.push('该队员经验不足，包含退款后仍需'+String(-available)+'经验');
 else if(!safe)reasons.push('调整后经验超出安全范围');
 return {target:next,expected:expected??current,rows,cost,refund,availableBefore:member.xp,availableAfter:safe?Number(available):null,investedBefore:experienceForTraining(member.training),investedAfter:experienceForTraining(next),earned:progress.earned,allowed:reasons.length===0,reasons,profile:PROGRESSION_RULES.id};
}
