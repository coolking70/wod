// Read-only display of recorded results. Reactions may redirect several attacks
// in one cast to the same unit; a result record is not a distinct recipient.
const amount = n => Number.isFinite(n) && n >= 0;
export function attackRecordCounts(events) {
 const hits=events.filter(e=>e.type==='attack');
 return {records:hits.length,recipients:new Set(hits.flatMap(e=>e.targets)).size,actual:hits.reduce((n,e)=>n+e.detail.actual,0)};
}
export function unitActionOutcomes(group) {
 const out=Object.create(null);
 for(const e of group.events){
  const d=e.detail||{},unit=e.type==='item'?e.actor:e.targets?.[0];
  let kind,resource,value,text;
  if(['attack','harm'].includes(e.type)&&amount(d.actual)){
   kind=d.grade==='闪避'?'miss':d.actual>0?'damage':'blocked';resource='hp';value=d.actual;
   text=kind==='miss'?'闪避':kind==='blocked'?'吸收':'−'+value;
  }else if(e.type==='heal'&&amount(d.actual)){kind='heal';resource='hp';value=d.actual;text='+'+value;}
  else if(e.type==='mana-damage'&&amount(d.actual)){kind=d.grade==='闪避'?'miss':'mana-loss';resource='mp';value=d.actual;text=kind==='miss'?'闪避':'−'+value+' MP';}
  else if(e.type==='mana-transfer'&&amount(d.actual)){kind='mana';resource='mp';value=d.actual;text='+'+value+' MP';}
  else if(e.type==='item'&&['hp','mp'].includes(d.resource)&&amount(d.actual)){kind=d.resource==='hp'?'heal':'mana';resource=d.resource;value=d.actual;text='+'+value;}
  else if(e.type==='immune'){kind='immune';value=0;text='免疫';}
  else continue;
  if(!unit)continue;
  const v=out[unit]??={unit,records:[],attackRecords:0,hpLoss:0,hpGain:0,mpLoss:0,mpGain:0,misses:0,absorbed:0,immune:0};
  v.records.push({eventId:e.id,type:e.type,kind,resource:resource||null,actual:value,text});
  if(e.type==='attack'||e.type==='mana-damage'||e.type==='immune')v.attackRecords++;
  if(kind==='damage')v.hpLoss+=value;
  if(kind==='heal')v.hpGain+=value;
  if(kind==='mana-loss')v.mpLoss+=value;
  if(kind==='mana')v.mpGain+=value;
  if(kind==='miss')v.misses++;
  if(kind==='blocked')v.absorbed++;
  if(kind==='immune')v.immune++;
 }
 for(const v of Object.values(out)){
  const parts=[];
  if(v.hpLoss)parts.push('−'+v.hpLoss+' HP');
  if(v.records.some(r=>r.kind==='heal'))parts.push('+'+v.hpGain+' HP');
  if(v.records.some(r=>r.kind==='mana-loss'))parts.push('−'+v.mpLoss+' MP');
  if(v.records.some(r=>r.kind==='mana'))parts.push('+'+v.mpGain+' MP');
  if(v.misses)parts.push(v.misses+'次闪避');
  if(v.absorbed)parts.push(v.absorbed+'次吸收');
  if(v.immune)parts.push(v.immune+'次免疫');
  // Preserve zero effective healing and keep gains/losses separate, never netted.
  if(!parts.length)parts.push('+0 HP');
  v.multiple=v.records.length>1;
  v.text=v.multiple?parts.join(' · '):v.records[0].text;
  v.kind=v.hpLoss?'damage':v.hpGain?'heal':v.records.some(r=>r.kind==='mana-loss')?'mana-loss':v.records.some(r=>r.kind==='mana')?'mana':v.misses?'miss':v.absorbed?'blocked':v.immune?'immune':'heal';
  v.floatText=!v.multiple?v.text:v.kind==='damage'?'−'+v.hpLoss:v.kind==='heal'?'+'+v.hpGain:v.kind==='mana-loss'?'−'+v.mpLoss+' MP':v.kind==='mana'?'+'+v.mpGain+' MP':v.kind==='miss'?v.misses+'次闪避':v.kind==='blocked'?v.absorbed+'次吸收':v.immune+'次免疫';
  v.countText=v.attackRecords?v.attackRecords+'次攻击记录':v.records.length+'项结果';
  v.eventIds=v.records.map(r=>r.eventId);
  v.title='本次记录结果（不含施放与防御费用）：'+v.records.map(r=>'#'+r.eventId+' '+r.text).join('；');
 }
 return out;
}
