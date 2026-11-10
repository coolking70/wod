// Original optional resource policies, not live-server WoD numbers.
export const CASTING_MEDIA={standard:{name:'标准符纸',runes:1,manaDelta:0},memory:{name:'心诵',runes:0,manaDelta:4},scribed:{name:'复写符纸',runes:2,manaDelta:-3}};
export function supportsMedia(skill){return skill?.item==='rune'&&['attack','buff','summon'].includes(skill.kind);}
export function mediumId(skill,command={}){const id=command.medium??'standard';if(command.medium===null||typeof id!=='string'||!Object.hasOwn(CASTING_MEDIA,id)||(id!=='standard'&&!supportsMedia(skill)))throw Error('施法媒介与技能不匹配');return id;}
export function mediumLabel(command){return command.medium&&command.medium!=='standard'?' / '+CASTING_MEDIA[command.medium].name:'';}
