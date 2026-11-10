import {clone,SKILLS} from './expedition-data.mjs';
import {focusedTarget} from './expedition-focus-mark.mjs';

// Authored planning option. It adds no skill, damage, range or free action.
export const TARGET_PICK_RULE='仅在本条原本合法的阵位或职责范围内，单体生命伤害攻击优先选择当前生命／机关耐久最低者。先遵守既有集火标记；生命相同沿原随机顺序。不会扩大范围、穿过近战阻挡、忽略免疫或援护，也不保证击倒或节省材料；每次实际出手重查。规则为项目改编。';
export const supportsTargetPick=skill=>skill?.kind==='attack'&&skill.mode==='single'&&skill.max===1&&!skill.nonDamaging&&!skill.manaDamage&&!skill.focusMark;
export const targetPickEnabled=command=>Object.hasOwn(command||{},'targetPick')&&command.targetPick==='lowestHp';
export function validateTargetPick(command){
 if(!Object.hasOwn(command||{},'targetPick'))return;
 if(command.targetPick!=='lowestHp'||!supportsTargetPick(SKILLS[command.skill]))throw Error('优先低生命仅用于合法的单体生命伤害攻击');
}
export function withTargetPick(command,enabled){
 if(typeof enabled!=='boolean')throw Error('择敌选项须为布尔值');
 const next=clone(command);if(enabled)next.targetPick='lowestHp';else delete next.targetPick;
 validateTargetPick(next);return next;
}
export const targetPickLabel=command=>targetPickEnabled(command)?' · 同范围优先低生命':'';
export function pickWithinCandidates(actor,candidates,skill,rng,command={},record){
 const pool=[...candidates],enabled=targetPickEnabled(command)&&supportsTargetPick(skill);
 const snapshot=enabled?pool.map(({id,name,pos,hp,maxHp})=>({id,name,pos,hp,maxHp})):null;
 const focus=focusedTarget(actor,pool,skill);
 let selected;
 if(focus)selected=[focus];
 else{
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  if(enabled)pool.sort((a,b)=>a.hp-b.hp);
  selected=pool.slice(0,skill.max);
 }
 if(enabled&&record)record({mode:'lowestHp',reason:focus?'existing_mark':pool.length?'lowest_current_hp':'no_legal_target',candidates:snapshot,selected:selected.map(({id,name,pos,hp,maxHp})=>({id,name,pos,hp,maxHp})),rule:TARGET_PICK_RULE});
 return selected;
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function targetPickEvidenceView(group){
 const trace=(group?.events||[group]).find(e=>e?.detail?.targetPicking)?.detail.targetPicking;
 if(!trace||trace.mode!=='lowestHp'||!Array.isArray(trace.candidates)||!Array.isArray(trace.selected)||[...trace.candidates,...trace.selected].some(u=>!u||typeof u!=='object'))return '';
 return `<section class=target-pick-proof><h3>同范围择敌 · 优先低当前生命</h3><p>择敌当时的合法候选：${trace.candidates.map(u=>`${esc(u.name)} ${esc(u.hp)}/${esc(u.maxHp)}`).join('、')||'无'}。</p><p>${trace.reason==='existing_mark'?'先遵守既有集火标记；':trace.reason==='no_legal_target'?'无合法目标，免费检查后备；':''}原指令目标：${trace.selected.map(u=>`${esc(u.name)}（择敌时 ${esc(u.hp)}/${esc(u.maxHp)}）`).join('、')||'未施放'}。援护与实际承伤仍按后续原记录结算。</p><small>${esc(trace.rule)}</small></section>`;
}
export function targetPickEditor(command,phase,index){
 if(!supportsTargetPick(SKILLS[command.skill]))return '';
 return `<label class="casting-media target-pick-control" title="${esc(TARGET_PICK_RULE)}"><input type=checkbox data-field=targetPick data-phase="${esc(phase)}" data-row="${esc(index)}" aria-label="同范围优先低当前生命" ${targetPickEnabled(command)?'checked':''}><svg viewBox="0 0 20 18" aria-hidden="true" focusable="false"><path d="M2 3h5l4 5M2 15h5l4-5M10 9h4"/><circle cx="16" cy="9" r="2"/></svg><b>同范围优先低当前生命</b>${targetPickEnabled(command)?'<span>先遵守集火标记；不扩大范围，援护照常结算。</span>':''}</label>`;
}
