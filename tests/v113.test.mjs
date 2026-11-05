import test from 'node:test';import assert from 'node:assert/strict';
import {CONFLUENCE_ROOMS} from '../dist/expedition-confluence.mjs';
import {confluenceConfig,roomsFor,supplyBudget,GEAR,clone} from '../dist/expedition-data.mjs';
import {validate,simulate} from '../dist/expedition-engine.mjs';
import {ADVENTURES,adventureConfig,chapterEnding} from '../dist/expedition-adventure.mjs';
import {ADVENTURE_GROUPS} from '../dist/expedition-camp-cycle.mjs';
import {healingPlanDescription} from '../dist/expedition-healing.mjs';
import {roleTargetCandidates} from '../dist/expedition-target-check.mjs';
import {confluenceLoop} from '../scripts/confluence-cases.mjs';
import {newGuild,depart,pendingReward,pendingReport,claim,validateGuild} from '../dist/expedition-guild.mjs';
import {lockedSkills} from '../dist/expedition-growth.mjs';
import {bookProgress} from '../dist/expedition-book.mjs';
import {equipmentSource} from '../dist/expedition-equipment-view.mjs';
import {sceneFor} from '../dist/expedition-stage.mjs';
const x=confluenceLoop();
test('three authored rooms change medic scope, covered position and role ambiguity without new engine rules',()=>{
 assert.equal(CONFLUENCE_ROOMS.length,3);assert.equal(new Set(CONFLUENCE_ROOMS.map(r=>r.id)).size,3);
 assert.deepEqual(CONFLUENCE_ROOMS.map(r=>r.enemies.find(u=>u.healing.groupAid).healing.target),['front','rear','front']);
 assert.deepEqual(CONFLUENCE_ROOMS.map(r=>r.enemies.find(u=>u.healing.groupAid).pos),['rear','left','rear']);
 assert.deepEqual(roleTargetCandidates(CONFLUENCE_ROOMS[2].enemies,'healer').map(u=>u.id),['cfsm','cfss']);
 assert.equal(CONFLUENCE_ROOMS[1].enemies.find(u=>u.id==='cfbg').prep[0].target,'left');
});
test('three legal thirty-supply starts need no unlearned course or free permanent assets',()=>{
 const g=newGuild();for(const plan of ['source','suppress','spread']){const c=confluenceConfig(plan);validate(c);assert.equal(supplyBudget(c),30);assert.equal(Object.values(c.supplies).reduce((n,v)=>n+v,0),30);assert.deepEqual(roomsFor(c),CONFLUENCE_ROOMS);for(const h of c.heroes){assert.deepEqual(lockedSkills(g.members.find(m=>m.id===h.id),h),[]);assert.deepEqual(h.training,{});}}
 assert.throws(()=>confluenceConfig('optimal'));assert.equal(adventureConfig('confluence').expedition,'confluence');assert.ok(ADVENTURES.some(a=>a.id==='confluence'));assert.ok(ADVENTURE_GROUPS.find(g=>g.id==='roles').routes.includes('confluence'));
});
test('real enemy group aid pays its own mana once, heals two and never consumes player herbs',()=>{
 const r=x.runs[1].report,casts=r.events.filter(e=>e.type==='cast'&&e.actor?.startsWith('cf')&&e.detail.skill==='groupheal');assert.equal(casts.length,3);
 for(const e of casts){assert.equal(e.detail.mpBefore-e.detail.mpAfter,10);assert.equal(e.detail.itemAmount,2);assert.equal(e.targets.length,2);const before=r.events[r.events.indexOf(e)-1];assert.deepEqual(e.supplies,before.supplies);const heals=r.events.filter(q=>q.type==='heal'&&q.actor===e.actor&&q.roomIndex===e.roomIndex&&q.detail.cast===e.detail.cast);assert.equal(heals.length,2);assert.ok(heals.every(q=>q.detail.amount===Math.floor(e.detail.mean*.45)&&q.detail.groupHealing.paidOnce));}
 assert.equal(x.runs[0].report.events.filter(e=>e.type==='cast'&&e.detail.skill==='groupheal').length,0);
});
test('actual healing blocks reference a prior successful suppression and do not undo earlier group healing',()=>{
 const r=x.runs[1].report,skips=r.events.filter(e=>e.type==='skip'&&e.actor?.startsWith('cf')&&e.detail.healingBlock);assert.equal(skips.length,3);
 for(const e of skips){assert.equal(e.detail.cost,0);assert.equal(e.detail.healingBlock.source,'d');const hit=r.events.find(q=>q.type==='effect'&&q.detail.effectId===e.detail.healingBlock.effectId);assert.ok(hit.id<e.id);assert.equal(hit.round,e.round);assert.equal(hit.roomIndex,e.roomIndex);assert.ok(!r.events.some(q=>q.id>hit.id&&q.id<e.id&&q.actor===e.actor&&q.type==='cast'&&['heal','groupheal'].includes(q.detail.skill)));}
 assert.ok(r.events.some(e=>e.type==='heal'&&e.actor==='cfcm'&&e.round===1));
});
test('bridge uses real interception and magical target bypass, with original targets retained',()=>{
 const r=x.runs[0].report,attempts=r.events.filter(e=>e.type==='intercept'&&e.actor==='cfbg');assert.equal(attempts.length,2);assert.ok(attempts.every(e=>e.detail.protected==='cfbm'&&e.detail.attackType==='ranged'));
 const magic=r.events.filter(e=>e.type==='attack'&&e.roomIndex===1&&e.actor==='c');assert.ok(magic.some(e=>e.targets.includes('cfbm')));assert.ok(magic.every(e=>!e.detail.interception));
});
test('fixed first/repeat rewards and accessory tradeoffs are earned only through normal claiming',()=>{
 assert.deepEqual(x.runs[0].reward,{cleared:3,gold:175,xp:75,firstClear:true,loot:['triagepin']});for(const run of x.runs.slice(1))assert.deepEqual(run.reward,{cleared:3,gold:120,xp:55,firstClear:false,loot:['triagepin']});
 assert.deepEqual(x.runs.map(r=>r.claimed.gold),[175,295,415]);assert.equal(GEAR.triagepin.slot,'accessory');assert.equal(GEAR.triagepin.bonus.con,-2);assert.equal(GEAR.triagepin.resistances.magic,-10);assert.match(equipmentSource('triagepin'),/合流救护站/);assert.equal(x.final.warehouse.triagepin,2);for(const run of x.runs)assert.throws(()=>claim(run.claimed));
});
test('claimed gear and paid suppression training remain personal while each selected goal earns one proof',()=>{
 assert.equal(x.desktop.members.find(h=>h.id==='f').gear.accessory,'triagepin');assert.equal(x.desktop.members.find(h=>h.id==='d').training['skill:suppress'],1);assert.equal(x.desktop.members.find(h=>h.id==='d').xp,55);assert.equal(x.final.command.heroId,'d');assert.equal(bookProgress(x.final).total,69);assert.equal(bookProgress(x.final).done,3);assert.deepEqual(Object.values(x.final.expeditionBook.confluence).map(p=>p.id),[1,2,3]);for(const run of x.runs){assert.equal(run.report.won,true);assert.equal(run.report.party.filter(h=>h.hp>0).length,6);assert.equal(run.claimed.history[0].objective.met,true);}validateGuild(JSON.parse(JSON.stringify(x.final)));
});
test('public dossier describes actual front/rear/self scopes and group costs rather than hardcoded all-party solo healing',()=>{
 const first=healingPlanDescription(CONFLUENCE_ROOMS[0].enemies.find(u=>u.id==='cfcm'));assert.match(first,/前排/);assert.match(first,/10法力\/2药草/);assert.match(first,/不足人数或资源回单救/);
 const last=healingPlanDescription(CONFLUENCE_ROOMS[2].enemies.find(u=>u.id==='cfss'));assert.match(last,/自身达阈值时优先自保/);assert.match(last,/自身/);assert.doesNotMatch(last,/同位合剂/);
});
test('chapter result and reused offline scene show actual route and do not fabricate extra loot or events',()=>{
 const r=x.runs[0].report,before=clone(r),ending=chapterEnding(r);assert.match(ending.text,/3\/3/);assert.match(ending.text,/分诊铜签/);assert.equal(sceneFor(r.config,0,r.rooms[0]).theme,'hospice');assert.deepEqual(r,before);
});
test('zero-room failure gives no clear bonus, relic or objective and no permanent material deduction',()=>{
 const c=confluenceConfig();for(const h of c.heroes){h.prep=[];h.main=[{skill:'wait',target:'front',mode:'repeat'}];h.healing.enabled=false;h.item='none';h.overrides={};}const p=depart(newGuild(),c),r=pendingReport(p),reward=pendingReward(p);assert.equal(r.won,false);assert.equal(reward.cleared,0);assert.equal(reward.gold,0);assert.deepEqual(reward.loot,[]);const g=claim(p);assert.equal(g.gold,0);assert.equal(g.clears.confluence,undefined);assert.equal(g.warehouse.triagepin,undefined);
});
