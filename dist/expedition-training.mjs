import {HEROES,trainingOptions,trainingCost,TRAINING_BUDGET} from './expedition-data.mjs';
import {growth,isAdvanced} from './expedition-growth.mjs';
export const TRAINING_XP_UNIT=20;
export const trainingInvestment=training=>trainingCost(training)*TRAINING_XP_UNIT;
// Quotes are read-only; pending-expedition protection belongs to the guild transaction.
export function trainingQuote(member,key,direction=1){
 if(![1,-1].includes(direction))throw Error('训练调整方向无效');
 const options=HEROES.some(h=>h.id===member.id)?trainingOptions(member.id):{},option=Object.hasOwn(options,key)?options[key]:null,rank=Object.hasOwn(member.training||{},key)?member.training[key]:0,next=rank+direction,reasons=[];
 if(!option)reasons.push('训练项目不属于该角色职业');
 else if(direction===1){
  if(rank>=3)reasons.push('已达到训练上限（每项3级）');
  if(option.kind==='skill'&&isAdvanced(option.id)&&(!member.unlocked.includes(option.id)||rank>=growth(member).advancedRank))reasons.push('先学习技能；熟练阶段训练最多1级，资深阶段开放2至3级');
  if(trainingCost({...member.training,[key]:next})>TRAINING_BUDGET)reasons.push('已达到训练上限（总预算6点）');
  if(member.xp<(rank+1)*TRAINING_XP_UNIT)reasons.push('该队员经验不足');
 }else if(rank<=0)reasons.push('该项目没有可退回的训练');
 else if(!Number.isSafeInteger(member.xp+rank*TRAINING_XP_UNIT))reasons.push('返还后经验超出安全范围');
 return {key,name:option?.name||key,rank,nextRank:next,cost:direction===1?(rank+1)*TRAINING_XP_UNIT:0,refund:direction===-1?rank*TRAINING_XP_UNIT:0,invested:trainingInvestment({[key]:rank}),direction,allowed:reasons.length===0,reasons};
}
