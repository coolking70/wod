import{attackRecordCounts}from'./expedition-action-outcomes.mjs';
// Pure display projection: action grouping never executes rules or changes event snapshots.
export function groupActions(events){
 const groups=[];
 events.forEach((event,index)=>{
  const previous=groups.at(-1);
  if(event.actionId&&previous?.actionId===event.actionId){previous.events.push(event);previous.end=index;return;}
  groups.push({actionId:event.actionId||null,start:index,end:index,roomIndex:event.roomIndex,round:event.round,phase:event.phase,type:event.type,events:[event]});
 });
 return groups;
}
export function summaryOf(group){
 const cast=group.events.find(e=>e.type==='cast');
 if(!cast)return group.events[0].text;
 const transfer=group.events.find(e=>e.type==='mana-transfer');if(transfer)return cast.text+' · 实际转入'+transfer.detail.actual+'法力 / 来源付'+transfer.detail.paidMana;
 const mana=group.events.filter(e=>e.type==='mana-damage');if(mana.length)return cast.text+' · 实际削减 '+mana.reduce((n,e)=>n+e.detail.actual,0)+' 法力 / 生命不变';
 const controls=group.events.filter(e=>e.type==='control');if(controls.length)return cast.text+' · 无生命伤害 / 附动摇'+controls.filter(e=>e.detail.applied).length+'次 / 抵抗'+controls.filter(e=>!e.detail.applied).length+'次';
 const summons=group.events.filter(e=>e.type==='summon');if(summons.length)return cast.text+' · 召唤 '+summons.length+' 名单位';
 const hits=group.events.filter(e=>e.type==='attack');
 const heals=group.events.filter(e=>e.type==='heal');
 if(hits.length){const n=attackRecordCounts(group.events),shield=hits.reduce((n,e)=>n+(e.detail.manaShield?.absorbed||0),0);return cast.text+' · '+(n.recipients===n.records?n.recipients+' 个目标':n.recipients+' 名结算对象 / '+n.records+' 次攻击记录')+' / '+n.actual+' 实伤'+(shield?' / 护盾吸收'+shield:'')+(group.events.some(e=>e.type==='dispel')?' / 破除技能增益':group.events.some(e=>e.type==='dispel-skip')?' / 未破除增益':'');}
 if(heals.length)return cast.text+' · 恢复 '+heals.reduce((n,e)=>n+e.detail.actual,0);
 return cast.text+' · '+cast.targets.length+' 个目标';
}
