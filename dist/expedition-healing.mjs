import {skillManaCost} from './expedition-advancement-data.mjs';
import {SKILLS} from './expedition-data.mjs';
import {healingBlockTrace} from './expedition-disruption.mjs';
export const HEAL_PRIORITIES={lowest:'最低生命比例',self_first:'自身达阈值时优先自保'};
export function selectHealingTarget(actor,units,target){
 const ranked=units.filter(u=>u.side===actor.side&&u.hp>0&&u.hp<u.maxHp&&(target==='all'||(target==='self'?u.id===actor.id:u.pos===target))).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
 if(actor.healing?.priority==='self_first'){const self=ranked.find(u=>u.id===actor.id&&u.hp/u.maxHp<=actor.healing.threshold);if(self)return self;}
 return ranked[0];
}
// Read-only facts captured at an actual main-action opportunity. No RNG or mutations.
export function healingDecision(actor,units,supplies){
 const policy=actor.healing||{},threshold=policy.threshold??0,manaCost=skillManaCost(actor,'heal');
 const candidates=units.filter(u=>u.side===actor.side).map(u=>{
  const inRange=policy.target==='all'||(policy.target==='self'?u.id===actor.id:u.pos===policy.target);
  const ratio=u.hp/u.maxHp;
  return {id:u.id,name:u.name,hp:u.hp,maxHp:u.maxHp,ratio,inRange,reason:u.hp<=0?'已倒下':!inRange?'范围之外':u.hp>=u.maxHp?'生命已满':ratio>threshold?'高于阈值':'满足阈值'};
 });
 const chosen=selectHealingTarget(actor,units,policy.target),selected=candidates.find(u=>u.id===chosen?.id);
 const block=healingBlockTrace(actor),status=!policy.enabled?'disabled':!selected?'no_target':selected.ratio>threshold?'threshold':block?'blocked':actor.mp<manaCost?'mana':supplies.herb<=0?'herb':'ready';
 return {schema:2,status,selectionPolicy:policy.priority||'lowest',enabled:Boolean(policy.enabled),threshold,target:policy.target,mp:actor.mp,herb:supplies.herb,cost:{mp:manaCost,herb:1},selectedId:selected?.id||null,candidates,...(block?{block}:{}),priority:(policy.priority==='self_first'?'自身在治疗范围内且达到阈值时先治疗自己；否则':'')+'范围内存活伤员按生命比例从低到高；同值按队伍顺序，召唤物排在正式成员之后。'};
}
export function healingReason(d){return ({disabled:'自动治疗已关闭',no_target:'治疗范围内没有存活伤员',threshold:'最低生命比例仍高于治疗阈值',blocked:'本回合禁疗，继续普通指令',mana:'法力不足，继续普通指令',herb:'药草不足，继续普通指令',ready:'满足条件，尝试治疗',healed:'执行治疗，占用本次行动',item_priority:'优先使用随身道具，本次未检查治疗'})[d.status]||'未记录原因';}
