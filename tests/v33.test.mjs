import test from 'node:test';
import assert from 'node:assert/strict';
import {newGuild,depart,claim,historyConfig,equip} from '../dist/expedition-guild.mjs';
import {historyComparison} from '../dist/expedition-history-diff.mjs';
import {defaults,tutorialConfig,clone} from '../dist/expedition-data.mjs';
test('历史对比逐人归组，报告默认和房间覆盖变化且不修改输入',()=>{
 const g=claim(depart(newGuild(),tutorialConfig())),c=historyConfig(g,1);c.heroes[0].pos='rear';c.heroes[0].overrides.cistern={main:[]};c.seed=5;
 const before=clone({g,c}),d=historyComparison(g,1,c);assert.equal(d.heroes[0].changes.length,1);assert.equal(d.global.length,1);assert.deepEqual({g,c},before);
 const base=claim(depart(newGuild(),defaults())),current=historyConfig(base,1);current.heroes[0].overrides.cistern={main:[]};assert.ok(historyComparison(base,1,current).heroes[0].changes.some(x=>x.after==='无指令'));
});
test('公会对比使用实际资产，准备方案对比保留草稿装备',()=>{
 let g=claim(depart(newGuild(),tutorialConfig()));g.gold=60;const c=historyConfig(g,1);g=equip(g,'a','lightplate');assert.equal(historyComparison(g,1,c,'draft').total,0);
 const actual=historyComparison(g,1,c,'guild');assert.equal(actual.heroes[0].changes.length,1);assert.ok(actual.heroes[0].changes[0].label.includes('防具'));
 assert.throws(()=>historyComparison(g,1,c,'wrong'));
});
test('不同路线覆盖比较包含双方房间，不遗漏章节后半程',()=>{
 const g=claim(depart(newGuild(),defaults())),c=historyConfig(g,1);c.expedition='chapter';c.heroes[0].overrides.heart={main:[]};
 // Validate using the route's declared room IDs, not invented slot labels.
 const d=historyComparison(g,1,c);assert.equal(d.routeChanged,true);assert.ok(d.heroes[0].changes.some(x=>x.label.includes('heart')));
});
