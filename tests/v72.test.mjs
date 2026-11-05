import test from 'node:test';import assert from 'node:assert/strict';import {foundryAssessment,foundryReward,validateFoundryState} from '../dist/expedition-foundry-contract.mjs';
import {foundryProfiles} from '../scripts/foundry-cases.mjs';import {foundryConfig,clone,defaults} from '../dist/expedition-data.mjs';import {simulate} from '../dist/expedition-engine.mjs';
import {depart,pendingReport,pendingReward,claim,assignLoot,validateGuild,migrateGuild} from '../dist/expedition-guild.mjs';import {foundryOutcomeView,foundryContracts} from '../dist/expedition-foundry-contract-view.mjs';
const base=foundryProfiles().trained;
test('真实单次战报形成不同可选目标，条件展示不发奖也不改变战报/公会',()=>{
 const split=pendingReport(depart(base,foundryConfig('split'))),shelter=pendingReport(depart(base,foundryConfig('shelter'))),before=clone({base,split,shelter});assert.deepEqual(foundryAssessment(split).goals,{blueprints:true,home:false});assert.deepEqual(foundryAssessment(shelter).goals,{blueprints:false,home:true});assert.deepEqual(foundryReward(split,base).loot,['kilngauge']);assert.deepEqual(foundryReward(shelter,base).loot,['bellowscoat']);assert.match(foundryOutcomeView(split),/本次达到条件/);assert.match(foundryOutcomeView(split),/实验、试演或历史重演不发奖/);assert.deepEqual({base,split,shelter},before);assert.equal(foundryReward(simulate(defaults()),base),null);
});
test('正常领取才记完成与定向遗物；基础首通/委托金币分账，经验不额外增加',()=>{
 const pending=depart(base,foundryConfig('split')),before=clone(pending),reward=pendingReward(pending);assert.equal(reward.gold,240);assert.equal(reward.xp,90);assert.equal(reward.foundry.gold,20);assert.deepEqual(reward.foundry.earned,['blueprints']);assert.deepEqual(reward.loot,['bellowscoat','kilngauge']);assert.equal(pending.foundry,undefined);assert.deepEqual(pendingReward(pending),reward);assert.deepEqual(pending,before);
 const done=claim(pending);assert.deepEqual(done.foundry.claimed,['blueprints']);assert.equal(done.warehouse.bellowscoat,1);assert.equal(done.warehouse.kilngauge,1);assert.equal(done.gold,base.gold+240);for(const m of base.members)assert.equal(done.members.find(n=>n.id===m.id).xp,m.xp+90);assert.deepEqual(done.history[0].foundry,reward.foundry);assert.throws(()=>claim(done),/没有待领取/);const equipped=assignLoot(done,'b','kilngauge');assert.equal(equipped.members.find(m=>m.id==='b').gear.accessory,'kilngauge');assert.equal(equipped.warehouse.kilngauge,0);
});
test('持久完成标志不依赖最近20条历史；重复满足不重复奖励，另一目标独立可领取',()=>{
 const done=claim(depart(base,foundryConfig('split'))),g=migrateGuild(JSON.parse(JSON.stringify(done))),report=pendingReport(depart(base,foundryConfig('split')));assert.deepEqual(foundryReward(report,g).earned,[]);assert.equal(foundryReward(report,g).gold,0);assert.deepEqual(foundryReward(report,g).loot,[]);
 const shelter=pendingReport(depart(base,foundryConfig('shelter'))),other=foundryReward(shelter,g);assert.deepEqual(other.earned,['home']);assert.deepEqual(other.loot,['bellowscoat']);const withoutHistory={foundry:clone(g.foundry),history:[]};assert.deepEqual(foundryReward(report,withoutHistory).earned,[]);assert.match(foundryContracts(g),/封存图纸 · 已完成/);assert.match(foundryContracts(g),/整队归航 · 未完成/);
});
test('生命90%边界按未取整比例判断，宠物不能凑足归航人数，失败不达成目标',()=>{
 const r=pendingReport(depart(base,foundryConfig('shelter'))),max=r.party.reduce((n,u)=>n+u.maxHp,0);assert.equal(max,640);let lost=r.party.reduce((n,u)=>n+u.hp,0)-576;r.party[0].hp-=lost;assert.equal(foundryAssessment(r).goals.home,true);r.party[0].hp--;assert.equal(foundryAssessment(r).goals.home,false);r.party[0].hp=0;r.party.push({...clone(r.party[1]),id:'pet',owner:r.party[1].id,hp:1000,maxHp:1000});assert.equal(foundryAssessment(r).goals.home,false);assert.equal(foundryAssessment(r).goals.blueprints,false);r.won=false;assert.deepEqual(foundryReward(r,base).earned,[]);
});
test('图纸需要实际通关、全员、回合和两项材料同时达标，未抵达不能凑低回合',()=>{
 const r=pendingReport(depart(base,foundryConfig('split')));for(const key of ['rune','arrow']){const changed=clone(r);changed.supplies[key]=2;assert.equal(foundryAssessment(changed).goals.blueprints,false);}const slow=clone(r);slow.rooms[0].rounds+=19;assert.equal(foundryAssessment(slow).goals.blueprints,false);const stopped=clone(r);stopped.won=false;stopped.rooms=stopped.rooms.slice(0,1);assert.equal(foundryAssessment(stopped).goals.blueprints,false);stopped.won=true;assert.equal(foundryAssessment(stopped).goals.blueprints,false);
});
test('未知、重复或无效委托完成状态拒绝，失败不改变有效存档',()=>{
 for(const foundry of [null,[],{claimed:'blueprints'},{claimed:['unknown']},{claimed:['home','home']}]){assert.throws(()=>validateFoundryState(foundry),/铸库委托/);const g=clone(base);g.foundry=foundry;const before=clone(g);assert.throws(()=>validateGuild(g),/铸库委托/);assert.deepEqual(g,before);}validateFoundryState(undefined);validateFoundryState({claimed:[]});
});
test('基础掉落与定向同名奖励按两件入库，两项可同时达成而不互斥',()=>{
 const pending=depart(base,foundryConfig('shelter')),reward=pendingReward(pending);assert.deepEqual(reward.foundry.earned,['home']);assert.deepEqual(reward.loot,['bellowscoat','bellowscoat']);assert.equal(claim(pending).warehouse.bellowscoat,2);
 const report=pendingReport(depart(base,foundryConfig('split')));for(const u of report.party)u.hp=u.maxHp;const both=foundryReward(report,base);assert.deepEqual(both.earned,['blueprints','home']);assert.equal(both.gold,40);assert.deepEqual(both.loot,['kilngauge','bellowscoat']);
});
