import test from 'node:test';
import assert from 'node:assert/strict';
import {scarcityConfig,defaults} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {supplyLedger,settlementGoals,tideFrame} from '../dist/expedition-settlement.mjs';
function run(seed=3,rescue='gather'){const c=scarcityConfig();c.seed=seed;c.rescueApproach=rescue;c.bellApproach='study';return simulate(c);}
test('ledger reconciles every supply and links only changed snapshots without mutating reports',()=>{
 for(const rescue of ['pass','gather','aid']){const r=run(1,rescue),before=JSON.stringify(r),l=supplyLedger(r);for(const row of l.rows){assert.equal(row.start+row.gained-row.spent,row.end);assert.equal(row.end,r.supplies[row.key]);}for(const entry of l.entries)assert.ok(r.events.some(e=>e.id===entry.eventId));assert.equal(JSON.stringify(r),before);}
});
test('rescue gains and spending remain separate from shared material casts',()=>{
 const r=run(1,'aid'),l=supplyLedger(r),entry=l.entries.find(x=>x.eventId===r.events.find(e=>e.type==='rescue').id);
 assert.deepEqual(entry.changes.map(x=>[x.key,x.delta]),[['herb',-3],['rune',4],['arrow',4]]);
 assert.equal(l.rows.find(x=>x.key==='rune').gained,4);
});
test('failure cannot earn clear, survivor or stock goals',()=>{const r=run();assert.equal(r.won,false);assert.equal(r.party.filter(x=>x.hp>0).length,6);assert.ok(settlementGoals(r).every(g=>!g.done));});
test('reserve goal has exact inclusive thresholds and requires victory',()=>{const r=run(3,'pass');assert.equal(r.won,true);r.supplies.rune=2;r.supplies.arrow=2;assert.ok(settlementGoals(r).every(g=>g.done));r.supplies.arrow=1;assert.equal(settlementGoals(r)[2].done,false);});
test('tide follows current event without leaking later flood result',()=>{
 const r=run(),end=r.events.at(-1),early=r.events.find(e=>e.roomIndex===end.roomIndex&&e.round===1),entry=r.events.find(e=>e.roomIndex===end.roomIndex&&e.round===0);
 assert.equal(tideFrame(r,early).sealed,false);assert.equal(tideFrame(r,early).elapsed,0);assert.equal(tideFrame(r,entry).remaining,4);assert.equal(tideFrame(r,end).sealed,true);assert.equal(tideFrame(r,end).remaining,0);
});
test('clear at deadline is clear, ordinary route has no tide',()=>{const r=run(3,'pass'),e=r.events.find(e=>e.type==='victory');const t=tideFrame(r,{...e,round:5});assert.equal(t.status,'本房肃清');assert.equal(t.sealed,false);assert.equal(t.elapsed,5);assert.equal(tideFrame({config:defaults()},e),null);});
