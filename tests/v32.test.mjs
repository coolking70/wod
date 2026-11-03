import {equipmentKit} from '../dist/expedition-equipment.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGuild,depart,pendingReport,claim,historyReport,historyConfig,validateGuild,equip} from '../dist/expedition-guild.mjs';
import {tutorialConfig,clone} from '../dist/expedition-data.mjs';
test('结算后重演与原报告一致，刷新与后续换装不改变历史',()=>{
 let g=newGuild();g.gold=60;g=depart(g,tutorialConfig());const original=pendingReport(g);g=claim(g);g=equip(g,'a','lightplate');g=JSON.parse(JSON.stringify(g));const before=clone(g);
 assert.deepEqual(historyReport(g,1),original);assert.deepEqual(g,before);
 const c=historyConfig(g,1);c.heroes[0].gear=equipmentKit('lightplate');assert.notEqual(historyConfig(g,1).heroes[0].gear,c.heroes[0].gear);
});
test('重演不改变正在进行的远征，也不能再次领取奖励',()=>{
 let g=claim(depart(newGuild(),tutorialConfig()));assert.throws(()=>claim(g));g=depart(g,tutorialConfig());const before=clone(g);historyReport(g,1);assert.deepEqual(g,before);assert.equal(g.pending.id,2);
});
test('保存最近20次快照，拒绝不存在或损坏的历史方案',()=>{
 let g=newGuild();for(let i=0;i<21;i++)g=claim(depart(g,tutorialConfig()));assert.equal(g.history.length,20);assert.throws(()=>historyReport(g,1));assert.equal(historyConfig(g,21).seed,21);
 const bad=clone(g);bad.history[0].config.expedition='unknown';assert.throws(()=>validateGuild(bad));
 const mismatch=clone(g);mismatch.history[0].route='classic';assert.throws(()=>validateGuild(mismatch));
});
