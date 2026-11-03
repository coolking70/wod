import test from 'node:test';
import assert from 'node:assert/strict';
import {effectOrigins,sourceTrace} from '../dist/expedition-source-trace.mjs';
import {groupActions} from '../dist/expedition-report.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {defaults} from '../dist/expedition-data.mjs';
const report=simulate(defaults());
test('真实战报的攻击与防御支援精确定位到原始施放，投影只读',()=>{
 const before=JSON.stringify(report),origins=effectOrigins(report.events),traces=groupActions(report.events).flatMap(g=>sourceTrace(g,origins));
 const linked=traces.flatMap(t=>t.effects).filter(e=>e.origin!==null);assert.ok(linked.length>0);assert.ok(linked.some(e=>e.side==='防御者'));
 for(const e of linked){const origin=report.events[e.origin];assert.equal(origin.type,'effect');assert.ok(origin.targets.length);}
 assert.equal(JSON.stringify(report),before);
});
test('同名同数值的不同施放通过标识区分，不猜测缺失来源',()=>{
 const units=[{id:'a',name:'甲'},{id:'b',name:'乙'}],events=[{type:'effect',actor:'a',targets:['b'],detail:{effectId:'first'}},{type:'effect',actor:'a',targets:['b'],detail:{effectId:'second'}}],map=effectOrigins(events);
 const group={start:3,events:[{type:'attack',id:4,actor:'b',targets:['a'],units,detail:{sources:[{effectId:'second',source:'a',name:'同名',stat:'skill',value:3}],targetSources:[]}}]};
 assert.equal(sourceTrace(group,map)[0].effects[0].origin,1);
 group.events[0].detail.sources[0].effectId='missing';assert.equal(sourceTrace(group,map)[0].effects[0].origin,null);
 group.events[0].detail.sources[0].effectId='second';group.start=1;assert.equal(sourceTrace(group,map)[0].effects[0].origin,null);
});
