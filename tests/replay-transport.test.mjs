import test from 'node:test';
import assert from 'node:assert/strict';
import {mountReplayTransport} from '../dist/expedition-replay-transport.mjs';

function fixture({observers=true}={}){
 const values=new Map(),listeners=new Map(),observations=[],instances=[];
 const root={parentElement:null,style:{getPropertyValue:n=>values.get(n)?.[0]||'',getPropertyPriority:n=>values.get(n)?.[1]||'',setProperty:(n,v,p='')=>values.set(n,[v,p]),removeProperty:n=>values.delete(n)}};
 const controls={parentElement:root,box:{width:300,height:300.4},getBoundingClientRect(){return this.box;}},transport={box:{width:280,height:44.2},getBoundingClientRect(){return this.box;}};
 class Observer{constructor(cb){this.cb=cb;instances.push(this);}observe(n,options){observations.push({n,options});}disconnect(){this.closed=true;}}
 const viewport={addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:(n,f)=>{if(listeners.get(n)===f)listeners.delete(n);}};
 const mount=()=>mountReplayTransport({root,controls,transport,viewport,Resize:observers?Observer:null,Mutation:observers?Observer:null});
 return{root,controls,transport,values,listeners,observations,instances,mount};
}
test('uses the live toolbar and transport dimensions across reflow and visibility changes',()=>{
 const f=fixture(),h=f.mount();assert.equal(f.values.get('--replay-toolbar-height')[0],'301px');assert.equal(f.values.get('--replay-transport-height')[0],'65px');
 f.controls.box.height=390;f.transport.box.height=61;f.instances[0].cb();assert.equal(f.values.get('--replay-toolbar-height')[0],'390px');assert.equal(f.values.get('--replay-transport-height')[0],'81px');
 f.controls.box.width=0;f.transport.box.width=0;f.instances[1].cb();assert.equal(f.values.get('--replay-toolbar-height')[0],'0px');assert.equal(f.values.get('--replay-transport-height')[0],'0px');h.dispose();
});
test('the fallback measures resize and explicit updates without observer support',()=>{
 const f=fixture({observers:false}),h=f.mount();f.controls.box.height=420;f.listeners.get('resize')();assert.equal(f.values.get('--replay-toolbar-height')[0],'420px');f.transport.box.height=45;h.update();assert.equal(f.values.get('--replay-transport-height')[0],'65px');h.dispose();assert.equal(f.listeners.size,0);
});
test('observes ancestor visibility only and restores earlier scoped inline values on teardown',()=>{
 const f=fixture();f.values.set('--replay-toolbar-height',['17px','important']);const h=f.mount();assert.ok(f.observations.some(o=>o.n===f.root&&o.options.attributeFilter.includes('hidden')));assert.ok(f.observations.filter(o=>o.options).every(o=>!o.options.subtree&&!o.options.attributeFilter.includes('style')));
 h.dispose();assert.deepEqual(f.values.get('--replay-toolbar-height'),['17px','important']);assert.equal(f.values.has('--replay-transport-height'),false);for(const o of f.instances){assert.ok(o.closed);o.cb();}h.update();h.dispose();assert.deepEqual(f.values.get('--replay-toolbar-height'),['17px','important']);assert.equal(f.values.size,1);
});
test('ignores invalid geometry and does not rewrite unchanged properties',()=>{
 const f=fixture();let writes=0;const set=f.root.style.setProperty;f.root.style.setProperty=(...a)=>{writes++;set(...a);};const h=f.mount();assert.equal(writes,2);h.update();assert.equal(writes,2);f.controls.box.height=NaN;f.transport.box.height=-10;h.update();assert.equal(f.values.get('--replay-toolbar-height')[0],'0px');assert.equal(f.values.get('--replay-transport-height')[0],'0px');h.dispose();
});
