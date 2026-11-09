import test from 'node:test';
import assert from 'node:assert/strict';
import {actionFocusFrame,actionFocusView,projectPortrait} from '../dist/expedition-action-focus.mjs';
const unit=(id,side='party')=>({id,name:id,side,hp:50,maxHp:100,mp:20,maxMp:40,pos:'front'}),a=unit('a'),b=unit('b','enemy');
const event=(id,type,actor,targets,detail={},units=[a,b])=>({id,type,actor,targets,detail,units:structuredClone(units),supplies:{herb:5,rune:5,arrow:5},text:type+' '+id,phase:'main',round:1});
test('current action reads actual final snapshots and results without changing or simulating records',()=>{
 const group={events:[event(1,'cast','a',['b']),event(2,'attack','a',['b'],{actual:7,grade:'命中'},[a,{...b,hp:43}])]},original=structuredClone(group),frame=actionFocusFrame(group);
 assert.deepEqual(group,original);assert.equal(frame.actor.id,'a');assert.deepEqual(frame.recipients.map(c=>c.id),['b']);assert.equal(frame.recipients[0].unit.hp,43);assert.equal(frame.recipients[0].outcome.text,'−7');frame.recipients[0].unit.hp=0;assert.deepEqual(group,original);
});
test('interception displays the actual recipient and does not invent a hit on the declared target',()=>{
 const x=unit('x','enemy'),c=unit('c'),group={events:[event(1,'cast','x',['c'],{},[a,c,x]),event(2,'intercept','a',['c'],{success:true},[a,c,x]),event(3,'attack','x',['a'],{actual:9,grade:'命中'},[{...a,hp:41},c,x])]},frame=actionFocusFrame(group);
 assert.deepEqual(frame.recipients.map(c=>c.id),['a']);assert.equal(frame.recipients[0].outcome.hpLoss,9);assert.ok(!actionFocusView(frame).includes('data-action-unit="c"'));
});
test('repeated attacks on one unit remain one card with every recorded result, including a miss',()=>{
 const group={events:[event(1,'cast','a',['b']),event(2,'attack','a',['b'],{actual:7,grade:'命中'}),event(3,'attack','a',['b'],{actual:0,grade:'闪避'})]},frame=actionFocusFrame(group);
 assert.equal(frame.recipients.length,1);assert.equal(frame.recipients[0].outcome.attackRecords,2);assert.equal(frame.recipients[0].outcome.hpLoss,7);assert.match(frame.recipients[0].outcome.text,/1次闪避/);assert.match(actionFocusView(frame),/2次攻击记录/);
});
test('cast-only diagnostic steps cannot preview future targets or damage; self zero healing remains explicit',()=>{
 const cast=actionFocusFrame({events:[event(1,'cast','a',['b'])]});assert.equal(cast.recipients.length,0);assert.equal(cast.actor.outcome,null);
 const own=actionFocusFrame({events:[event(1,'item','a',[],{actual:0,resource:'hp'})]});assert.equal(own.recipients.length,0);assert.equal(own.actor.outcome.text,'+0');assert.match(actionFocusView(own),/\+0/);
});
test('departed objects keep their last recorded identity without claiming stale HP is a current snapshot',()=>{
 const spirit=unit('s'),frame=actionFocusFrame({events:[event(1,'cast','a',['s'],{},[a,spirit]),event(2,'dismiss','a',['s'],{},[a])]});
 assert.equal(frame.recipients[0].id,'s');assert.equal(frame.recipients[0].departed,true);assert.equal(frame.recipients[0].unit,null);assert.match(actionFocusView(frame),/本步已离场/);assert.match(actionFocusView(frame),/data-action-unit="s" disabled/);
});
test('environment steps have no invented actor, and all names/text are escaped',()=>{
 assert.equal(actionFocusFrame({events:[event(1,'room',null,[])]}),null);assert.equal(actionFocusView(null),'');
 const hostile={...a,name:'<img onerror="boom">'},frame=actionFocusFrame({events:[event(1,'cast','a',[],{},[hostile])]});const html=actionFocusView(frame);assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img onerror=&quot;boom&quot;&gt;'));
});
function portrait({deferred=false,id=false}={}){
 const attrs=new Map([['data-guardian-id','a'],...(id?[['id','unsafe-duplicate']]:[])]);let resolve;const ready=deferred?new Promise(r=>resolve=r):Promise.resolve();const original={startTime:deferred?null:31,playState:'running',playbackRate:1,ready};let captured;
 const source={getAnimations:()=>[original],querySelectorAll:()=>[],cloneNode:()=>copy};original.effect={target:source,getKeyframes:()=>[{transform:'rotate(0deg)',offset:0},{transform:'rotate(30deg)',offset:1}],getTiming:()=>({duration:900,iterations:1,fill:'none',easing:'linear'})};
 const copy={querySelectorAll:()=>[],hasAttribute:n=>attrs.has(n),getAttribute:n=>attrs.get(n),setAttribute:(n,v)=>attrs.set(n,v),removeAttribute:n=>attrs.delete(n),animate:(frames,timing)=>{captured={frames,timing,startTime:null,playState:'running',ready:Promise.resolve(),cancel(){this.playState='idle';}};return captured;}};
 const target={append:n=>{assert.equal(n,copy);}};return{source,copy,target,original,get captured(){return captured;},resolve(){original.startTime=57;resolve?.();}};
}
test('projection reuses exact source effects and start time while keeping the original identity and clock unchanged',()=>{
 const p=portrait(),r=projectPortrait(p.source,p.target);assert.equal(r.count,1);assert.equal(p.copy.hasAttribute('data-guardian-id'),false);assert.equal(p.copy.getAttribute('data-action-guardian-id'),'a');assert.deepEqual(p.captured.frames,p.original.effect.getKeyframes());assert.deepEqual(p.captured.timing,p.original.effect.getTiming());assert.equal(p.captured.startTime,31);assert.equal(p.original.startTime,31);r.cancel();assert.equal(p.captured.playState,'idle');assert.equal(p.original.playState,'running');
});
test('a delayed source start binds after readiness; cancellation blocks late asynchronous resurrection',async()=>{
 const first=portrait({deferred:true});projectPortrait(first.source,first.target);first.resolve();await new Promise(r=>setImmediate(r));assert.equal(first.captured.startTime,57);
 const stopped=portrait({deferred:true}),r=projectPortrait(stopped.source,stopped.target);r.cancel();stopped.resolve();await new Promise(r=>setImmediate(r));assert.equal(stopped.captured.playState,'idle');assert.equal(stopped.captured.startTime,null);
});
test('un-namespaced figure IDs fail before insertion and no-source fallbacks create no animation',()=>{
 const p=portrait({id:true});assert.throws(()=>projectPortrait(p.source,p.target),/namespaced SVG/);assert.equal(projectPortrait(null,p.target).count,0);
});
