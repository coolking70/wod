// Ordinary summon casts share one live creature across forms.
// The existing scripted awakening still creates its two guardians.
export const SUMMON_FORMS={
 sentinel:{partyName:'唤潮卫',enemyName:'溺誓潮卫',mark:'灵',hpBase:36,hpPerLevel:4,mana:20,attrs:{str:10,con:10,int:8,dex:12,cha:0,agi:8,per:10,wil:10},attack:'strike',target:'front'},
 tidearcher:{partyName:'唤潮弩灵',enemyName:'溺誓弩灵',mark:'弩',hpBase:24,hpPerLevel:3,mana:16,attrs:{str:8,con:8,int:6,dex:14,cha:0,agi:12,per:14,wil:8},attack:'shot',target:'rear'}
};
export function hasSummoningSkill(unit){const ids=Array.isArray(unit?.skills)?unit.skills:Object.keys(unit?.skills||{});return ids.some(id=>Object.hasOwn(SUMMON_FORMS,id));}
