import {groupAidLabel} from './expedition-group-aid.mjs';
import {targetCountLabel} from './expedition-target-count.mjs';
import {scheduleLabel} from './expedition-schedule.mjs';
import {GOALS} from './expedition-goal-data.mjs';
import {stockFloorLabel} from './expedition-stock-floor.mjs';
import {mediumLabel} from './expedition-media-data.mjs';
import {shoalsChartId} from './expedition-shoals.mjs';
import {COURIER_PASSES,courierPass} from './expedition-courier.mjs';
import {foundryApproach,FOUNDRY_APPROACHES} from './expedition-foundry.mjs';
import {ADVANCEMENTS} from './expedition-advancement-data.mjs';
import {HARBOR_RESERVE,harborReserve} from './expedition-harbor-reserve.mjs';
import {HARBOR_PASS,HARBOR_TASK,HARBOR_DIFFICULTY,harborDifficulty} from './expedition-harbor.mjs';
import {SLOTS} from './expedition-equipment.mjs';
import {HEAL_PRIORITIES} from './expedition-healing.mjs';
import {BELL_CHOICES,RESCUE_CHOICES} from './expedition-events.mjs';
// Read-only projections. Findings describe observations, never inferred combat causality.
import {ROLE_TARGETS,HEROES,ROOMS,POS,TYPES,DEFENSE_TYPES,SKILLS,GEAR,ATTR,DEFENSES,ITEMS,EXPEDITIONS,clone,migrateConfig,trainingOptions,roomsFor} from './expedition-data.mjs';
import {validate} from './expedition-engine.mjs';
const heroIds=new Set(HEROES.map(h=>h.id));
const heroName=id=>HEROES.find(h=>h.id===id)?.name||id;
export function reviewReport(report){
 return report.rooms.map((result,roomIndex)=>{
  const events=report.events.map((event,index)=>({...event,index})).filter(e=>e.roomIndex===roomIndex),findings=[];
  const add=(kind,title,fact,suggestion,evidence,hero)=>findings.push({id:`${roomIndex}:${kind}:${hero||findings.length}`,kind,title,fact,suggestion,eventIndex:evidence.index,hero:heroIds.has(hero)?hero:null,roomId:roomsFor(report.config)[roomIndex].id});
  if(result.stopReason==='潮水封路'){const e=events.find(e=>e.type==='defeat');if(e)add('deadline','潮水封路',`本房${result.roundLimit}回合用尽时仍未清场，队员存活不代表通过。`,'核对输出覆盖、抗性与材料；拾取会缩短第二房间限时，可与赶路对照。',e);}
  for(const h of HEROES){
   const deaths=events.filter(e=>e.type==='down'&&e.targets.includes(h.id));
   if(deaths.length)add('down',h.name+' 倒下',`第 ${deaths[0].round} 回合倒下。`, '查看此前承伤、防御和治疗时机，再尝试调整该房间的站位或保护。',deaths[0],h.id);
   const failed=events.filter(e=>e.type==='failed'&&e.actor===h.id);
   if(failed.length)add('failed',h.name+' 空过行动',`${failed.length} 个普通行动未执行任何技能。`,'检查附近的跳过记录，以及是否配置低消耗备用指令。',failed[0],h.id);
   const skips=events.filter(e=>e.type==='skip'&&e.actor===h.id&&['法力不足','耗材耗尽'].includes(e.detail.reason));
   if(skips.length)add('resource',h.name+' 资源不足',`${skips.length} 次指令检查因资源不足被跳过；这不等于空过行动次数。`,'检查法力、共享补给与备用指令；药瓶也会占用行动。',skips[0],h.id);
   const counts=events.filter(e=>e.type==='skip'&&e.actor===h.id&&e.detail.targetCount?.blocked);if(counts.length)add('target-count',h.name+' 群攻数量后备',`${counts.length}次检查因本条候选不足改查后备，不等于普通行动空过。`,'检查原先目标顺序中的实际候选与后备；不跨阵位凑数，也不保证省料后的行动更有利。',counts[0],h.id);
   const schedules=events.filter(e=>e.type==='skip'&&e.actor===h.id&&e.detail.schedule);if(schedules.length)add('schedule',h.name+' 回合窗口后备',`${schedules.length}次检查在配置窗口之外免费跳过；不等于普通行动空过。`,'核对实际后备行动和窗口；本房一次不会每回合重置，其他技能和自动救护仍照原规则。',schedules[0],h.id);
   const floorSkips=events.filter(e=>e.type==='skip'&&e.actor===h.id&&e.detail.stockFloor?.blocked);if(floorSkips.length)add('stock-floor',h.name+' 用料底线后备',`${floorSkips.length} 次检查因本条用后留存不足改查后备；当时仍有材料，这不等于缺料或普通行动空过。`,'查看原始余量、底线与实际后备；底线只限本条，其他指令和自动救护仍可用料，不代表物资已划归某人。',floorSkips[0],h.id);
   const gearSkips=events.filter(e=>e.type==='skip'&&e.actor===h.id&&e.detail.reason==='装备条件不满足');
   if(gearSkips.length)add('equipment',h.name+' 技能缺少装备',`${gearSkips.length} 次指令检查不满足装备条件；首次技能：${SKILLS[gearSkips[0].detail.skill].name}。`,'检查该技能要求的装备，或配置可用的备用指令。',gearSkips[0],h.id);
   const fallback=events.filter(e=>e.type==='defend'&&e.actor===h.id&&e.detail.reason);
   if(fallback.length)add('defense',h.name+' 防御回退',`${fallback.length} 次防御未能使用所选技能；首次原因：${fallback[0].detail.reason}。`,'核对装备条件与剩余法力，判断是否需要更节省的防御。',fallback[0],h.id);
  }
  for(const h of HEROES){const resisted=events.filter(e=>e.type==='attack'&&e.actor===h.id&&e.detail.resistanceDelta>0);if(resisted.length){const prevented=resisted.reduce((n,e)=>n+e.detail.resistanceDelta,0);add('resistance',h.name+' 的伤害被抗性削减',`${resisted.length} 次攻击被类型抗性减少共 ${prevented} 点结算伤害（含可能溢出部分，不等于少扣的生命）。`,'核对目标抗性，尝试改变目标、攻击类型或节省本房间资源；破甲不会抵消百分比抗性。',resisted[0],h.id);}}
  for(const e of events.filter(e=>e.type==='rescue'))add('rescue',e.text,e.detail.rule,'检查救援耗用药草与后续机关补给；此处收益不计入战斗治疗。',e,e.actor);
  for(const e of events.filter(e=>e.type==='route'))add('route',e.text,e.detail.rule,'可跳转到沉钟来源，核对末房变化是否符合队伍输出类型。',e);
  for(const e of events.filter(e=>e.type==='encounter'))add('encounter','沉钟机关 · '+BELL_CHOICES[e.detail.approach].name,e.detail.rule,'核对检定与进场资源；可从出发配置修改机关策略，再与绕过方案对照。',e,e.actor);
  const buckets=new Map();
  for(const e of events.filter(e=>e.type==='attack'&&heroIds.has(e.targets[0])&&e.detail.actual>0)){
   const target=e.units.find(u=>u.id===e.targets[0]),key=target.pos+':'+e.detail.attackType;
   if(!buckets.has(key))buckets.set(key,{pos:target.pos,type:e.detail.attackType,amount:0,hits:0,evidence:e});
   const b=buckets.get(key);b.amount+=e.detail.actual;b.hits++;if(e.detail.actual>b.evidence.detail.actual)b.evidence=e;
  }
  const pressure=[...buckets.values()].sort((a,b)=>b.amount-a.amount)[0];
  if(pressure)add('pressure',POS[pressure.pos]+'承伤集中',`本房间最大的“位置×攻击类型”承伤组合：${TYPES[pressure.type]}，${pressure.hits} 次有效受击，共 ${pressure.amount} 实扣生命。`, '先查看最大一次受击；分散站位、提高对应防御或集中辅助都可尝试，需重新对照验证。',pressure.evidence,pressure.evidence.targets[0]);
  const summonOwners=new Map();for(const e of events.filter(e=>e.type==='summon'&&!heroIds.has(e.actor))){const group=summonOwners.get(e.actor)||[];group.push(e);summonOwners.set(e.actor,group);}
  for(const group of summonOwners.values())if(group.length>=2){const e=group[0];add('summon','敌方多次召唤',`${e.units.find(u=>u.id===e.actor)?.name||'敌方'} 在本房间召出 ${group.length} 名单位。`,'检查召唤来源；优先攻击主人可能减少后续召唤，但首领阶段召唤与常规补召需要区分。',e,'b');}
  const own=e=>heroIds.has(e.actor)||heroIds.has(e.units.find(u=>u.id===e.actor)?.owner);
  const metrics={damageTaken:events.filter(e=>e.type==='attack'&&heroIds.has(e.targets[0])).reduce((n,e)=>n+e.detail.actual,0),healing:events.filter(e=>e.type==='heal'&&own(e)).reduce((n,e)=>n+e.detail.actual,0),items:events.filter(e=>e.type==='item'&&heroIds.has(e.actor)).length,failed:events.filter(e=>e.type==='failed'&&heroIds.has(e.actor)).length,defenseMana:events.filter(e=>e.type==='defend'&&heroIds.has(e.actor)).reduce((n,e)=>n+e.detail.cost,0)};
  return {roomIndex,roomId:roomsFor(report.config)[roomIndex].id,...clone(result),metrics,findings};
 });
}
const canonical=x=>JSON.stringify(x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(canonical(x[k]))])):Array.isArray(x)?x.map(v=>JSON.parse(canonical(v))):x);
const commandText=rows=>rows.length?rows.map(r=>`${SKILLS[r.skill].name}${mediumLabel(r)}${stockFloorLabel(r)}${scheduleLabel(r)}${targetCountLabel(r)}→${POS[r.target]||ROLE_TARGETS[r.target]||({self:'自身',all:'全队',priority:'按个人阵位优先',supportPriority:'按辅助阵位优先'}[r.target])}（${{round:'每回合一次',repeat:'持续',cycle:'轮换',once:'一次'}[r.mode]}）`).join('；'):'无指令';
function format(key,value){
 if(['attackOrder','supportOrder'].includes(key))return value===undefined?'默认阵位顺序':value.map(pos=>POS[pos]).join(' → ');
 if(key==='objective')return GOALS.find(g=>g.id===value)?.name||'自由探索';
 if(key==='courierPass')return COURIER_PASSES[value];
 if(key==='foundryFlow')return value==='cooling-1'?'启用潮渠引流':'保留原出口';
 if(key==='advancement'&&!value)return '未选择';
 if(value===undefined)return '继承默认';
 if(key==='harborReserve')return HARBOR_RESERVE[value];if(key==='harborDifficulty')return HARBOR_DIFFICULTY[value];if(key==='harborPass')return HARBOR_PASS[value];if(key==='harborTask')return HARBOR_TASK[value];
 if(key==='foundryApproach')return FOUNDRY_APPROACHES[value];
 if(key==='rescueApproach')return RESCUE_CHOICES[value].name;
 if(key==='bellApproach')return BELL_CHOICES[value].name;
 if(['prep','main'].includes(key))return commandText(value);
 if(['prepOrder','roomOrder'].includes(key))return value.map(heroName).join(' → ');
 if(key==='defenses')return Object.entries(DEFENSE_TYPES).map(([k,label])=>label+'：'+DEFENSES[value[k]].name).join('；');
 if(key==='healing')return `${HEAL_PRIORITIES[value.priority||'lowest']} / ${value.enabled?'开启':'关闭'} / ${value.threshold*100}% / ${POS[value.target]||({all:'全队',self:'自身'}[value.target])}${groupAidLabel(value)}`;
 if(key==='itemPolicy')return `${value.enabled?'开启':'关闭'} / ${value.threshold*100}%`;
 const lookup={advancement:ADVANCEMENTS,pos:POS,gear:GEAR,trained:SKILLS,attribute:ATTR,defenseFocus:DEFENSES,item:ITEMS,expedition:EXPEDITIONS}[key];
 if(lookup){const v=lookup[value];return typeof v==='object'?v.name:v;}
 return String(value);
}
export const describeConfigValue=(key,value)=>format(key,value);
export function configurationChanges(a,b){
 const roomLabels=a.expedition===b.expedition?roomsFor(a).map(r=>({id:r.id,name:r.name})):[...new Set([...roomsFor(a),...roomsFor(b)].map(r=>r.id))].map(id=>({id,name:'房间槽 '+id}));
 const knownRooms=new Set(roomLabels.map(r=>r.id));for(const id of [...Object.keys(a.roomOrders),...Object.keys(b.roomOrders),...[...a.heroes,...b.heroes].flatMap(h=>Object.keys(h.overrides))])if(!knownRooms.has(id)){knownRooms.add(id);roomLabels.push({id,name:'其他房间槽 '+id});}
 const changes=[],labels={supportOrder:'辅助阵位优先',attackOrder:'远攻阵位优先',advancement:'后期职业进阶',pos:'站位',gear:'装备',trained:'技能专修',attribute:'属性专长',defenseFocus:'防御专修',item:'携带道具',prep:'预备指令',main:'普通指令',healing:'治疗策略',defenses:'防御技能',itemPolicy:'道具策略'};
 const compare=(label,key,x,y)=>{if(canonical(x??null)!==canonical(y??null))changes.push({label,before:format(key,x),after:format(key,y)});};
 if(a.expedition==='harbor'||b.expedition==='harbor'){compare('港口符纸预留','harborReserve',harborReserve(a),harborReserve(b));compare('港口难度','harborDifficulty',harborDifficulty(a),harborDifficulty(b));compare('港口通路策略','harborPass',a.harbor?.pass,b.harbor?.pass);compare('港口事件策略','harborTask',a.harbor?.task,b.harbor?.task);}
 if(a.expedition==='shoals'||b.expedition==='shoals')compare('漂礁海图编号','shoalsChart',shoalsChartId(a),shoalsChartId(b));
 if(a.expedition==='courier'||b.expedition==='courier')compare('邮路第二场通路','courierPass',courierPass(a),courierPass(b));
 if(a.expedition==='foundry'||b.expedition==='foundry'){compare('铸库第二场通路','foundryApproach',foundryApproach(a),foundryApproach(b));compare('铸库通路出口','foundryFlow',a.foundryFlow,b.foundryFlow);}
 compare('回廊救援策略','rescueApproach',a.rescueApproach,b.rescueApproach);
 compare('沉钟机关策略','bellApproach',a.bellApproach,b.bellApproach);
 if(a.objective||b.objective)compare('攻略目标','objective',a.objective,b.objective);
 compare('远征路线','expedition',a.expedition,b.expedition);compare('种子','seed',a.seed,b.seed);compare('默认协作顺序','prepOrder',a.prepOrder,b.prepOrder);
 for(const key of ['herb','rune','arrow'])compare({herb:'药草',rune:'符纸',arrow:'箭矢'}[key],key,a.supplies[key],b.supplies[key]);
 for(const room of roomLabels)compare(room.name+' / 协作顺序','roomOrder',a.roomOrders[room.id],b.roomOrders[room.id]);
 for(const h of HEROES){const x=a.heroes.find(u=>u.id===h.id),y=b.heroes.find(u=>u.id===h.id);if(!x||!y){if(x||y)changes.push({label:h.name+' / 出战',before:x?'出战':'未出战',after:y?'出战':'未出战'});continue;}for(const slot of Object.keys(SLOTS))compare(h.name+' / '+SLOTS[slot],'gear',x.gear[slot],y.gear[slot]);for(const key of Object.keys(labels).filter(k=>k!=='gear'))compare(h.name+' / 默认'+labels[key],key,x[key],y[key]);for(const [key,option] of Object.entries(trainingOptions(h.id)))compare(h.name+' / 训练 / '+option.name,'rank',x.training[key]||0,y.training[key]||0);for(const room of roomLabels)for(const key of ['supportOrder','attackOrder','pos','prep','main','healing','defenses','itemPolicy'])compare(h.name+' / '+room.name+' / '+labels[key],key,x.overrides[room.id]?.[key],y.overrides[room.id]?.[key]);}
 return changes;
}
export function readPlans(raw){
 if(raw===null)return {plans:[],rejected:0};
 const parsed=JSON.parse(raw);if(parsed?.version!==1||!Array.isArray(parsed.plans)||parsed.plans.length>12)throw Error('方案存档格式无效');
 const plans=[],seen=new Set();let rejected=0;
 for(const p of parsed.plans){try{if(!p||typeof p.id!=='string'||!p.id||seen.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40)throw Error('方案信息无效');const config=migrateConfig(p.config);validate(config);plans.push({id:p.id,name:p.name,config});seen.add(p.id);}catch{rejected++;}}
 return {plans,rejected};
}
export function storePlan(plans,{id,name,config},replace=false){
 const clean=name.trim();if(!clean||clean.length>40)throw Error('方案名称须为1–40字');validate(config);
 const at=plans.findIndex(p=>p.id===id);if(replace&&at<0)throw Error('请先选择一个方案');if(!replace&&(at>=0||plans.length>=12))throw Error('最多保存12个方案；可选择已有方案更新');
 const next=clone(plans),p={id,name:clean,config:clone(config)};if(replace)next[at]=p;else next.push(p);return next;
}
