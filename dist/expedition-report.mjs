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
 const summons=group.events.filter(e=>e.type==='summon');if(summons.length)return cast.text+' · 召唤 '+summons.length+' 名单位';
 const hits=group.events.filter(e=>e.type==='attack');
 const heals=group.events.filter(e=>e.type==='heal');
 if(hits.length)return cast.text+' · '+hits.length+' 个目标 / '+hits.reduce((n,e)=>n+e.detail.actual,0)+' 实伤'+(group.events.some(e=>e.type==='dispel')?' / 破除技能增益':group.events.some(e=>e.type==='dispel-skip')?' / 未破除增益':'');
 if(heals.length)return cast.text+' · 恢复 '+heals.reduce((n,e)=>n+e.detail.actual,0);
 return cast.text+' · '+cast.targets.length+' 个目标';
}
