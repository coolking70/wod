// Equipment skill categories are independent from hero classes and attack types.
// Membership and values below are project design, not a server rules table.
export const SKILL_CLASSES=Object.freeze({closecombat:Object.freeze({name:'近战技艺',labels:Object.freeze(['剑术','盾缘重击','盾牌格挡']),members:Object.freeze(['skill:strike','skill:shieldbash','defense:parry'])})});
export function skillClassSources(items,key){
 return items.filter(Boolean).flatMap(item=>Object.entries(item.classRanks||{}).filter(([id])=>SKILL_CLASSES[id]?.members.includes(key)).map(([id,amount])=>({id,name:SKILL_CLASSES[id].name,item:item.name,amount})));
}
export const skillClassRank=(items,key)=>skillClassSources(items,key).reduce((n,r)=>n+r.amount,0);
export function skillClassSummary(ranks={}){return Object.entries(ranks).map(([id,n])=>`${SKILL_CLASSES[id].name}类别等级 ${n>=0?'+':''}${n}（${SKILL_CLASSES[id].labels.join('、')}；不授予技能）`).join(' · ');}
export function skillClassDifference(a={},b={}){return Object.keys({...a,...b}).map(id=>[id,(b[id]||0)-(a[id]||0)]).filter(([,n])=>n).map(([id,n])=>`${SKILL_CLASSES[id].name}类别等级 ${n>0?'+':''}${n}`).join(' / ');}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function skillClassEvidenceView(group){
 const rows=(group?.events||[group]).filter(Boolean).flatMap(e=>{const p=e.type==='cast'?e.detail?.levelSources:e.type==='defend'?e.detail:null;return p?.classEquipment?[{event:e,profile:p}]:[];});
 return rows.length?`<section class="skill-class-proof"><h3>技能类别等级 · 本次实际来源</h3>${rows.map(({event:e,profile:p})=>`<p>记录 ${esc(e.id)} · ${esc(e.text)}：装备等级合计 ${esc(p.equipment)}，其中类别加值 ${esc(p.classEquipment.amount)}（${p.classEquipment.sources.map(s=>esc(s.item)+' / '+esc(s.name)+' +'+esc(s.amount)).join('、')}）。实际总等级 ${esc(p.total??p.level)}。</p>`).join('')}<p>类别部分已包含在装备等级合计内，不能重复相加；只按本次实际穿戴和已掌握技能生效，不授予技能、经验或课程。防御缺装备或法力仍按原规则回退，费用沿原规则。</p></section>`:'';
}
