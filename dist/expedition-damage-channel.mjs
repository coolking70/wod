import {TYPES}from'./expedition-data.mjs';
export const DAMAGE_CHANNEL_RULE='攻击方式决定目标路线、应对防御、援护和攻击免疫；伤害通道决定实际受击者的伤害抗性。先按攻击方式完成命中检定，再按实际受击者的通道抗性与既有护甲规则结算：心理通道不采用物理护甲，其他通道仍采用。攻击免疫按攻击方式，不按伤害通道；跨通道不会额外穿甲、改变费用/行动队列/目标人数或附着状态。具体通道和公式为项目暂定改编。';
export function damageTypeOf(s){if(s.damageType!==undefined&&(!Object.hasOwn(TYPES,s.damageType)||s.kind!=='attack'))throw Error('伤害通道须来自攻击技能定义中的已知类型');return s.damageType||s.type;}
export function damageChannelTrace(s){const damageType=damageTypeOf(s);return s.damageType!==undefined&&damageType!==s.type?{attackType:s.type,damageType,rule:DAMAGE_CHANNEL_RULE}:null;}
export function damageChannelLabel(s){const v=damageChannelTrace(s);return v?' · '+TYPES[v.attackType]+'攻防 / '+TYPES[v.damageType]+'伤害':'';}
export function damageChannelEvidenceView(e){const d=e?.detail,c=d?.damageChannel;if(!c)return '';return `<section class="damage-channel-proof"><h3>${TYPES[c.attackType]}攻防 · ${TYPES[c.damageType]}伤害</h3><p>${c.rule}</p>${e.type==='attack'?`<p>本次${d.defenseProfile.name}应对${TYPES[d.attackType]}，按实际受击者${TYPES[d.damageType]}抗性${d.resistance}%和护甲${d.armor}结算；实际伤害${d.actual}，已计入本人实伤。</p>`:''}</section>`;}
