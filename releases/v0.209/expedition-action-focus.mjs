import {stageFrame} from './expedition-stage.mjs';
import {unitActionOutcomes} from './expedition-action-outcomes.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=['guardian','ranger','bard','scholar','tidecaller','herbalist'];
export function actionFocusFrame(group){
 const frame=stageFrame(group),actor=frame.units.find(u=>u.id===frame.actor);if(!actor)return null;
 const outcomes=unitActionOutcomes(group),card=id=>{
  const current=frame.units.find(u=>u.id===id),previous=current||[...group.events].reverse().flatMap(e=>e.units).find(u=>u.id===id);
  return {id,name:previous?.name||id,unit:current?structuredClone(current):null,departed:!current,mark:previous?.mark||'',outcome:outcomes[id]?structuredClone(outcomes[id]):null,cues:frame.cues.filter(c=>c.unit===id).map(c=>({...c}))};
 };
 return {actor:card(actor.id),recipients:[...new Set(frame.targets)].filter(id=>id!==actor.id).map(card),eventIds:group.events.map(e=>e.id),text:(group.events.find(e=>e.type==='cast')||group.events[0]).text};
}
export function actionFocusView(frame){
 if(!frame)return '';
 const card=(c,actor)=>`<button type="button" class="action-focus-unit ${actor?'action-focus-actor':''} ${c.unit?.hp<=0?'action-focus-dead':''}" data-action-unit="${escape(c.id)}" ${c.departed?'disabled':''} aria-label="查看${escape(c.name)}状态"><span class="action-focus-art" data-action-art="${escape(c.id)}" aria-hidden="true"></span><span class="action-focus-name">${escape(c.name)}</span>${c.unit?`<small>HP ${c.unit.hp}/${c.unit.maxHp} · MP ${c.unit.mp}/${c.unit.maxMp}</small>`:'<small>本步已离场</small>'}${c.outcome?`<strong class="action-focus-result">${escape(c.outcome.text)}</strong>${c.outcome.multiple?`<small>${escape(c.outcome.countText)}</small>`:''}`:c.cues.length?`<small class="action-focus-cues">${escape([...new Set(c.cues.map(c=>c.text))].join(' · '))}</small>`:''}</button>`;
 return `<p class="action-focus-heading">当前行动 <span>本步已结算快照</span></p><p class="action-focus-text">${escape(frame.text)}</p><div class="action-focus-pair"><div>${card(frame.actor,true)}</div><span class="action-focus-direction" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h17m-6-6 6 6-6 6"/></svg></span><div class="action-focus-recipients" aria-label="本步实际影响对象">${frame.recipients.length?frame.recipients.map(c=>card(c,false)).join(''):'<p class="muted">本步没有其他快照对象。</p>'}</div></div>`;
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
export function mountActionFocus({stage,board,enabled,viewport=globalThis.window}){
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
 panel.addEventListener('click',e=>{const b=e.target.closest('[data-action-unit]');if(!b||b.disabled)return;[...board.querySelectorAll('[data-unit]')].find(n=>n.dataset.unit===b.dataset.actionUnit)?.click();});
 const resize=()=>{if(last)render(last);};media.addEventListener?.('change',resize);
 return {render,cancel,focusOffsetFor(node){return !panel.hidden&&media.matches&&board.contains(node)?Math.ceil(panel.getBoundingClientRect().height)+parseFloat(document.querySelector('#replay').style.getPropertyValue('--replay-transport-height')||'60')+14:null;},dispose(){cancel();media.removeEventListener?.('change',resize);wrapper.before(stage);wrapper.remove();}};
}
