import test from 'node:test';import assert from 'node:assert/strict';
import {rehearseReplacement,replacementSignature} from '../dist/expedition-roster-rehearsal.mjs';import {rosterRehearsalView} from '../dist/expedition-roster-rehearsal-view.mjs';
import {crossRouteProfiles} from '../scripts/cross-route-cases.mjs';import {clone,defaults,scarcityConfig} from '../dist/expedition-data.mjs';
import {train,learnAdvanced,depart,pendingReport,guildConfig} from '../dist/expedition-guild.mjs';import {setCompanion} from '../dist/expedition-command.mjs';import {swapCompanion,rosterConfig} from '../dist/expedition-roster.mjs';
const profiles=crossRouteProfiles(),earned=setCompanion(learnAdvanced(train(profiles.recruited,'d','skill:ward'),'d'),'d','seer');
test('两套换人试演等于各自正常实际出征，使用同一次下次种子且不保存、发奖或改名单',()=>{
 const g=clone(earned),c=defaults(),before=clone({g,c}),trial=rehearseReplacement(g,c,'d','mira'),swapped=swapCompanion(g,c,'d','mira');
 assert.deepEqual(trial.reports.before,pendingReport(depart(g,c)));assert.deepEqual(trial.reports.after,pendingReport(depart(swapped,rosterConfig(swapped,c))));assert.equal(trial.seed,g.next);assert.equal(trial.reports.before.config.seed,trial.reports.after.config.seed);assert.deepEqual({g,c},before);
 assert.equal(trial.reports.before.config.heroes.some(h=>h.id==='mira'),false);assert.equal(trial.reports.after.config.heroes.some(h=>h.id==='d'),false);assert.equal(trial.reports.after.config.heroes.some(h=>h.id==='mira'),true);
});
test('候补使用自己的零培养、装备和课程状态，不继承离队者已支付资产，结果深层独立',()=>{
 const g=clone(earned),c=defaults(),before=clone({g,c}),trial=rehearseReplacement(g,c,'d','mira'),mira=g.members.find(m=>m.id==='mira'),out=g.members.find(m=>m.id==='d'),hero=trial.reports.after.config.heroes.find(h=>h.id==='mira');
 assert.deepEqual(hero.training,mira.training);assert.notDeepEqual(hero.training,out.training);assert.deepEqual(hero.gear,mira.gear);assert.equal(hero.prep.some(r=>r.skill==='foresight'),false);assert.deepEqual(mira.unlocked,[]);assert.deepEqual({g,c},before);
 trial.reports.after.config.heroes[0].training['skill:strike']=3;trial.rooms[0].after.supplies.rune=9999;assert.deepEqual({g,c},before);assert.notEqual(trial.reports.after.rooms[0].supplies.rune,9999);
});
test('主角、已出战目标、待结算与未学课程沿用正常事务限制，失败不更改输入',()=>{
 const g=clone(earned),c=defaults(),before=clone({g,c});assert.throws(()=>rehearseReplacement(g,c,'c','mira'),/不能替换主角/);assert.throws(()=>rehearseReplacement(g,c,'d','a'),/未出战/);assert.throws(()=>rehearseReplacement(depart(g,c),c,'d','mira'),/领取/);
 const locked=setCompanion(g,'mira','seer'),lockedBefore=clone(locked);assert.throws(()=>rehearseReplacement(locked,c,'d','mira'),/尚未学习/);assert.deepEqual(locked,lockedBefore);assert.deepEqual({g,c},before);
});
test('签名覆盖资产、职责、准备配置和替换选择，避免旧试演冒充当前队伍',()=>{
 const g=clone(earned),c=defaults(),signature=replacementSignature(g,c,'d','mira');assert.equal(replacementSignature(clone(g),clone(c),'d','mira'),signature);assert.notEqual(replacementSignature(train(g,'d','skill:spark'),c,'d','mira'),signature);assert.notEqual(replacementSignature(setCompanion(g,'f','field'),c,'d','mira'),signature);assert.notEqual(replacementSignature(g,{...c,seed:c.seed+1},'d','mira'),signature);assert.notEqual(replacementSignature(g,c,'b','mira'),signature);
});
test('逐房事实与原始报告对账，未抵达保持null，失效视图不再提供旧报告入口',()=>{
 const g=clone(earned),c=scarcityConfig(true),trial=rehearseReplacement(g,c,'b','mira');assert.equal(trial.rooms.length,3);
 for(const key of ['before','after']){const report=trial.reports[key],s=trial.summary[key];assert.equal(s.cleared,report.rooms.filter(r=>r.won).length);assert.equal(s.rounds,report.rooms.reduce((n,r)=>n+r.rounds,0));assert.deepEqual(s.supplies,report.supplies);for(let i=0;i<trial.rooms.length;i++){const room=trial.rooms[i][key],raw=report.rooms[i];if(!raw)assert.equal(room,null);else{assert.equal(room.won,raw.won);assert.equal(room.rounds,raw.rounds);assert.deepEqual(room.supplies,raw.supplies);}}}
 assert.equal(trial.summary.after.stopReason,'潮水封路');assert.equal(trial.summary.after.alive,6);assert.equal(trial.rooms.at(-1).after,null);const stale=rosterRehearsalView({value:trial,stale:true});assert.match(stale,/已过期/);assert.doesNotMatch(stale,/data-roster-report/);const html=rosterRehearsalView({value:trial,stale:false});assert.match(html,/没有出征、换人、支付或发奖/);assert.match(html,/data-roster-report="after"/);assert.match(html,/未抵达/);
});
