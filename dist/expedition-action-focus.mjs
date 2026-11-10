import {stageFrame} from './expedition-stage.mjs';
import {unitActionOutcomes} from './expedition-action-outcomes.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=['guardian','ranger','bard','scholar','tidecaller','herbalist','inkcaster','fieldmedic'];
export function actionInterceptionRecord(report,group,eventId,source=group){
 if(!Array.isArray(report?.events)||!group?.events?.length||!source?.events?.length||!Number.isSafeInteger(eventId))return null;
 if(!Number.isSafeInteger(group.start)||!Number.isSafeInteger(group.end)||group.start<0||group.end<group.start||group.end>=report.events.length)return null;
 if(group.start!==source.start||group.end!==source.end||group.events.length!==source.events.length||group.events.some((e,i)=>e!==source.events[i]||!report.events.includes(e)))return null;
 const slice=report.events.slice(group.start,group.end+1);if(slice.length!==group.events.length||slice.some((e,i)=>e!==group.events[i]))return null;
 const matches=report.events.filter(e=>e.id===eventId),event=group.events.find(e=>e.id===eventId&&e.type==='intercept');
 if(matches.length!==1||event!==matches[0])return null;
 return {eventId,index:report.events.indexOf(event),guardian:event.actor,text:event.text};
}
export function actionFocusFrame(group){
 const frame=stageFrame(group),actor=frame.units.find(u=>u.id===frame.actor);if(!actor)return null;
 const outcomes=unitActionOutcomes(group),card=id=>{
  const current=frame.units.find(u=>u.id===id),previous=current||[...group.events].reverse().flatMap(e=>e.units).find(u=>u.id===id);
  return {id,name:previous?.name||id,unit:current?structuredClone(current):null,departed:!current,mark:previous?.mark||'',outcome:outcomes[id]?structuredClone(outcomes[id]):null,cues:frame.cues.filter(c=>c.unit===id).map(c=>({...c}))};
 };
 const interceptions=group.events.filter(e=>e.type==='intercept'&&Number.isSafeInteger(e.id)).map(e=>({eventId:e.id,text:e.text,success:typeof e.detail?.success==='boolean'?e.detail.success:null,guardianName:typeof e.detail?.guardianName==='string'?e.detail.guardianName:null,protectedName:typeof e.detail?.protectedName==='string'?e.detail.protectedName:null,cost:Number.isFinite(e.detail?.cost)&&e.detail.cost>=0?e.detail.cost:null}));
 return {actor:card(actor.id),recipients:[...new Set(frame.targets)].filter(id=>id!==actor.id).map(card),interceptions,eventIds:group.events.map(e=>e.id),text:(group.events.find(e=>e.type==='cast')||group.events[0]).text};
}
export function actionFocusView(frame){
 if(!frame)return '';
 const card=(c,actor)=>`<button type="button" class="action-focus-unit ${actor?'action-focus-actor':''} ${c.unit?.hp<=0?'action-focus-dead':''}" data-action-unit="${escape(c.id)}" ${c.departed?'disabled':''} aria-label="查看${escape(c.name)}状态"><span class="action-focus-art" data-action-art="${escape(c.id)}" aria-hidden="true"></span><span class="action-focus-name">${escape(c.name)}</span>${c.unit?`<small>HP ${c.unit.hp}/${c.unit.maxHp} · MP ${c.unit.mp}/${c.unit.maxMp}</small>`:'<small>本步已离场</small>'}${c.outcome?`<strong class="action-focus-result">${escape(c.outcome.text)}</strong>${c.outcome.multiple?`<small>${escape(c.outcome.countText)}</small>`:''}`:c.cues.length?`<small class="action-focus-cues">${escape([...new Set(c.cues.map(c=>c.text))].join(' · '))}</small>`:''}</button>`;
 const causes=(frame.interceptions||[]).map(e=>{const label=e.success!==null&&e.guardianName&&e.protectedName?(e.success?`${e.guardianName} 替 ${e.protectedName} 接招`:`${e.guardianName} 未及援护 ${e.protectedName}`):e.text;return `<button type="button" data-action-interception="${e.eventId}" aria-label="查看援护原记录 ${e.eventId}：${escape(e.text)}"><img src="assets/interception-link-v210.svg" width="20" height="20" alt="" aria-hidden="true"><span>${escape(label)}<small>${e.cost===null?'':'援护已付 '+escape(e.cost)+' MP · '}查看原记录 ↗</small></span></button>`;}).join('');
 return `<p class="action-focus-heading">当前行动 <span>本步已结算快照</span></p><p class="action-focus-text">${escape(frame.text)}</p>${causes?`<div class="action-interceptions" role="group" aria-label="本步援护原因">${causes}</div>`:''}<div class="action-focus-pair"><div>${card(frame.actor,true)}</div><span class="action-focus-direction" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h17m-6-6 6 6-6 6"/></svg></span><div class="action-focus-recipients" aria-label="本步实际影响对象">${frame.recipients.length?frame.recipients.map(c=>card(c,false)).join(''):'<p class="muted">本步没有其他快照对象。</p>'}</div></div>`;
}
// SVG <use> does not follow source Web Animation effects in Chromium. Reuse the
// actual native geometry, then bind copies of the exact effects to their source
// document timeline/start time. No pose model, timer or combat state is created.
export function projectPortrait(source,target){
 if(!source)return {cancel(){},count:0};
 const clone=source.cloneNode(true),left=[source,...source.querySelectorAll('*')],right=[clone,...clone.querySelectorAll('*')],running=[];let disposed=false;
 for(const node of right)for(const role of roles){const name='data-'+role+'-id';if(node.hasAttribute(name)){node.setAttribute('data-action-'+role+'-id',node.getAttribute(name));node.removeAttribute(name);}}
 // Native figures currently use no SVG IDs. Fail closed if that contract changes.
 if(right.some(n=>n.hasAttribute('id')))throw Error('Action projection requires an explicitly namespaced SVG');
 target.append(clone);
 for(let i=0;i<left.length;i++)for(const original of left[i].getAnimations?.()||[]){
  if(original.effect?.target!==left[i]||!original.effect?.getKeyframes||!right[i].animate)continue;
  const copy=right[i].animate(original.effect.getKeyframes(),{...original.effect.getTiming()});copy.playbackRate=original.playbackRate;running.push(copy);
  const bind=()=>{if(disposed||original.playState==='idle'||copy.playState==='idle')return;if(original.startTime!==null)copy.startTime=original.startTime;};
  if(original.startTime!==null)bind();else Promise.all([original.ready,copy.ready]).then(bind,()=>{});
 }
 return {cancel(){disposed=true;for(const animation of running)animation.cancel();},count:running.length};
}
export function mountActionFocus({stage,board,enabled,onRecord=()=>{},viewport=globalThis.window}){
 const document=stage.ownerDocument,wrapper=document.createElement('div'),panel=document.createElement('section');wrapper.className='action-focus-wrapper';panel.id='action-focus';panel.className='action-focus';panel.setAttribute('aria-label','当前行动对象');panel.hidden=true;stage.before(wrapper);wrapper.append(panel,stage);
 const media=viewport.matchMedia('(max-width:700px)');let last=null,projections=[];
 function cancel(){for(const p of projections)p.cancel();projections=[];}
 function render(group){cancel();last=group;const frame=group?actionFocusFrame(group):null,show=media.matches&&enabled.checked&&!!frame;panel.hidden=!show;panel.replaceChildren();if(!show)return;
  panel.innerHTML=actionFocusView(frame);
  for(const node of panel.querySelectorAll('[data-action-art]')){
   const source=[...board.querySelectorAll('[data-unit]')].find(n=>n.dataset.unit===node.dataset.actionArt)?.querySelector('.portrait');
   if(source)projections.push(projectPortrait(source,node));else node.textContent='◇';
  }
 }
 panel.addEventListener('click',e=>{const source=e.target.closest('[data-action-interception]');if(source){onRecord(Number(source.dataset.actionInterception),last);return;}const b=e.target.closest('[data-action-unit]');if(!b||b.disabled)return;[...board.querySelectorAll('[data-unit]')].find(n=>n.dataset.unit===b.dataset.actionUnit)?.click();});
 const resize=()=>{if(last)render(last);};media.addEventListener?.('change',resize);
 return {render,cancel,focusOffsetFor(node){return !panel.hidden&&media.matches&&board.contains(node)?Math.ceil(panel.getBoundingClientRect().height)+parseFloat(document.querySelector('#replay').style.getPropertyValue('--replay-transport-height')||'60')+14:null;},dispose(){cancel();media.removeEventListener?.('change',resize);wrapper.before(stage);wrapper.remove();}};
}
