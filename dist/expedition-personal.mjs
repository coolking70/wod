// Recorded facts only. Do not infer prevented damage or attribute allies' damage to buffs.
import {HEROES} from './expedition-data.mjs';
export function personalReport(report,heroId){
 if(!HEROES.some(h=>h.id===heroId))throw Error('未知观察角色');
 const blank=()=>({damage:0,healing:0,received:0,taken:0,casts:0,castMana:0,defenseMana:0,failed:0,items:0,summonDamage:0,buffApplications:0,controlApplications:0,healingBlocks:0,passiveHealing:0,passiveRecords:0,passiveOverheal:0});
 const total=blank(),rooms=report.rooms.map((r,i)=>({index:i,name:r.name,...blank()})),given=new Map(),received=new Map(),issues=new Map(),evidence=[],supplies={herb:0,rune:0,arrow:0};
 let stock={...report.config.supplies};const buffKeys=new Set(),inKeys=new Set(),controlKeys=new Set(),proofKeys=new Set();
 const add=(room,key,n=1)=>{total[key]+=n;if(rooms[room])rooms[room][key]+=n;};
 const proof=(e,index,kind)=>{if(!proofKeys.has(kind)){proofKeys.add(kind);evidence.push({index,kind,text:e.text,roomIndex:e.roomIndex});}};
 const link=(map,id,key,amount,index)=>{if(!map.has(id))map.set(id,{id,healing:0,buffs:0,index});map.get(id)[key]+=amount;if(!Object.hasOwn(map.get(id),key+'Index'))map.get(id)[key+'Index']=index;};
 report.events.forEach((e,index)=>{
  const own=e.actor===heroId,target=e.targets.includes(heroId),d=e.detail||{};
  for(const key of Object.keys(stock)){if(own&&e.supplies)supplies[key]+=Math.max(0,stock[key]-e.supplies[key]);if(e.supplies)stock[key]=e.supplies[key];}
  if(own&&e.type==='cast'){add(e.roomIndex,'casts');add(e.roomIndex,'castMana',Math.max(0,d.mpBefore-d.mpAfter));}
  if(own&&e.type==='defend')add(e.roomIndex,'defenseMana',Math.max(0,d.mpBefore-d.mpAfter));
  if(e.type==='attack'){
   if(own){add(e.roomIndex,'damage',d.actual);proof(e,index,'本人攻击');}
   if(target){add(e.roomIndex,'taken',d.actual);proof(e,index,'受到攻击');}
   if(e.units.find(u=>u.id===e.actor)?.owner===heroId){add(e.roomIndex,'summonDamage',d.actual);proof(e,index,'召唤物攻击');}
  }
  if(e.type==='heal'){
   if(own&&d.passive){add(e.roomIndex,'passiveRecords');add(e.roomIndex,'passiveHealing',d.actual);add(e.roomIndex,'passiveOverheal',d.overheal);}
   if(own){add(e.roomIndex,'healing',d.actual);proof(e,index,'本人治疗');if(e.targets[0]!==heroId)link(given,e.targets[0],'healing',d.actual,index);}
   if(target){add(e.roomIndex,'received',d.actual);if(!own)link(received,e.actor,'healing',d.actual,index);proof(e,index,'得到治疗');}
  }
  if(e.type==='skip'&&d.healingBlock){if(d.healingBlock.source===heroId){add(e.roomIndex,'healingBlocks');proof(e,index,'救护受阻');}if(own)proof(e,index,'本人救护受阻');}
  if(e.type==='effect')for(const id of e.targets){
   // A multi-component buff on one recipient is one application, not several contributions.
   const key=[e.roomIndex,e.actionId||d.cast||e.id,e.actor,id,d.skill].join(':');
   if(d.harmful){if(own&&!controlKeys.has(key)){controlKeys.add(key);add(e.roomIndex,'controlApplications');proof(e,index,'施加禁疗');}continue;}
   if(own&&!buffKeys.has(key)){buffKeys.add(key);add(e.roomIndex,'buffApplications');if(id!==heroId)link(given,id,'buffs',1,index);proof(e,index,'施加增益');}
   if(id===heroId&&!own&&!inKeys.has(key)){inKeys.add(key);link(received,e.actor,'buffs',1,index);proof(e,index,'得到增益');}
  }
  if(own&&e.type==='item'){add(e.roomIndex,'items');proof(e,index,'使用道具');}
  if(own&&e.type==='failed'){add(e.roomIndex,'failed');proof(e,index,'行动空过');}
  if(own&&e.type==='skip'&&['法力不足','耗材耗尽','装备条件不满足'].includes(d.reason)){
   const key=d.reason+':'+d.skill;if(!issues.has(key))issues.set(key,{reason:d.reason,skill:d.skill,count:0,index});issues.get(key).count++;proof(e,index,d.reason);
  }
  if(target&&e.type==='down')proof(e,index,'角色倒下');
 });
 const name=id=>HEROES.find(h=>h.id===id)?.name||report.events.flatMap(e=>e.units).find(u=>u.id===id)?.name||id;
 return {heroId,name:name(heroId),total,rooms,supplies,given:[...given.values()].map(x=>({...x,name:name(x.id)})),received:[...received.values()].map(x=>({...x,name:name(x.id)})),issues:[...issues.values()],evidence};
}

// Keep complete action groups, plus room/story boundaries, for a personal replay.
export function personalSteps(steps,heroId){
 return steps.filter(g=>g.events.some(e=>['room','victory','defeat','scene','encounter','route','rescue','branch','deadline'].includes(e.type)||e.actor===heroId||e.targets.includes(heroId)||e.units.some(u=>u.owner===heroId&&(u.id===e.actor||e.targets.includes(u.id)))));
}
