import {PROGRESSION_RULES,experienceForTraining} from './expedition-progression-rules.mjs';
import {SKILLS,HEROES,CLASSES,clone,row} from './expedition-data.mjs';
import {ADVANCEMENT_COST} from './expedition-advancement-data.mjs';
export const ADVANCED={a:'rallyguard',b:'sweep',c:'tidebolt',d:'foresight',e:'resolvechant',f:'poultice'};
for(const h of HEROES)if(!ADVANCED[h.id])ADVANCED[h.id]=ADVANCED[CLASSES[h.classId].starterId];
export const UNLOCK_COST=PROGRESSION_RULES.course.costXp;
export const isAdvanced=skill=>Object.values(ADVANCED).includes(skill);
// Partition of earned XP; equipment and temporary battle effects are not investments.
export function experienceLedger(m){const available=m.xp,training=experienceForTraining(m.training),courses=(m.unlocked?.length||0)*UNLOCK_COST,advancement=m.advancement?ADVANCEMENT_COST:0;return {available,training,courses,advancement,earned:available+training+courses+advancement,refundable:training+advancement};}
export const careerXp=m=>experienceLedger(m).earned;
export function growth(m){const earned=careerXp(m),stages=PROGRESSION_RULES.stages,stage=stages.findLast(s=>earned>=s.earned)||stages[0],next=stages.find(s=>s.earned>earned)?.earned??null;return {earned,level:stage.level,next,advancedRank:stage.advancedRank};}
export function lockedSkills(m,h){const used=[h.trained,...(h.initiative==='foresight'?['foresight']:[]),...Object.entries(h.training||{}).filter(([,n])=>n>0).map(([k])=>k.startsWith('skill:')?k.slice(6):''),...['prep','main'].flatMap(p=>(h[p]||[]).map(r=>r.skill)),...Object.values(h.overrides||{}).flatMap(o=>[...(o.initiative==='foresight'?['foresight']:[]),...['prep','main'].flatMap(p=>(o[p]||[]).map(r=>r.skill))])];return [...new Set(used.filter(s=>isAdvanced(s)&&!m.unlocked.includes(s)))];}
export function installAdvanced(config,id,skill){if(ADVANCED[id]!==skill)throw Error('进阶技能不属于该职业');const c=clone(config),h=c.heroes.find(h=>h.id===id);if(!h)throw Error('队员不存在');const phase=SKILLS[skill].kind==='buff'?'prep':'main',target={a:'front',b:'rear',c:'rear',d:'center',e:'center',f:'front'}[CLASSES[HEROES.find(h=>h.id===id).classId].starterId];const rest=h[phase].filter(r=>r.skill!==skill);if(rest.length>=4)throw Error('该阶段已有4条指令，请先在准备页留出一格');h[phase]=[row(skill,target,phase==='prep'?'repeat':'cycle'),...rest];for(const override of Object.values(h.overrides||{}))delete override[phase];return c;}
export function assertGuildSkills(m,h){const locked=lockedSkills(m,h);if(locked.length)throw Error(`${HEROES.find(t=>t.id===m.id).name}尚未学习：${locked.map(s=>SKILLS[s].name).join('、')}。请先在公会学习或移除相关指令/专修。`);}
