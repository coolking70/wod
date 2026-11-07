import{validateAutomaticAction,automaticDecision}from'./expedition-automatic-action.mjs';
import {liveFocusMarks,focusedTarget,focusDecision,FOCUS_STAT,FOCUS_RULE} from './expedition-focus-mark.mjs';
import {diseaseDefense} from './expedition-disease.mjs';
import {validateChannel,channelStep,CHANNEL_RULE} from './expedition-channel.mjs';
import {createEscort,escortOutcome} from './expedition-escort.mjs';
import {manaRegenerationProfile} from './expedition-mana-regeneration.mjs';
import {validateManaFloor,manaFloorCheck} from './expedition-mana-floor.mjs';
import {validateWardLinks,wardEffects,wardRecipients,WARD_RULE} from './expedition-linked-wards.mjs';
import {coatingRecipient,activeCoating,coatedHit} from './expedition-weapon-coating.mjs';
import {validateInitiative,validateEnemyInitiative,initiativeProfile} from './expedition-initiative.mjs';
import {validateHealthPhases,nextHealthPhase,applyHealthPhase} from './expedition-health-phases.mjs';
import {damageTypeOf,damageChannelTrace} from './expedition-damage-channel.mjs';
import {manaDamageResult,manaSelection,MANA_DAMAGE_RULE} from './expedition-mana-damage.mjs';
import {applyAttributeTraining} from './expedition-attribute-training.mjs';
import {validateAttackImmunities,attackEligible,immuneToAttack,immunityDecision,IMMUNITY_RULE} from './expedition-immunity.mjs';
import {validatePositionOnly,positionOnlyCheck} from './expedition-position-only.mjs';
import {roomWaves,WAVE_RULE} from './expedition-waves.mjs';
import {validateWithdrawal,withdrawalDecision} from './expedition-withdrawal.mjs';
import {OFFBEAT,OFFBEAT_RULE,offbeatEligible,existingOffbeat,ordinaryActionDecision,offbeatTargetCheck} from './expedition-offbeat.mjs';
import {validateGroupAid,groupAidCandidates} from './expedition-group-aid.mjs';
import {validateSupportOrder,supportPriorityChoice} from './expedition-support-priority.mjs';
import {validateAttackOrder,attackOrder,positionPriorityDecision} from './expedition-position-priority.mjs';
import {validateTargetCount,targetCountCheck} from './expedition-target-count.mjs';
import {validateSchedule,scheduleCheck} from './expedition-schedule.mjs';
import {validateObjective} from './expedition-goal-data.mjs';
import {manaRecipients,manaTransferAmount,MANA_TRANSFER_RULE} from './expedition-mana-transfer.mjs';
import {validateStockFloor,stockFloorCheck,STOCK_NAMES} from './expedition-stock-floor.mjs';
import {CORROSION,corrosionOn,corrosionTicks,corrosionSource} from './expedition-corrosion.mjs';
import {validateSummonTarget,summonOrders} from './expedition-summon-orders.mjs';
import {removableBuffs,removedBuffRecord,dispelRule} from './expedition-unravel.mjs';
import {INTERCEPTION,interceptionCandidate} from './expedition-interception.mjs';
import {SUMMON_FORMS,hasSummoningSkill} from './expedition-summons.mjs';
import {mediumId,CASTING_MEDIA} from './expedition-media-data.mjs';
import {commandCost} from './expedition-media.mjs';
import {shoalsChartId} from './expedition-shoals.mjs';
import {WEAKENING,cleansableEffects,activeWeakening,canWeaken} from './expedition-afflictions.mjs';
import {courierPass,resolveCourierPass,COURIER_ROOMS,COURIER_RELAY} from './expedition-courier.mjs';
import {reserveBlock} from './expedition-harbor-reserve.mjs';
import {advancementOptions,skillManaCost,advancementEffectBonus,advancementTrace} from './expedition-advancement-data.mjs';
import {regenerationTicks} from './expedition-regeneration.mjs';
import {HEALING_BLOCK_REASON,HEALING_BLOCK_STAT,healingBlockTrace,canApplyHealingBlock} from './expedition-disruption.mjs';
import {validHarborPlan,resolveHarborStep} from './expedition-harbor.mjs';
import {foundryApproach,resolveFoundryPass,validFoundryFlow,FOUNDRY_COOLED_VAULT,FOUNDRY_ROOMS} from './expedition-foundry.mjs';
import {validEquipment,equipmentTotals,equipmentRank} from './expedition-equipment.mjs';
import {healingDecision,selectHealingTarget} from './expedition-healing.mjs';
import {RESCUE_CHOICES,resolveRescue,BELL_CHOICES,bellCandidates,resolveBell,BELL_ROUTES,bellRoute,applyBellRoute} from './expedition-events.mjs';
import {ROOM_IDS,gearSupports,ROLE_TARGETS,roleTargetAllowed,positionOrderAllowed,supportPriorityAllowed,supplyBudget,hasArchiveEvents,roomTimeBudget,VERSION,clone,POS,GEAR,SKILLS,HEROES,ROOMS,DEFENSES,TYPES,DEFENSE_TYPES,PLAN_FIELDS,resolveHeroPlan,ITEMS,EXPEDITIONS,roomsFor,naturalDefenses,row,trainingOptions,MAX_TRAINING_RANK} from './expedition-data.mjs';
import {validateMechanism,mechanismDecision} from './expedition-mechanisms.mjs';
export const RULESET='original-wod-inspired-0.57.0';
const routes={front:['front','left','right','center','rear'],left:['right','front','center','rear','left'],right:['left','front','center','rear','right'],center:['front','left','right','center','rear'],rear:['front','left','right','center','rear']};
function validateOrder(order,heroes){if(!Array.isArray(order)||order.length!==6||new Set(order).size!==6||order.some(id=>!heroes.some(h=>h.id===id)))throw Error('预备顺序必须包含所有队员');}
function validatePlan(h,t){
 validateAutomaticAction(h);
 if(Object.hasOwn(h,'mechanism'))throw Error('机关类别来自遭遇模板，不是英雄配置');
 if(Object.hasOwn(h,'healthPhases')||Object.hasOwn(h,'healthPhaseIndex'))throw Error('生命阶段来自遭遇模板，不是英雄配置');
 if(Object.hasOwn(h,'immuneTo'))throw Error('攻击类型免疫来自遭遇模板，不是英雄配置');
 validateAttackOrder(h);validateSupportOrder(h);validateInitiative(h,t);
 if(!Object.hasOwn(POS,h.pos))throw Error('站位无效');
 for(const phase of ['prep','main']){if(!Array.isArray(h[phase])||h[phase].length>4)throw Error('每阶段至多 4 条指令');for(const r of h[phase]){const s=SKILLS[r?.skill];if(Object.hasOwn(r||{},'damageType'))throw Error('伤害通道来自技能定义，不是指令参数');if(s){damageTypeOf(s);mediumId(s,r);validateSummonTarget(r);validateStockFloor(r);validateManaFloor(r);validateSchedule(r);validateTargetCount(r);validatePositionOnly(r);}if(!s||(!t.skills.includes(r.skill)&&r.skill!=='wait')||!(phase==='prep'?['buff','summon'].includes(s.kind):['attack','wait','transfer'].includes(s.kind))||!['repeat','cycle','once','round'].includes(r.mode)||(r.mode==='round'&&phase!=='main')||![...Object.keys(POS),'self','all',...(roleTargetAllowed(s)?Object.keys(ROLE_TARGETS):[]),...(positionOrderAllowed(s)?['priority']:[]),...(supportPriorityAllowed(s)?['supportPriority']:[])].includes(r.target))throw Error('指令不合法');if(s.kind==='summon'&&!Object.hasOwn(POS,r.target))throw Error('召唤位置无效');if(s.cover&&!Object.hasOwn(POS,r.target)&&r.target!=='supportPriority')throw Error('援护必须选择其他队员所在阵位');if(s.kind==='transfer'&&r.target!=='all'&&!Object.hasOwn(POS,r.target))throw Error('法力援助必须选择友方阵位或全队');}}
 if(h.healing)validateGroupAid(h.healing,t);
 if(!h.healing||!['lowest','self_first'].includes(h.healing.priority??'lowest')||typeof h.healing.enabled!=='boolean'||![.5,.65,.8].includes(h.healing.threshold)||![...Object.keys(POS),'all','self'].includes(h.healing.target)||(h.healing.enabled&&!t.skills.includes('heal')))throw Error('治疗设置不合法');
 if(!h.itemPolicy||typeof h.itemPolicy.enabled!=='boolean'||![.3,.5,.7].includes(h.itemPolicy.threshold))throw Error('道具使用策略无效');
 if(!h.defenses||Object.keys(h.defenses).length!==3)throw Error('防御配置无效');
 for(const type of Object.keys(DEFENSE_TYPES))if(!DEFENSES[h.defenses[type]]?.types.includes(type))throw Error('防御技能与攻击类型不匹配');
}
export function validate(c){
 validateObjective(c);validateWithdrawal(c);
 if(c?.version!==VERSION||!Number.isInteger(c.seed)||c.seed<1||c.seed>999999)throw Error('配置版本或种子无效');
 if(!Array.isArray(c.heroes)||c.heroes.length!==6||new Set(c.heroes.map(h=>h.id)).size!==6)throw Error('必须包含 6 名不同队员');
 if((c.expedition==='harbor'||c.harbor!==undefined)&&!validHarborPlan(c.harbor))throw Error('港口分支策略无效');
 if(!Object.hasOwn(EXPEDITIONS,c.expedition))throw Error('远征路线无效');
 foundryApproach(c);validFoundryFlow(c);courierPass(c);shoalsChartId(c);
 if(!Object.hasOwn(BELL_CHOICES,c.bellApproach))throw Error('机关应对策略无效');
 if(!Object.hasOwn(RESCUE_CHOICES,c.rescueApproach))throw Error('救援策略无效');
 validateOrder(c.prepOrder,c.heroes);
 if(!c.roomOrders||typeof c.roomOrders!=='object'||Array.isArray(c.roomOrders))throw Error('房间顺序配置无效');
 for(const [roomId,order] of Object.entries(c.roomOrders)){if(!ROOM_IDS.includes(roomId))throw Error('未知房间');validateOrder(order,c.heroes);}
 let total=0;for(const k of ['herb','rune','arrow']){const n=c.supplies?.[k];if(!Number.isInteger(n)||n<0||n>60)throw Error('补给数量须为 0–60');total+=n;}if(total>supplyBudget(c))throw Error('此路线补给总预算为 '+supplyBudget(c));
 for(const h of c.heroes){if(['windup','channel','windupFinished'].some(k=>Object.hasOwn(h,k)))throw Error('蓄能仅允许固定敌方模板');if(Object.hasOwn(h,'wardLinks'))throw Error('护壁仅允许公开遭遇模板定义');const t=HEROES.find(t=>t.id===h.id);if(!t||!Object.hasOwn(ITEMS,h.item)||!validEquipment(h.gear)||!t.skills.includes(h.trained)||!Object.hasOwn(t.attrs,h.attribute)||!Object.hasOwn(DEFENSES,h.defenseFocus)||h.defenseFocus==='natural')throw Error('队员配置无效');if(h.advancement!==undefined&&!advancementOptions(h.id).some(([id])=>id===h.advancement))throw Error('后期进阶与职业不匹配');validatePlan(h,t);
  if(!h.training||typeof h.training!=='object'||Array.isArray(h.training)||Object.entries(h.training).some(([k,n])=>!Object.hasOwn(trainingOptions(h.id),k)||!Number.isInteger(n)||n<0||n>MAX_TRAINING_RANK))throw Error('训练配置无效或超过每项等级上限');
  if(!h.overrides||typeof h.overrides!=='object'||Array.isArray(h.overrides))throw Error('房间覆盖无效');
  for(const [roomId,patch] of Object.entries(h.overrides)){if(!ROOM_IDS.includes(roomId)||!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!PLAN_FIELDS.includes(k)))throw Error('房间覆盖包含未知字段');validatePlan(resolveHeroPlan(h,roomId),t);}
 }return true;
}
export function buildParty(c){return c.heroes.map(h=>{const t=HEROES.find(t=>t.id===h.id),a=applyAttributeTraining(t.attrs,h.training);a[h.attribute]+=3;const bonus=equipmentTotals(h.gear).bonus,maxHp=50+4*(a.con+(bonus.con||0)),maxMp=20+2*(a.int+(bonus.int||0))+a.wil+(bonus.wil||0);return {...clone(t),...clone(h),attrs:a,itemInstance:{id:h.id+':'+h.item,kind:h.item,remaining:ITEMS[h.item].charges},side:'party',hp:maxHp,maxHp,mp:maxMp,maxMp,skills:Object.fromEntries(t.skills.map(s=>[s,t.base+(h.trained===s?3:0)+(h.training['skill:'+s]||0)])),effects:[]};});}
export function current(u,key){const gear=equipmentTotals(u.gear);return (u.attrs[key]??(key==='armor'?gear.armor:0))+(gear.bonus[key]||0)+(u.effects||[]).reduce((n,e)=>n+(e.active!==false&&e.stat===key?e.value:0),0);}
export function resistanceOf(u,type){return Math.max(-50,Math.min(75,(u.resistances?.[type]||0)+(equipmentTotals(u.gear).resistances[type]||0)));}
export function damageResult(rolled,multiplier,armor,resistance=0){const afterArmor=Math.max(0,rolled*multiplier-armor),damage=Math.floor(afterArmor*(1-resistance/100));return {afterArmor,unresisted:Math.floor(afterArmor),damage};}
export function skillLevel(u,sid){return (u.skills[sid]||0)+(u.skills[sid]!==undefined?equipmentRank(u.gear,'skill:'+sid):0)+(SKILLS[sid]?.kind==='attack'?current(u,'skill'):0);}
export function skillBreakdown(u,sid){const training=u.training?.['skill:'+sid]||0,specialization=u.trained===sid?3:0,temporary=SKILLS[sid]?.kind==='attack'?current(u,'skill'):0;return {base:(u.skills[sid]||0)-training-specialization,specialization,training,...(equipmentTotals(u.gear).ranks?{equipment:u.skills[sid]!==undefined?equipmentRank(u.gear,'skill:'+sid):0}:{}),temporary,total:skillLevel(u,sid)};}
export function mean(u,sid){const s=SKILLS[sid];return 2*current(u,s.primary)+current(u,s.secondary)+2*skillLevel(u,sid);}
export function defenseProfile(u,type){
 if(type==='disease')return diseaseDefense(u,current,Boolean(equipmentTotals(u.gear).ranks));
 const requested=u.defenses?.[type==='mental'?'magic':type]||'natural',chosen=DEFENSES[requested];
 let reason=null;
 if(!chosen||!chosen.types.includes(type))reason='类型不匹配';
 else if(chosen.gear&&!gearSupports(u.gear,chosen.gear))reason='缺少盾牌（需携盾武器）';
 else if(u.mp<chosen.cost)reason='法力不足';
 const skill=reason?'natural':requested,d=DEFENSES[skill];
 const [primary,secondary]=skill==='natural'?(type==='melee'?['dex','agi']:['magic','mental'].includes(type)?['wil','int']:['agi','per']):[d.primary,d.secondary];
 const training=skill==='natural'?0:u.training?.['defense:'+skill]||0,specialization=skill==='natural'?0:u.defenseFocus===skill?3:0,temporaryLevel=skill==='natural'?0:current(u,'defenseSkill'),equipment=skill==='natural'?0:equipmentRank(u.gear,'defense:'+skill),level=skill==='natural'?0:6+specialization+training+equipment+temporaryLevel;
 const base=2*current(u,primary)+current(u,secondary)+2*level;
 return {requested,skill,name:d.name,reason,level,training,specialization,...(equipmentTotals(u.gear).ranks?{equipment}:{}),temporaryLevel,cost:d.cost,primary,secondary,primaryValue:current(u,primary),secondaryValue:current(u,secondary),base,bonus:current(u,'defense'),mean:base+current(u,'defense')};
}
export function chooseTargets(actor,units,s,target,rng=()=>0,command={}){
 if(s.kind==='transfer')return manaRecipients(actor,units,target).slice(0,1);
 if(target==='priority'&&!positionOrderAllowed(s))return [];
 if(target==='supportPriority')return supportPriorityAllowed(s)?supportPriorityChoice(actor,units,s).targets:[];
 const aid=s.kind==='buff'||s.kind==='heal';let pool=units.filter(u=>u.hp>0&&(aid?u.side===actor.side&&!u.mechanism:u.side!==actor.side));
 if(s.kind==='attack')pool=pool.filter(u=>attackEligible(u,s));
 if(s.weaponDamage)pool=pool.filter(coatingRecipient);
 if(s.dispel)pool=pool.filter(u=>removableBuffs(u).length);
 if(s.actionDamp)pool=pool.filter(offbeatEligible);
 if(s.mode==='self')return aid&&actor.mechanism?[]:[actor];
 if(s.kind==='heal'){const selected=selectHealingTarget(actor,pool,target);if(s.groupHealing){const group=groupAidCandidates(actor,pool,target,selected);return group.length>=2?group:[];}return selected?[selected]:[];}
 if(s.mode==='all')return pool.slice(0,s.max);
 if(aid)return pool.filter(u=>target==='self'?u.id===actor.id:u.pos===target).slice(0,s.max);
 if(Object.hasOwn(ROLE_TARGETS,target)){if(!roleTargetAllowed(s))return [];const candidates=pool.filter(u=>(target==='healer'?u.skills?.heal!==undefined:hasSummoningSkill(u)));const focus=focusedTarget(actor,candidates,s);if(focus)return [focus];for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}return candidates.slice(0,s.max);}
 const order=s.type==='melee'?routes[actor.pos]:command.onlyPosition?[target]:target==='priority'?attackOrder(actor):[target,...Object.keys(POS).filter(p=>p!==target)];
 for(const p of order){const group=pool.filter(u=>u.pos===p);if(group.length){const focus=focusedTarget(actor,group,s);if(focus)return [focus];for(let i=group.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[group[i],group[j]]=[group[j],group[i]];}return group.slice(0,s.max);}}return [];
}
function random(seed){let x=seed>>>0;return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function simulate(c,options={}){
 validate(c);const rng=random(c.seed),party=options.party?clone(options.party):buildParty(c),rooms=clone(options.rooms||roomsFor(c)),supplies=clone(c.supplies),events=[],results=[];
 const snapshotTypes=Object.keys(TYPES).filter(t=>t!=='disease'||[...party,...rooms.flatMap(r=>roomWaves(r).flatMap(w=>w.enemies))].some(u=>Object.keys(u.skills||{}).some(s=>SKILLS[s]?.type==='disease')));
 const escorts=createEscort(c),escortLost=()=>escorts.some(u=>u.hp<=0);
 const stats=Object.fromEntries(party.map(u=>[u.id,{damage:0,actual:0,overkill:0,healing:0,interrupts:0,failed:0,defenses:0,defenseMana:0}]));
 let harborFlags={},harborSource=null,foundrySource=null,courierSource=null;let bellRecord=null,rescueRecord=null;let summons=[],summonSerial=0;let enemies=[],roomIndex=0,round=0,phase='',sequence=0,enemySupplies={},clock=0,actionId=null;
 party.forEach(u=>{u.effects??=[];validateAttackImmunities(u);});
 const all=()=>[...party,...enemies,...summons,...escorts],live=side=>all().filter(u=>u.side===side&&u.hp>0);
 const heroesAlive=()=>party.some(u=>u.hp>0);
 const snapshot=()=>all().map(u=>({id:u.id,name:u.name,mark:u.mark,side:u.side,owner:u.owner||null,summoned:Boolean(u.owner),...(u.escort?{escort:true}:{}),...(u.channel?{channel:clone(u.channel)}:{}),itemInstance:u.itemInstance?clone(u.itemInstance):null,pos:u.pos,resistances:Object.fromEntries(snapshotTypes.map(t=>[t,resistanceOf(u,t)])),...(u.immuneTo?{immuneTo:[...u.immuneTo]}:{}),...(u.mechanism?{mechanism:true}:{}),...(u.healthPhaseIndex?{healthPhase:{index:u.healthPhaseIndex,name:u.healthPhaseName}}:{}),hp:u.hp,maxHp:u.maxHp,mp:u.mp,maxMp:u.maxMp,effects:clone(u.effects),defenses:clone(u.defenses||{}),attrs:Object.fromEntries(Object.keys(u.attrs).map(k=>[k,current(u,k)]))}));
 function emit(type,text,actor=null,targets=[],detail={}){events.push({id:++sequence,roomIndex,round,phase,type,text,actor,targets,actionId,detail:clone(detail),units:snapshot(),supplies:clone(supplies)});}
 function cancelChannel(u,reason){if(!u?.channel)return;const channel={...clone(u.channel),status:'取消',reason},saved=actionId;delete u.channel;u.windupFinished=true;actionId=null;emit('windup-cancel',u.name+' 蓄能取消：'+reason,u.id,[],{channel,cost:0,consumedAction:false,rule:CHANNEL_RULE});actionId=saved;}
 function removeSummons(owner,reason,extra={}){if(owner&&reason==='主人倒下')cancelChannel(all().find(u=>u.id===owner),'来源倒下');const gone=summons.filter(u=>u.hp>0&&(!owner||u.owner===owner));for(const u of gone){u.hp=0;emit('dismiss',u.name+' 消散：'+reason,u.owner,[u.id],{reason,owner:u.owner,...extra});}}
 function spawn(owner,pos,skill='sentinel',aim){
  const form=SUMMON_FORMS[skill];if(!form)throw Error('未知召唤形态');const orders=summonOrders(skill,aim);
  const id='summon:'+roomIndex+':'+(++summonSerial),level=skillLevel(owner,skill)||8,hp=form.hpBase+level*form.hpPerLevel;
  const u={id,name:owner.side==='party'?form.partyName:form.enemyName,mark:form.mark,owner:owner.id,side:owner.side,pos,gear:'field',attrs:clone(form.attrs),hp,maxHp:hp,mp:form.mana,maxMp:form.mana,skills:{[form.attack]:level},defenses:naturalDefenses(),effects:[],prep:[],main:orders.commands,healing:{enabled:false}};
  summons.push(u);stats[id]={damage:0,actual:0,overkill:0,healing:0,interrupts:0,failed:0,defenses:0,defenseMana:0,owner:owner.id,name:u.name};
  emit('summon',owner.name+' 召来 '+u.name,owner.id,[id],{owner:owner.id,skill,level,pos,hp,...(skill!=='sentinel'?{form:{id:skill,attack:form.attack,target:orders.target,rule:orders.record?orders.record.rule:'弩灵生命较低，以穿石箭优先后排，不消耗箭矢；后排空缺按原远程路线回退。'}}:{}),...(orders.record?{orders:orders.record}:{}),rule:'本房间有效；主人倒下即消散；仅进入尚未生成的行动队列。'});return u;
 }
 function reactHealth(u,sourceEventId){while(nextHealthPhase(u)){const healthPhase={...applyHealthPhase(u),sourceEventId},saved=actionId;actionId=null;emit('health-phase',u.name+' 进入「'+healthPhase.name+'」',u.id,[u.id],{healthPhase});actionId=saved;}}
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
 function establishWards(waveIndex){for(const {source,target,effect}of wardEffects(enemies,roomIndex,waveIndex)){target.effects.push(effect);emit('ward-link',source.name+' 为 '+target.name+' 建立护壁：护甲 +'+effect.value,source.id,[target.id],{effectId:effect.id,sourceName:source.name,targetName:target.name,armor:effect.value,cost:0,consumedAction:false,rule:WARD_RULE});}}
 function releaseWards(source,sourceDamageEventId,sourceDownEventId){for(const {unit,effects}of wardRecipients(enemies,source.id)){const armorBefore=current(unit,'armor'),ids=new Set(effects.map(e=>e.id));unit.effects=unit.effects.filter(e=>!ids.has(e.id));emit('ward-release',source.name+' 已拆除，'+unit.name+' 解除本来源护壁',source.id,[unit.id],{sourceDamageEventId,sourceDownEventId,sourceName:source.name,targetName:unit.name,removed:effects.map(e=>({effectId:e.id,source:e.source,stat:e.stat,value:e.value})),armorBefore,armorAfter:current(unit,'armor'),released:effects.reduce((n,e)=>n+e.value,0),cost:0,consumedAction:false,rule:WARD_RULE});}}
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
  const room=rooms[roomIndex],waves=roomWaves(room);for(const wave of waves){validateWardLinks(wave.enemies);}for(const wave of waves)for(const u of wave.enemies){validateAttackImmunities(u);validateMechanism(u);validateHealthPhases(u);validateEnemyInitiative(u);validateChannel(u,SKILLS);}let waveIndex=0,pendingWave=false,lastWaveClear=null;const clearedWaves=[],hasMoreWaves=()=>waveIndex+1<waves.length;round=0;phase='进场';for(const u of party){const h=c.heroes.find(h=>h.id===u.id);if(h){const plan=resolveHeroPlan(h,room.id);for(const key of PLAN_FIELDS){if(['attackOrder','supportOrder','initiative'].includes(key)&&plan[key]===undefined)delete u[key];else u[key]=clone(plan[key]);}}}enemies=room.enemies.map(u=>({...u,effects:[],side:'enemy'}));enemySupplies={herb:60,rune:60,arrow:60};
  const cursors=new Map(),used=new Set(),roundUsed=new Map(),roundCursors=new Map(),interceptUsed=new Map();let serial=0;
  emit('room',room.name+'：生命、法力、补给与远征效果继承。',null,[],{...(waves.length>1?{wavePlan:{total:waves.length,names:waves.map(w=>w.name),rule:WAVE_RULE}}:{}),rule:'房间效果结束；远征效果保留；行动游标重置。',...(c.expedition==='shoals'?{chart:shoalsChartId(c),node:room.node}:{})});
  establishWards(0);
  if(escorts.length)emit('escort',escorts[0].name+' 随队进入：剩余生命 '+escorts[0].hp+'/'+escorts[0].maxHp,null,[escorts[0].id],{escort:escortOutcome(escorts),carriedFromPriorRoom:roomIndex>0});
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
  function attempt(u,r,key,interrupt=false,prepaid=null,automaticAction=null){
   const schedule=scheduleCheck(r,round);if(schedule?.blocked){emit('skip',u.name+' 跳过「'+SKILLS[r.skill].name+'」：不在配置回合窗口',u.id,[],{reason:'不在配置回合窗口',skill:r.skill,schedule,cost:0,consumedAction:false});return false;}
   const s=SKILLS[r.skill],payment=prepaid?{...commandCost(u,r),mana:0,resource:null,amount:0}:commandCost(u,r),manaCost=payment.mana,advancement=advancementTrace(u,r.skill),stock=u.side==='party'?supplies:enemySupplies;let reason='',reservation=null,healingBlock=null,stockFloor=null,manaFloor=null,targetCount=null,positionOnly=null,focusMarkBlock=null;
   if(used.has(key)&&r.mode==='once')reason='本房间一次指令已执行';
   else if(roundUsed.get(key)===round&&r.mode==='round')reason='本回合一次指令已执行，继续后备';
   else if(s.requiresGear&&!gearSupports(u.gear,s.requiresGear))reason='装备条件不满足';
   else if(s.kind==='heal'&&(healingBlock=healingBlockTrace(u)))reason=HEALING_BLOCK_REASON;
   else if(s.kind==='summon'&&summons.some(t=>t.owner===u.id&&t.hp>0))reason='已有存活召唤物';
   else if(s.recall&&!summons.some(t=>t.owner===u.id&&t.hp>0))reason='没有自己的存活召唤物可召回';
   else if(s.focusMark&&(focusMarkBlock=liveFocusMarks(all(),u.side)).length)reason='同方已有存活集火标记者，不刷新，继续后备';
   else if(u.mp<manaCost)reason='法力不足';
   else if(payment.resource&&stock[payment.resource]<payment.amount)reason='耗材耗尽';
   else if((reservation=reserveBlock(c,roomIndex,u,s,stock,payment)))reason='为第三场事件预留2符纸，尝试下一条指令';
   else if((stockFloor=stockFloorCheck(r,payment,stock))?.blocked)reason='用后留存不足：需留'+stockFloor.floor+STOCK_NAMES[stockFloor.resource]+'，尝试下一条指令';
   if(!reason&&(manaFloor=manaFloorCheck(r,payment,u.mp))?.blocked)reason='保留法力不足：用后至少留'+manaFloor.floor+'法力，尝试下一条指令';
   const focusTargeting=!reason?focusDecision(u,all(),s,()=>chooseTargets(u,all(),{...s,max:Number.MAX_SAFE_INTEGER},r.target,()=>0,r)):null;
   const manaTargets=!reason?manaSelection(u,all(),s,r.target):null;
   const mechanismSelection=!reason?mechanismDecision(u,all(),s,r.target):null;
   const attackImmunity=!reason?immunityDecision(u,all(),s,r.target):null;
   const positionPriority=!reason&&r.target==='priority'?positionPriorityDecision(u,all(),s):null;
   const offbeatSelection=!reason&&s.actionDamp?offbeatTargetCheck(u,all(),r.target):null;
   const supportSelection=!reason&&r.target==='supportPriority'?supportPriorityChoice(u,all(),s):null,supportPriority=supportSelection?.trace;
   if(!reason&&r.onlyPosition){positionOnly=positionOnlyCheck(r,chooseTargets(u,all(),{...s,max:Number.MAX_SAFE_INTEGER},r.target,()=>0,r));if(positionOnly.blocked)reason='指定阵位'+POS[r.target]+'无合法目标，尝试后备';}
   if(!reason&&r.minTargets){targetCount=targetCountCheck(r,chooseTargets(u,all(),s,r.target,()=>0,r).length);if(targetCount.blocked)reason='可攻击单位不足：需至少'+targetCount.required+'名，当前'+targetCount.available+'名';}
   let targets=[];
   if(!reason&&!['wait','summon'].includes(s.kind)){
    targets=supportSelection?supportSelection.targets:chooseTargets(u,s.cleanse?all().filter(t=>cleansableEffects(t).length):s.cover?all().filter(t=>t.id!==u.id):all(),s,r.target,rng,r);
         if(focusTargeting){focusTargeting.selected=targets.map(t=>({id:t.id,name:t.name,pos:t.pos}));const m=focusTargeting.eligibleMark;focusTargeting.followed=m&&targets.some(t=>t.id===m.id)?m:null;}
         if(manaTargets)manaTargets.selected=targets.map(t=>({id:t.id,name:t.name,pos:t.pos,mp:t.mp}));
         if(attackImmunity)attackImmunity.selected=targets.map(t=>({id:t.id,name:t.name,pos:t.pos}));
     if(mechanismSelection)mechanismSelection.selected=targets.map(t=>({id:t.id,name:t.name,pos:t.pos}));
     if(offbeatSelection)offbeatSelection.selected=targets.map(t=>({id:t.id,name:t.name}));
    if(s.kind==='buff'&&!s.cleanse)targets=targets.filter(t=>!t.effects.some(e=>e.skill===r.skill));
    if(!targets.length)reason=s.manaDamage?'指定范围没有可削减法力的合法敌人，尝试后备':s.kind==='transfer'?'范围内没有其他法力不高于50%的存活正式友方':s.dispel?'没有带可破除技能增益的合法敌人':s.actionDamp?'当前没有可迟拍的额外行动目标，尝试后备':s.disarm?'当前没有合法机关，尝试后备':Object.hasOwn(ROLE_TARGETS,r.target)?'没有存活的'+ROLE_TARGETS[r.target]+'，尝试下一条指令':s.cleanse?'没有可净化的负面效果':s.cover?'没有可援护的其他队员':s.kind==='buff'?'无可覆盖目标或同名效果仍在':attackImmunity?'类型免疫排除后没有合法目标，尝试后备':mechanismSelection?'普通攻击不能作用机关，尝试后备':'没有合法目标';
   }
   if(reason){emit('skip',u.name+' 跳过「'+s.name+'」：'+reason,u.id,[],{reason,skill:r.skill,...(payment.medium!=='standard'?{medium:payment.medium,requiredMana:payment.mana,requiredResource:payment.resource,requiredAmount:payment.amount}:{}),requiredGear:s.requiresGear||null,cost:0,consumedAction:false,...(reservation?{reservation}: {}),...(healingBlock?{healingBlock}: {}),...(focusMarkBlock?.length?{focusMarkBlock:focusMarkBlock.map(({unit,effect})=>({id:unit.id,name:unit.name,effectId:effect.id,source:effect.source}))}:{}),...(stockFloor?{stockFloor}: {}),...(manaFloor?{manaFloor}:{}),...(targetCount?{targetCount}:{}),...(positionOnly?{positionOnly}:{}),...(manaTargets?{manaSelection:manaTargets}:{}),...(mechanismSelection?{mechanismSelection}:{}),...(attackImmunity?{attackImmunity}:{}),...(positionPriority?{positionPriority}:{}),...(focusTargeting?{focusTargeting}:{}),...(supportPriority?{supportPriority}:{}),...(offbeatSelection?{offbeatSelection}:{})});return false;}
   if(s.kind==='wait'){emit('wait',u.name+' 等待。',u.id,[],{consumedAction:true});used.add(key);roundUsed.set(key,round);return true;}
   const before=u.mp;u.mp-=manaCost;if(payment.resource)stock[payment.resource]-=payment.amount;used.add(key);roundUsed.set(key,round);
   const lv=skillLevel(u,r.skill),m=mean(u,r.skill),cast=++serial;actionId=roomIndex+':'+cast;
   if(prepaid)emit('windup-release',u.name+' 完成蓄能，按当前状态释放「'+s.name+'」',u.id,targets.map(t=>t.id),{channel:{...prepaid,status:'释放'},cost:0,consumedAction:true,rule:CHANNEL_RULE});
   emit('cast',u.name+' '+(interrupt?'中断普通指令，使用':automaticAction?'自动应急使用':'使用')+'「'+s.name+'」',u.id,targets.map(t=>t.id),{cast,skill:r.skill,...(automaticAction?{automaticAction:clone(automaticAction)}:{}),...(prepaid?{channel:{...prepaid,status:'已释放'}}:{}),...(damageChannelTrace(s)?{damageChannel:damageChannelTrace(s)}:{}),...(schedule?{executionWindow:schedule}:{}),skillLevel:lv,levelSources:skillBreakdown(u,r.skill),...(advancement?{advancement}:{}),primary:current(u,s.primary),secondary:current(u,s.secondary),mean:m,formula:'主属性 ×2 + 副属性 + 实时技能等级 ×2',mpBefore:before,mpAfter:u.mp,item:payment.resource,...((s.groupHealing||s.type==='disease')?{itemAmount:payment.amount}:{}),...(stockFloor?{stockFloor}:{}),...(manaFloor?{manaFloor}:{}),...(targetCount?{targetCount}:{}),...(positionOnly?{positionOnly}:{}),...(manaTargets?{manaSelection:manaTargets}:{}),...(mechanismSelection?{mechanismSelection}:{}),...(attackImmunity?{attackImmunity}:{}),...(positionPriority?{positionPriority}:{}),...(focusTargeting?{focusTargeting}:{}),...(supportPriority?{supportPriority}:{}),...(offbeatSelection?{offbeatSelection}:{}),...(payment.medium!=='standard'?{itemAmount:payment.amount,medium:{id:payment.medium,name:CASTING_MEDIA[payment.medium].name,baseMana:payment.baseMana,manaDelta:CASTING_MEDIA[payment.medium].manaDelta,actualMana:payment.mana,resource:payment.resource,amount:payment.amount,rule:'只改变法力与符纸支付；效果、检定、装备、目标和指令节奏保持。'}}:{}),interrupt,...(Object.hasOwn(ROLE_TARGETS,r.target)?{targetPolicy:{requested:r.target,rule:'仅选择存活且拥有'+(r.target==='healer'?'治疗':'召唤')+'技能的敌人；多人符合时随机选一人，'+(s.manaDamage?'断流还要求剩余法力大于0。':'不要求当前资源充足。'),selected:targets.map(t=>({id:t.id,name:t.name,pos:t.pos}))}}:{}),sources:effectTrace(u)});
   if(s.kind==='summon')spawn(u,r.target,r.skill,r.summonTarget);
   if(s.recall)removeSummons(u.id,'主人施放潮灵归还',{recall:true,skill:r.skill,rule:'仅召回本人的存活召唤物，占本次预备；不返还原召唤消耗，不影响其他主人。'});
   if(s.cleanse)for(const t of targets){const removed=cleansableEffects(t);t.effects=t.effects.filter(e=>!removed.includes(e));emit('cleanse',u.name+' 为 '+t.name+' 净化 '+removed.map(e=>e.component||e.name).join('、'),u.id,[t.id],{cast,skill:r.skill,removed:removed.map(e=>({effectId:e.id,skill:e.skill,name:e.name,component:e.component,stat:e.stat,value:e.value,source:e.source,sourceName:e.sourceName})),rule:'只移除本次实际记录的负面效果；不移除正面增益、不回滚此前检定、不提供后续免疫。'});}
   if(s.kind==='buff'&&!s.cleanse&&!s.recall)for(const t of targets){
    const components=s.components||[{stat:s.stat,base:s.base,scale:s.scale,scope:s.scope,duration:s.duration,delay:0}];
    for(const [componentIndex,part] of components.entries()){
     const advancementBonus=advancementEffectBonus(u,r.skill,part.stat),v=Math.floor(part.base+m*part.scale)+advancementBonus,delay=part.delay||0,e={id:`${roomIndex}:${cast}:${t.id}:${componentIndex}`,skill:r.skill,name:s.name,component:part.label||s.name,source:u.id,sourceName:u.name,stat:part.stat,value:v,scope:part.scope,active:delay===0,activateTick:clock+delay,activateRound:round+delay,expires:part.scope==='rounds'?round+delay+part.duration:null,expiresTick:part.scope==='rounds'?clock+delay+part.duration:null};
     t.effects.push(e);emit('effect',t.name+' '+(e.active?'获得':'等待')+'「'+s.name+(e.component!==s.name?' · '+e.component:'')+'」：'+({manaRegen:'自然法力回复修正',weaponDamage:'持械附加法术伤害基值',cover:'援护许可',regeneration:'每回合缓释恢复',defense:'全防御检定',int:'智力',skill:'攻击技能等级',defenseSkill:'防御技能等级',armor:'护甲',actions:'行动次数'}[part.stat]||part.stat)+' '+(v>=0?'+':'')+v,u.id,[t.id],{effectId:e.id,cast,skill:r.skill,component:e.component,stat:e.stat,value:v,mean:m,formula:`floor(${part.base} + ${m} × ${part.scale})${advancementBonus?' + '+advancementBonus:''}`,scope:e.scope,expires:e.expires,active:e.active,activateRound:e.activateRound,sources:effectTrace(u)});
    }
   }
   if(s.kind==='transfer'){const t=targets[0],amount=manaTransferAmount(m,manaCost),beforeMp=t.mp,actual=Math.min(t.maxMp-t.mp,amount);t.mp+=actual;if(stats[u.id])stats[u.id].manaGiven=(stats[u.id].manaGiven||0)+actual;if(stats[t.id])stats[t.id].manaReceived=(stats[t.id].manaReceived||0)+actual;emit('mana-transfer',u.name+' 向 '+t.name+' 转入 '+actual+' 法力',u.id,[t.id],{cast,skill:r.skill,mean:m,amount,actual,overflow:amount-actual,paidMana:manaCost,donorBefore:before,donorAfter:u.mp,targetBefore:beforeMp,targetAfter:t.mp,targetMax:t.maxMp,netLoss:manaCost-actual,threshold:.5,formula:`min(${manaCost}, max(1, floor(1 + ${m} × 0.08)))`,consumedAction:true,rule:MANA_TRANSFER_RULE,sources:effectTrace(u)});}
   if(s.kind==='heal'){if(s.groupHealing){if(stats[u.id])stats[u.id].interrupts++;for(const t of targets){const amount=Math.floor(m*.45),actual=Math.min(t.maxHp-t.hp,amount),hpBefore=t.hp;t.hp+=actual;if(stats[u.id])stats[u.id].healing+=actual;emit('heal',u.name+' 用同位合剂为 '+t.name+' 恢复 '+actual+' 生命',u.id,[t.id],{cast,skill:r.skill,amount,actual,overheal:amount-actual,hpBefore,hpAfter:t.hp,formula:`floor(${m} × 0.45)`,ordinaryCursorUnchanged:true,groupHealing:{recipients:targets.map(t=>t.id),paidOnce:true}});}}else{const t=targets[0],amount=Math.floor(m*.7),actual=Math.min(t.maxHp-t.hp,amount);t.hp+=actual;if(stats[u.id]){stats[u.id].healing+=actual;stats[u.id].interrupts++;}emit('heal',u.name+' 为 '+t.name+' 恢复 '+actual+' 生命',u.id,[t.id],{cast,skill:r.skill,amount,actual,overheal:amount-actual,formula:`floor(${m} × 0.7)`,ordinaryCursorUnchanged:true});}}
   if(s.kind==='attack')for(const chosen of targets){
    if(chosen.hp<=0){emit('attack-skip',u.name+' 不再结算指向 '+chosen.name+' 的攻击：原目标已倒下',u.id,[chosen.id],{cast,skill:r.skill,reason:'原目标已倒下',cost:0,consumedAction:false,rule:'已完成施法不退款；不重复防御、攻击或记录倒下，其余原目标继续结算。'});continue;}
    const attack=roll(m);let t=chosen,interception=null;
    const cover=s.disarm?null:interceptionCandidate(chosen,all(),s.type,round,interceptUsed);
    if(cover){const {effect,guardian,reason}=cover,identity={effectId:effect.id,source:effect.source,recipient:chosen.id,skill:effect.skill,component:effect.component,stat:effect.stat,value:effect.value},common={cast,skill:r.skill,attackType:s.type,protected:chosen.id,protectedName:chosen.name,guardian:effect.source,guardianName:guardian?.name||effect.source,cover:identity};
     if(reason)emit('intercept-skip',(guardian?.name||effect.source)+' 未尝试援护 '+chosen.name+'：'+reason,effect.source,[chosen.id],{...common,reason,cost:0,consumedAction:false});
     else {const before=guardian.mp;guardian.mp-=INTERCEPTION.cost;interceptUsed.set(guardian.id,round);const reactionMean=mean(guardian,INTERCEPTION.skill),reaction=roll(reactionMean),difficulty=Math.ceil(attack*.8),success=reaction>=difficulty;
      emit('intercept',guardian.name+(success?' 接下了原本指向 ':' 未及接下指向 ')+chosen.name+' 的攻击',guardian.id,[chosen.id],{...common,attack,difficulty,reactionMean,reaction,success,actualTarget:success?guardian.id:chosen.id,level:skillLevel(guardian,INTERCEPTION.skill),mpBefore:before,mpAfter:guardian.mp,cost:INTERCEPTION.cost,consumedAction:false,sources:effectTrace(guardian),rule:'援护实掷不低于本次攻击实掷×0.8向上取整才重定向；之后按实际目标正常防御和扣生命。每位援护者每回合最多尝试一次，失败也付2法力；不取消其他目标，不折算避免伤害。'});
      interception={eventId:events.at(-1).id,protected:chosen.id,protectedName:chosen.name,guardian:guardian.id,success,cover:identity};if(stats[guardian.id]){stats[guardian.id].interceptAttempts=(stats[guardian.id].interceptAttempts||0)+1;stats[guardian.id].interceptMana=(stats[guardian.id].interceptMana||0)+INTERCEPTION.cost;if(success)stats[guardian.id].interceptions=(stats[guardian.id].interceptions||0)+1;}if(success)t=guardian;
     }
    }
    if(immuneToAttack(t,s.type)){emit('immune',t.name+' 免疫本次'+TYPES[s.type]+'攻击',u.id,[t.id],{cast,skill:r.skill,attackType:s.type,originalTarget:chosen.id,...(interception?{interception}:{}),reason:'实际受击者固有攻击类型免疫',costAlreadyPaid:true,consumedAction:true,actual:0,damage:0,rule:IMMUNITY_RULE});continue;}
    const profile=defenseProfile(t,s.type),mpBefore=t.mp;t.mp-=profile.cost;
    if(stats[t.id]){stats[t.id].defenses++;stats[t.id].defenseMana+=profile.cost;}
    const defenseMean=profile.mean,defense=roll(defenseMean);
    emit('defend',t.name+' 使用「'+profile.name+'」应对'+TYPES[s.type]+(profile.reason?'（'+profile.reason+'，回退自然防御）':''),t.id,[u.id],{cast,attackType:s.type,...(damageChannelTrace(s)?{damageType:damageTypeOf(s),damageChannel:damageChannelTrace(s)}:{}),...profile,roll:defense,mpBefore,mpAfter:t.mp});
    const grade=attack<=defense?'闪避':attack<=defense*1.5?'命中':attack<=defense*2.25?'重击':'致命';const multiplier={'闪避':0,'命中':1,'重击':1.25,'致命':1.5}[grade];
    if(s.manaDamage){const base=current(u,s.primary)/2+current(u,s.secondary)/3+lv/2,rolled=grade==='闪避'?0:roll(base*s.power),resistance=resistanceOf(t,damageTypeOf(s)),hit=manaDamageResult(rolled,multiplier,resistance,t.mp),hpBefore=t.hp;t.mp=hit.mpAfter;if(stats[u.id])stats[u.id].manaDamage=(stats[u.id].manaDamage||0)+hit.actual;
     emit('mana-damage',u.name+' → '+t.name+'：'+grade+'，实际削减 '+hit.actual+' 法力（生命不变）',u.id,[t.id],{cast,skill:r.skill,attackType:s.type,...(damageChannelTrace(s)?{damageType:damageTypeOf(s),damageChannel:damageChannelTrace(s)}:{}),attackMean:m,attack,defenseMean,defense,defenseProfile:profile,grade,skillLevel:lv,base,rolled,multiplier,armor:0,resistance,...hit,hpBefore,hpAfter:t.hp,resource:'mp',formula:`floor(${rolled} × ${multiplier} × (1 − ${resistance}/100))，按防御支付后的剩余法力截断`,rule:MANA_DAMAGE_RULE,sources:effectTrace(u),targetSources:effectTrace(t)});continue;}
    const damageType=damageTypeOf(s),channel=damageChannelTrace(s);const base=current(u,s.primary)/2+current(u,s.secondary)/3+lv/2,rolled=grade==='闪避'?0:roll(base*s.power),armorBefore=current(t,'armor'),armorIgnored=damageType==='mental'?Math.max(0,armorBefore):Math.min(Math.max(0,armorBefore),s.ignoreArmor||0),armor=damageType==='mental'?0:armorBefore-armorIgnored,resistance=resistanceOf(t,damageType),mitigation=damageResult(rolled,multiplier,armor,resistance),primaryDamage=grade==='闪避'?0:mitigation.damage,coating=activeCoating(u,s),parts=coating?coatedHit({damageType,base,rolled,multiplier,armorBefore,armorIgnored,armor,resistance,...mitigation,damage:primaryDamage},coating,{multiplier,armorBefore,ignoreArmor:s.ignoreArmor||0,resistance:resistanceOf(t,'magic'),hp:t.hp}):null,damage=parts?parts.damage:primaryDamage,actual=parts?parts.actual:Math.min(t.hp,damage),beforeHp=t.hp;t.hp-=actual;
    if(stats[u.id]){stats[u.id].damage+=damage;stats[u.id].actual+=actual;stats[u.id].overkill+=damage-actual;if(s.disarm)stats[u.id].mechanismDamage=(stats[u.id].mechanismDamage||0)+actual;}
    emit('attack',u.name+' → '+t.name+'：'+grade+(grade==='闪避'?'':'，'+damage+(s.disarm?' 耐久拆解':' 伤害')+(damage>actual?'（溢出 '+(damage-actual)+'）':'')),u.id,[t.id],{cast,skill:r.skill,attackMean:m,attack,attackType:s.type,...(channel?{damageType,damageChannel:channel}:{}),...(s.disarm?{mechanismHit:true}:{}),...(interception?{interception}:{}),defenseMean,defense,defenseProfile:profile,grade,skillLevel:lv,base,rolled,multiplier,armorBefore,armorIgnored,armor,...(s.type==='mental'&&!channel?{mentalRule:'心理攻击沿用法术栏防御；物理护甲不参与，只采用心理抗性。'}:{}),resistance,afterArmor:mitigation.afterArmor,unresisted:mitigation.unresisted,resistanceDelta:mitigation.unresisted-primaryDamage,...(parts?{primaryDamage,damageParts:parts.damageParts}:{}),damage,actual,overkill:damage-actual,hpBefore:beforeHp,hpAfter:t.hp,formula:parts?'各段 floor(max(0, 点数 × 同一命中倍率 − 该段护甲) × (1 − 该段抗性/100)) 之和；主段先按剩余生命截断':`floor(max(0, ${rolled} × ${multiplier} − ${armor}) × (1 − ${resistance}/100))`,sources:effectTrace(u),targetSources:effectTrace(t)});const healthDamageEventId=sequence;
    if(s.dispel){const removed=t.hp>0&&grade!=='闪避'?removableBuffs(t):[];if(removed.length){const attackEventId=events.at(-1).id;t.effects=t.effects.filter(e=>!removed.includes(e));emit('dispel',u.name+' 破除 '+t.name+' 的「'+removed[0].name+'」',u.id,[t.id],{cast,skill:r.skill,attackEventId,removed:removed.map(removedBuffRecord),rule:dispelRule(removed)});}else emit('dispel-skip',u.name+' 本次未破除增益',u.id,[t.id],{cast,skill:r.skill,attackEventId:events.at(-1).id,reason:t.hp<=0?'目标已倒下':grade==='闪避'?'本次法术被闪避':'没有可破除的技能增益',costAlreadyPaid:true,consumedAction:true});}
    if(t.hp===0){emit('down',t.name+(t.mechanism?' 已拆除。':' 倒下。'),u.id,[t.id],{cast,...(t.mechanism?{mechanism:true}:{} )});const downEventId=sequence;removeSummons(t.id,'主人倒下');if(t.mechanism)releaseWards(t,healthDamageEventId,downEventId);}
    else if(canApplyHealingBlock(s,grade,t)){
     const effect={id:`${roomIndex}:${cast}:${t.id}:healingBlock`,skill:r.skill,name:s.name,component:'禁疗',source:u.id,sourceName:u.name,stat:HEALING_BLOCK_STAT,value:1,scope:'rounds',active:true,harmful:true,activateTick:clock,activateRound:round,expires:round,expiresTick:clock};
     t.effects.push(effect);emit('effect',t.name+' 受到「禁疗」：本回合余下的自动草药救护受限，仍可执行普通指令',u.id,[t.id],{effectId:effect.id,cast,skill:r.skill,component:effect.component,stat:effect.stat,value:1,scope:'rounds',active:true,harmful:true,activateRound:round,expires:round,rule:'命中后仅限制本回合余下的自动草药救护；已完成治疗不撤销，不阻止普通指令，同回合不叠加或延长。',sources:effectTrace(u)});
    }
    if(t.hp>0&&s.weakening&&grade!=='闪避'){if(canWeaken(s,grade,t)){const effect={id:`${roomIndex}:${cast}:${t.id}:weakening`,skill:r.skill,name:s.name,component:WEAKENING.name,source:u.id,sourceName:u.name,stat:WEAKENING.stat,value:WEAKENING.value,scope:'rounds',active:true,harmful:true,activateTick:clock,activateRound:round,expires:round+WEAKENING.duration,expiresTick:clock+WEAKENING.duration};t.effects.push(effect);emit('effect',t.name+' 受到「挫志」：攻击技能等级-3，持续当前与下一回合',u.id,[t.id],{effectId:effect.id,cast,skill:r.skill,component:effect.component,stat:effect.stat,value:effect.value,scope:effect.scope,active:true,harmful:true,activateRound:round,expires:effect.expires,rule:'不叠加或刷新；只影响之后的攻击技能，不影响防御、辅助、救护或已经完成的检定；来源倒下不撤销，可在预备阶段净化。',sources:effectTrace(u)});}else {const effect=activeWeakening(t);emit('effect-blocked',t.name+' 已有挫志，本次不叠加或刷新；攻击照常付费',u.id,[t.id],{cast,skill:r.skill,effectId:effect.id,source:effect.source,component:effect.component,reason:'同名负面效果仍在',expires:effect.expires,consumedAction:true});}}
    if(s.focusMark&&grade!=='闪避'&&t.hp>0&&!liveFocusMarks(all(),u.side).length){const effect={id:`${roomIndex}:${cast}:${t.id}:focus`,skill:r.skill,name:s.name,component:'集火标记',source:u.id,sourceName:u.name,sourceSide:u.side,stat:FOCUS_STAT,value:1,scope:'rounds',active:true,harmful:true,activateTick:clock,activateRound:round,expires:round+1,expiresTick:clock+1};t.effects.push(effect);emit('effect',t.name+' 被猎令指认：后续合法单体攻击优先',u.id,[t.id],{effectId:effect.id,cast,skill:r.skill,component:effect.component,stat:effect.stat,value:1,scope:effect.scope,active:true,harmful:true,sourceSide:u.side,activateRound:round,expires:effect.expires,rule:FOCUS_RULE});}
    if(s.actionDamp&&grade!=='闪避'&&t.hp>0&&!existingOffbeat(t)){const effect={id:`${roomIndex}:${cast}:${t.id}:offbeat`,skill:r.skill,name:s.name,component:OFFBEAT.name,source:u.id,sourceName:u.name,stat:OFFBEAT.stat,value:OFFBEAT.limit,scope:'rounds',harmful:true,active:false,activateTick:clock+1,activateRound:round+1,expires:round+1,expiresTick:clock+1};t.effects.push(effect);emit('effect',t.name+' 附着迟拍：下一回合少排至多1次额外行动',u.id,[t.id],{effectId:effect.id,cast,skill:r.skill,component:effect.component,stat:effect.stat,value:effect.value,scope:effect.scope,harmful:true,active:false,activateRound:effect.activateRound,expires:effect.expires,rule:OFFBEAT_RULE});}
    if(s.corrosion&&grade!=='闪避'&&t.hp>0){const prior=corrosionOn(t);if(prior)emit('effect-blocked',t.name+' 已有潮蚀，不叠加或刷新',u.id,[t.id],{cast,skill:r.skill,effectId:prior.id,source:prior.source,component:CORROSION.name,reason:'同名负面效果仍在',expires:prior.expires,consumedAction:true});else{const effect={id:`${roomIndex}:${cast}:${t.id}:corrosion`,skill:r.skill,name:s.name,component:CORROSION.name,source:u.id,sourceName:u.name,stat:CORROSION.stat,value:CORROSION.value,scope:'rounds',harmful:true,active:false,activateTick:clock+1,activateRound:round+1,expires:round+CORROSION.duration,expiresTick:clock+CORROSION.duration};t.effects.push(effect);emit('effect',t.name+' 附着潮蚀：之后两个回合开始结算法术抗性持续伤害',u.id,[t.id],{effectId:effect.id,cast,skill:r.skill,component:effect.component,stat:effect.stat,value:effect.value,scope:effect.scope,harmful:true,active:false,activateRound:effect.activateRound,expires:effect.expires,rule:'之后两个回合开始各按基值6和当时法术抗性结算；不再攻防检定、不重复收费、不叠加刷新，可净化；来源倒下仍保留，房间结束清理。'});}}
    if(t.side==='enemy'&&actual>0)reactHealth(t,healthDamageEventId);
   }actionId=null;for(const enemy of enemies)awaken(enemy);return true;
  }
  function act(u,p){
   const trace=p==='main'&&u.skills?.heal!==undefined?healingDecision(u,all(),u.side==='party'?supplies:enemySupplies):null,start=events.length;
   try {
   if(p==='main'&&u.side==='enemy'&&channelStep(u,round)){
    const step=channelStep(u,round),spec=u.windup;actionId=null;
    if(step==='start'){
     const s=SKILLS[spec.skill],payment=commandCost(u,spec),targets=chooseTargets(u,all(),s,spec.target,()=>0),reason=u.mp<payment.mana?'法力不足':payment.resource&&enemySupplies[payment.resource]<payment.amount?'敌方耗材不足':s.requiresGear&&!gearSupports(u.gear,s.requiresGear)?'装备条件不满足':!targets.length?'没有合法目标':null;
     if(reason){u.windupFinished=true;emit('windup-cancel',u.name+' 未能开始蓄能：'+reason,u.id,[],{channel:{status:'未开始',startRound:round,releaseRound:round+spec.rounds,paidMana:0,paidAmount:0,reason},cost:0,consumedAction:false,rule:CHANNEL_RULE});}
     else{const mpBefore=u.mp,stockBefore=payment.resource?enemySupplies[payment.resource]:null;u.mp-=payment.mana;if(payment.resource)enemySupplies[payment.resource]-=payment.amount;u.channel={skill:spec.skill,target:spec.target,startRound:round,releaseRound:round+spec.rounds,sourceEventId:sequence+1,paidMana:payment.mana,resource:payment.resource||null,paidAmount:payment.resource?payment.amount:0};emit('windup-start',u.name+' 开始蓄能「'+s.name+'」，最早第'+u.channel.releaseRound+'回合释放',u.id,[],{channel:{...clone(u.channel),status:'开始'},mpBefore,mpAfter:u.mp,stockBefore,stockAfter:payment.resource?enemySupplies[payment.resource]:null,cost:payment.mana,consumedAction:true,rule:CHANNEL_RULE});return;}
    }else if(step==='hold'){emit('windup-hold',u.name+' 继续蓄能，本次普通行动不进攻',u.id,[],{channel:{...clone(u.channel),status:'维持'},cost:0,consumedAction:true,rule:CHANNEL_RULE});return;}
    else {const paid=clone(u.channel);delete u.channel;u.windupFinished=true;const ok=attempt(u,{skill:spec.skill,target:spec.target,mode:'repeat'},u.id+':windup',false,paid);if(!ok)emit('windup-cancel',u.name+' 释放时失去合法条件，蓄能取消',u.id,[],{channel:{...paid,status:'取消',reason:'释放时失去合法目标或装备条件'},cost:0,consumedAction:true,rule:CHANNEL_RULE});return;}
   }
   if(p==='main'&&useItem(u)){if(trace)trace.status='item_priority';return;}
   if(p==='main'&&u.healing?.enabled){const h=u.healing,t=chooseTargets(u,all(),SKILLS.heal,h.target,rng)[0],skill=trace?.groupAid?.chosenSkill||'heal';if(t&&t.hp/t.maxHp<=h.threshold){if(attempt(u,{skill,target:h.target,mode:'repeat'},u.id+':heal',true))return;}}
   const rows=u[p]||[],key=u.id+':'+p+(u.healthPhaseIndex?':health-phase:'+u.healthPhaseIndex:'');if(rows.some(r=>r.mode==='round'||r.roundWindow||r.minTargets||r.onlyPosition)&&roundCursors.get(key)!==round){cursors.set(key,0);roundCursors.set(key,round);}let at=cursors.get(key)||0;
   for(let i=0;i<rows.length;i++){const r=rows[at],ok=attempt(u,r,key+':'+at);const next=ok&&r.mode==='repeat'?at:(at+1)%rows.length;cursors.set(key,next);at=next;if(ok)return;}
   const automatic=p==='main'&&u.side==='party'&&u.automaticAction===true?automaticDecision(u,rows,{level:skillLevel,probe:(r,payment)=>{const s=SKILLS[r.skill],stock=supplies;if(s.requiresGear&&!gearSupports(u.gear,s.requiresGear))return'装备条件不满足';if(u.mp<payment.mana)return'法力不足';if(payment.resource&&stock[payment.resource]<payment.amount)return'耗材耗尽';if(reserveBlock(c,roomIndex,u,s,stock,payment))return'事件预留不足';return chooseTargets(u,all(),s,r.target,()=>0,r).length?'':'没有合法目标（阵位、免疫、机关或技能资格）';}}):null;
   if(automatic)automatic.configuredFailures=events.slice(start).filter(e=>e.type==='skip'&&e.actor===u.id&&automatic.configuredSkills.includes(e.detail.skill)).map(e=>({eventId:e.id,skill:e.detail.skill,reason:e.detail.reason}));
   if(automatic?.selected){const from=events.length;if(attempt(u,automatic.selected.row,key+':automatic:'+automatic.selected.skill,false,null,automatic)){const outcome=events.slice(from).find(e=>e.type==='cast'&&e.actor===u.id);if(outcome)for(const f of automatic.configuredFailures){const source=events.find(e=>e.id===f.eventId);source.detail.automaticOutcome={eventId:outcome.id,skill:outcome.detail.skill};}return;}}
   if(p==='main'){if(stats[u.id])stats[u.id].failed++;emit('failed',u.name+' 无法执行任何行动。',u.id,[],{consumedAction:true,automaticAttack:false,...(automatic?{automaticAction:clone(automatic)}:{})});}
   } finally {const emittedAction=events.slice(start),mechanismSkips=emittedAction.filter(e=>e.type==='skip'&&e.detail.mechanismSelection);if(mechanismSkips.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of mechanismSkips)e.detail.mechanismOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const reserved=emittedAction.filter(e=>e.type==='skip'&&e.detail.reservation);if(reserved.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of reserved)e.detail.reserveOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const manaFloorSkips=emittedAction.filter(e=>e.type==='skip'&&e.detail.manaFloor?.blocked);if(manaFloorSkips.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of manaFloorSkips)e.detail.manaFloorOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const floorSkips=emittedAction.filter(e=>e.type==='skip'&&e.detail.stockFloor?.blocked);if(floorSkips.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of floorSkips)e.detail.stockOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const scheduled=emittedAction.filter(e=>e.type==='skip'&&e.detail.schedule);if(scheduled.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of scheduled)e.detail.scheduleOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const countSkips=emittedAction.filter(e=>e.type==='skip'&&e.detail.targetCount?.blocked);if(countSkips.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of countSkips)e.detail.targetCountOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const positionSkips=emittedAction.filter(e=>e.type==='skip'&&e.detail.positionOnly?.blocked);if(positionSkips.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of positionSkips)e.detail.positionOnlyOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}const immuneSkips=emittedAction.filter(e=>e.type==='skip'&&e.detail.attackImmunity);if(immuneSkips.length){const outcome=emittedAction.find(e=>['cast','item','wait','failed'].includes(e.type));for(const e of immuneSkips)e.detail.immunityOutcome=outcome?{eventId:outcome.id,type:outcome.type,skill:outcome.detail.skill||null}:{eventId:null,type:'no-preparation',skill:null};}if(trace){const emitted=events.slice(start),entry=emitted.find(e=>['cast','item','failed','wait'].includes(e.type))||emitted[0];if(emitted.some(e=>e.type==='heal'&&e.actor===u.id))trace.status='healed';if(entry)entry.detail.healingDecision=clone(trace);}}
  }
  function closeRound(){phase='回合结束';for(const u of all()){const expired=u.effects.filter(e=>e.scope==='rounds'&&e.expiresTick<=clock);u.effects=u.effects.filter(e=>!expired.includes(e));for(const e of expired)emit('expire',u.name+' 的「'+e.name+(e.component!==e.name?' · '+e.component:'')+'」到期',e.source,[u.id],{scope:e.scope,component:e.component,stat:e.stat});}if(heroesAlive()&&!live('enemy').length&&hasMoreWaves()&&!pendingWave){emit('wave-clear','第'+(waveIndex+1)+'波已清；仍有公开增援，下回合继续。',null,[],{wave:{index:waveIndex+1,total:waves.length,name:waves[waveIndex].name,nextName:waves[waveIndex+1].name,rule:WAVE_RULE}});lastWaveClear=events.at(-1).id;clearedWaves.push({index:waveIndex+1,eventId:lastWaveClear,round});pendingWave=true;}}
  let withdrawal=null;const maxRounds=c.expedition==='scarcity'?Math.min(options.maxRounds??24,roomTimeBudget(c,room.id)):(options.maxRounds??24);
  for(round=1;round<=maxRounds&&heroesAlive()&&!escortLost()&&(live('enemy').length||hasMoreWaves());round++){
   clock++;phase='回合开始';emit('round','第 '+round+' 回合');
   for(const u of all())for(const e of u.effects)if(e.active===false&&e.activateTick<=clock){e.active=true;emit('activate',u.name+' 的「'+e.name+(e.component!==e.name?' · '+e.component:'')+'」开始生效',e.source,[u.id],{component:e.component,stat:e.stat,value:e.value,expires:e.expires,...(e.harmful?{harmful:true}:{})});}
   for(const u of all())for(const effect of regenerationTicks(u)){
    const before=u.hp,actual=Math.min(u.maxHp-before,effect.value);u.hp+=actual;
    if(stats[effect.source])stats[effect.source].healing+=actual;
    emit('heal',u.name+' 的「'+effect.name+'」缓释恢复 '+actual+' 生命'+(effect.value>actual?'（未生效 '+(effect.value-actual)+'）':''),effect.source,[u.id],{skill:effect.skill,effectId:effect.id,passive:true,before,after:u.hp,actual,overheal:effect.value-actual,consumedAction:false,cost:0,sources:[{effectId:effect.id,source:effect.source,name:effect.name,component:effect.component,stat:effect.stat,value:effect.value}],rule:'回合开始缓释，不消耗普通行动或再次扣材料；不复活倒下者，不受仅限制自动草药救护的禁疗影响。'});
   }
   for(const u of all())for(const effect of corrosionTicks(u)){
    if(u.hp<=0)break;if(immuneToAttack(u,'magic')){emit('immune',u.name+' 的法术免疫阻止本次潮蚀',effect.source,[u.id],{effectId:effect.id,skill:effect.skill,attackType:'magic',passive:true,base:effect.value,actual:0,damage:0,costAlreadyPaid:false,consumedAction:false,reason:'固有法术免疫，本次潮蚀不扣生命；旧效果仍按原期限结束',rule:IMMUNITY_RULE});continue;}const hpBefore=u.hp,resistance=resistanceOf(u,'magic'),damage=Math.floor(effect.value*(1-resistance/100)),actual=Math.min(hpBefore,damage);u.hp-=actual;actionId=`tick:${clock}:${effect.id}`;
    if(stats[effect.source]){stats[effect.source].damage+=damage;stats[effect.source].actual+=actual;stats[effect.source].overkill+=damage-actual;}
    emit('harm',u.name+' 受到潮蚀 '+actual+' 持续伤害',effect.source,[u.id],{skill:effect.skill,effectId:effect.id,passive:true,base:effect.value,resistanceType:'magic',resistance,damage,actual,overkill:damage-actual,hpBefore,hpAfter:u.hp,consumedAction:false,cost:0,sources:[corrosionSource(effect)],rule:'回合开始在缓释恢复之后结算；按当前法术抗性，不重掷攻防、不用物理护甲、不重复扣材料或消耗普通行动。净化不能撤销已发生伤害。'});
    const healthDamageEventId=sequence;
    if(u.hp===0){emit('down',u.name+' 因潮蚀倒下。',effect.source,[u.id],{effectId:effect.id,passive:true});removeSummons(u.id,'主人倒下');}else if(u.side==='enemy'){awaken(u);if(actual>0)reactHealth(u,healthDamageEventId);}actionId=null;
   }
   if(pendingWave&&heroesAlive()&&!live('enemy').length){waveIndex++;pendingWave=false;enemies=waves[waveIndex].enemies.map(u=>({...u,effects:[],side:'enemy'}));emit('reinforcement','第'+(waveIndex+1)+'波增援抵达：'+waves[waveIndex].name,null,enemies.map(u=>u.id),{wave:{index:waveIndex+1,total:waves.length,name:waves[waveIndex].name,sourceEventId:lastWaveClear,arrivals:enemies.map(u=>({id:u.id,name:u.name,pos:u.pos,hp:u.hp,mp:u.mp})),enemySupplies:clone(enemySupplies),rule:WAVE_RULE}});establishWards(waveIndex);}
   if(escortLost()){closeRound();continue;}
   if(!heroesAlive()||!live('enemy').length){if(heroesAlive()&&hasMoreWaves())closeRound();continue;}
   withdrawal=withdrawalDecision(c,party,live('enemy'));if(withdrawal){phase='撤退';emit('withdraw','按战前计划整队撤退：'+withdrawal.alive.length+'名正式队员仍存活。',null,[],{withdrawal});break;}
   phase='回合前';const ordered=[...(c.roomOrders[room.id]||c.prepOrder).map(id=>party.find(u=>u.id===id)).filter(Boolean),...enemies];for(const u of ordered)if(u.hp>0)act(u,'prep');
   phase='自然回复';for(const u of all().filter(u=>u.hp>0)){const before=u.mp,modifier=current(u,'manaRegen'),sources=effectTrace(u).filter(e=>e.stat==='manaRegen');if(modifier!==0||sources.length){const profile=manaRegenerationProfile(u,modifier,sources);u.mp=profile.after;emit('regen',u.name+' 自然法力变化 '+(profile.actual>=0?'+':'')+profile.actual,u.id,[u.id],{before,after:u.mp,manaRegeneration:profile,consumedAction:false,cost:0});}else{u.mp=Math.min(u.maxMp,u.mp+1);if(u.mp!==before)emit('regen',u.name+' 自然回复 1 法力',u.id,[],{before,after:u.mp});}}
   phase='先攻';const order=[],actionLimits=[];for(const u of all().filter(u=>u.hp>0&&!u.escort)){const decision=ordinaryActionDecision(u);if(decision.trace)actionLimits.push(decision.trace);const agi=current(u,'agi'),per=current(u,'per'),actions=decision.actions,initiative=initiativeProfile(u,{current,mean,skillBreakdown});if(initiative){u.mp=initiative.mpAfter;if(stats[u.id]&&initiative.cost>0)stats[u.id].initiativeMana=(stats[u.id].initiativeMana||0)+initiative.cost;emit('initiative-check',u.name+' '+(initiative.reason?'回退自然先攻':'采用先觉先攻'),u.id,[u.id],{initiative,cost:initiative.cost,mpBefore:initiative.mpBefore,mpAfter:initiative.mpAfter,consumedAction:false});}const average=initiative?initiative.mean:2*agi+per,base=roll(average),count=decision.count;for(let i=0;i<count;i++)order.push({u,value:base/(1+i*.6),ordinal:i+1,total:count,agi,per,actions,mean:average,base,...(initiative?{initiative}:{})});}
   order.sort((a,b)=>b.value-a.value);emit('initiative','本回合行动队列已确定',null,[],{policy:'原创衰减：基础先攻 ÷ (1 + 0.6 × 已排行动数)',...(actionLimits.length?{actionLimits}:{}),order:order.map(e=>({actor:e.u.name,actorId:e.u.id,value:e.value,ordinal:e.ordinal,total:e.total,agi:e.agi,per:e.per,actions:e.actions,mean:e.mean,base:e.base,...(e.initiative?{initiative:e.initiative}:{}),sources:effectTrace(e.u).filter(s=>(e.initiative?.chosen==='foresight'?['int','per','actions','extraActionLimit']:['agi','per','actions','extraActionLimit']).includes(s.stat))}))});
   phase='主行动';for(const e of order){if(!heroesAlive()||escortLost()||!live('enemy').length)break;if(e.u.hp>0)act(e.u,'main');}
   closeRound();
  }
  round=withdrawal?round:Math.min(round-1,maxRounds);const won=heroesAlive()&&!escortLost()&&!hasMoreWaves()&&live('enemy').length===0;phase='房间结算';for(const u of enemies)cancelChannel(u,'房间结束');removeSummons(null,'房间结束');
  for(const u of [...party,...escorts]){const expired=u.effects.filter(e=>e.scope!=='expedition');u.effects=u.effects.filter(e=>e.scope==='expedition');for(const e of expired)emit('expire',u.name+' 的「'+e.name+'」随战斗结束',e.source,[u.id],{scope:e.scope,component:e.component,stat:e.stat});}
  results.push({...(escorts.length?{escort:escortOutcome(escorts),...(escortLost()?{stopReason:'护送对象倒下'}:{})}:{}),...(waves.length>1?{waves:{total:waves.length,entered:waveIndex+1,remaining:waves.length-waveIndex-1,completed:clearedWaves.length+(won?1:0),cleared:clearedWaves,...(won?{lastCleared:waveIndex+1}:{})},...(!won&&!withdrawal&&heroesAlive()?{stopReason:'达到回合上限，仍有未完成波次'}:{})}:{}),...(withdrawal?{stopReason:'按计划撤退',withdrawal:clone(withdrawal)}:{}),...(c.expedition==='shoals'?{id:room.id,node:room.node,note:room.note}:{}),...((courierPath||courierRelay)?{id:room.id,path:courierRelay?'relay':courierPath.decision.chosen,note:room.note}:{}),...((foundryPass||foundryVault)?{id:room.id,path:foundryVault?'cooled':foundryPass.decision.chosen,note:room.note}:{}),...(c.expedition==='harbor'?{id:room.id,node:room.node,note:room.note}:{}),...(c.expedition==='scarcity'?{roundLimit:maxRounds,...(!withdrawal?{stopReason:won?null:heroesAlive()?'潮水封路':'全员倒下'}:{})}:{}),name:room.name,won,rounds:round,survivors:party.filter(u=>u.hp>0).length,hp:party.reduce((n,u)=>n+u.hp,0),mp:party.reduce((n,u)=>n+u.mp,0),supplies:clone(supplies)});emit(won?'victory':'defeat',won?'房间肃清，整队继续前进。':'远征停止：'+(escortLost()?'护送对象倒下。':withdrawal?'按战前计划整队撤退；仍存活'+withdrawal.alive.length+'人。':heroesAlive()?(c.expedition==='scarcity'?'潮水封路，未在 '+maxRounds+' 回合内清场。':'达到回合上限。'):'队伍全员倒下。'),null,[],withdrawal?{withdrawal}:escorts.length?{escort:escortOutcome(escorts)}:{});
  summons=[];if(!won)break;
 }
 return {version:VERSION,ruleset:RULESET,config:clone(c),...(escorts.length?{escorts:clone(escorts)}:{}),events,rooms:results,stats,party:clone(party),supplies,won:results.length===rooms.length&&results.every(r=>r.won)};
}
