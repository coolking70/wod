import test from 'node:test';import assert from 'node:assert/strict';
import {draftCommandPreview,adoptDraftCommands} from '../dist/expedition-draft-commands.mjs';
import {configurationUndo,restoreConfigurationUndo} from '../dist/expedition-config-undo.mjs';
import {guildConfig,newGuild,train,depart} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {seerGuild} from '../scripts/seer-cases.mjs';
import {defaults,clone,row,resolveHeroPlan} from '../dist/expedition-data.mjs';import {simulate} from '../dist/expedition-engine.mjs';
const setup=()=>({g:setCompanion(seerGuild(),'d','seer'),c:defaults()}),ask={targetId:'d',roomId:'gallery'};
const effective=(hero,room)=>{const {overrides,...plan}=resolveHeroPlan(hero,room);return plan;};
test('本房草稿原被托管忽略，明确采用后只有选定房间指令改变，其他实际队员与房间保留',()=>{
 const {g,c}=setup(),source=c.heroes.find(h=>h.id==='d');source.overrides.gallery={main:[row('wait')]};source.overrides.cistern={main:[row('spark','rear')]};const before=clone({g,c}),actual=guildConfig(g,c),p=draftCommandPreview(g,c,ask);
 assert.notDeepEqual(resolveHeroPlan(actual.heroes.find(h=>h.id==='d'),'gallery').main,[row('wait')]);assert.equal(p.allowed,true);assert.match(p.commands.find(c=>c.key==='main').before,/截疗符/);assert.match(p.commands.find(c=>c.key==='main').after,/等待/);assert.equal(p.commands.find(c=>c.key==='main').changed,true);assert.equal(p.commands.some(c=>c.before==='继承默认'),false);const result=adoptDraftCommands(g,c,p),next=guildConfig(result.guild,result.config);
 assert.deepEqual(resolveHeroPlan(next.heroes.find(h=>h.id==='d'),'gallery').main,[row('wait')]);assert.deepEqual(effective(next.heroes.find(h=>h.id==='d'),'cistern'),effective(actual.heroes.find(h=>h.id==='d'),'cistern'));assert.deepEqual(next.heroes.filter(h=>h.id!=='d'),actual.heroes.filter(h=>h.id!=='d'));assert.deepEqual(result.guild.members,g.members);assert.deepEqual({g,c},before);
});
test('默认指令采用不偷带草稿逐房覆盖、专修或资产，位置/防御/道具仍是当前实际值',()=>{
 const {g,c}=setup(),h=c.heroes.find(h=>h.id==='d');h.main=[row('wait')];h.trained='spark';h.training={'skill:spark':3};h.advancement='wardcraft';h.overrides.cistern={main:[row('spark','rear')],pos:'left'};const actual=guildConfig(g,c).heroes.find(h=>h.id==='d'),p=draftCommandPreview(g,c,{targetId:'d'}),next=p.config.heroes.find(h=>h.id==='d');assert.equal(p.allowed,true);assert.deepEqual(next.main,[row('wait')]);assert.equal(next.overrides.cistern.main,undefined);assert.equal(next.overrides.cistern.pos,'left');for(const key of ['trained','training','gear','advancement','pos','defenses','item','itemPolicy','attribute','defenseFocus'])assert.deepEqual(next[key],actual[key]);assert.deepEqual(p.guild.members,g.members);assert.deepEqual(p.config.heroes.filter(h=>h.id!=='d'),c.heroes.filter(h=>h.id!=='d'));
});
test('课程未学与待结算拒绝明确应用，不由草稿授予技能或改写待结算出征',()=>{
 const g=setCompanion(selectHero(newGuild(),'c'),'d','ward'),c=defaults();c.heroes.find(h=>h.id==='d').prep=[row('foresight','center')];const p=draftCommandPreview(g,c,{targetId:'d'}),before=clone(g);assert.equal(p.allowed,false);assert.throws(()=>adoptDraftCommands(g,c,p),/先觉阵/);assert.deepEqual(g,before);
 const earned=setup(),pending=depart(earned.g,earned.c),draft=clone(earned.c);draft.heroes.find(h=>h.id==='d').overrides.gallery={main:[row('wait')]};const locked=draftCommandPreview(pending,draft,ask),snapshot=clone(pending);assert.throws(()=>adoptDraftCommands(pending,draft,locked),/领取/);assert.deepEqual(pending,snapshot);
});
test('预览过期会拒绝，传入伪造的配置或公会候选不能授予资产',()=>{
 const {g,c}=setup();c.heroes.find(h=>h.id==='d').overrides.gallery={main:[row('wait')]};const p=draftCommandPreview(g,c,ask),changed=train(g,'d','skill:ward');assert.throws(()=>adoptDraftCommands(changed,c,p),/过期/);const other=clone(c);other.seed++;assert.throws(()=>adoptDraftCommands(g,other,p),/过期/);p.guild.gold=99999;p.guild.members[0].xp=99999;p.config.heroes.find(h=>h.id==='d').training={'skill:spark':3};const applied=adoptDraftCommands(g,c,p);assert.equal(applied.guild.gold,g.gold);assert.deepEqual(applied.guild.members,g.members);assert.deepEqual(applied.config.heroes.find(h=>h.id==='d').training,g.members.find(m=>m.id==='d').training);assert.throws(()=>adoptDraftCommands(g,c,ask),/缺少预览/);
});
test('未知队员与外路线房间拒绝，已是自定义且指令相同时不制造应用',()=>{
 const {g,c}=setup(),before=clone({g,c});assert.throws(()=>draftCommandPreview(g,c,{targetId:'mira'}),/均出战/);assert.throws(()=>draftCommandPreview(g,c,{...ask,roomId:'harbor_cache'}),/不属于/);assert.throws(()=>draftCommandPreview(g,c,{...ask,roomId:null}),/不属于/);const custom=setCompanion(g,'d','custom'),p=draftCommandPreview(custom,c,{targetId:'d'});assert.equal(p.allowed,false);assert.match(p.reasons.join(''),/一致/);assert.deepEqual({g,c},before);
});
test('采用本房草稿接入一次配置职责撤销，撤销保留后来的个人成长',()=>{
 const {g,c}=setup();c.heroes.find(h=>h.id==='d').overrides.gallery={main:[row('wait')]};const p=draftCommandPreview(g,c,ask),applied=adoptDraftCommands(g,c,p),undo=configurationUndo(c,g,applied.guild),current=train(applied.guild,'d','skill:ward'),restored=restoreConfigurationUndo(current,undo);assert.deepEqual(restored.config,c);assert.equal(restored.guild.command.companions.d,'seer');assert.deepEqual(restored.guild.members,current.members);assert.notDeepEqual(resolveHeroPlan(guildConfig(restored.guild,restored.config).heroes.find(h=>h.id==='d'),'gallery').main,[row('wait')]);
});
test('从真实报告配置改配不改历史报告，预览及应用结果与来源深层独立',()=>{
 const {g,c}=setup(),report=simulate(guildConfig(g,c)),before=clone(report),draft=clone(report.config);draft.heroes.find(h=>h.id==='d').overrides.gallery={main:[row('wait')]};const p=draftCommandPreview(g,draft,ask),result=adoptDraftCommands(g,draft,p);result.config.heroes.find(h=>h.id==='d').overrides.gallery.main[0].skill='spark';result.guild.members[0].xp=0;assert.deepEqual(report,before);assert.equal(p.config.heroes.find(h=>h.id==='d').overrides.gallery.main[0].skill,'wait');assert.equal(draft.heroes.find(h=>h.id==='d').overrides.gallery.main[0].skill,'wait');
});
