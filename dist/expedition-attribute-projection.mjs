import {ATTR,clone,MAX_TRAINING_RANK,SKILLS,TYPES} from './expedition-data.mjs';
import {attributeBreakdown} from './expedition-attribute-training.mjs';
import {trainingQuote} from './expedition-training.mjs';
import {isAdvanced} from './expedition-growth.mjs';
import {buildParty,mean,defenseProfile} from './expedition-engine.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function attributeProjectionInventory(hero,member){
 if(hero.id!==member.id||Object.keys({...hero.training,...member.training}).some(k=>(hero.training[k]||0)!==(member.training[k]||0)))throw Error('属性预览需要该队员实际永久培养');
 const unit=h=>buildParty({heroes:[h]})[0],before=unit(hero),base=Object.fromEntries(attributeBreakdown(hero).map(r=>[r.key,r.total])),skills=Object.keys(before.skills).filter(s=>!isAdvanced(s)||member.unlocked.includes(s)),types=Object.keys(TYPES),rows={};
 for(const key of Object.keys(ATTR)){
  const trainingKey='attr:'+key,up=trainingQuote(member,trainingKey),down=trainingQuote(member,trainingKey,-1);
  const project=q=>{
   if(q.nextRank<0||q.nextRank>MAX_TRAINING_RANK||q.direction===-1&&!q.allowed)return null;
   const h=clone(hero);if(q.nextRank)h.training[trainingKey]=q.nextRank;else delete h.training[trainingKey];const after=unit(h);
   return {value:attributeBreakdown(h).find(r=>r.key===key).total,maxHp:after.maxHp,maxMp:after.maxMp,skills:skills.map(s=>({id:s,name:SKILLS[s].name,before:mean(before,s),after:mean(after,s)})).filter(r=>r.before!==r.after),defenses:types.map(type=>({type,before:defenseProfile(before,type).mean,after:defenseProfile(after,type).mean})).filter(r=>r.before!==r.after)};
  };
  rows[key]={key,name:ATTR[key],before:{value:base[key],maxHp:before.maxHp,maxMp:before.maxMp},up,down,after:project(up),refunded:project(down)};
 }
 return rows;
}
export function attributeProjectionView(r,pending=false){
 const lines=(after,q)=>{if(!after)return '';const label=q.direction===1?'培养一级':'退回一级';return `<section data-attribute-projection-direction="${q.direction===1?'up':'down'}"><p><b>${label}</b> · ${q.direction===1?'花费 '+q.cost:'返还 '+q.refund}经验${q.allowed?'':'；当前不可支付：'+esc(q.reasons.join('；'))}</p><p>${esc(r.name)}出发总值 <strong>${r.before.value} → ${after.value}</strong><br>生命上限 <strong data-projected-hp>${r.before.maxHp} → ${after.maxHp}</strong> · 法力上限 <strong data-projected-mp>${r.before.maxMp} → ${after.maxMp}</strong></p>${after.skills.length?`<p>技能检定基值：${after.skills.map(s=>esc(s.name)+' '+s.before+'→'+s.after).join('；')}</p>`:''}${after.defenses.length?`<p>默认防御基值：${after.defenses.map(s=>esc(TYPES[s.type])+' '+s.before+'→'+s.after).join('；')}</p>`:''}</section>`;};
 return `<details class="attribute-projection" data-growth-detail="preview:attr:${esc(r.key)}" data-attribute-projection="${esc(r.key)}"><summary>培养与退回预览${r.after?' · '+r.before.value+' → '+r.after.value:''}</summary>${lines(r.after,r.up)}${lines(r.refunded,r.down)}${!r.after?'<p>本项已达到培养上限，没有下一级。</p>':''}${!r.down.allowed&&r.down.rank>0?'<p>当前不能退回：'+esc(r.down.reasons.join('；'))+'</p>':''}${pending?'<p>待领取期间只读，不能调整永久培养。</p>':''}<p>只看当前装备、专修、倾向和已保存默认配置；不含跨房消耗或临时效果。已学技能的检定变化不等于已列入指令或保证出手；防御房间覆盖另在出征核对。查看不支付、不退回、不编入队伍。</p></details>`;
}
