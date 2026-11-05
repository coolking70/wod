import {hasSummoningSkill} from './expedition-summons.mjs';
import {COURIER_ROOMS,COURIER_KEEL} from './expedition-courier.mjs';
import {harborNodes,HARBOR_NODES} from './expedition-harbor.mjs';
import {healingReason} from './expedition-healing.mjs';
import {HEROES,roomsFor,SKILLS} from './expedition-data.mjs';
// Prefix-only projection: never reads events after the selected replay snapshot.
export function careTimeline(report,unitId,eventId,limit=12){
 const end=report.events.findIndex(e=>e.id===eventId);if(end<0)return null;
 const now=report.events[end],unit=now.units.find(u=>u.id===unitId);if(!unit||!HEROES.some(h=>h.id===unitId))return null;
 const rows=[],medics=new Set(report.config.heroes.filter(h=>HEROES.find(t=>t.id===h.id)?.skills.includes('heal')).map(h=>h.id));
 for(const e of report.events.slice(0,end+1)){
  if(e.roomIndex!==now.roomIndex)continue;
  const d=e.detail||{},target=e.targets.includes(unitId),snapshot=e.units.find(u=>u.id===unitId);
  let kind=null,detail='';
  if(e.type==='attack'&&target){kind='damage';detail=`HP ${d.hpBefore} → ${d.hpAfter}；${d.defenseProfile?.name||'自然防御'}：${d.defense} 对攻击 ${d.attack}；护甲 ${d.armor} / 抗性 ${d.resistance||0}%；实扣 ${d.actual}`;if(d.defenseProfile?.reason)detail+='；回退原因：'+d.defenseProfile.reason;}
  else if(e.type==='heal'&&target){kind='heal';detail=`${d.passive?'缓释恢复（不占普通行动）':'有效治疗'} ${d.actual} / 未生效 ${d.overheal}；HP ${snapshot.hp-d.actual} → ${snapshot.hp}`;}
  else if(e.type==='item'&&e.actor===unitId&&d.resource==='hp'){kind='heal';detail=`自用药匣；HP ${d.before} → ${d.after}；占用本人行动`;}
  else if(e.type==='down'&&target){kind='down';detail='HP 0；倒下后无法行动，也不会随换房复活。';}
  else if(medics.has(e.actor)&&['cast','item','failed','wait'].includes(e.type)){
   kind='medic';detail=`药师实际行动；此时${unit.name} HP ${snapshot?.hp??'未知'}。`;
   if(e.type==='cast'&&d.skill==='heal')detail+='治疗对象：'+e.targets.map(id=>e.units.find(u=>u.id===id)?.name||id).join('、');
  }
  if(d.healingDecision){kind=kind||'medic';detail+=(detail?'；':'')+healingReason(d.healingDecision);}
  if(kind)rows.push({eventId:e.id,round:e.round,phase:e.phase,kind,text:e.text,detail,...(d.healingDecision?{decision:d.healingDecision}:{})});
 }
 return {unit:unit.name,roomIndex:now.roomIndex,eventId,hp:unit.hp,maxHp:unit.maxHp,total:rows.length,rows:rows.slice(-limit)};
}
export function healingActivity(report){
 const ids=new Set(report.config.heroes.map(h=>h.id)),heals=report.events.filter(e=>e.type==='heal'&&ids.has(e.actor));
 return {actual:heals.reduce((n,e)=>n+e.detail.actual,0),ordinaryActions:heals.filter(e=>!e.detail.passive).length,passiveRecords:heals.filter(e=>e.detail.passive).length};
}
export function enemyBadge(config,unit){
 if(unit.side!=='enemy')return null;
 if(unit.owner||unit.summoned)return {kind:'summon',label:'召唤',symbol:'◇'};
 const template=(config.expedition==='courier'?[...COURIER_ROOMS,COURIER_KEEL]:config.expedition==='harbor'?Object.values(harborNodes(config)):roomsFor(config)).flatMap(r=>r.enemies).find(u=>u.id===unit.id);
 if(template?.skills.mireflask!==undefined)return {kind:'magic',label:'蚀潮施法',symbol:'蚀'};
 if(template?.skills.unravel!==undefined)return {kind:'magic',label:'破印者',symbol:'解'};
 if(['palisade','harbor','hospice','chapter','seasoned','veteran'].includes(config.expedition)&&template?.skills.heal!==undefined)return {kind:'magic',label:'治疗支援',symbol:'药'};
 if(['harbor','hospice','chapter','seasoned','veteran'].includes(config.expedition)&&hasSummoningSkill(template))return {kind:'magic',label:'召唤支援',symbol:'潮'};
 if(template?.skills.interpose!==undefined)return {kind:'mixed',label:'援护支援',symbol:'盾'};
 const types=[...new Set(Object.keys(template?.skills||{}).map(k=>SKILLS[k]?.type).filter(Boolean))];
 if(types.length>1)return {kind:'mixed',label:'复合',symbol:'✧'};
 return ({melee:{kind:'melee',label:'近战',symbol:'盾'},ranged:{kind:'ranged',label:'远程',symbol:'弩'},magic:{kind:'magic',label:'法术',symbol:'咒'},mental:{kind:'magic',label:'心理',symbol:'心'}})[types[0]]||{kind:'mixed',label:'敌方',symbol:'◇'};
}
