import {readRoutePreparation} from './expedition-plan-book.mjs';
import {rosterConfig} from './expedition-roster.mjs';
import {validateGuild} from './expedition-guild.mjs';
import {validate} from './expedition-engine.mjs';
import {ATTR,SKILLS,DEFENSES,HEROES} from './expedition-data.mjs';

// Existing free preparation choices, not XP ranks or original WoD mastery.
export const PERSONAL_FOCUS_FIELDS=Object.freeze(['attribute','trained','defenseFocus']);
export function routeFocusPreparation(storage,route,current,guild,options){
 const assigned=readRoutePreparation(storage,route,options);validateGuild(guild);
 if(assigned.bound||!guild.command)return {...assigned,personalFocus:null};
 validate(current);
 const sourceConfig=rosterConfig(guild,current),next=rosterConfig(guild,assigned.config),id=guild.command.heroId,source=sourceConfig.heroes.find(h=>h.id===id),target=next.heroes.find(h=>h.id===id);
 if(!source||!target)throw Error('当前名册缺少自己的英雄，准备未改变');
 const changed=PERSONAL_FOCUS_FIELDS.flatMap(field=>target[field]===source[field]?[]:[{field,before:target[field],after:source[field]}]);
 for(const field of PERSONAL_FOCUS_FIELDS)target[field]=source[field];validate(next);
 return {...assigned,config:next,personalFocus:{heroId:id,attribute:target.attribute,trained:target.trained,defenseFocus:target.defenseFocus,changed}};
}
export function routeFocusNotice(assigned){
 if(assigned.bound)return '已按分配的完整方案载入；实际出战名册与培养仍须按公会核对。';
 const f=assigned.personalFocus;if(!f)return '';
 return `保留${HEROES.find(h=>h.id===f.heroId).name}的${ATTR[f.attribute]}倾向、${SKILLS[f.trained].name}专修与${DEFENSES[f.defenseFocus].name}防御专修；阵位、指令和反应配置请按新路线核对。`;
}
