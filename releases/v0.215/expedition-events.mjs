// Original non-combat encounter; decision is fixed before departure.
import {SKILLS,gearSupports,HEROES} from './expedition-data.mjs';
export const BELL_CHOICES={
 bypass:{name:'绕过机关',desc:'不检定、不付费，也不获得增益。'},
 study:{name:'解读封印',resource:'rune',cost:2,difficulty:70,stat:'defense',value:8,candidates:[['d','ward'],['e','insight']],desc:'消耗2符纸；学者/吟游者中检定均值最高且存活者负责。难度70。成功：当前存活队员本房间全防御检定+8；失败：执行者失去最多12法力。'},
 force:{name:'强行破拆',resource:'arrow',cost:3,difficulty:60,stat:'armor',value:3,candidates:[['a','shieldbash'],['b','pierce']],desc:'消耗3箭矢作破拆材料；守卫/射手中满足技能装备、检定均值最高且存活者负责。难度60。成功：当前存活队员本房间护甲+3；失败：执行者失去最多12法力。'}
};
export function bellCandidates(party,approach,readMean){return (BELL_CHOICES[approach].candidates||[]).flatMap(([id,skill])=>party.filter(u=>(u.classId||HEROES.find(h=>h.id===u.id)?.classId)===HEROES.find(h=>h.id===id).classId).map(u=>({id:u.id,skill,mean:readMean(u,skill),reason:u.hp<=0?'队员已倒下':SKILLS[skill].requiresGear&&!gearSupports(u.gear,SKILLS[skill].requiresGear)?'装备条件不满足':null}))).sort((a,b)=>b.mean-a.mean);}
export function resolveBell(approach,candidates,supplies,random){
 const choice=BELL_CHOICES[approach];if(approach==='bypass')return {status:'bypassed',reason:'按计划绕过',cost:0};
 const actor=candidates.find(c=>!c.reason);if(!actor)return {status:'unavailable',reason:'没有存活且满足装备条件的执行者',cost:0};
 if(supplies[choice.resource]<choice.cost)return {status:'unavailable',reason:'进场时共享补给不足',cost:0};
 const factors=[random(),random()],roll=Math.floor(actor.mean*(.5+(factors[0]+factors[1])/2));
 return {status:roll>=choice.difficulty?'success':'failure',actor:actor.id,skill:actor.skill,mean:actor.mean,roll,factors,difficulty:choice.difficulty,cost:choice.cost,resource:choice.resource};
}

// A route is earned from a recorded outcome, never from replay UI or current config.
export const BELL_ROUTES={
 direct:{name:'正门 · 原封印',desc:'维持原有四名敌人与属性，不额外付费。'},
 deciphered:{name:'密文 · 破印路线',desc:'解读成功：封库第三场全部敌人的法术抗性降低20个百分点；阵容不变。'},
 breach:{name:'侧门 · 惊动守卫',desc:'破拆成功：避开后排封库护印师；三名守印者力量+4，整场有效。'}
};
export function bellRoute(outcome){return outcome?.status==='success'?(outcome.approach==='study'?'deciphered':outcome.approach==='force'?'breach':'direct'):'direct';}
export function applyBellRoute(enemies,route){
 const units=structuredClone(enemies),changes=[];
 if(route==='deciphered')for(const u of units){const before=u.resistances?.magic||0;u.resistances={...u.resistances,magic:before-20};changes.push({id:u.id,name:u.name,field:'法术抗性',before,after:u.resistances.magic});}
 if(route==='breach'){
  const at=units.findIndex(u=>u.id==='aa4');if(at>=0){const [u]=units.splice(at,1);changes.push({id:u.id,name:u.name,field:'参与战斗',before:'参战',after:'绕过'});}
  for(const u of units.filter(u=>['aa1','aa2','aa3'].includes(u.id))){const before=u.attrs.str;u.attrs.str+=4;changes.push({id:u.id,name:u.name,field:'力量',before,after:u.attrs.str});}
 }
 return {enemies:units,changes};
}

export const RESCUE_CHOICES={
 pass:{name:'直接赶路',desc:'不检定、不消耗，也不获得补给。'},
 gather:{name:'拾取遗落药草',desc:'拾取路旁药袋，固定获得2药草；放弃救治，不检定。'},
 aid:{name:'救治受伤信使',desc:'消耗3药草，由存活药师的治疗技能检定，难度70。成功获得4符纸和4箭矢；失败药草仍消耗。无需额外法力、不占战斗行动。'}
};
export function resolveRescue(approach,party,supplies,readMean,random){
 const delta={herb:0,rune:0,arrow:0};
 if(approach==='pass')return {status:'bypassed',delta,reason:'按计划直接赶路'};
 if(approach==='gather')return {status:'gathered',delta:{...delta,herb:2},reason:'拾取遗落药袋，获得2药草'};
 const actor=party.filter(u=>u.skills?.heal!==undefined&&u.hp>0).sort((a,b)=>readMean(b,'heal')-readMean(a,'heal'))[0];
 if(!actor)return {status:'unavailable',delta,reason:'没有存活药师，无法执行救治'};
 if(supplies.herb<3)return {status:'unavailable',delta,reason:'进场药草不足3份，无法执行救治'};
 const mean=readMean(actor,'heal'),factors=[random(),random()],roll=Math.floor(mean*(.5+(factors[0]+factors[1])/2)),success=roll>=70;
 return {status:success?'success':'failure',actor:actor.id,skill:'heal',mean,factors,roll,difficulty:70,delta:{herb:-3,rune:success?4:0,arrow:success?4:0},reason:success?'信使恢复行动，将4符纸和4箭矢交给队伍':'救治未成功，3药草已消耗；没有获得补给'};
}
