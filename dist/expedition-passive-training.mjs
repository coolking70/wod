// Ordinary passive training: no action slot, preferred skill, equipment rank or temporary effect.
export const PASSIVE_HEALTH=Object.freeze({id:'health',key:'passive:health',name:'耐病修习',perRank:4,maxRank:3});
export const passiveOptions=()=>[[PASSIVE_HEALTH.key,{name:PASSIVE_HEALTH.name+'（被动）',kind:'passive',id:PASSIVE_HEALTH.id}]];
export function passiveHealth(unit){const rank=unit?.training?.[PASSIVE_HEALTH.key];return Number.isSafeInteger(rank)&&rank>0&&rank<=3?{key:PASSIVE_HEALTH.key,rank,amount:rank*4}:null;}
export function passiveHealthEvidence(profile){const p=profile?.passiveTraining;if(!p||p.key!==PASSIVE_HEALTH.key||!Number.isSafeInteger(p.rank)||p.rank<1||p.rank>3||p.amount!==p.rank*4||!Number.isFinite(p.generalDefenseBonus)||!Number.isFinite(profile.bonus)||profile.bonus!==p.generalDefenseBonus+p.amount||!Number.isFinite(profile.base)||profile.mean!==profile.base+profile.bonus)return null;return p;}
