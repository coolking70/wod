import {clone,trainingOptions,roomsFor,resolveHeroPlan,TYPES,MAX_TRAINING_RANK} from './expedition-data.mjs';
import {buildParty,skillBreakdown,mean,defenseProfile} from './expedition-engine.mjs';
import {trainingQuote} from './expedition-training.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unitFor=h=>buildParty({heroes:[h]})[0];
function skillState(u,id){const b=skillBreakdown(u,id);return {level:b.total,mean:mean(u,id),base:b.base,specialization:b.specialization,training:b.training,equipment:b.equipment||0,other:b.total-b.base-b.specialization-b.training-(b.equipment||0)};}
function defenseStates(h,u,id,config){const rows=[];for(const room of roomsFor(config)){const plan=resolveHeroPlan(h,room.id),current={...u,...plan,effects:[]};for(const type of Object.keys(TYPES)){const d=defenseProfile(current,type);if(d.requested===id)rows.push({roomId:room.id,roomName:room.name,type,requested:d.requested,skill:d.skill,reason:d.reason||null,level:d.level,mean:d.mean});}}return rows;}
// Static projections only. No simulation, guild transaction, RNG, payment or command installation.
export function trainingImpactInventory(member,actualConfig){
 const actor=actualConfig.heroes.find(h=>h.id===member.id),options=trainingOptions(member.id),rows={};
 if(actor&&Object.keys({...member.training,...actor.training}).some(k=>(member.training[k]||0)!==(actor.training[k]||0)))throw Error('培养预览需要实际已应用的永久训练');
 const beforeUnit=actor?unitFor(actor):null;
 for(const [key,o]of Object.entries(options).filter(([,o])=>o.kind!=='attribute')){
  const up=trainingQuote(member,key),down=trainingQuote(member,key,-1),state=h=>{const u=h===actor?beforeUnit:unitFor(h);return o.kind==='skill'?skillState(u,o.id):defenseStates(h,u,o.id,actualConfig);};
  const project=quote=>{if(!actor||quote.nextRank<0||quote.nextRank>MAX_TRAINING_RANK)return null;const h=clone(actor);if(quote.nextRank)h.training[key]=quote.nextRank;else delete h.training[key];return state(h);};
  rows[key]={key,name:o.name,kind:o.kind,active:Boolean(actor),up,down,before:actor?state(actor):null,after:project(up),refunded:project(down)};
 }
 return rows;
}
export function trainingImpactView(r,pending=false){
 if(!r)return '';const preview=r.kind==='skill'&&r.before&&r.after?` · 等级 ${r.before.level} → ${r.after.level}`:'';
 const cost=q=>q.direction===1?`花费 ${q.cost} 经验`:`返还 ${q.refund} 经验`;
 const value=(a,b,label)=>`<p data-impact-direction="${label}">${label==='up'?'训练一级':'退回一级'}：等级 <strong>${a.level} → ${b.level}</strong> · 检定基值 <strong>${a.mean} → ${b.mean}</strong></p>`;
 let content='';
 if(!r.active)content='<p>当前未出战，不把候补保存的战术当作本次实际效果。安排出战后再核对；仍可按实际费用培养。</p>';
 else if(r.kind==='skill'){
  const a=r.before;content=`<p data-impact-sources>当前出发等级 ${a.level} = 基础 ${a.base} + 专修 ${a.specialization} + 永久培养 ${a.training} + 装备技能 ${a.equipment}${a.other?' + 其他静态修正 '+a.other:''}。</p>`+(r.after?value(a,r.after,'up'):'<p>已达本项训练上限，没有下一级预览。</p>')+(r.refunded?value(a,r.refunded,'down'):'');
 }else{
  content=r.before.length?r.before.map((a,i)=>{const b=r.after?.[i],d=r.refunded?.[i];return `<p>${esc(a.roomName)} · ${esc(TYPES[a.type])}：${a.reason?esc(a.reason)+'，回退自然防御；本项培养不改变该回退。':`当前等级 ${a.level} / 检定基值 ${a.mean}${b?`；训练后 ${b.level} / ${b.mean}`:''}${d?`；退回后 ${d.level} / ${d.mean}`:''}`}</p>`;}).join(''):'<p>当前各房间没有选择此防御，训练不会自动切换防御。请先核对出征指令与防御选择。</p>';
 }
 const quote=(q,enabled)=>enabled?`<p>${q.direction===1?'训练一级':'退回一级'} · ${cost(q)}${q.allowed?'':'；当前不可调整：'+esc(q.reasons.join('；'))}</p>`:'';
 return `<details class="training-impact" data-growth-detail="impact:${esc(r.key)}" data-training-impact="${esc(r.key)}"><summary>付款前看实际变化${preview}</summary>${content}${quote(r.up,r.after)}${quote(r.down,r.refunded)}${pending?'<p>当前有待领取结算，不能调整永久培养；这里核对的是当前准备，不是已出发快照。</p>':''}<p>只按当前已应用职责、专修、实际装备和永久训练核对出发静态值；各房按出发法力计算，不模拟跨房消耗或临时效果。等级不等于固定伤害、护盾或治疗量，实际效果依技能公式和战报；培养不添加指令、不切换防御。费用沿本项目参数，非已核实的原版服务器数表。</p></details>`;
}
