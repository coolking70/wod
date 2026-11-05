import test from 'node:test';import assert from 'node:assert/strict';
import {PROGRESSION_RULES} from '../dist/expedition-progression-rules.mjs';
import {experienceLedger,careerXp,growth} from '../dist/expedition-growth.mjs';
import {newGuild,train,lowerTraining,retrain,chooseAdvancement,resetAdvancement,learnAdvanced,migrateGuild} from '../dist/expedition-guild.mjs';
import {advancementReadyGuild} from '../scripts/advancement-cases.mjs';
import {clone} from '../dist/expedition-data.mjs';
import {experienceView} from '../dist/expedition-progression-view.mjs';
const member=(g,id='d')=>g.members.find(m=>m.id===id);
test('正常赚取的经验在可用、训练、课程和后期进阶间精确守恒',()=>{
 let g=advancementReadyGuild();assert.deepEqual(experienceLedger(member(g)),{available:165,training:240,courses:40,advancement:0,earned:445,refundable:240});
 g=chooseAdvancement(g,'d','wardcraft');assert.deepEqual(experienceLedger(member(g)),{available:85,training:240,courses:40,advancement:80,earned:445,refundable:320});
 const key=Object.keys(member(g).training)[0];g=lowerTraining(g,'d',key);const l=experienceLedger(member(g));assert.equal(l.available,145);assert.equal(l.training,180);assert.equal(l.earned,445);
 g=resetAdvancement(retrain(g,'d'),'d');assert.deepEqual(experienceLedger(member(g)),{available:405,training:0,courses:40,advancement:0,earned:445,refundable:0});assert.equal(growth(member(g)).level,3);
});
test('学习保留的课程不被训练退款冒充可退投入',()=>{
 let g=newGuild();member(g).xp=100;g=learnAdvanced(g,'d');g=train(g,'d','skill:ward');assert.equal(experienceLedger(member(g)).refundable,20);
 g=retrain(g,'d');assert.equal(member(g).xp,60);assert.deepEqual(member(g).unlocked,['foresight']);assert.equal(careerXp(member(g)),100);
});
test('经验账目只读且按个人计算，不从装备、战中属性或其他角色借经验',()=>{
 const g=chooseAdvancement(advancementReadyGuild(),'d','sigilcraft'),before=clone(g),m=member(g),l=experienceLedger(m);
 const decorated={...m,gear:{body:'fictional'},skills:{ward:999},effects:[{value:999}],bonusXp:999};assert.deepEqual(experienceLedger(decorated),l);
 assert.equal(experienceLedger(member(g,'f')).advancement,0);l.available=999;assert.deepEqual(g,before);assert.equal(experienceLedger(m).available,85);
});
test('所有成长阈值及精确退回保持现有存档语义',()=>{
 for(const [xp,level,next] of [[0,1,60],[59,1,60],[60,2,150],[149,2,150],[150,3,null]]){const g=newGuild();member(g).xp=xp;assert.deepEqual(growth(member(g)),{earned:xp,level,next,advancedRank:level===3?3:1});assert.deepEqual(migrateGuild(g),g);}
});
test('研究资料和导入存档不能修改当前规则参数或选择参考服',()=>{
 assert.equal(PROGRESSION_RULES.referenceServer,null);assert.equal(PROGRESSION_RULES.verification,'prototype');assert.throws(()=>{PROGRESSION_RULES.training.xpUnit=999;},TypeError);assert.throws(()=>{PROGRESSION_RULES.stages[1].earned=1;},TypeError);
 const g=newGuild();g.referenceServer='Delta';g.progression={training:{xpUnit:1}};member(g).xp=20;const n=train(migrateGuild(g),'d','skill:ward');assert.equal(member(n).xp,0);assert.equal(PROGRESSION_RULES.referenceServer,null);
});
test('经验界面解释课程保留与退款守恒，不将装备增益作为永久投入',()=>{
 const g=chooseAdvancement(advancementReadyGuild(),'d','wardcraft'),html=experienceView(member(g));for(const [key,value] of Object.entries({available:85,training:240,courses:40,advancement:80,earned:445}))assert.ok(html.includes(`data-xp="${key}">${value}</dd>`));assert.match(html,/课程学习 · 重修时保留/);assert.match(html,/装备和临时效果不计入/);
});
