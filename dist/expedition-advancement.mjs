import {ADVANCEMENTS,ADVANCEMENT_COST,ADVANCEMENT_REQUIRED_XP,advancementOptions} from './expedition-advancement-data.mjs';
import {careerXp} from './expedition-growth.mjs';
export function advancementStatus(g,id){
 const member=g.members.find(m=>m.id===id),options=advancementOptions(id),reasons=[];
 if(!member)reasons.push('角色尚未加入公会');
 if(!options.length)reasons.push('本职业后期进阶尚未开放');
 if(g.pending)reasons.push('请先领取远征结算');
 if(member?.advancement)reasons.push('已选择进阶；重选前请先退回原进阶');
 const earned=member?careerXp(member):0;
 if(earned<ADVANCEMENT_REQUIRED_XP)reasons.push('需要累计'+ADVANCEMENT_REQUIRED_XP+'经验');
 if(!(g.clears?.veteran>0))reasons.push('公会需要先通关资深试炼');
 if((member?.xp||0)<ADVANCEMENT_COST)reasons.push('可用经验不足'+ADVANCEMENT_COST);
 return {options,earned,cost:ADVANCEMENT_COST,requiredXp:ADVANCEMENT_REQUIRED_XP,selected:member?.advancement?.path||null,allowed:reasons.length===0,reasons};
}
export function validMemberAdvancement(g,member){
 const a=member.advancement;if(a===undefined||a===null)return true;
 return !!(a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).length===2&&ADVANCEMENTS[a.path]&&advancementOptions(member.id).some(([id])=>id===a.path)&&a.paidXp===ADVANCEMENT_COST&&careerXp(member)>=ADVANCEMENT_REQUIRED_XP&&g.clears?.veteran>0);
}
