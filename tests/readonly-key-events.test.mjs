import test from 'node:test';
import assert from 'node:assert/strict';
import {mountSaveOwnership} from '../dist/expedition-save-ownership-view.mjs';
import {SAVE_KEYS,SaveOwnershipError} from '../dist/expedition-save-ownership.mjs';

test('read-only replay shortcut is not intercepted but edits and native saved bytes remain protected',async()=>{
 const captures=new Map(),notices={textContent:''};let focusCount=0;
 const node=(...selectors)=>({attributes:{},closest(s){return s.split(',').some(x=>selectors.includes(x))?this:null;},matches(){return false;},setAttribute(k,v){this.attributes[k]=v;}});
 const list=node('#key-events'),shortcut=node('#key-events','[data-key-event]'),edit=node('#restore-report'),claim=node('[data-report-cycle=claim]');
 // querySelectorAll matches elements, not their ancestors; closest models event bubbling.
 const controls=new Map([['#key-events',list],['[data-key-event]',shortcut],['#restore-report',edit],['[data-report-cycle=claim]',claim]]);
 class TestStore {constructor(){this.raw=new Map(SAVE_KEYS.map((k,i)=>[k,`raw-${i}`]));this.nativeWrites=0;}getItem(k){return this.raw.get(k)??null;}setItem(k,v){this.nativeWrites++;this.raw.set(k,v);}removeItem(k){this.nativeWrites++;this.raw.delete(k);}clear(){this.nativeWrites++;this.raw.clear();}}
 const storage=new TestStore(),snapshot=()=>SAVE_KEYS.map(k=>storage.getItem(k));
 const box={dataset:{},setAttribute(){},addEventListener(){},querySelector(k){return k==='strong'?{focus(){focusCount++;}}:null;}};
 const document={body:{dataset:{},prepend(){}},createElement(){return box;},querySelector(k){return k==='#guild-feedback'||k==='#notice'?notices:null;},querySelectorAll(s){return [...new Set(s.split(',').map(k=>controls.get(k)).filter(Boolean))];},addEventListener(t,fn,capture){assert.equal(capture,true);captures.set(t,fn);}};
 const globals={document,navigator:{locks:{request(_name,_opts,callback){return callback(null);}}},localStorage:storage,MutationObserver:class{observe(){}},addEventListener(){}};
 const saved=Object.fromEntries(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 try{
  for(const [k,value] of Object.entries(globals))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value});
  const owner=await mountSaveOwnership();assert.equal(owner.state.status,'readonly');assert.equal(owner.guardInstalled,true);const before=snapshot();
  const click=target=>{const disposition={defaultPrevented:false,stopped:false};captures.get('click')({target,preventDefault(){disposition.defaultPrevented=true;},stopImmediatePropagation(){disposition.stopped=true;}});return disposition;};
  assert.equal(list.attributes['aria-disabled'],undefined);assert.deepEqual(click(shortcut),{defaultPrevented:false,stopped:false});assert.equal(focusCount,0);
  for(const button of [edit,claim]){assert.equal(button.attributes['aria-disabled'],'true');assert.deepEqual(click(button),{defaultPrevented:true,stopped:true});}assert.equal(focusCount,2);
  for(const k of SAVE_KEYS){assert.throws(()=>storage.setItem(k,'bad'),SaveOwnershipError);assert.throws(()=>storage.removeItem(k),SaveOwnershipError);}
  assert.throws(()=>storage.clear(),SaveOwnershipError);assert.deepEqual(snapshot(),before);assert.equal(storage.nativeWrites,0);
 }finally{for(const [k,d] of Object.entries(saved))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
});
