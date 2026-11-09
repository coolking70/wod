import {POS,ROLE_TARGETS,row} from './expedition-data.mjs';import {SUMMON_FORMS} from './expedition-summons.mjs';
export const SUMMON_TARGETS={...POS,...ROLE_TARGETS};
export function validateSummonTarget(command){if(Object.hasOwn(command,'summonTarget')&&(command.skill!=='tidearcher'||typeof command.summonTarget!=='string'||!Object.hasOwn(SUMMON_TARGETS,command.summonTarget)))throw Error('只有弩灵可配置合法攻击目标');}
export function summonOrders(skill,aim){
 const form=SUMMON_FORMS[skill];if(!form)throw Error('未知召唤形态');if(aim!==undefined)validateSummonTarget({skill,summonTarget:aim});
 const target=aim??form.target,role=Object.hasOwn(ROLE_TARGETS,target),commands=[row(form.attack,target)];if(role)commands.push(row(form.attack,form.target,'cycle'));
 return {target,commands,...(aim!==undefined?{record:{target,fallback:role?form.target:null,rule:role?'每次普通行动先检查存活职责目标，无合格者免费检查后排后备；后备执行后重新从首条检查。不消耗箭矢。':'优先所选敌方阵位，空缺按原远程路线回退；不改变己方入场位置，不消耗箭矢。'}}:{})};
}
