import test from 'node:test';
import assert from 'node:assert/strict';
import {supportFrame,supportMoments} from '../dist/expedition-support.mjs';
import {stageFrame} from '../dist/expedition-stage.mjs';
import {groupActions} from '../dist/expedition-report.mjs';
import {defaults} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
const report=simulate(defaults());
test('实际支援变化保留来源、目标、数值，投影不修改战报',()=>{
 const before=JSON.stringify(report),groups=groupActions(report.events),g=groups.find(g=>g.events.some(e=>e.type==='effect'));const v=supportFrame(g),effects=g.events.filter(e=>e.type==='effect');
 assert.ok(v.changes.length);assert.deepEqual(v.recipients,[...new Set(effects.flatMap(e=>e.targets))]);assert.ok(v.changes.every(c=>c.source&&c.recipient));assert.equal(JSON.stringify(report),before);
});
test('支援导航按完整行动分组且不越房间，延迟和到期保留区别',()=>{
 const moments=supportMoments(report.events,0);assert.ok(moments.length);assert.ok(moments.every(m=>report.events[m.start].roomIndex===0));assert.equal(new Set(moments.map(m=>m.start)).size,moments.length);
 const units=[{id:'a',name:'甲',effects:[{active:false}]}],base={actor:'a',targets:['a'],units,supplies:{},detail:{active:false,activateRound:2,component:'节拍',stat:'actions',value:1}};
 const v=supportFrame({events:[{...base,id:1,type:'effect'}]});assert.equal(v.changes[0].state,'等待生效');assert.equal(v.counts.a.pending,1);
 const expiry={events:[{...base,id:2,type:'expire',detail:{component:'节拍',stat:'actions'}}]};assert.equal(supportFrame(expiry).changes[0].state,'到期');assert.equal(stageFrame(expiry).links[0].kind,'expire');
});
