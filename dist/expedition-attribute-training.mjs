import {ATTR,HEROES} from './expedition-data.mjs';
import {equipmentTotals} from './expedition-equipment.mjs';
export const ATTRIBUTE_USES={str:'力量相关技能检定；不直接增加护甲或基础行动。',dex:'灵巧相关技能，以及原自然近战防御中的灵巧项。',con:'每点增加4生命上限，同时参与相关技能检定；不直接改变护甲或抗性。',agi:'每点增加2先攻均值，并参与相关防御；不额外增加行动次数。',per:'每点增加1先攻均值，并参与相关攻击与防御。',int:'每点增加2法力上限，并参与施法、救护与相关防御；不固定增加所有技能效果。',wil:'每点增加1法力上限，并参与相关施法与心智防御。',cha:'吟游辅助与心理技能的相关检定；不固定增加行动或覆盖人数。'};
export function applyAttributeTraining(attrs,training={}){const a={...attrs};for(const key of Object.keys(a))a[key]+=training['attr:'+key]||0;return a;}
export function attributeBreakdown(h){const template=HEROES.find(t=>t.id===h.id);if(!template)throw Error('属性角色无效');const gear=equipmentTotals(h.gear).bonus;return Object.entries(ATTR).map(([key,name])=>{const base=template.attrs[key],focus=h.attribute===key?3:0,training=h.training?.['attr:'+key]||0,equipment=gear[key]||0;return {key,name,base,focus,training,equipment,total:base+focus+training+equipment,use:ATTRIBUTE_USES[key]};});}
export function attributeResources(h){const a=Object.fromEntries(attributeBreakdown(h).map(r=>[r.key,r.total]));return {maxHp:50+4*a.con,maxMp:20+2*a.int+a.wil};}
