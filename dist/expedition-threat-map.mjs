import {roomWaves} from './expedition-waves.mjs';
import {POS,TYPES,ROLE_TARGETS,SKILLS,clone,roomsFor,resolveHeroPlan} from './expedition-data.mjs';
import {buildParty,chooseTargets,current,defenseProfile,resistanceOf} from './expedition-engine.mjs';
import {scheduleLabel} from './expedition-schedule.mjs';
import {targetCountCheck} from './expedition-target-count.mjs';

export const THREAT_MAP_RULE='只核对各房初始敌人指令与当前队员站位，假定全员存活、没有临时效果。候选是可能被选中的范围，单次仍受技能人数上限约束；不代表每人都会受击。各条普通指令是后备或轮转关系，不能相加为攻击次数。窗口、法力、材料、先攻、减员、援护、召唤及分支会改变实际执行；这里不试演、不估伤害或胜负。';

// Collect the whole legal group through the engine's existing targeting rule.
// Its local deterministic shuffle is discarded, not a sampled future target.
export function threatCandidates(enemy,party,command){
 const skill=SKILLS[command.skill];if(skill?.kind!=='attack')return [];
 const ids=new Set(chooseTargets({...enemy,side:'enemy'},party,{...skill,max:Number.MAX_SAFE_INTEGER},command.target,()=>0).map(u=>u.id));
 return party.filter(u=>ids.has(u.id));
}
export function enemyThreatMap(config,scope=''){
 const rooms=roomsFor(config);if(scope&&!rooms.some(r=>r.id===scope))throw Error('威胁核对房间不属于当前路线');
 const base=buildParty(config);
 return rooms.filter(r=>!scope||r.id===scope).map(room=>{
  const party=base.map(u=>{const p=resolveHeroPlan(config.heroes.find(h=>h.id===u.id),room.id);return {...u,pos:p.pos,defenses:clone(p.defenses)};});
  const waves=roomWaves(room),attacks=waves.flatMap((wave,waveIndex)=>wave.enemies.flatMap(enemy=>enemy.main.flatMap((command,row)=>{
   const skill=SKILLS[command.skill];if(skill.kind!=='attack')return [];
   const candidates=threatCandidates(enemy,party,command),count=targetCountCheck(command,Math.min(candidates.length,skill.max));
   return [{...(waves.length>1?{wave:waveIndex+1}:{}),id:enemy.id+':'+row,source:enemy.id,name:enemy.name,sourcePosition:enemy.pos,row,skill:command.skill,type:skill.type,target:command.target,mode:command.mode,limit:skill.max,window:command.roundWindow?clone(command.roundWindow):null,dispel:Boolean(skill.dispel),...(skill.actionDamp?{offbeat:true}:{}),targetCount:count,candidates:candidates.map(u=>u.id)}];
  })));
  const heroes=party.map(u=>({id:u.id,name:u.name,pos:u.pos,attacks:attacks.filter(a=>a.candidates.includes(u.id)).map(a=>{
   const profile=defenseProfile(u,a.type);return {attack:a.id,type:a.type,defense:profile.name,defenseCost:profile.cost,defenseReason:profile.reason||'',resistance:resistanceOf(u,a.type),armor:a.type==='mental'?null:current(u,'armor')};
  })}));
  return {...(waves.length>1?{waves:waves.length}:{}),roomId:room.id,name:room.name,note:room.note,conditional:['chapter','harbor','foundry','courier'].includes(config.expedition),attacks,heroes};
 });
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode={repeat:'持续检查',cycle:'执行后下一条',once:'本房一次',round:'每回合一次'};
const aim=a=>a.type==='melee'?'按近战阵位路线':POS[a.target]||ROLE_TARGETS[a.target]||'按个人阵位优先';
export function enemyThreatMapView(rooms,{actual=false,editable=true}={}){
 return `<section class="enemy-threat-map"><h3>敌方攻击范围核对 · ${actual?'公会实际配置':'准备页草稿'}</h3><p>${rooms.some(r=>r.waves)?THREAT_MAP_RULE.replace('各房初始敌人指令','各房各波公开模板的指令'):THREAT_MAP_RULE}</p>${rooms.map(room=>{
  const names=ids=>ids.map(id=>room.heroes.find(h=>h.id===id)?.name||id).map(esc).join('、')||'当前无候选';
  return `<details class="threat-room" data-threat-room="${esc(room.roomId)}" ${rooms.length===1?'open':''}><summary>${esc(room.name)} · ${room.attacks.length}条${room.waves?'各波公开':'初始'}普通攻击配置</summary>${room.waves?'<p class=wave-threat-rule>本房含公开增援，各波按清场顺序抵达；这里分波核对，不把各波指令相加成同时攻击次数。队伍生命、法力、召唤和本房一次指令不重置，实际候选会变化。</p>':''}${room.conditional?'<p class="ready-diff">本路线含抵达时事件或通路变化。此处只映射公开初始模板，不预先决定实际分支、损失或末房变化；请结合房间说明。</p>':''}<div class="threat-attacks">${room.attacks.map(a=>`<article data-threat-attack="${esc(a.id)}"><h4>${a.wave?'第'+a.wave+'波 · ':''}${esc(a.name)} · 普通第${a.row+1}条 · ${SKILLS[a.skill].name}</h4><p>${POS[a.sourcePosition]}来源 / ${TYPES[a.type]} / ${mode[a.mode]}${scheduleLabel({roundWindow:a.window})} → ${aim(a)}</p><p class="threat-candidates">${a.wave?'该波模板候选':'初始候选'}：${names(a.candidates)}；单次至多${a.limit}人${a.candidates.length>a.limit?'，不会同时攻击全部候选':''}。</p>${a.targetCount?.blocked?`<p>初始可选${a.targetCount.available}人，少于本条要求${a.targetCount.required}人；按原规则检查后备，不表示后续一直不会施放。</p>`:''}${a.offbeat?'<p>迟拍还要求当时已有额外行动且无迟拍。初始空候选不表示安全，预备辅助后会重新检查；只影响下一回合队列。</p>':''}${a.dispel?'<p>破印还要求目标当时带有可破除增益。当前没有增益的空候选不表示安全；预备辅助后须按实际效果重新选择。</p>':''}</article>`).join('')||'<p>没有初始普通攻击配置；预备、召唤与事件仍须查看敌情。</p>'}</div><div class="threat-heroes">${room.heroes.map(h=>`<article data-threat-hero="${esc(h.id)}"><h4>${esc(h.name)} · ${POS[h.pos]}</h4>${h.attacks.length?`<ul>${h.attacks.map(p=>{const a=room.attacks.find(a=>a.id===p.attack);return `<li>${a.wave?'第'+a.wave+'波 · ':''}${esc(a.name)} / ${SKILLS[a.skill].name}：${esc(p.defense)}${p.defenseCost?'（每次需'+p.defenseCost+'法力）':''}${p.defenseReason?' · '+esc(p.defenseReason):''}；${TYPES[p.type]}抗性${p.resistance}%${p.armor===null?'，护甲不参与此类伤害':'，基础护甲'+p.armor+'（穿甲会另行调整）'}。</li>`;}).join('')}</ul>`:'<p>当前未落入这些初始普通攻击候选；减员、破印条件、召唤和分支变化后仍可能受击。</p>'}<button data-threat-edit="${esc(h.id)}" data-threat-scope="${esc(room.roomId)}" ${editable?'':'disabled'}>调整${esc(h.name)}本房站位与防御</button></article>`).join('')}</div><small>防御采用当前满法力、无临时效果的配置；实际缺蓝或装备不满足时依原规则回退。${actual?'调整伙伴沿既有编辑流程保留其实际职责指令并切到自定义，可在方案管理撤销。':'本草稿与公会实际装备、训练和伙伴职责可能不同，正式出征前请核对公会。'}</small></details>`;
 }).join('')}</section>`;
}
