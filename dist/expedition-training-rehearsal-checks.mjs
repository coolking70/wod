import {TYPES,SKILLS,roomsFor,resolveHeroPlan} from './expedition-data.mjs';
import {validate,buildParty,mean,skillLevel,current,skillBreakdown,defenseProfile} from './expedition-engine.mjs';
import {initiativeProfile} from './expedition-initiative.mjs';
// Departure-static check values only; no simulation, payment or report mutation.
export function trainingRehearsalChecks(trial){
 const configs={before:trial?.reports?.before?.config,after:trial?.reports?.after?.config};
 if(!configs.before||!configs.after||!trial.id)return null;
 const sides={};for(const [key,config]of Object.entries(configs)){validate(config);const hero=config.heroes.find(h=>h.id===trial.id),unit=buildParty(config).find(u=>u.id===trial.id);if(!hero||!unit)return null;sides[key]={config,hero,unit,rooms:roomsFor(config)};}
 const a=sides.before,b=sides.after;if(JSON.stringify(a.rooms.map(r=>r.id))!==JSON.stringify(b.rooms.map(r=>r.id)))return null;
 const skills=Object.keys(a.unit.skills).filter(id=>Object.hasOwn(b.unit.skills,id)).map(id=>({id,name:SKILLS[id].name,before:{level:skillLevel(a.unit,id),mean:mean(a.unit,id)},after:{level:skillLevel(b.unit,id),mean:mean(b.unit,id)}})).filter(r=>r.before.level!==r.after.level||r.before.mean!==r.after.mean);
 const checks=[],grouped=new Map(),profile=p=>({requested:p.requested,skill:p.skill,name:p.name,level:p.level,mean:p.mean,cost:p.cost,reason:p.reason||null,...(p.passiveTraining?{passive:{rank:p.passiveTraining.rank,amount:p.passiveTraining.amount}}:{})});
 function add(kind,type,room,before,after){if(JSON.stringify(before)===JSON.stringify(after))return;const key=JSON.stringify([kind,type,before,after]),old=grouped.get(key);if(old){old.rooms.push({id:room.id,name:room.name});return;}const row={kind,type,rooms:[{id:room.id,name:room.name}],before,after};grouped.set(key,row);checks.push(row);}
 for(const room of a.rooms){const units=Object.fromEntries(Object.entries(sides).map(([key,s])=>[key,{...s.unit,...resolveHeroPlan(s.hero,room.id),effects:[]} ]));
  for(const type of Object.keys(TYPES))add('defense',type,room,profile(defenseProfile(units.before,type)),profile(defenseProfile(units.after,type)));
  const initiative=u=>{const p=initiativeProfile(u,{current,mean,skillBreakdown});return p?{name:p.name,mean:p.mean,cost:p.cost,reason:p.reason||null}:{name:'自然先攻',mean:2*current(u,'agi')+current(u,'per'),cost:0,reason:null};};add('initiative','initiative',room,initiative(units.before),initiative(units.after));
 }
 return {skills,checks};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function trainingRehearsalChecksView(value){
 if(!value)return '<p data-training-checks-unavailable>本份试演的出发检定对照不可用，请查看两份完整原始战报。</p>';
 const rows=[...value.skills.map(r=>`<li data-check-kind="skill">${esc(r.name)}：静态等级 ${esc(r.before.level)} → ${esc(r.after.level)}；检定均值 ${esc(r.before.mean)} → ${esc(r.after.mean)}</li>`),...value.checks.map(r=>`<li data-check-kind="${esc(r.kind)}" data-check-type="${esc(r.type)}">${esc(r.rooms.map(x=>x.name).join('、'))} · ${r.kind==='defense'?esc(TYPES[r.type])+' / ':''}${esc(r.before.name)}${r.before.name===r.after.name?'':' → '+esc(r.after.name)}：${r.kind==='defense'?'等级 '+esc(r.before.level)+' → '+esc(r.after.level)+'；':''}检定均值 ${esc(r.before.mean)} → ${esc(r.after.mean)}；防御/先攻法力 ${esc(r.before.cost)} → ${esc(r.after.cost)}${r.before.passive||r.after.passive?'；耐病修习 '+esc(r.before.passive?.rank||0)+' → '+esc(r.after.passive?.rank||0)+'级，被动加值 '+esc(r.before.passive?.amount||0)+' → '+esc(r.after.passive?.amount||0):''}${r.before.reason||r.after.reason?'；回退原因 '+esc(r.before.reason||'无')+' → '+esc(r.after.reason||'无'):''}</li>`)];
 return `<details data-training-checks><summary>核对出发检定变化 · ${rows.length}项</summary>${rows.length?'<ul>'+rows.join('')+'</ul>':'<p>当前配置核对的出发技能、防御与先攻检定没有变化。</p>'}<p>这里分开列出等级与检定均值；同一数值不等于同一来源或实际收益。按出发法力和各房已配置防御/先攻核对，不预测跨房剩余法力、房间修正、临时状态、实际掷值或胜率。伤害、治疗与行动后果仍看完整战报；培养不会自动添加指令。</p></details>`;
}
