import {SKILLS,HEROES,CLASSES,clone,row,trainingCost} from './expedition-data.mjs';
export const ADVANCED={a:'rallyguard',b:'sweep',c:'tidebolt',d:'foresight',e:'resolvechant',f:'poultice'};
for(const h of HEROES)if(!ADVANCED[h.id])ADVANCED[h.id]=ADVANCED[CLASSES[h.classId].starterId];
export const UNLOCK_COST=40;
export const isAdvanced=skill=>Object.values(ADVANCED).includes(skill);
// All earned experience remains either unspent, invested in training, or paid to unlock a skill.
export const careerXp=m=>m.xp+trainingCost(m.training)*20+(m.unlocked?.length||0)*UNLOCK_COST;
export function growth(m){const earned=careerXp(m),level=earned>=150?3:earned>=60?2:1;return {earned,level,next:level===1?60:level===2?150:null,advancedRank:level>=3?3:1};}
export function lockedSkills(m,h){const used=[h.trained,...Object.entries(h.training||{}).filter(([,n])=>n>0).map(([k])=>k.startsWith('skill:')?k.slice(6):''),...['prep','main'].flatMap(p=>(h[p]||[]).map(r=>r.skill)),...Object.values(h.overrides||{}).flatMap(o=>['prep','main'].flatMap(p=>(o[p]||[]).map(r=>r.skill)))];return [...new Set(used.filter(s=>isAdvanced(s)&&!m.unlocked.includes(s)))];}
export function installAdvanced(config,id,skill){if(ADVANCED[id]!==skill)throw Error('进阶技能不属于该职业');const c=clone(config),h=c.heroes.find(h=>h.id===id);if(!h)throw Error('队员不存在');const phase=SKILLS[skill].kind==='buff'?'prep':'main',target={a:'front',b:'rear',c:'rear',d:'center',e:'center',f:'front'}[CLASSES[HEROES.find(h=>h.id===id).classId].starterId];const rest=h[phase].filter(r=>r.skill!==skill);if(rest.length>=4)throw Error('该阶段已有4条指令，请先在准备页留出一格');h[phase]=[row(skill,target,phase==='prep'?'repeat':'cycle'),...rest];for(const override of Object.values(h.overrides||{}))delete override[phase];return c;}
export function assertGuildSkills(m,h){const locked=lockedSkills(m,h);if(locked.length)throw Error(`${HEROES.find(t=>t.id===m.id).name}尚未学习：${locked.map(s=>SKILLS[s].name).join('、')}。请先在公会学习或移除相关指令/专修。`);}
