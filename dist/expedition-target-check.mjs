import {attackEligible} from './expedition-immunity.mjs';
import {hasSummoningSkill} from './expedition-summons.mjs';
import {ROLE_TARGETS,SKILLS,POS,TYPES} from './expedition-data.mjs';
export function roleTargetCandidates(enemies,target,skill){if(!Object.hasOwn(ROLE_TARGETS,target))return [];return enemies.filter(u=>u.hp>0&&(!skill||attackEligible(u,skill))&&(target==='summoner'?hasSummoningSkill(u):u.skills?.heal!==undefined));}
export function initialTargetWarnings(plan,room){
 const warnings=[];
 for(const phase of ['prep','main'])plan[phase].forEach((command,row)=>{const common={...(room.reinforcements?{reinforcements:true}:{}),actor:plan.id,roomId:room.id,roomName:room.name,phase,row,skill:command.skill,target:command.target};const skill=SKILLS[command.skill];if(skill.kind==='attack'&&Object.hasOwn(ROLE_TARGETS,command.target)&&!roleTargetCandidates(room.enemies,command.target,skill).length)warnings.push({...common,...(roleTargetCandidates(room.enemies,command.target).length?{immunity:true,attackType:skill.type}:{})});if(command.onlyPosition&&!room.enemies.some(u=>u.hp>0&&u.pos===command.target&&attackEligible(u,skill)))warnings.push({...common,onlyPosition:true,...(room.enemies.some(u=>u.hp>0&&u.pos===command.target)?{immunity:true,attackType:skill.type}:{})});});
 return warnings;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function initialTargetWarningsView(warnings){
 if(!warnings.length)return '';
 return `<details class="ready-target-check"><summary>初始${warnings.some(w=>w.onlyPosition)?'阵位与职责':'职责'}目标提醒 · ${warnings.length}条</summary><p>只按各房初始敌人的${warnings.some(w=>w.onlyPosition)?'技能与站位':'技能'}检查。战中会重新检查目标，敌方支援、召唤或分支可能改变候选；这不是禁用指令或通关预测，不阻止出征。</p><ul>${warnings.map(w=>`<li>${esc(w.roomName)} · ${w.phase==='main'?'普通':'预备'}第${w.row+1}条：${SKILLS[w.skill].name}${w.immunity?'该阵位/职责存在，但其初始成员均免疫本条'+TYPES[w.attackType]+'攻击。':'初始没有'+(w.onlyPosition?'指定'+POS[w.target]+'阵位的':ROLE_TARGETS[w.target])+'候选。'}${w.reinforcements?(w.onlyPosition?'本房公开增援可能新增此阵位候选；含此条件的阶段每个新回合从首条重查。':'本房公开增援可能新增候选，须按实际游标重新检查。'):''}<button data-cooperation-edit="${esc(w.actor)}" data-cooperation-room="${esc(w.roomId)}" data-cooperation-row="${w.row}" data-cooperation-phase="${w.phase}">查看此条指令</button></li>`).join('')}</ul></details>`;
}
