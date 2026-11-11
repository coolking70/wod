import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,row,clone,roomsFor,resolveHeroPlan,HEROES} from '../dist/expedition-data.mjs';
import {ADVANCED,installAdvanced} from '../dist/expedition-growth.mjs';
import {newGuild,learnAdvanced,depart,pendingReport,claim} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {readiness,customizeForEditing} from '../dist/expedition-readiness.mjs';
import {configurationUndo,restoreConfigurationUndo} from '../dist/expedition-config-undo.mjs';
import {defaultCoursePreview,defaultCourseView,installDefaultCourse} from '../dist/expedition-course-install.mjs';
import {recruit,swapCompanion} from '../dist/expedition-roster.mjs';
import {courseInstallCases} from '../scripts/course-install-cases.mjs';
const x=courseInstallCases();
test('real first three claims earn the course; installing keeps exact earned assets and all current room commands',()=>{
 const before=clone(x),p=defaultCoursePreview(x.guild,x.config,'b'),edit=installDefaultCourse(x.guild,x.config,'b'),old=x.config.heroes.find(h=>h.id==='b'),next=edit.config.heroes.find(h=>h.id==='b');
 assert.equal(x.guild.next,4);assert.equal(x.beforeLearning.members.find(m=>m.id==='b').xp-x.guild.members.find(m=>m.id==='b').xp,40);assert.equal(p.allowed,true);assert.equal(p.preservedOverrides,2);assert.equal(p.rooms.filter(r=>r.overridden).length,2);assert.deepEqual(edit.guild,x.guild);assert.deepEqual(next.overrides,old.overrides);assert.deepEqual(next.main,[row('sweep','rear','cycle'),...old.main]);assert.equal(resolveHeroPlan(next,x.rooms[1].id).main.length,0);assert.deepEqual(x,before);
 for(const room of p.rooms)assert.equal(room.courseListed,!room.overridden);
});
test('legacy uniform installation remains exact and explicitly discards only the selected phase',()=>{
 const old=installAdvanced(x.config,'b','sweep'),current=installAdvanced(x.config,'b','sweep',{preserveOverrides:false}),h=old.heroes.find(h=>h.id==='b');assert.deepEqual(old,current);for(const o of Object.values(h.overrides))assert.equal(Object.hasOwn(o,'main'),false);assert.deepEqual(h.overrides[x.rooms[1].id].prep,[]);assert.deepEqual(installDefaultCourse(x.guild,x.config,'b').config.heroes.filter(h=>h.id!=='b'),readiness(x.guild,x.config).config.heroes.filter(h=>h.id!=='b'));
});
test('all nine roster members install into the correct phase without discarding explicit empty or off-route overrides',()=>{
 const visited=[];for(const hero of HEROES){let g=selectHero(clone(x.beforeLearning),hero.id==='a'?'b':'a'),c=defaults();if(!g.members.some(m=>m.id===hero.id)){g.gold=1000;g=recruit(g,hero.id);g=swapCompanion(g,c,'b',hero.id);}g.members.find(m=>m.id===hero.id).xp=100;g=learnAdvanced(g,hero.id);c=readiness(g,c).config;const h=c.heroes.find(h=>h.id===hero.id);h.overrides.gallery={prep:[],main:[],pos:'rear'};const before=clone(h.overrides),e=installDefaultCourse(g,c,hero.id),after=e.config.heroes.find(h=>h.id===hero.id);assert.deepEqual(after.overrides,before);assert.ok([...after.main,...after.prep].some(r=>r.skill===ADVANCED[hero.id]));visited.push(hero.id);}assert.deepEqual(visited,HEROES.map(h=>h.id));
});
test('applied companion role is materialized before installation and can be exactly undone without undoing a course',()=>{
 let g=selectHero(newGuild(),'a');g.members.find(m=>m.id==='d').xp=100;g=learnAdvanced(g,'d');g=setCompanion(g,'d','seer');const c=defaults(),actual=customizeForEditing(g,c,'d'),edit=installDefaultCourse(g,c,'d'),undo=configurationUndo(c,g,edit.guild);assert.equal(defaultCoursePreview(g,c,'d').changesRole,true);assert.equal(edit.guild.command.companions.d,'custom');assert.deepEqual(edit.config.heroes.find(h=>h.id==='d').main,actual.config.heroes.find(h=>h.id==='d').main);assert.deepEqual(restoreConfigurationUndo(edit.guild,undo),{config:c,guild:g});assert.deepEqual(edit.guild.members,g.members);
});
test('full default phase refuses without input mutation while an already installed course can be moved to first',()=>{
 const c=clone(x.config),h=c.heroes.find(h=>h.id==='b');h.main=Array.from({length:4},()=>row('shot','front'));const before=clone(c);assert.equal(defaultCoursePreview(x.guild,c,'b').allowed,false);assert.throws(()=>installDefaultCourse(x.guild,c,'b'),/4条/);assert.deepEqual(c,before);h.main[3]=row('sweep','front');assert.equal(defaultCoursePreview(x.guild,c,'b').allowed,true);const e=installDefaultCourse(x.guild,c,'b');assert.equal(e.config.heroes.find(h=>h.id==='b').main.length,4);assert.equal(e.config.heroes.find(h=>h.id==='b').main.filter(r=>r.skill==='sweep').length,1);
});
test('unlearned, pending, inactive and unknown actors are blocked without a free course or payment',()=>{
 for(const [g,c,reason] of [[x.beforeLearning,x.config,/尚未学习/],[depart(x.guild,x.config),x.config,/领取/]]){const before=clone({g,c});assert.equal(defaultCoursePreview(g,c,'b').allowed,false);assert.throws(()=>installDefaultCourse(g,c,'b'),reason);assert.deepEqual({g,c},before);}
 let inactive=recruit({...clone(x.beforeLearning),gold:1000},'mira');inactive.members.find(m=>m.id==='mira').xp=100;inactive=learnAdvanced(inactive,'mira');assert.throws(()=>installDefaultCourse(inactive,x.config,'mira'),/先安排/);
 assert.throws(()=>defaultCoursePreview(x.guild,x.config,'__proto__'),/未知/);assert.throws(()=>installDefaultCourse(x.guild,x.config,'mira'),/尚未招募/);
});
test('new default installation uses existing departure and exact single settlement with no simulated preview writes',()=>{
 const before=clone(x),p=depart(x.edit.guild,x.edit.config),report=pendingReport(p),after=claim(p);assert.equal(report.config.heroes.find(h=>h.id==='b').overrides[x.rooms[1].id].main.length,0);assert.equal(after.next,5);assert.equal(after.pending,null);assert.deepEqual(after.members.find(m=>m.id==='b').unlocked,['sweep']);assert.deepEqual(x,before);assert.throws(()=>claim(after),/^Error: 没有待领取奖励$/);
});
test('scope view separates retained overrides, listed courses and actual future actions, and escapes dynamic room text',()=>{
 const p=clone(x.preview);p.rooms[0].name='<img src=x onerror=1>';const html=defaultCourseView(p);assert.match(html,/保留2份/);assert.match(html,/保留本房普通覆盖/);assert.match(html,/未列此课程/);assert.match(html,/不预测出手或胜负/);assert.ok(html.includes('&lt;img src=x onerror=1&gt;'));assert.equal(html.includes('<img src=x'),false);assert.match(defaultCourseView(defaultCoursePreview(x.beforeLearning,x.config,'b')),/disabled/);
});
