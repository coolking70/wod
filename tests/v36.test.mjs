import test from 'node:test';
import assert from 'node:assert/strict';
import {highlightedSteps} from '../dist/expedition-highlights.mjs';
import {groupActions} from '../dist/expedition-report.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {defaults} from '../dist/expedition-data.mjs';
test('关键回放保留完整行动及所有房间结算，不改变战报',()=>{
 const r=simulate(defaults()),before=JSON.stringify(r),full=groupActions(r.events),selected=highlightedSteps(r.events);assert.ok(selected.length<full.length);
 for(const g of selected)assert.deepEqual(g,full.find(x=>x.start===g.start));
 for(const [i,e] of r.events.entries())if(['room','victory','defeat','down','summon','scene','activate'].includes(e.type))assert.ok(selected.some(g=>i>=g.start&&i<=g.end));
 assert.equal(JSON.stringify(r),before);
});
test('同房重复增益仅精选首次，跨房重新展示；普通低伤害不会误称关键',()=>{
 const e=(id,roomIndex,type,detail={})=>({id,roomIndex,round:1,actor:'a',targets:['b'],type,detail,units:[]});
 const events=[e(1,0,'effect',{skill:'x'}),e(2,0,'effect',{skill:'x'}),e(3,1,'effect',{skill:'x'}),e(4,1,'attack',{grade:'命中',actual:1,hpBefore:100}),e(5,1,'attack',{grade:'致命',actual:1,hpBefore:100})];
 assert.deepEqual(highlightedSteps(events).map(g=>g.start),[0,2,4]);
});
test('急救精选使用治疗后快照还原治疗前血量，排除普通治疗与零治疗',()=>{
 const heal=(id,hp,actual)=>({id,roomIndex:0,round:1,actor:'a',targets:['b'],type:'heal',detail:{actual},units:[{id:'b',hp,maxHp:100}]});
 assert.deepEqual(highlightedSteps([heal(1,55,20),heal(2,56,20),heal(3,20,0)]).map(g=>g.start),[0]);
});
