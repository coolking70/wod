import {GEAR} from './expedition-equipment.mjs';
import {ATTR} from './expedition-data.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const DAMAGE_ATTRIBUTE_RULE='命中仍按技能原属性检定；此武器仅将普通物理弓击的伤害投点前基值改为感知/2＋力量/3＋实际技能等级/2＋4。技能威力、随机投点、命中品质、穿甲、抗性、援护和费用沿原流程。潮印箭、机关拆解、削蓝、无伤技能和淬药附加段不采用该武器伤害公式。武器、属性搭配和数值均为项目改编，不是原版现服数表。';
export function damageAttributeProfile(gear,skill=null){
 const id=typeof gear==='string'?gear:gear?.weapon,item=Object.hasOwn(GEAR,id)?GEAR[id]:null,p=item?.damageAttributes;
 if(p===undefined)return null;
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join(',')!=='bonus,primary,secondary'||!Object.hasOwn(ATTR,p.primary)||!Object.hasOwn(ATTR,p.secondary)||!Number.isSafeInteger(p.bonus)||p.bonus<0||item.slot!=='weapon'||item.countsAs!=='bow')throw Error('武器伤害属性定义无效');
 if(skill&&(skill.kind!=='attack'||skill.type!=='ranged'||(skill.damageType||skill.type)!=='ranged'||skill.disarm||skill.manaDamage||skill.nonDamaging))return null;
 return {gearId:id,gearName:item.name,primary:p.primary,secondary:p.secondary,bonus:p.bonus};
}
export function damageBaseFor(unit,skill,level,value){
 const p=damageAttributeProfile(unit.gear,skill),primary=p?.primary||skill.primary,secondary=p?.secondary||skill.secondary,pv=value(unit,primary),sv=value(unit,secondary);
 let base=pv/2+sv/3+level/2;
 if(!p)return {base};
 base+=p.bonus;
 return {base,trace:{gearId:p.gearId,gearName:p.gearName,attack:{primary:skill.primary,secondary:skill.secondary,primaryValue:value(unit,skill.primary),secondaryValue:value(unit,skill.secondary)},primary,secondary,primaryValue:pv,secondaryValue:sv,bonus:p.bonus,level,base,power:skill.power,rule:DAMAGE_ATTRIBUTE_RULE}};
}
export function damageAttributeSummary(gear){const p=damageAttributeProfile(gear);return p?'物理弓击伤害基值：'+ATTR[p.primary]+'/2＋'+ATTR[p.secondary]+'/3＋技能等级/2＋'+p.bonus+'（命中属性保持原技能）':'';}
export function damageAttributePreparationView(gear){const text=damageAttributeSummary(gear);return text?'<section class="damage-attributes-preparation"><h4>命中与伤害分开培养</h4><p>'+esc(text)+'</p><small>'+DAMAGE_ATTRIBUTE_RULE+'</small></section>':'';}
export function damageAttributeEvidenceView(event){
 const t=event?.detail?.damageAttributes;if(!t||typeof t!=='object'||Array.isArray(t)||!t.attack||typeof t.attack!=='object'||Array.isArray(t.attack))return '';
 const name=k=>Object.hasOwn(ATTR,k)?ATTR[k]:k;
 return '<section class="damage-attributes-proof"><h3>本次命中与伤害属性</h3><p>'+esc(t.gearName)+' · '+esc(event.text)+'</p><p>命中：'+esc(name(t.attack.primary))+' '+esc(t.attack.primaryValue)+' / '+esc(name(t.attack.secondary))+' '+esc(t.attack.secondaryValue)+'，当时命中均值 '+esc(event.detail.attackMean)+'。</p><p>伤害投点前基值：'+esc(name(t.primary))+' '+esc(t.primaryValue)+'/2 ＋ '+esc(name(t.secondary))+' '+esc(t.secondaryValue)+'/3 ＋ 技能等级 '+esc(t.level)+'/2 ＋ 武器 '+esc(t.bonus)+' = '+esc(t.base)+'；再按技能威力 '+esc(t.power)+' 和原随机流程投点。'+(event.detail.grade==='闪避'?'本次闪避，未产生生命伤害。':'命中品质、护甲和抗性之后的实伤以本条结算为准。')+'</p><small>'+esc(t.rule)+'</small></section>';
}
