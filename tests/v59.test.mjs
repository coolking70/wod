import test from 'node:test';import assert from 'node:assert/strict';
import {newGuild,train,lowerTraining,applyTrainingPlan,learnAdvanced,chooseAdvancement,depart,guildConfig,validateGuild} from '../dist/expedition-guild.mjs';
import {quoteTrainingPlan,trainingSnapshot} from '../dist/expedition-training-plan.mjs';import {careerXp,growth} from '../dist/expedition-growth.mjs';
import {clone,defaults} from '../dist/expedition-data.mjs';import {advancementReadyGuild} from '../scripts/advancement-cases.mjs';
const member=g=>g.members.find(m=>m.id==='d'),funded=()=>{const g=newGuild();member(g).xp=120;return g;};
test('培养草案只读，退款可在同一事务内支付另一技能，不需额外可用经验',()=>{
 let g=funded();for(let i=0;i<3;i++)g=train(g,'d','skill:ward');const before=clone(g),q=quoteTrainingPlan(member(g),{'skill:suppress':3});assert.equal(q.cost,120);assert.equal(q.refund,120);assert.equal(q.availableAfter,0);assert.equal(q.allowed,true);assert.deepEqual(g,before);
 const n=applyTrainingPlan(g,'d',q);assert.deepEqual(member(n).training,{'skill:suppress':3});assert.equal(member(n).xp,0);assert.equal(careerXp(member(n)),120);assert.deepEqual(g,before);
});
test('原子调配与先降后升的逐项事务精确等价，不修改其他角色',()=>{
 let g=advancementReadyGuild();g=chooseAdvancement(g,'d','wardcraft');const old=member(g),key=Object.keys(old.training)[0],target={...old.training,[key]:1,'skill:ward':2};const q=quoteTrainingPlan(old,target),n=applyTrainingPlan(g,'d',q);let sequential=lowerTraining(lowerTraining(g,'d',key),'d',key);for(let i=0;i<2;i++)sequential=train(sequential,'d','skill:ward');assert.deepEqual(n,sequential);assert.deepEqual(n.members.filter(m=>m.id!=='d'),g.members.filter(m=>m.id!=='d'));assert.deepEqual(member(n).advancement,old.advancement);assert.deepEqual(member(n).unlocked,old.unlocked);assert.deepEqual(growth(member(n)),growth(old));
});
test('缺经验的草案拒绝且输入不发生部分退款或部分训练',()=>{
 const g=newGuild(),before=clone(g),q=quoteTrainingPlan(member(g),{'skill:ward':3});assert.equal(q.allowed,false);assert.equal(q.availableAfter,null);assert.match(q.reasons.join(),/仍需120/);assert.throws(()=>applyTrainingPlan(g,'d',q),/经验不足/);assert.deepEqual(g,before);
});
test('普通课程解锁和阶段上限独立校验，草案不能代付或遗忘课程',()=>{
 let g=funded();assert.equal(quoteTrainingPlan(member(g),{'skill:foresight':1}).allowed,false);g=learnAdvanced(g,'d');assert.equal(quoteTrainingPlan(member(g),{'skill:foresight':2}).allowed,false);const n=applyTrainingPlan(g,'d',quoteTrainingPlan(member(g),{'skill:foresight':1}));assert.equal(member(n).xp,60);assert.deepEqual(member(n).unlocked,['foresight']);validateGuild(n);
});
test('拒绝外职业、继承属性、数组和非法等级，不接受客户端费用或余额',()=>{
 const g=funded();for(const target of [{'skill:strike':1},{'skill:ward':4},{'skill:ward':-1},{'skill:ward':.5},{'skill:ward':NaN},{constructor:1},JSON.parse('{"__proto__":1}'),[],Object.create({'skill:ward':1})])assert.throws(()=>quoteTrainingPlan(member(g),target));
 const q=quoteTrainingPlan(member(g),{'skill:ward':2});q.cost=0;q.availableAfter=99999;const n=applyTrainingPlan(g,'d',q);assert.equal(member(n).xp,60);assert.equal(careerXp(member(n)),120);assert.throws(()=>applyTrainingPlan(g,'d',{target:q.target}),/快照/);
});
test('成长变化使草案过期，其他角色变动不误拒绝本人的有效草案',()=>{
 const g=funded(),q=quoteTrainingPlan(member(g),{'skill:ward':1}),changed=train(g,'d','skill:suppress'),before=clone(changed);assert.throws(()=>applyTrainingPlan(changed,'d',q),/已变化/);assert.deepEqual(changed,before);
 const other=clone(g);other.members.find(m=>m.id==='f').xp=100;assert.equal(member(applyTrainingPlan(other,'d',q)).xp,100);
 const reordered=clone(member(g));reordered.training={'skill:ward':0};assert.notEqual(trainingSnapshot(reordered),q.expected);
});
test('待结算拒绝整个草案，草稿无法改写实际资产快照',()=>{
 const g=funded(),q=quoteTrainingPlan(member(g),{'skill:ward':2}),pending=depart(g,defaults()),before=clone(pending);assert.throws(()=>applyTrainingPlan(pending,'d',q),/领取/);assert.deepEqual(pending,before);assert.deepEqual(pending.pending.config.heroes.find(h=>h.id==='d').training,{});
});
test('应用后实际出征采用整份目标培养，重复应用旧草案不会再次退款',()=>{
 let g=funded();g=train(g,'d','skill:ward');const q=quoteTrainingPlan(member(g),{'skill:suppress':2}),n=applyTrainingPlan(g,'d',q);assert.deepEqual(guildConfig(n,defaults()).heroes.find(h=>h.id==='d').training,q.target);assert.throws(()=>applyTrainingPlan(n,'d',q),/已变化/);assert.deepEqual(member(n).training,{'skill:suppress':2});
});
test('无变化不能重复应用，零等级规范为删除，经验净额不经浮点溢出',()=>{
 let g=funded();g=train(g,'d','skill:ward');const m=member(g);assert.equal(quoteTrainingPlan(m,m.training).allowed,false);const zero=quoteTrainingPlan(m,{'skill:ward':0});assert.deepEqual(zero.target,{});assert.equal(member(applyTrainingPlan(g,'d',zero)).xp,120);
 m.xp=Number.MAX_SAFE_INTEGER;assert.equal(quoteTrainingPlan(m,{}).allowed,false);const neutral=quoteTrainingPlan(m,{'skill:suppress':1});assert.equal(neutral.availableAfter,Number.MAX_SAFE_INTEGER);assert.equal(neutral.allowed,true);
});
