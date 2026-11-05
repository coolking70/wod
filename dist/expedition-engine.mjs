import {courierPass,resolveCourierPass,COURIER_ROOMS,COURIER_RELAY} from './expedition-courier.mjs';
import {reserveBlock} from './expedition-harbor-reserve.mjs';
import {advancementOptions,skillManaCost,advancementEffectBonus,advancementTrace} from './expedition-advancement-data.mjs';
import {regenerationTicks} from './expedition-regeneration.mjs';
import {HEALING_BLOCK_REASON,HEALING_BLOCK_STAT,healingBlockTrace,canApplyHealingBlock} from './expedition-disruption.mjs';
import {validHarborPlan,resolveHarborStep} from './expedition-harbor.mjs';
import {foundryApproach,resolveFoundryPass,validFoundryFlow,FOUNDRY_COOLED_VAULT,FOUNDRY_ROOMS} from './expedition-foundry.mjs';
import {validEquipment,equipmentTotals} from './expedition-equipment.mjs';
import {healingDecision,selectHealingTarget} from './expedition-healing.mjs';
import {RESCUE_CHOICES,resolveRescue,BELL_CHOICES,bellCandidates,resolveBell,BELL_ROUTES,bellRoute,applyBellRoute} from './expedition-events.mjs';
import {ROOM_IDS,gearSupports,ROLE_TARGETS,roleTargetAllowed,supplyBudget,hasArchiveEvents,roomTimeBudget,VERSION,clone,POS,GEAR,SKILLS,HEROES,ROOMS,DEFENSES,TYPES,PLAN_FIELDS,resolveHeroPlan,ITEMS,EXPEDITIONS,roomsFor,naturalDefenses,row,trainingOptions,MAX_TRAINING_RANK} from './expedition-data.mjs';
export const RULESET='original-wod-inspired-0.57.0';
const routes={front:['front','left','right','center','rear'],left:['right','front','center','rear','left'],right:['left','front','center','rear','right'],center:['front','left','right','center','rear'],rear:['front','left','right','center','rear']};
function validateOrder(order,heroes){if(!Array.isArray(order)||order.length!==6||new Set(order).size!==6||order.some(id=>!heroes.some(h=>h.id===id)))throw Error('预备顺序必须包含所有队员');}
function validatePlan(h,t){
 if(!Object.hasOwn(POS,h.pos))throw Error('站位无效');
 for(const phase of ['prep','main']){if(!Array.isArray(h[phase])||h[phase].length>4)throw Error('每阶段至多 4 条指令');for(const r of h[phase]){const s=SKILLS[r?.skill];if(!s||(!t.skills.includes(r.skill)&&r.skill!=='wait')||!(phase==='prep'?['buff','summon'].includes(s.kind):['attack','wait'].includes(s.kind))||!['repeat','cycle','once','round'].includes(r.mode)||(r.mode==='round'&&phase!=='main')||![...Object.keys(POS),'self','all',...(roleTargetAllowed(s)?Object.keys(ROLE_TARGETS):[])].includes(r.target))throw Error('指令不合法');if(s.kind==='summon'&&!Object.hasOwn(POS,r.target))throw Error('召唤位置无效');}}
 if(!h.healing||!['lowest','self_first'].includes(h.healing.priority??'lowest')||typeof h.healing.enabled!=='boolean'||![.5,.65,.8].includes(h.healing.threshold)||![...Object.keys(POS),'all','self'].includes(h.healing.target)||(h.healing.enabled&&!t.skills.includes('heal')))throw Error('治疗设置不合法');
 if(!h.itemPolicy||typeof h.itemPolicy.enabled!=='boolean'||![.3,.5,.7].includes(h.itemPolicy.threshold))throw Error('道具使用策略无效');
 if(!h.defenses||Object.keys(h.defenses).length!==3)throw Error('防御配置无效');
 for(const type of Object.keys(TYPES))if(!DEFENSES[h.defenses[type]]?.types.includes(type))throw Error('防御技能与攻击类型不匹配');
}
export function validate(c){
 if(c?.version!==VERSION||!Number.isInteger(c.seed)||c.seed<1||c.seed>999999)throw Error('配置版本或种子无效');
 if(!Array.isArray(c.heroes)||c.heroes.length!==6||new Set(c.heroes.map(h=>h.id)).size!==6)throw Error('必须包含 6 名不同队员');
 if((c.expedition==='harbor'||c.harbor!==undefined)&&!validHarborPlan(c.harbor))throw Error('港口分支策略无效');
 if(!Object.hasOwn(EXPEDITIONS,c.expedition))throw Error('远征路线无效');
 foundryApproach(c);validFoundryFlow(c);courierPass(c);
 if(!Object.hasOwn(BELL_CHOICES,c.bellApproach))throw Error('机关应对策略无效');
 if(!Object.hasOwn(RESCUE_CHOICES,c.rescueApproach))throw Error('救援策略无效');
 validateOrder(c.prepOrder,c.heroes);
 if(!c.roomOrders||typeof c.roomOrders!=='object'||Array.isArray(c.roomOrders))throw Error('房间顺序配置无效');
 for(const [roomId,order] of Object.entries(c.roomOrders)){if(!ROOM_IDS.includes(roomId))throw Error('未知房间');validateOrder(order,c.heroes);}
 let total=0;for(const k of ['herb','rune','arrow']){const n=c.supplies?.[k];if(!Number.isInteger(n)||n<0||n>60)throw Error('补给数量须为 0–60');total+=n;}if(total>supplyBudget(c))throw Error('此路线补给总预算为 '+supplyBudget(c));
 for(const h of c.heroes){const t=HEROES.find(t=>t.id===h.id);if(!t||!Object.hasOwn(ITEMS,h.item)||!validEquipment(h.gear)||!t.skills.includes(h.trained)||!Object.hasOwn(t.attrs,h.attribute)||!Object.hasOwn(DEFENSES,h.defenseFocus)||h.defenseFocus==='natural')throw Error('队员配置无效');if(h.advancement!==undefined&&!advancementOptions(h.id).some(([id])=>id===h.advancement))throw Error('后期进阶与职业不匹配');validatePlan(h,t);
  if(!h.training||typeof h.training!=='object'||Array.isArray(h.training)||Object.entries(h.training).some(([k,n])=>!Object.hasOwn(trainingOptions(h.id),k)||!Number.isInteger(n)||n<0||n>MAX_TRAINING_RANK))throw Error('训练配置无效或超过每项等级上限');
  if(!h.overrides||typeof h.overrides!=='object'||Array.isArray(h.overrides))throw Error('房间覆盖无效');
  for(const [roomId,patch] of Object.entries(h.overrides)){if(!ROOM_IDS.includes(roomId)||!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!PLAN_FIELDS.includes(k)))throw Error('房间覆盖包含未知字段');validatePlan(resolveHeroPlan(h,roomId),t);}
 }return true;
}
export function buildParty(c){return c.heroes.map(h=>{const t=HEROES.find(t=>t.id===h.id),a=clone(t.attrs);a[h.attribute]+=3;const bonus=equipmentTotals(h.gear).bonus,maxHp=50+4*(a.con+(bonus.con||0)),maxMp=20+2*(a.int+(bonus.int||0))+a.wil+(bonus.wil||0);return {...clone(t),...clone(h),attrs:a,itemInstance:{id:h.id+':'+h.item,kind:h.item,remaining:ITEMS[h.item].charges},side:'party',hp:maxHp,maxHp,mp:maxMp,maxMp,skills:Object.fromEntries(t.skills.map(s=>[s,t.base+(h.trained===s?3:0)+(h.training['skill:'+s]||0)])),effects:[]};});}
export function current(u,key){const gear=equipmentTotals(u.gear);return (u.attrs[key]??(key==='armor'?gear.armor:0))+(gear.bonus[key]||0)+(u.effects||[]).reduce((n,e)=>n+(e.active!==false&&e.stat===key?e.value:0),0);}
export function resistanceOf(u,type){return Math.max(-50,Math.min(75,(u.resistances?.[type]||0)+(equipmentTotals(u.gear).resistances[type]||0)));}
export function damageResult(rolled,multiplier,armor,resistance=0){const afterArmor=Math.max(0,rolled*multiplier-armor),damage=Math.floor(afterArmor*(1-resistance/100));return {afterArmor,unresisted:Math.floor(afterArmor),damage};}
export function skillLevel(u,sid){return (u.skills[sid]||0)+(SKILLS[sid]?.kind==='attack'?current(u,'skill'):0);}
export function skillBreakdown(u,sid){const training=u.training?.['skill:'+sid]||0,specialization=u.trained===sid?3:0,temporary=SKILLS[sid]?.kind==='attack'?current(u,'skill'):0;return {base:(u.skills[sid]||0)-training-specialization,specialization,training,temporary,total:skillLevel(u,sid)};}
export function mean(u,sid){const s=SKILLS[sid];return 2*current(u,s.primary)+current(u,s.secondary)+2*skillLevel(u,sid);}
export function defenseProfile(u,type){
 const requested=u.defenses?.[type]||'natural',chosen=DEFENSES[requested];
 let reason=null;
 if(!chosen||!chosen.types.includes(type))reason='类型不匹配';
 else if(chosen.gear&&!gearSupports(u.gear,chosen.gear))reason='缺少盾牌（需携盾武器）';
 else if(u.mp<chosen.cost)reason='法力不足';
 const skill=reason?'natural':requested,d=DEFENSES[skill];
 const [primary,secondary]=skill==='natural'?(type==='melee'?['dex','agi']:type==='magic'?['wil','int']:['agi','per']):[d.primary,d.secondary];
 const training=skill==='natural'?0:u.training?.['defense:'+skill]||0,specialization=skill==='natural'?0:u.defenseFocus===skill?3:0,temporaryLevel=skill==='natural'?0:current(u,'defenseSkill'),level=skill==='natural'?0:6+specialization+training+temporaryLevel;
 const base=2*current(u,primary)+current(u,secondary)+2*level;
 return {requested,skill,name:d.name,reason,level,training,specialization,temporaryLevel,cost:d.cost,primary,secondary,primaryValue:current(u,primary),secondaryValue:current(u,secondary),base,bonus:current(u,'defense'),mean:base+current(u,'defense')};
}
export function chooseTargets(actor,units,s,target,rng=()=>0){
 const aid=s.kind==='buff'||s.kind==='heal';let pool=units.filter(u=>u.hp>0&&(aid?u.side===actor.side:u.side!==actor.side));
 if(s.mode==='self')return [actor];
 if(s.kind==='heal'){const selected=selectHealingTarget(actor,pool,target);return selected?[selected]:[];}
 if(s.mode==='all')return pool.slice(0,s.max);
 if(aid)return pool.filter(u=>target==='self'?u.id===actor.id:u.pos===target).slice(0,s.max);
 if(Object.hasOwn(ROLE_TARGETS,target)){if(!roleTargetAllowed(s))return [];const candidates=pool.filter(u=>u.skills?.[target==='healer'?'heal':'sentinel']!==undefined);for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}return candidates.slice(0,s.max);}
 const order=s.type==='melee'?routes[actor.pos]:[target,...Object.keys(POS).filter(p=>p!==target)];
 for(const p of order){const group=pool.filter(u=>u.pos===p);if(group.length){for(let i=group.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[group[i],group[j]]=[group[j],group[i]];}return group.slice(0,s.max);}}return [];
}
function random(seed){let x=seed>>>0;return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function simulate(c,options={}){
 validate(c);const rng=random(c.seed),party=options.party?clone(options.party):buildParty(c),rooms=clone(options.rooms||roomsFor(c)),supplies=clone(c.supplies),events=[],results=[];
 const stats=Object.fromEntries(party.map(u=>[u.id,{damage:0,actual:0,overkill:0,healing:0,interrupts:0,failed:0,defenses:0,defenseMana:0}]));
 let harborFlags={},harborSource=null,foundrySource=null,courierSource=null;let bellRecord=null,rescueRecord=null;let summons=[],summonSerial=0;let enemies=[],roomIndex=0,round=0,phase='',sequence=0,enemySupplies={},clock=0,actionId=null;
 party.forEach(u=>u.effects??=[]);
 const all=()=>[...party,...enemies,...summons],live=side=>all().filter(u=>u.side===side&&u.hp>0);
 const heroesAlive=()=>party.some(u=>u.hp>0);
 const snapshot=()=>all().map(u=>({id:u.id,name:u.name,mark:u.mark,side:u.side,owner:u.owner||null,summoned:Boolean(u.owner),itemInstance:u.itemInstance?clone(u.itemInstance):null,pos:u.pos,resistances:Object.fromEntries(Object.keys(TYPES).map(t=>[t,resistanceOf(u,t)])),hp:u.hp,maxHp:u.maxHp,mp:u.mp,maxMp:u.maxMp,effects:clone(u.effects),defenses:clone(u.defenses||{}),attrs:Object.fromEntries(Object.keys(u.attrs).map(k=>[k,current(u,k)]))}));
 function emit(type,text,actor=null,targets=[],detail={}){events.push({id:++sequence,roomIndex,round,phase,type,text,actor,targets,actionId,detail:clone(detail),units:snapshot(),supplies:clone(supplies)});}
 function removeSummons(owner,reason){const gone=summons.filter(u=>u.hp>0&&(!owner||u.owner===owner));for(const u of gone){u.hp=0;emit('dismiss',u.name+' 消散：'+reason,u.owner,[u.id],{reason,owner:u.owner});}}
 function spawn(owner,pos,skill='sentinel'){
  const id='summon:'+roomIndex+':'+(++summonSerial),level=skillLevel(owner,skill)||8,hp=36+level*4;
  const u={id,name:owner.side==='party'?'唤潮卫':'溺誓潮卫',mark:'灵',owner:owner.id,side:owner.side,pos,gear:'field',attrs:{str:10,con:10,int:8,dex:12,cha:0,agi:8,per:10,wil:10},hp,maxHp:hp,mp:20,maxMp:20,skills:{strike:level},defenses:naturalDefenses(),effects:[],prep:[],main:[row('strike')],healing:{enabled:false}};
  summons.push(u);stats[id]={damage:0,actual:0,overkill:0,healing:0,interrupts:0,failed:0,defenses:0,defenseMana:0,owner:owner.id,name:u.name};
  emit('summon',owner.name+' 召来 '+u.name,owner.id,[id],{owner:owner.id,skill,level,pos,hp,rule:'本房间有效；主人倒下即消散；仅进入尚未生成的行动队列。'});return u;
 }
 function awaken(u){if(!u.awakens||u.awakened||u.hp<=0||u.hp>u.maxHp/2)return;
  u.awakened=true;u.main=[row('wave','rear')];const saved=actionId;actionId=null;
  emit('scene',u.name+' 的封印破裂，潮卫自水中升起。',u.id,[],{scene:'oathbreaker',rule:'生命不高于50%且仍存活；只触发一次。后续普通行动改为法术压制后排。'});
  spawn(u,'left');spawn(u,'right');actionId=saved;
 }
 function useItem(u){const instance=u.itemInstance,policy=u.itemPolicy,item=ITEMS[instance?.kind];if(!item?.resource||!policy?.enabled)return false;
  const resource=item.resource,max=resource==='hp'?u.maxHp:u.maxMp;if(u[resource]/max>policy.threshold)return false;
  if(instance.remaining<=0){emit('item-empty',u.name+' 的「'+item.name+'」已耗尽，继续检查治疗与普通指令。',u.id,[],{instanceId:instance.id,remaining:0,consumedAction:false});return false;}
  const before=u[resource],actual=Math.min(max-before,item.amount);if(actual<=0)return false;instance.remaining--;u[resource]+=actual;
  emit('item',u.name+' 使用「'+item.name+'」，恢复 '+actual+(resource==='hp'?' 生命':' 法力'),u.id,[u.id],{instanceId:instance.id,kind:instance.kind,remaining:instance.remaining,resource,before,after:u[resource],actual,consumedAction:true,ordinaryCursorUnchanged:true});return true;
 }
 const roll=m=>Math.floor(m*(.5+(rng()+rng())/2));
 function effectTrace(u){return u.effects.filter(e=>e.active!==false).map(e=>({effectId:e.id,source:e.source,name:e.name,component:e.component,stat:e.stat,value:e.value}));}
 for(roomIndex=0;roomIndex<rooms.length;roomIndex++){
  let harborDecision=null,harborDelta={},foundryPass=null,foundryVault=null,courierPath=null,courierRelay=null;
  if(c.expedition==='harbor'&&!options.rooms){const selected=resolveHarborStep(roomIndex,c,party,supplies,mean,resistanceOf,random(c.seed^0x48A01^roomIndex),harborFlags);rooms[roomIndex]=selected.room;harborFlags=selected.flags;harborDecision=selected.decision;harborDelta=selected.delta;}
  if(c.expedition==='foundry'&&roomIndex===1&&!options.rooms&&foundryApproach(c)!=='bellows'){foundryPass=resolveFoundryPass(c,party,supplies,resistanceOf);rooms[roomIndex]=clone(foundryPass.room);}
  if(c.expedition==='foundry'&&roomIndex===3&&!options.rooms)rooms[roomIndex]=clone(FOUNDRY_ROOMS[3]);
  if(c.expedition==='foundry'&&roomIndex===3&&foundrySource&&validFoundryFlow(c)&&!options.rooms){rooms[roomIndex]=clone(FOUNDRY_COOLED_VAULT);foundryVault={domain:'foundry',kind:'vault',chosen:'channel',sourceEventId:foundrySource,reason:'第二场实际开启冷却潮渠，引流迫使护炉师转向左翼自守，不再覆盖前排监工。',changes:[{id:'fvp',name:'护炉师',skill:'ward',before:'front',after:'left'}],suppliesBefore:clone(supplies),suppliesAfter:clone(supplies),rule:'只由第二场实际执行的通路决定，不再次检查抗性、不掷骰、不收费；敌方生命、抗性与普通指令不变。'};}
  if(c.expedition==='courier'&&!options.rooms){
   if(roomIndex===1&&courierPass(c)!=='sails'){courierPath=resolveCourierPass(c,supplies);rooms[roomIndex]=clone(courierPath.room);}
   if(roomIndex===2){rooms[roomIndex]=clone(courierSource?COURIER_RELAY:COURIER_ROOMS[2]);if(courierSource)courierRelay={domain:'courier',kind:'relay',chosen:'keel',sourceEventId:courierSource,reason:'第二场实际布缆走船底，切断前排鼓令；鼓手转为给后排医师节拍。',changes:[{id:'cfb',name:'催帆鼓手',skill:'rhythm',before:'front',after:'rear'}],suppliesBefore:clone(supplies),suppliesAfter:clone(supplies),rule:'由第二场实际通路决定；没有第二次费用、检定或隐藏伤害，原敌方生命、抗性、技能等级与普通指令不变。'};}
  }
  const room=rooms[roomIndex];round=0;phase='进场';for(const u of party){const h=c.heroes.find(h=>h.id===u.id);if(h){const plan=resolveHeroPlan(h,room.id);for(const key of PLAN_FIELDS)u[key]=clone(plan[key]);}}enemies=room.enemies.map(u=>({...u,effects:[],side:'enemy'}));enemySupplies={herb:60,rune:60,arrow:60};
  const cursors=new Map(),used=new Set(),roundUsed=new Map(),roundCursors=new Map();let serial=0;
  emit('room',room.name+'：生命、法力、补给与远征效果继承。',null,[],{rule:'房间效果结束；远征效果保留；行动游标重置。'});
  if(harborDecision){for(const [key,delta] of Object.entries(harborDelta))supplies[key]+=delta;emit('branch',room.name+' · '+harborDecision.reason,harborDecision.actor,[],{...harborDecision,sourceEventId:roomIndex===3?harborSource:null});if(roomIndex===2)harborSource=events.at(-1).id;}
  if(foundryPass){for(const [key,delta] of Object.entries(foundryPass.delta))supplies[key]+=delta;emit('branch',room.name+' · '+foundryPass.decision.reason,null,[],foundryPass.decision);if(foundryPass.decision.chosen==='channel')foundrySource=events.at(-1).id;}
  if(foundryVault)emit('branch',room.name+' · '+foundryVault.reason,null,['fvp'],foundryVault);
  if(courierPath){for(const [key,delta] of Object.entries(courierPath.delta))supplies[key]+=delta;emit('branch',room.name+' · '+courierPath.decision.reason,null,[],courierPath.decision);if(courierPath.decision.chosen==='keel')courierSource=events.at(-1).id;}
  if(courierRelay)emit('branch',room.name+' · '+courierRelay.reason,null,['cfb'],courierRelay);
  if(c.expedition==='scarcity')emit('deadline','潮水封路：本房须在 '+roomTimeBudget(c,room.id)+' 回合内清场。',null,[],{limit:roomTimeBudget(c,room.id),gatherDelay:room.id==='cistern'&&c.rescueApproach==='gather'?1:0,rule:room.id==='cistern'&&c.rescueApproach==='gather'?'拾取药草占用1回合，原5回合缩短为4回合；不额外跳过战斗行动。':'本房第5回合结束仍有敌人则远征停止。'});
  if(hasArchiveEvents(c)&&room.id==='altar'){
   const route=bellRoute(bellRecord?.detail),result=applyBellRoute(enemies,route);enemies=result.enemies;
   emit('route',(c.expedition==='chapter'?'封库出口 · ':'末房路线 · ')+BELL_ROUTES[route].name,null,result.changes.map(x=>x.id),{route,sourceEventId:bellRecord?.id||null,sourceRoomIndex:bellRecord?.roomIndex??null,changes:result.changes,rule:BELL_ROUTES[route].desc,reason:route==='direct'?'沉钟未成功打开其他路线，维持原遭遇。':'由第二房间的成功检定解锁；不再检定或支付额外材料。'});
  }
  if(hasArchiveEvents(c)&&room.id==='cistern'){
   const result=resolveRescue(c.rescueApproach,party,supplies,mean,random(c.seed^0xA1D12)),before=clone(supplies),actor=party.find(u=>u.id===result.actor);
   if(c.expedition==='scarcity'&&c.rescueApproach==='gather')result.reason+='；绕路占用1回合，本房限时4回合';
   for(const k of Object.keys(result.delta))supplies[k]+=result.delta[k];
   emit('rescue','回廊伤员 · '+RESCUE_CHOICES[c.rescueApproach].name+' · '+({bypassed:'赶路',gathered:'拾取',unavailable:'未执行',success:'成功',failure:'失败'}[result.status]),result.actor||null,[],{...result,approach:c.rescueApproach,suppliesBefore:before,suppliesAfter:clone(supplies),rule:result.reason,levelSources:actor?skillBreakdown(actor,'heal'):null,formula:actor?`floor(${result.mean} × (0.5 + (${result.factors.join(' + ')}) / 2)) ≥ 70`:null});rescueRecord=events.at(-1);
  }
  if(hasArchiveEvents(c)&&room.id==='cistern'){

   const approach=c.bellApproach,choice=BELL_CHOICES[approach],candidates=bellCandidates(party,approach,mean),outcome=resolveBell(approach,candidates,supplies,random(c.seed^0x5B311));
   const actor=party.find(u=>u.id===outcome.actor),affected=[];let manaLoss=0;
   if(outcome.cost)supplies[outcome.resource]-=outcome.cost;
   if(outcome.status==='success')for(const u of party.filter(u=>u.hp>0)){u.effects.push({id:'bell:'+u.id,skill:'event:bell',name:'沉钟余护',component:'沉钟余护',source:actor.id,sourceName:actor.name,stat:choice.stat,value:choice.value,scope:'battle',active:true,expires:null});affected.push(u.id);}
   if(outcome.status==='failure'){manaLoss=Math.min(12,actor.mp);actor.mp-=manaLoss;affected.push(actor.id);}
   const consequence=outcome.status==='success'?`存活队员本房间${choice.stat==='armor'?'护甲':'全防御检定'} +${choice.value}`:outcome.status==='failure'?`${actor.name}失去 ${manaLoss} 法力`:outcome.reason;
   const detail={sourceRescueEventId:rescueRecord?.id||null,encounter:'sunken-bell',approach,...outcome,candidates,manaLoss,levelSources:actor?skillBreakdown(actor,outcome.skill):null,bonus:outcome.status==='success'?{stat:choice.stat,value:choice.value,scope:'battle'}:null,formula:actor?`floor(${outcome.mean} × (0.5 + (${outcome.factors.join(' + ')}) / 2)) ≥ ${outcome.difficulty}`:null,rule:choice.name+'：'+consequence,scene:'sunken-bell'};
   emit('encounter','沉钟机关 · '+choice.name+' · '+({success:'成功',failure:'失败',bypassed:'绕过',unavailable:'未执行'}[outcome.status]),actor?.id||null,affected,detail);bellRecord=events.at(-1);
  }
  function attempt(u,r,key,interrupt=false){
   const s=SKILLS[r.skill],manaCost=skillManaCost(u,r.skill),advancement=advancementTrace(u,r.skill),stock=u.side==='party'?supplies:enemySupplies;let reason='',reservation=null,healingBlock=null;
   if(used.has(key)&&r.mode==='once')reason='本房间一次指令已执行';
   else if(roundUsed.get(key)===round&&r.mode==='round')reason='本回合一次指令已执行，继续后备';
   else if(s.requiresGear&&!gearSupports(u.gear,s.requiresGear))reason='装备条件不满足';
   else if(s.kind==='heal'&&(healingBlock=healingBlockTrace(u)))reason=HEALING_BLOCK_REASON;
   else if(s.kind==='summon'&&summons.some(t=>t.owner===u.id&&t.hp>0))reason='已有存活召唤物';
   else if(u.mp<manaCost)reason='法力不足';
   else if(s.item&&stock[s.item]<=0)reason='耗材耗尽';
   else if((reservation=reserveBlock(c,roomIndex,u,s,stock)))reason='为第三场事件预留2符纸，尝试下一条指令';
   let targets=[];
   if(!reason&&!['wait','summon'].includes(s.kind)){
    targets=chooseTargets(u,all(),s,r.target,rng);
    if(s.kind==='buff')targets=targets.filter(t=>!t.effects.some(e=>e.skill===r.skill));
    if(!targets.length)reason=Object.hasOwn(ROLE_TARGETS,r.target)?'没有存活的'+ROLE_TARGETS[r.target]+'，尝试下一条指令':s.kind==='buff'?'无可覆盖目标或同名效果仍在':'没有合法目标';
   }
   if(reason){emit('skip',u.name+' 跳过「'+s.name+'」：'+reason,u.id,[],{reason,skill:r.skill,requiredGear:s.requiresGear||null,cost:0,consumedAction:false,...(reservation?{reservation}: {}),...(healingBlock?{healingBlock}: {})});return false;}
   if(s.kind==='wait'){emit('wait',u.name+' 等待。',u.id,[],{consumedAction:true});used.add(key);roundUsed.set(key,round);return true;}
   const before=u.mp;u.mp-=manaCost;if(s.item)stock[s.item]--;used.add(key);roundUsed.set(key,round);
   const lv=skillLevel(u,r.skill),m=mean(u,r.skill),cast=++serial;actionId=roomIndex+':'+cast;
   emit('cast',u.name+' '+(interrupt?'中断普通指令，使用':'使用')+'「'+s.name+'」',u.id,targets.map(t=>t.id),{cast,skill:r.skill,skillLevel:lv,levelSources:skillBreakdown(u,r.skill),...(advancement?{advancement}:{}),primary:current(u,s.primary),secondary:current(u,s.secondary),mean:m,formula:'主属性 ×2 + 副属性 + 实时技能等级 ×2',mpBefore:before,mpAfter:u.mp,item:s.item||null,interrupt,...(Object.hasOwn(ROLE_TARGETS,r.target)?{targetPolicy:{requested:r.target,rule:'仅选择存活且拥有'+(r.target==='healer'?'治疗':'召唤')+'技能的敌人；多人符合时随机选一人，不要求当前资源充足。',selected:targets.map(t=>({id:t.id,name:t.name,pos:t.pos}))}}:{}),sources:effectTrace(u)});
   if(s.kind==='summon')spawn(u,r.target);
   if(s.kind==='buff')for(const t of targets){
    const components=s.components||[{stat:s.stat,base:s.base,scale:s.scale,scope:s.scope,duration:s.duration,delay:0}];
    for(const [componentIndex,part] of components.entries()){
     const advancementBonus=advancementEffectBonus(u,r.skill,part.stat),v=Math.floor(part.base+m*part.scale)+advancementBonus,delay=part.delay||0,e={id:`${roomIndex}:${cast}:${t.id}:${componentIndex}`,skill:r.skill,name:s.name,component:part.label||s.name,source:u.id,sourceName:u.name,stat:part.stat,value:v,scope:part.scope,active:delay===0,activateTick:clock+delay,activateRound:round+delay,expires:part.scope==='rounds'?round+delay+part.duration:null,expiresTick:part.scope==='rounds'?clock+delay+part.duration:null};
     t.effects.push(e);emit('effect',t.name+' '+(e.active?'获得':'等待')+'「'+s.name+(e.component!==s.name?' · '+e.component:'')+'」：'+({regeneration:'每回合缓释恢复',defense:'全防御检定',int:'智力',skill:'攻击技能等级',defenseSkill:'防御技能等级',armor:'护甲',actions:'行动次数'}[part.stat]||part.stat)+' +'+v,u.id,[t.id],{effectId:e.id,cast,skill:r.skill,component:e.component,stat:e.stat,value:v,mean:m,formula:`floor(${part.base} + ${m} × ${part.scale})${advancementBonus?' + '+advancementBonus:''}`,scope:e.scope,expires:e.expires,active:e.active,activateRound:e.activateRound,sources:effectTrace(u)});
    }
   }
   if(s.kind==='heal'){const t=targets[0],amount=Math.floor(m*.7),actual=Math.min(t.maxHp-t.hp,amount);t.hp+=actual;if(stats[u.id]){stats[u.id].healing+=actual;stats[u.id].interrupts++;}emit('heal',u.name+' 为 '+t.name+' 恢复 '+actual+' 生命',u.id,[t.id],{cast,skill:r.skill,amount,actual,overheal:amount-actual,formula:`floor(${m} × 0.7)`,ordinaryCursorUnchanged:true});}
   if(s.kind==='attack')for(const t of targets){
    const attack=roll(m),profile=defenseProfile(t,s.type),mpBefore=t.mp;t.mp-=profile.cost;
    if(stats[t.id]){stats[t.id].defenses++;stats[t.id].defenseMana+=profile.cost;}
    const defenseMean=profile.mean,defense=roll(defenseMean);
    emit('defend',t.name+' 使用「'+profile.name+'」应对'+TYPES[s.type]+(profile.reason?'（'+profile.reason+'，回退自然防御）':''),t.id,[u.id],{cast,attackType:s.type,...profile,roll:defense,mpBefore,mpAfter:t.mp});
    const grade=attack<=defense?'闪避':attack<=defense*1.5?'命中':attack<=defense*2.25?'重击':'致命';const multiplier={'闪避':0,'命中':1,'重击':1.25,'致命':1.5}[grade];
    const base=current(u,s.primary)/2+current(u,s.secondary)/3+lv/2,rolled=grade==='闪避'?0:roll(base*s.power),armorBefore=current(t,'armor'),armorIgnored=Math.min(Math.max(0,armorBefore),s.ignoreArmor||0),armor=armorBefore-armorIgnored,resistance=resistanceOf(t,s.type),mitigation=damageResult(rolled,multiplier,armor,resistance),damage=grade==='闪避'?0:mitigation.damage,actual=Math.min(t.hp,damage),beforeHp=t.hp;t.hp-=actual;
    if(stats[u.id]){stats[u.id].damage+=damage;stats[u.id].actual+=actual;stats[u.id].overkill+=damage-actual;}
    emit('attack',u.name+' → '+t.name+'：'+grade+(grade==='闪避'?'':'，'+damage+' 伤害'+(damage>actual?'（溢出 '+(damage-actual)+'）':'')),u.id,[t.id],{cast,skill:r.skill,attackMean:m,attack,attackType:s.type,defenseMean,defense,defenseProfile:profile,grade,skillLevel:lv,base,rolled,multiplier,armorBefore,armorIgnored,armor,resistance,afterArmor:mitigation.afterArmor,unresisted:mitigation.unresisted,resistanceDelta:mitigation.unresisted-damage,damage,actual,overkill:damage-actual,hpBefore:beforeHp,hpAfter:t.hp,formula:`floor(max(0, ${rolled} × ${multiplier} − ${armor}) × (1 − ${resistance}/100))`,sources:effectTrace(u),targetSources:effectTrace(t)});
    if(t.hp===0){emit('down',t.name+' 倒下。',u.id,[t.id],{cast});removeSummons(t.id,'主人倒下');}
    else if(canApplyHealingBlock(s,grade,t)){
     const effect={id:`${roomIndex}:${cast}:${t.id}:healingBlock`,skill:r.skill,name:s.name,component:'禁疗',source:u.id,sourceName:u.name,stat:HEALING_BLOCK_STAT,value:1,scope:'rounds',active:true,harmful:true,activateTick:clock,activateRound:round,expires:round,expiresTick:clock};
     t.effects.push(effect);emit('effect',t.name+' 受到「禁疗」：本回合余下的自动草药救护受限，仍可执行普通指令',u.id,[t.id],{effectId:effect.id,cast,skill:r.skill,component:effect.component,stat:effect.stat,value:1,scope:'rounds',active:true,harmful:true,activateRound:round,expires:round,rule:'命中后仅限制本回合余下的自动草药救护；已完成治疗不撤销，不阻止普通指令，同回合不叠加或延长。',sources:effectTrace(u)});
    }
   }actionId=null;for(const enemy of enemies)awaken(enemy);return true;
  }
  function act(u,p){
   const trace=p==='main'&&u.skills?.heal!==undefined?healingDecision(u,all(),u.side==='party'?supplies:enemySupplies):null,start=events.length;
   try {
   if(p==='main'&&useItem(u)){if(trace)trace.status='item_priority';return;}
   if(p==='main'&&u.healing?.enabled){const h=u.healing,t=chooseTargets(u,all(),SKILLS.heal,h.target,rng)[0];if(t&&t.hp/t.maxHp<=h.threshold){if(attempt(u,{skill:'heal',target:h.target,mode:'repeat'},u.id+':heal',true))return;}}
   const rows=u[p]||[],key=u.id+':'+p;if(rows.some(r=>r.mode==='round')&&roundCursors.get(key)!==round){cursors.set(key,0);roundCursors.set(key,round);}let at=cursors.get(key)||0;
   for(let i=0;i<rows.length;i++){const r=rows[at],ok=attempt(u,r,key+':'+at);const next=ok&&r.mode==='repeat'?at:(at+1)%rows.length;cursors.set(key,next);at=next;if(ok)return;}
   if(p==='main'){if(stats[u.id])stats[u.id].failed++;emit('failed',u.name+' 无法执行任何行动。',u.id,[],{consumedAction:true,automaticAttack:false});}
   } finally {const emittedAction=events.slice(start),reserved=emittedAction.filter(e=>e.type==='skip'&&e.detail.reservation);if(reserved.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of reserved)e.detail.reserveOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}if(trace){const emitted=events.slice(start),entry=emitted.find(e=>['cast','item','failed','wait'].includes(e.type))||emitted[0];if(emitted.some(e=>e.type==='heal'&&e.actor===u.id))trace.status='healed';if(entry)entry.detail.healingDecision=clone(trace);}}
  }
  const maxRounds=c.expedition==='scarcity'?Math.min(options.maxRounds??24,roomTimeBudget(c,room.id)):(options.maxRounds??24);
  for(round=1;round<=maxRounds&&heroesAlive()&&live('enemy').length;round++){
   clock++;phase='回合开始';emit('round','第 '+round+' 回合');
   for(const u of all())for(const e of u.effects)if(e.active===false&&e.activateTick<=clock){e.active=true;emit('activate',u.name+' 的「'+e.name+(e.component!==e.name?' · '+e.component:'')+'」开始生效',e.source,[u.id],{component:e.component,stat:e.stat,value:e.value,expires:e.expires});}
   for(const u of all())for(const effect of regenerationTicks(u)){
    const before=u.hp,actual=Math.min(u.maxHp-before,effect.value);u.hp+=actual;
    if(stats[effect.source])stats[effect.source].healing+=actual;
    emit('heal',u.name+' 的「'+effect.name+'」缓释恢复 '+actual+' 生命'+(effect.value>actual?'（未生效 '+(effect.value-actual)+'）':''),effect.source,[u.id],{skill:effect.skill,effectId:effect.id,passive:true,before,after:u.hp,actual,overheal:effect.value-actual,consumedAction:false,cost:0,sources:[{effectId:effect.id,source:effect.source,name:effect.name,component:effect.component,stat:effect.stat,value:effect.value}],rule:'回合开始缓释，不消耗普通行动或再次扣材料；不复活倒下者，不受仅限制自动草药救护的禁疗影响。'});
   }
   phase='回合前';const ordered=[...(c.roomOrders[room.id]||c.prepOrder).map(id=>party.find(u=>u.id===id)).filter(Boolean),...enemies];for(const u of ordered)if(u.hp>0)act(u,'prep');
   phase='自然回复';for(const u of all().filter(u=>u.hp>0)){const before=u.mp;u.mp=Math.min(u.maxMp,u.mp+1);if(u.mp!==before)emit('regen',u.name+' 自然回复 1 法力',u.id,[],{before,after:u.mp});}
   phase='先攻';const order=[];for(const u of all().filter(u=>u.hp>0)){const agi=current(u,'agi'),per=current(u,'per'),actions=current(u,'actions'),mean=2*agi+per,base=roll(mean),count=Math.max(0,Math.floor(1+actions));for(let i=0;i<count;i++)order.push({u,value:base/(1+i*.6),ordinal:i+1,total:count,agi,per,actions,mean,base});}
   order.sort((a,b)=>b.value-a.value);emit('initiative','本回合行动队列已确定',null,[],{policy:'原创衰减：基础先攻 ÷ (1 + 0.6 × 已排行动数)',order:order.map(e=>({actor:e.u.name,actorId:e.u.id,value:e.value,ordinal:e.ordinal,total:e.total,agi:e.agi,per:e.per,actions:e.actions,mean:e.mean,base:e.base,sources:effectTrace(e.u).filter(s=>['agi','per','actions'].includes(s.stat))}))});
   phase='主行动';for(const e of order){if(!heroesAlive()||!live('enemy').length)break;if(e.u.hp>0)act(e.u,'main');}
   phase='回合结束';for(const u of all()){const expired=u.effects.filter(e=>e.scope==='rounds'&&e.expiresTick<=clock);u.effects=u.effects.filter(e=>!expired.includes(e));for(const e of expired)emit('expire',u.name+' 的「'+e.name+(e.component!==e.name?' · '+e.component:'')+'」到期',e.source,[u.id],{scope:e.scope,component:e.component,stat:e.stat});}
  }
  round=Math.min(round-1,maxRounds);const won=heroesAlive()&&live('enemy').length===0;phase='房间结算';removeSummons(null,'房间结束');
  for(const u of party){const expired=u.effects.filter(e=>e.scope!=='expedition');u.effects=u.effects.filter(e=>e.scope==='expedition');for(const e of expired)emit('expire',u.name+' 的「'+e.name+'」随战斗结束',e.source,[u.id],{scope:e.scope,component:e.component,stat:e.stat});}
  results.push({...((courierPath||courierRelay)?{id:room.id,path:courierRelay?'relay':courierPath.decision.chosen,note:room.note}:{}),...((foundryPass||foundryVault)?{id:room.id,path:foundryVault?'cooled':foundryPass.decision.chosen,note:room.note}:{}),...(c.expedition==='harbor'?{id:room.id,node:room.node,note:room.note}:{}),...(c.expedition==='scarcity'?{roundLimit:maxRounds,stopReason:won?null:heroesAlive()?'潮水封路':'全员倒下'}:{}),name:room.name,won,rounds:round,survivors:party.filter(u=>u.hp>0).length,hp:party.reduce((n,u)=>n+u.hp,0),mp:party.reduce((n,u)=>n+u.mp,0),supplies:clone(supplies)});emit(won?'victory':'defeat',won?'房间肃清，整队继续前进。':'远征停止：'+(heroesAlive()?(c.expedition==='scarcity'?'潮水封路，未在 '+maxRounds+' 回合内清场。':'达到回合上限。'):'队伍全员倒下。'));
  summons=[];if(!won)break;
 }
 return {version:VERSION,ruleset:RULESET,config:clone(c),events,rooms:results,stats,party:clone(party),supplies,won:results.length===rooms.length&&results.every(r=>r.won)};
}
