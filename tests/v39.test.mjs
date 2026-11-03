import test from 'node:test';import assert from 'node:assert/strict';
import {HEROES,CLASSES,defaults,clone,archiveConfig} from '../dist/expedition-data.mjs';
import {newGuild,depart,claim,pendingReport,guildConfig,validateGuild,train,equip,historyReport,learnAdvanced} from '../dist/expedition-guild.mjs';
import {recruit,swapCompanion,rosterConfig} from '../dist/expedition-roster.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {validate,simulate,buildParty,mean} from '../dist/expedition-engine.mjs';
import {bellCandidates,resolveRescue} from '../dist/expedition-events.mjs';
import {personalReport} from '../dist/expedition-personal.mjs';
import {configurationChanges} from '../dist/expedition-review.mjs';
import {applyBuild,BUILDS} from '../dist/expedition-builds.mjs';
import {ADVANCED,installAdvanced} from '../dist/expedition-growth.mjs';
function funded(){let g=selectHero(newGuild(),'c');g=claim(depart(g,defaults()));g=claim(depart(g,defaults()));return g;}
test('职业模板与角色身份分离，同职业不同实例拥有不同统计和资产',()=>{
 let g=recruit(funded(),'mira');g=swapCompanion(g,defaults(),'b','mira');const c=guildConfig(g,defaults()),party=buildParty(c),d=party.find(u=>u.id==='d'),m=party.find(u=>u.id==='mira');assert.equal(d.classId,m.classId);assert.notEqual(d.id,m.id);assert.notEqual(d.name,m.name);const r=simulate(c);assert.ok(r.stats.d&&r.stats.mira);assert.equal(r.stats.b,undefined);assert.equal(personalReport(r,'mira').total.damage,r.stats.mira.actual);assert.deepEqual(CLASS_KEYS(),['guardian','ranger','tidecaller','scholar','bard','herbalist']);
});
function CLASS_KEYS(){return Object.keys(CLASSES);}
test('招募收费一次，未解锁/未结算/未招募换人/主角替换被拒绝',()=>{
 assert.throws(()=>recruit(newGuild(),'mira'));const base=funded(),g=recruit(base,'mira');assert.equal(g.gold,base.gold-60);assert.equal(base.members.length,6);assert.equal(g.members.length,7);assert.throws(()=>recruit(g,'mira'));assert.throws(()=>recruit(depart(g,defaults()),'orin'));assert.throws(()=>swapCompanion(g,defaults(),'c','mira'));assert.throws(()=>swapCompanion(base,defaults(),'b','mira'));assert.throws(()=>setCompanion(base,'mira','ward'));
});
test('候补保存装备与训练，轮换恢复个人指令，不复制原位资产',()=>{
 let g=funded();g=recruit(g,'mira');g.members.find(m=>m.id==='mira').xp=60;g=train(g,'mira','skill:bulwark');g=equip(g,'mira','wardfocus');const draft=defaults();draft.heroes[1].pos='left';draft.heroes[1].main=[{skill:'pierce',target:'healer',mode:'repeat'}];
 g=swapCompanion(g,draft,'b','mira');let c=guildConfig(g,draft);assert.equal(c.heroes.find(h=>h.id==='mira').gear.armor,'wardfocus');assert.equal(c.heroes.find(h=>h.id==='mira').training['skill:bulwark'],1);assert.equal(g.members.find(m=>m.id==='b').gear.weapon,'bow');
 g=swapCompanion(g,c,'mira','b');c=guildConfig(g,c);assert.equal(c.heroes[1].pos,'left');assert.equal(c.heroes[1].main[0].skill,'pierce');assert.equal(g.members.find(m=>m.id==='mira').gear.armor,'wardfocus');
});
test('出战顺序只包含实际六人，房间覆盖顺序同步替换，重复/候补ID拒绝',()=>{
 let g=recruit(funded(),'mira');const c=defaults();c.roomOrders.gallery=['a','b','c','d','e','f'];g=swapCompanion(g,c,'b','mira');const out=rosterConfig(g,c);validate(out);assert.ok(out.prepOrder.includes('mira'));assert.ok(!out.prepOrder.includes('b'));assert.deepEqual(out.roomOrders.gallery,['a','mira','c','d','e','f']);out.prepOrder[0]='b';assert.throws(()=>validate(out));
});
test('仅出战者获得经验，换回旧队伍不改写历史阵容和身份',()=>{
 let g=recruit(funded(),'mira');g=swapCompanion(g,defaults(),'b','mira');const before=clone(g),pending=depart(g,defaults()),report=pendingReport(pending),done=claim(pending);assert.equal(done.members.find(m=>m.id==='b').xp,before.members.find(m=>m.id==='b').xp);assert.ok(done.members.find(m=>m.id==='mira').xp>before.members.find(m=>m.id==='mira').xp);g=swapCompanion(done,report.config,'mira','b');assert.deepEqual(historyReport(g,3).config,report.config);assert.equal(historyReport(g,3).perspective.heroId,'c');assert.ok(configurationChanges(report.config,guildConfig(g,report.config)).some(c=>c.label==='米菈 / 出战'&&c.after==='未出战'));
});
test('替补学者和药师可以承担机关与救援，不依赖原始角色ID',()=>{
 let g=funded();g=recruit(recruit(g,'mira'),'orin');g=swapCompanion(g,defaults(),'d','mira');let c=guildConfig(g,archiveConfig());g=swapCompanion(g,c,'f','orin');c=guildConfig(g,c);const party=buildParty(c),bell=bellCandidates(party,'study',mean);assert.ok(bell.some(x=>x.id==='mira'));assert.ok(!bell.some(x=>x.id==='d'));const rescue=resolveRescue('aid',party,{herb:10},mean,()=>.9);assert.equal(rescue.actor,'orin');validate(c);simulate(c);
});
test('同职业进阶学习互不共享，两名候补构筑与技能均可执行',()=>{
 let g=recruit(recruit(funded(),'mira'),'orin');g=swapCompanion(g,defaults(),'b','mira');let c=guildConfig(g,defaults());g=swapCompanion(g,c,'e','orin');c=guildConfig(g,c);
 for(const id of ['mira','orin']){g.members.find(m=>m.id===id).xp=60;g=learnAdvanced(g,id);assert.deepEqual(g.members.find(m=>m.id===id).unlocked,[ADVANCED[id]]);for(const b of BUILDS[id])validate(applyBuild(c,id,b.id));c=installAdvanced(c,id,ADVANCED[id]);}
 assert.deepEqual(g.members.find(m=>m.id==='d').unlocked,[]);const r=simulate(guildConfig(g,c));for(const id of ['mira','orin'])assert.ok(r.events.some(e=>e.actor===id&&e.type==='cast'&&e.detail.skill===ADVANCED[id]));
});
test('拒绝重复名册、错误职业与损坏的个人战术缓存',()=>{
 for(const mutate of [g=>g.lineup[1]='a',g=>g.members[0].classId='herbalist',g=>g.members[0].tactics.id='b',g=>g.members[0].tactics.main=[{skill:'heal',target:'all',mode:'repeat'}]]){const g=newGuild();mutate(g);assert.throws(()=>validateGuild(g));}
});
