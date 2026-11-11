import {ADVANCED,installAdvanced} from './expedition-growth.mjs';
import {SKILLS,roomsFor,resolveHeroPlan} from './expedition-data.mjs';
import {customizeForEditing} from './expedition-readiness.mjs';
import {validate} from './expedition-engine.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Use applied companion commands, not the draft hidden underneath a managed role.
// This is a structural preview; it neither learns a course nor predicts an action.
export function defaultCoursePreview(g,config,id){
 if(!Object.hasOwn(ADVANCED,id))throw Error('未知课程队员');const skill=ADVANCED[id];
 const phase=SKILLS[skill].kind==='buff'?'prep':'main',result={id,skill,phase,phaseName:phase==='prep'?'预备':'普通',name:SKILLS[skill].name,allowed:false,reasons:[],rooms:[],preservedOverrides:0,changesRole:false};
 const member=g.members.find(m=>m.id===id);if(!member)throw Error('队员尚未招募');
 if(g.pending)result.reasons.push('请先领取远征结算，再调整指令');
 if(!g.lineup.includes(id))result.reasons.push('请先安排此人出战');
 if(!member.unlocked.includes(skill))result.reasons.push('尚未学习本职业课程');
 if(result.reasons.length)return result;
 const edit=customizeForEditing(g,config,id),before=edit.config.heroes.find(h=>h.id===id);result.changesRole=edit.changed;
 try{
  const installed=installAdvanced(edit.config,id,skill,{preserveOverrides:true});validate(installed);const after=installed.heroes.find(h=>h.id===id);
  result.preservedOverrides=Object.values(before.overrides).filter(o=>Object.hasOwn(o,phase)).length;
  result.rooms=roomsFor(installed).map(room=>{const old=resolveHeroPlan(before,room.id)[phase],next=resolveHeroPlan(after,room.id)[phase];return {id:room.id,name:room.name,overridden:Object.hasOwn(before.overrides[room.id]||{},phase),changed:JSON.stringify(old)!==JSON.stringify(next),courseListed:next.some(r=>r.skill===skill)};});
  result.allowed=true;
 }catch(error){result.reasons.push(error.message);}
 return result;
}

export function installDefaultCourse(g,config,id){
 const preview=defaultCoursePreview(g,config,id);if(!preview.allowed)throw Error(preview.reasons.join('；'));
 const edit=customizeForEditing(g,config,id);
 return {...edit,config:installAdvanced(edit.config,id,preview.skill,{preserveOverrides:true})};
}

export function defaultCourseView(preview){return `<section class="course-default-install" data-course-member="${esc(preview.id)}"><button type="button" data-install-default="${esc(preview.skill)}" ${preview.allowed?'':'disabled'}>只加入默认${preview.phaseName} · 保留逐房指令</button><p>默认阶段置于首条；${preview.preservedOverrides?`保留${preview.preservedOverrides}份同阶段逐房覆盖。`:'保留其他阶段与房间设置。'}${preview.changesRole?'将当前实际伙伴指令转为自定义，可连同配置撤销。':''}学习与安装分开，安装不再花经验。</p><details data-growth-detail="course-scope"><summary>安装后在哪些房间列入课程</summary>${preview.reasons.map(s=>'<p>'+esc(s)+'</p>').join('')}<ul>${preview.rooms.map(room=>`<li data-course-room="${esc(room.id)}">${esc(room.name)} · ${room.overridden?'保留本房'+preview.phaseName+'覆盖':room.changed?'采用新默认'+preview.phaseName:'默认'+preview.phaseName+'不变'} · ${room.courseListed?'已列入此课程':'未列此课程'}</li>`).join('')}</ul><p>只核对当前路线的实际指令，不预测出手或胜负。保留的空指令覆盖仍为空；若要在该房使用课程，请到准备页明确修改。</p></details></section>`;}
