import test from 'node:test';import assert from 'node:assert/strict';
import {rehearseTrainingPlan} from '../dist/expedition-training-rehearsal.mjs';import {trainingRehearsalView} from '../dist/expedition-training-rehearsal-view.mjs';import {quoteTrainingPlan} from '../dist/expedition-training-plan.mjs';
import {advancementReadyGuild} from '../scripts/advancement-cases.mjs';import {applyTrainingPlan,guildConfig,depart,pendingReport,chooseAdvancement} from '../dist/expedition-guild.mjs';import {selectHero,setCompanion} from '../dist/expedition-command.mjs';import {recruit} from '../dist/expedition-roster.mjs';
import {defaults,hospiceConfig,clone} from '../dist/expedition-data.mjs';import {personalReport} from '../dist/expedition-personal.mjs';import {buildParty,defenseProfile} from '../dist/expedition-engine.mjs';
const member=(g,id='d')=>g.members.find(m=>m.id===id),plan=g=>quoteTrainingPlan(member(g),{...member(g).training,'skill:ward':1});
test('培养试演两份战报与真正出征精确一致，但不动资产、履历或出征序号',()=>{
 const g=advancementReadyGuild(),before=clone(g),c=hospiceConfig('front'),q=plan(g),p=rehearseTrainingPlan(g,c,'d',q);assert.deepEqual(p.reports.before,pendingReport(depart(g,c)));assert.deepEqual(p.reports.after,pendingReport(depart(applyTrainingPlan(g,'d',q),c)));assert.equal(p.seed,g.next);assert.deepEqual(g,before);assert.equal(g.pending,null);
});
test('试演采用实际装备、伙伴职责和进阶，不从实验草稿赠送资产',()=>{
 let g=chooseAdvancement(advancementReadyGuild(),'d','sigilcraft');g=setCompanion(g,'d','suppress');const c=hospiceConfig('front'),h=c.heroes.find(h=>h.id==='d');h.advancement='wardcraft';h.training={'skill:suppress':3};const p=rehearseTrainingPlan(g,c,'d',plan(g));assert.equal(p.reports.before.config.heroes.find(h=>h.id==='d').advancement,'sigilcraft');assert.deepEqual(p.reports.before.config.heroes.find(h=>h.id==='d').training,member(g).training);assert.deepEqual(p.reports.before.config.heroes.find(h=>h.id==='d').main,p.reports.after.config.heroes.find(h=>h.id==='d').main);assert.ok(p.reports.after.events.some(e=>e.actor==='d'&&e.type==='cast'&&e.detail.skill==='suppress'&&e.detail.advancement.mana===4));
});
test('个人用料和行动摘要逐项来自原始战报，不把友军伤害算作支援贡献',()=>{
 const g=advancementReadyGuild(),p=rehearseTrainingPlan(g,defaults(),'d',plan(g));for(const side of ['before','after']){const r=personalReport(p.reports[side],'d');assert.deepEqual(p.summary[side].personal,{...r.total,supplies:r.supplies,issues:r.issues});assert.equal(p.summary[side].rounds,p.reports[side].rooms.reduce((n,r)=>n+r.rounds,0));assert.equal(p.summary[side].alive,p.reports[side].party.filter(u=>u.hp>0).length);assert.equal('contribution' in p.summary[side],false);}
});
test('静态技能和防御变化使用实际角色构建及防御回退规则',()=>{
 const g=advancementReadyGuild(),m=member(g),target={...m.training,'skill:ward':1,'defense:resist':2},q=quoteTrainingPlan(m,target),p=rehearseTrainingPlan(g,defaults(),'d',q);assert.deepEqual(p.skills,[{skill:'ward',before:9,after:10}]);const a=buildParty(p.reports.before.config).find(u=>u.id==='d'),b=buildParty(p.reports.after.config).find(u=>u.id==='d');for(const r of p.defenses){assert.equal(r.before,defenseProfile(a,r.type).level);assert.equal(r.after,defenseProfile(b,r.type).level);}assert.ok(p.defenses.length);
});
test('未出战候补不能冒充本人试演，成长仍可独立规划',()=>{
 let g=recruit(advancementReadyGuild(),'mira');member(g,'mira').xp=100;const q=quoteTrainingPlan(member(g,'mira'),{'skill:ward':1});assert.equal(q.allowed,true);assert.throws(()=>rehearseTrainingPlan(g,defaults(),'mira',q),/未出战/);assert.equal(member(applyTrainingPlan(g,'mira',q),'mira').xp,80);
});
test('待结算、过期和缺经验草案均拒绝试演，不改输入',()=>{
 const g=advancementReadyGuild(),q=plan(g),p=depart(g,defaults()),before=clone(p);assert.throws(()=>rehearseTrainingPlan(p,defaults(),'d',q),/领取/);assert.deepEqual(p,before);const changed=applyTrainingPlan(g,'d',q);assert.throws(()=>rehearseTrainingPlan(changed,defaults(),'d',q),/已变化/);
});
test('重复试演完全确定，观察者与下一次出征种子边界正确',()=>{
 const g=selectHero(advancementReadyGuild(),'f');g.next=1000000;const q=plan(g),a=rehearseTrainingPlan(g,defaults(),'d',q),b=rehearseTrainingPlan(g,defaults(),'d',q);assert.deepEqual(a,b);assert.equal(a.seed,1);assert.equal(a.reports.after.perspective.heroId,'f');
});
test('界面保留失败、回合、支援和材料解释，明确单种子及未支付边界',()=>{
 const g=advancementReadyGuild(),p=rehearseTrainingPlan(g,defaults(),'d',plan(g)),html=trainingRehearsalView(p);for(const text of ['当前培养','培养草案','本人增益施加','本人消耗符纸','不是胜率或稳定收益','止步后的较少回合不能当作效率优势','没有出征、支付经验或发放奖励'])assert.ok(html.includes(text));assert.equal(trainingRehearsalView(null),'');
});
