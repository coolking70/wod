import test from'node:test';import assert from'node:assert/strict';
import{enemyBadge}from'../dist/expedition-care.mjs';
import{COURIER_ROOMS}from'../dist/expedition-courier.mjs';
import{courierConfig}from'../dist/expedition-data.mjs';
const config=courierConfig(),medic=COURIER_ROOMS[2].enemies.find(u=>u.id==='cfh');
test('courier field medic is identified by the existing heal skill instead of generic mixed attacks',()=>{assert.equal(medic.skills.heal,9);assert.deepEqual(enemyBadge(config,{...medic,side:'enemy'}),{kind:'magic',label:'治疗支援',symbol:'药'});});
test('a medicinal-looking name cannot grant a role, and party or unknown IDs do not borrow the enemy skill',()=>{const other=COURIER_ROOMS[2].enemies.find(u=>u.id==='cfb');assert.notEqual(enemyBadge(config,{...other,name:'救护药师',side:'enemy'}).label,'治疗支援');assert.equal(enemyBadge(config,{...medic,side:'party'}),null);assert.notEqual(enemyBadge(config,{id:'unknown',name:medic.name,side:'enemy'}).label,'治疗支援');});
test('role label is read-only, while summoned ownership retains its own established badge',()=>{const before=JSON.stringify(config),unit={...medic,side:'enemy',owner:'other',summoned:true};assert.equal(enemyBadge(config,unit).label,'召唤');assert.equal(JSON.stringify(config),before);assert.equal(unit.owner,'other');});
