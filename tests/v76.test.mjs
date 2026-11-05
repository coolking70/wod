import test from 'node:test';import assert from 'node:assert/strict';
import {foundryStoryProgress,validateFoundryStory,FOUNDRY_STORY_ENDINGS} from '../dist/expedition-foundry-story.mjs';import {foundryStoryView} from '../dist/expedition-foundry-story-view.mjs';
import {newGuild,claimFoundryStory,depart,pendingReport,pendingReward,claim,validateGuild,historyReport,assignLoot} from '../dist/expedition-guild.mjs';import {watchConfig,foundryConfig,clone} from '../dist/expedition-data.mjs';import {watchProfiles} from '../scripts/watch-cases.mjs';import {foundryProfiles} from '../scripts/foundry-cases.mjs';import {equipmentSource} from '../dist/expedition-equipment-view.mjs';
const grown=watchProfiles().grown,ready=claim(depart(grown,watchConfig()));
test('旅程从正常已领取的结果形成；查看、实验或待结算不会自动计入守望或发奖',()=>{
 const initial=newGuild(),before=clone(initial);assert.equal(foundryStoryProgress(initial).completed,0);foundryStoryView(initial);assert.deepEqual(initial,before);assert.throws(()=>claimFoundryStory(initial,'convoy'),/完成三段/);
 assert.equal(foundryStoryProgress(grown).completed,2);const pending=depart(grown,watchConfig()),saved=clone(pending);assert.equal(pendingReport(pending).won,true);assert.equal(foundryStoryProgress(pending).completed,2);assert.equal(foundryStoryProgress(pending).canClaim,false);assert.equal(pendingReward(pending).gold,210);assert.equal(pendingReward(pending).foundryStory,undefined);foundryStoryView(pending);assert.deepEqual(pending,saved);assert.equal(foundryStoryProgress(ready).completed,3);assert.equal(ready.foundryStory,undefined);
});
test('图纸与完整归航是任选条件，不把两个可选目标强制都做；正常结果跨历史保留',()=>{
 for(const plan of ['split','shelter']){const g=claim(depart(foundryProfiles().trained,foundryConfig(plan)));assert.equal(g.foundry.claimed.length,1);assert.equal(foundryStoryProgress(g).steps.find(s=>s.id==='proof').done,true);}
 const g=clone(ready);g.history=[];assert.equal(foundryStoryProgress(g).ready,true);validateGuild(g);assert.equal(claimFoundryStory(g,'convoy').foundryStory.ending,'convoy');
});
test('三个结局各给一次准确40金币与一件指定遗物，不改变个人成长、出战、clear或正常奖励',()=>{
 for(const [id,e] of Object.entries(FOUNDRY_STORY_ENDINGS)){const before=clone(ready),done=claimFoundryStory(ready,id);assert.deepEqual(done.foundryStory,{ending:id});assert.equal(done.gold,ready.gold+40);assert.equal(done.warehouse[e.gear],(ready.warehouse[e.gear]||0)+1);assert.deepEqual(done.members,ready.members);assert.deepEqual(done.clears,ready.clears);assert.deepEqual(done.history,ready.history);assert.deepEqual(done.foundry,ready.foundry);assert.equal(done.next,ready.next);for(const other of Object.keys(ready.warehouse).filter(k=>k!==e.gear))assert.equal(done.warehouse[other],ready.warehouse[other]);assert.deepEqual(ready,before);assert.throws(()=>claimFoundryStory(done,id),/已记录/);assert.throws(()=>claimFoundryStory(done,Object.keys(FOUNDRY_STORY_ENDINGS).find(k=>k!==id)),/已记录/);}
});
test('无效结局和记录字段被拒绝，不允许原型键、重复附加奖励字段或缺少正常里程碑',()=>{
 for(const id of [null,[],{},'','toString','__proto__','unknown']){const before=clone(ready);assert.throws(()=>claimFoundryStory(ready,id),/有效的归航/);assert.deepEqual(ready,before);}
 for(const state of [null,[],{},'convoy',{ending:'bad'},{ending:'toString'},{ending:'convoy',gold:999},{foo:'convoy'},Object.assign(Object.create({ending:'convoy'}),{foo:1})])assert.throws(()=>validateFoundryStory(state),/归航记录/);
 const missing=clone(grown);missing.foundryStory={ending:'archive'};assert.throws(()=>validateGuild(missing),/缺少正常远征/);
});
test('待结算期间不能交付，金币或遗物计数溢出拒绝且不部分写入',()=>{
 const pending=depart(ready,watchConfig()),before=clone(pending);assert.throws(()=>claimFoundryStory(pending,'archive'),/领取远征结算/);assert.deepEqual(pending,before);
 for(const field of ['gold','warehouse']){const g=clone(ready);if(field==='gold')g.gold=Number.MAX_SAFE_INTEGER;else g.warehouse.kilngauge=Number.MAX_SAFE_INTEGER;validateGuild(g);const before=clone(g);assert.throws(()=>claimFoundryStory(g,'archive'),/安全计数/);assert.deepEqual(g,before);}
});
test('结局与装备进入真实备份，领取后可分配给成员，历史重演保持原始战报且不再次派奖',()=>{
 const old=historyReport(ready,grown.next),g=claimFoundryStory(ready,'archive'),done=assignLoot(g,'d','kilngauge'),backup=JSON.parse(JSON.stringify(done));validateGuild(backup);assert.equal(backup.members.find(h=>h.id==='d').gear.accessory,'kilngauge');assert.deepEqual(backup.foundryStory,{ending:'archive'});assert.deepEqual(historyReport(backup,grown.next),old);const before=clone(backup);assert.throws(()=>claimFoundryStory(backup,'archive'),/已记录/);assert.deepEqual(backup,before);
});
test('未完成、可交付和已记录三种故事视图只读，指定来源和奖励代价可见',()=>{
 for(const g of [newGuild(),grown,ready,claimFoundryStory(ready,'vigil')]){const before=clone(g),html=foundryStoryView(g);assert.match(html,/单人旅程/);assert.match(html,/正常远征/);assert.deepEqual(g,before);}
 assert.match(foundryStoryView(newGuild()),/data-foundry-story-end="convoy" disabled/);assert.match(foundryStoryView(ready),/选择此结局并领取/);assert.match(foundryStoryView(claimFoundryStory(ready,'vigil')),/data-story-ending="vigil"/);for(const e of Object.values(FOUNDRY_STORY_ENDINGS))assert.match(equipmentSource(e.gear),/铸库归航（三选一，一次）/);
});
