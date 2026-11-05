import {SKILLS} from './expedition-data.mjs';
import {skillManaCost} from './expedition-advancement-data.mjs';
import {CASTING_MEDIA,mediumId} from './expedition-media-data.mjs';
export function commandCost(unit,command){const skill=SKILLS[command.skill],id=mediumId(skill,command),policy=CASTING_MEDIA[id],baseMana=skillManaCost(unit,command.skill),mana=id==='standard'?baseMana:Math.max(1,baseMana+policy.manaDelta),amount=id==='standard'?(skill.item?1:0):policy.runes,resource=amount?(skill.item||null):null;return {mana,resource,amount,medium:id,baseMana};}
export function commandCostText(unit,command){const cost=commandCost(unit,command);return `${cost.medium==='standard'?'标准支付':CASTING_MEDIA[cost.medium].name+'支付'}：${cost.mana}法力 / ${cost.resource?cost.amount+({herb:'药草',rune:'符纸',arrow:'箭矢'}[cost.resource]):'无共享材料'}`;}
