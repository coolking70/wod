import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,roomsFor,supplyBudget} from '../dist/expedition-data.mjs';
import {ADVENTURES,adventureConfig,chapterEnding} from '../dist/expedition-adventure.mjs';
import {simulate,validate,buildParty} from '../dist/expedition-engine.mjs';
import {RETURNING_TIDE_ROOMS} from '../dist/expedition-returning-tide.mjs';
import {ROUTE_REWARDS,expeditionReward} from '../dist/expedition-loot.mjs';
import {claim,historyReport,validateGuild,train} from '../dist/expedition-guild.mjs';
import {collectReport} from '../dist/expedition-report-archive-guild.mjs';
import {thawArchive} from '../dist/expedition-report-archive.mjs';
import {CAMPAIGN_KEYS,captureCampaign,validateCampaignBackup,restoreCampaign,campaignRaw} from '../dist/expedition-campaign-backup.mjs';
import {explorationIndex} from '../dist/expedition-exploration-index.mjs';
import {returningTideLoop,returningTideConfirmations} from '../scripts/returning-tide-cases.mjs';
const loop=returningTideLoop();
test('finite four-room chapter is freely available and declares original mechanics without granting skills or supply economy',()=>{
 const config=adventureConfig('returningtide');assert.equal(validate(config),true);assert.equal(roomsFor(config),RETURNING_TIDE_ROOMS);assert.equal(roomsFor(config).length,4);assert.equal(new Set(roomsFor(config).map(r=>r.id)).size,4);assert.equal(supplyBudget(config),36);assert.equal(Object.values(config.supplies).reduce((a,b)=>a+b),36);assert.equal(ADVENTURES.filter(r=>r.id==='returningtide').length,1);assert.ok(explorationIndex(null).ids.includes('returningtide'));assert.equal(explorationIndex(null).total,38);assert.match(ADVENTURES.find(r=>r.id==='returningtide').focus,/原创/);assert.equal(Object.hasOwn(config,'permanentSupply'),false);
});
test('real tutorial1/classic2/3 assets pay the three ordinary20XP investments without changing identity or coins',()=>{
 assert.equal(loop.earned.next,4);assert.equal(loop.prepared.gold,loop.earned.gold);for(const m of loop.earned.members){const after=clone(loop.prepared.members.find(h=>h.id===m.id));if(['b','d','f'].includes(m.id)){assert.equal(m.xp-after.xp,20);const key={b:'skill:pierce',d:'skill:ward',f:'skill:heal'}[m.id];assert.equal(after.training[key],1);delete after.training[key];after.xp+=20;}assert.deepEqual(after,m);}for(const k of['lineup','command','warehouse','history','clears'])assert.deepEqual(loop.prepared[k],loop.earned[k]);
});
test('normal4/5 exact whole reports and claims retain old history, one reward per departure and genuine loot ownership',()=>{
 assert.deepEqual(loop.runs.map(r=>r.pending.pending.id),[4,5]);assert.equal(loop.final.next,6);assert.equal(loop.final.gold,660);assert.equal(loop.final.clears.returningtide,2);const warehouse=clone(loop.earned.warehouse);
 for(const r of loop.runs){assert.deepEqual(historyReport(r.claimed,r.before.next),r.report);assert.throws(()=>claim(r.claimed));assert.equal(r.claimed.gold,r.before.gold+r.reward.gold);for(const id of r.reward.loot)warehouse[id]=(warehouse[id]||0)+1;for(const m of r.before.members){const after=clone(r.claimed.members.find(h=>h.id===m.id));after.xp-=r.reward.xp;assert.deepEqual(after,m);}for(const record of r.before.history)assert.deepEqual(r.claimed.history.find(h=>h.id===record.id),record);assert.deepEqual(r.claimed.command,r.before.command);assert.deepEqual(r.claimed.lineup,r.before.lineup);assert.equal(validateGuild(r.claimed),r.claimed);}assert.deepEqual(loop.final.warehouse,warehouse);assert.deepEqual(loop.runs.map(r=>[r.reward.gold,r.reward.xp,r.reward.firstClear]),[[240,100,true],[170,75,false]]);assert.equal(loop.final.expeditionBook.returningtide.clear.id,4);assert.equal(loop.final.expeditionBook.returningtide.reserve,undefined);
});
test('same declared preparation preserves both observed channel cancellation4 and release5 with genuine fees and phase transitions',()=>{
 for(const r of loop.runs){assert.equal(r.report.won,true);assert.equal(r.report.party.filter(h=>h.hp>0).length,6);assert.equal(r.report.supplies.rune,0);assert.ok(r.report.events.some(e=>e.type==='health-phase'));const start=r.report.events.find(e=>e.type==='windup-start');assert.ok(start);assert.ok(start.detail.cost>0);assert.ok(start.detail.channel.paidMana>0);assert.deepEqual(r.pending.pending.config,r.report.config);}assert.ok(loop.runs[0].report.events.some(e=>e.type==='windup-cancel'));assert.ok(loop.runs[1].report.events.some(e=>e.type==='windup-release'));assert.deepEqual(loop.runs.map(r=>r.report.rooms.map(v=>v.rounds)),[[3,3,3,6],[4,3,3,6]]);
});
test('every room carries the exact preceding party HP/MP/item and shared stock without a hidden recovery',()=>{
 for(const {report:r}of loop.runs)for(let room=1;room<4;room++){const prev=r.events.find(e=>e.roomIndex===room-1&&e.type==='victory'),next=r.events.find(e=>e.roomIndex===room&&e.type==='room');assert.deepEqual(next.supplies,prev.supplies);for(const h of r.config.heroes){const a=prev.units.find(u=>u.id===h.id),b=next.units.find(u=>u.id===h.id);assert.deepEqual([b.hp,b.mp,b.itemInstance],[a.hp,a.mp,a.itemInstance]);}}
});
test('the third encounter can be held with living enemies and zero attack damage instead of clearing',()=>{
 const c=adventureConfig('returningtide');for(const h of c.heroes){h.prep=[];h.main=[{skill:'wait',target:'front',mode:'repeat'}];}const r=simulate(c,{rooms:[clone(RETURNING_TIDE_ROOMS[2])]});assert.equal(r.won,true);assert.equal(r.rooms[0].holdout.mode,'held');assert.equal(r.rooms[0].holdout.completedRounds,4);assert.equal(r.rooms[0].holdout.remaining.length,3);assert.ok(r.rooms[0].holdout.remaining.every(u=>u.hp>0));assert.equal(r.events.filter(e=>e.type==='attack'&&r.config.heroes.some(h=>h.id===e.actor)).length,0);
});
test('a genuine first-room defeat has no clear loot or first-clear bonus and a truthful incomplete epilogue',()=>{
 const c=adventureConfig('returningtide'),party=buildParty(c);for(const h of party){h.hp=1;h.mp=0;}for(const h of c.heroes){h.prep=[];h.main=[{skill:'wait',target:'front',mode:'repeat'}];h.healing.enabled=false;h.item='none';}const r=simulate(c,{party});assert.equal(r.won,false);const reward=expeditionReward(r,{first:true,id:4});assert.equal(reward.firstClear,false);assert.deepEqual(reward.loot,[]);assert.equal(reward.cleared,0);assert.equal(reward.gold,0);assert.match(chapterEnding(r).text,/0\/4/);assert.match(chapterEnding(r).text,/不发通关/);
});
test('pending blocks spending and first-clear rewards use only the ordinary existing pool',()=>{
 assert.throws(()=>train(loop.runs[0].pending,'b','skill:pierce'));assert.deepEqual(ROUTE_REWARDS.returningtide.pool,['anchorseal','bellfocus','saltcloak']);assert.deepEqual(loop.runs[0].reward.loot,['anchorseal']);assert.deepEqual(loop.runs[1].reward.loot,['bellfocus']);assert.equal(loop.runs[0].reward.cleared,4);assert.equal(loop.runs[0].reward.xp,4*10+35+25);
});
test('the complete new report freezes and thaws without granting any extra reward',async()=>{
 const r=loop.runs[0],saved=await collectReport(r.pending,{source:'pending',id:r.pending.pending.id,signature:JSON.stringify(r.pending.pending)},r.report,'归潮黎明首次原报告');assert.deepEqual(await thawArchive(saved.reportArchives[0]),r.report);const without=clone(saved);delete without.reportArchives;assert.deepEqual(without,r.pending);
});
test('all four existing business keys roundtrip with the new pending route and no new persistence category',async()=>{
 const values=new Map([[CAMPAIGN_KEYS[0],JSON.stringify(loop.config)],[CAMPAIGN_KEYS[1],JSON.stringify({version:1,plans:[]})],[CAMPAIGN_KEYS[2],null],[CAMPAIGN_KEYS[3],JSON.stringify(loop.runs[0].pending)]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},before=campaignRaw(storage),backup=await captureCampaign(storage,'2026-11-10T00:00:00.000Z');assert.equal((await validateCampaignBackup(backup)).guild.pending.id,4);assert.deepEqual(campaignRaw(storage),before);const target=new Map(),destination={getItem:k=>target.get(k)??null,setItem:(k,v)=>target.set(k,v),removeItem:k=>target.delete(k)};await restoreCampaign(destination,backup,campaignRaw(destination));assert.deepEqual(campaignRaw(destination),before);
});
test('two fixed default confirmations remain immutable observations, not a difficulty or win-rate adjustment',()=>{
 const before=clone(RETURNING_TIDE_ROOMS),cases=returningTideConfirmations();assert.deepEqual(cases.map(x=>x.seed),[731,732]);for(const r of cases){assert.equal(r.report.config.seed,r.seed);assert.equal(r.report.rooms.length,4);assert.equal(r.report.supplies.rune,0);}assert.deepEqual(RETURNING_TIDE_ROOMS,before);
});
test('the all-alive ending does not invent a casualty and rendering cannot modify settlement',()=>{
 const r=loop.runs[0].report,before=clone(r),ending=chapterEnding(r);assert.match(ending.text,/6\/6/);assert.match(ending.text,/六人一起/);assert.equal(ending.image,'returning-tide-v220.svg');assert.deepEqual(r,before);
});
