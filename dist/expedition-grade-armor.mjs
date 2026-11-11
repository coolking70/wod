import {GEAR,SLOTS,equipmentTotals} from './expedition-equipment.mjs';
const GRADES=['命中','重击','致命'],LABELS={melee:'近战',ranged:'远程',magic:'法术',disease:'疾病'};
export const GRADE_ARMOR_RULE='分档护甲只来自实际装备：先按本次命中/重击/致命选取对应伤害通道的额外护甲，加到当时基础护甲与技能护甲，再按原穿甲、抗性和护盾结算。不同伤害段分别选通道，同一次攻防不重掷。闪避不结算，心理伤害绕护甲，削减法力和持续伤害保持原规则。三档结构参考公开WoD物品；装备、通道映射、数值与命中阈值为本项目设计。';
const signed=n=>n>0?'+'+n:String(n),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rows(gear){return (typeof gear==='string'?[gear]:Object.keys(SLOTS).map(k=>gear?.[k])).flatMap(id=>{
 const item=GEAR[id];if(!item?.hitArmor)return [];
 if(typeof item.hitArmor!=='object'||Array.isArray(item.hitArmor)||!Object.keys(item.hitArmor).length)throw Error('装备分档护甲定义无效');
 return Object.entries(item.hitArmor).map(([type,values])=>{if(!Object.hasOwn(LABELS,type)||!Array.isArray(values)||values.length!==3||values.some(n=>!Number.isSafeInteger(n)||n<0))throw Error('装备分档护甲必须为已知伤害通道的三个非负整数');return {gearId:id,gearName:item.name,damageType:type,values:[...values]};});
});}
export function gradeArmorTotals(gear){const totals={};for(const r of rows(gear)){totals[r.damageType]??=[0,0,0];r.values.forEach((n,i)=>totals[r.damageType][i]+=n);}return totals;}
export function gradeArmorForHit(unit,damageType,grade,flat){
 if(damageType==='mental'||grade==='闪避')return null;
 const sources=rows(unit.gear).filter(r=>r.damageType===damageType);if(!sources.length)return null;
 const index=GRADES.indexOf(grade);if(index<0||!Number.isFinite(flat))throw Error('本次命中品质或基础护甲无效');
 const bonus=sources.reduce((n,r)=>n+r.values[index],0);return {grade,damageType,index,flat,bonus,total:flat+bonus,sources:sources.map(r=>({...r,selected:r.values[index]})),rule:GRADE_ARMOR_RULE};
}
export function gradeArmorSummary(gear){return Object.entries(gradeArmorTotals(gear)).map(([t,v])=>LABELS[t]+'额外护甲（命中/重击/致命）'+v.join('/')).join('；');}
export function gradeArmorDifference(current,next){const a=gradeArmorTotals(current),b=gradeArmorTotals(next),flat=equipmentTotals(next).armor-equipmentTotals(current).armor;return [...new Set([...Object.keys(a),...Object.keys(b)])].map(type=>LABELS[type]+'护甲（命中/重击/致命）'+GRADES.map((_,i)=>signed(flat+(b[type]?.[i]||0)-(a[type]?.[i]||0))).join('/'));}
export function gradeArmorPreparationView(gear){const text=gradeArmorSummary(gear);return text?'<section class="grade-armor-preparation"><h4>品质护甲 · 当前装备</h4><p>'+esc(text)+'</p><small>'+GRADE_ARMOR_RULE+'</small></section>':'';}
export function gradeArmorEvidenceView(event){
 const d=event?.detail;if(!d)return '';
 const parts=Array.isArray(d.damageParts)?d.damageParts:[{...d,kind:'primary'}];
 const validSource=s=>s&&typeof s==='object'&&!Array.isArray(s)&&typeof s.gearId==='string'&&typeof s.gearName==='string'&&Array.isArray(s.values)&&s.values.length===3;
 const selected=parts.filter(p=>p?.hitArmor&&Array.isArray(p.hitArmor.sources)&&p.hitArmor.sources.some(validSource));if(!selected.length)return '';
 return '<section class="grade-armor-proof"><h3>本次命中品质护甲</h3><p>'+esc(event.text)+'</p>'+selected.map(p=>{const a=p.hitArmor;return '<article><p>'+esc(p.kind==='coating'?'淬潮附加段':'原攻击')+' · '+esc(LABELS[a.damageType]||a.damageType)+' · '+esc(a.grade)+'：当时基础/技能护甲 '+esc(a.flat)+' + 装备选档 '+esc(a.bonus)+' = 穿甲前 '+esc(a.total)+'；忽略 '+esc(p.armorIgnored)+'，生效 '+esc(p.armor)+'。</p><ul>'+a.sources.filter(validSource).map(s=>'<li>'+esc(s.gearName)+'：三档 '+esc(Array.isArray(s.values)?s.values.join('/'):'未知')+'，本次采用 '+esc(s.selected)+'</li>').join('')+'</ul></article>';}).join('')+'<small>'+GRADE_ARMOR_RULE+'</small></section>';
}
