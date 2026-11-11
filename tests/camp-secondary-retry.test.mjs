import test from 'node:test';
import assert from 'node:assert/strict';
import {postQuestLoop} from '../scripts/post-quest-cases.mjs';
import {campObjective} from '../dist/expedition-camp-cycle.mjs';
import {campCycleView} from '../dist/expedition-camp-cycle-view.mjs';
const x=await postQuestLoop(),retry=html=>(html.match(/data-cycle-action="retry"/g)||[]).length;
test('earned failures25 and26 keep their quest as primary and expose one exact historic preparation without writes',()=>{
 for(const g of [x.failed,x.failedAgain]){const before=JSON.stringify(g),c=campObjective(g),viewBefore=JSON.stringify(c),h=campCycleView(c);assert.equal(c.stage,'postquest');assert.deepEqual(c.primary,{action:'journey',value:'postquest',label:'查看当前任务与通路'});assert.equal(retry(h),1);assert.match(h,new RegExp('data-cycle-action="retry" data-cycle-value="'+g.history[0].id+'"'));assert.ok(h.indexOf('class=primary')<h.indexOf('class="camp-secondary-retry"'));assert.match(h,/只进入远征准备/);assert.equal(JSON.stringify(g),before);assert.equal(JSON.stringify(c),viewBefore);}
});
test('pending26 with an already claimed failure25 exposes no premature retry, and ready delivery remains the main action',()=>{
 const pending=campObjective(x.runs[3].pending);assert.equal(pending.last.won,false);assert.equal(pending.stage,'pending');assert.equal(retry(campCycleView(pending)),0);const ready=campObjective(x.ready);assert.equal(ready.stage,'postquest-delivery');assert.equal(retry(campCycleView(ready)),0);assert.match(campCycleView(ready),/选择归信交付/);
});
test('the existing primary failure retry stays single when no active quest takes priority',()=>{
 const g=structuredClone(x.failed);delete g.postQuest;const c=campObjective(g);assert.equal(c.stage,'retry');assert.equal(retry(campCycleView(c)),1);assert.doesNotMatch(campCycleView(c),/camp-secondary-retry/);
});
test('display projection distinguishes a missed goal after a win from an actual loss',()=>{
 const c=structuredClone(campObjective(x.failed));c.last.won=true;c.last.objective={met:false};const h=campCycleView(c);assert.equal(retry(h),1);assert.match(h,/已通关，但所选攻略目标未达成/);assert.match(h,/载入第25次目标与方案/);assert.doesNotMatch(h,/次止步方案/);c.last.objective.met=true;assert.equal(retry(campCycleView(c)),0);
});
test('unselected hero or an invalid historic action identifier cannot create a secondary action',()=>{
 const c=structuredClone(campObjective(x.failed));c.heroId=null;assert.equal(retry(campCycleView(c)),0);c.heroId='e';for(const id of [0,-1,1.5,'25" onclick="bad',Number.MAX_SAFE_INTEGER+1]){c.last.id=id;const h=campCycleView(c);assert.equal(retry(h),0);assert.doesNotMatch(h,/camp-secondary-retry/);}
});
