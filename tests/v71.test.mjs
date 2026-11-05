import test from 'node:test';import assert from 'node:assert/strict';
import {FOUNDRY_ROOMS} from '../dist/expedition-foundry.mjs';import {foundryConfig,roomsFor,ROOM_IDS,supplyBudget,clone,GEAR} from '../dist/expedition-data.mjs';
import {validate,simulate,current,buildParty,resistanceOf} from '../dist/expedition-engine.mjs';import {ADVENTURES,adventureConfig,chapterEnding} from '../dist/expedition-adventure.mjs';import {sceneFor} from '../dist/expedition-stage.mjs';
import {foundryProfiles} from '../scripts/foundry-cases.mjs';import {guildConfig,newGuild,depart,pendingReport,pendingReward,claim,assignLoot,equip} from '../dist/expedition-guild.mjs';import {ROUTE_REWARDS,expeditionReward} from '../dist/expedition-loot.mjs';import {equipmentSource} from '../dist/expedition-equipment-view.mjs';
const trained=foundryProfiles().trained;
test('铸库为四个独立房间且三种战术起点合法，不赠送培养或课程，固定30补给',()=>{
 assert.ok(ADVENTURES.some(a=>a.id==='foundry'));validate(adventureConfig('foundry'));assert.equal(roomsFor(foundryConfig()).length,4);assert.equal(new Set(FOUNDRY_ROOMS.map(r=>r.id)).size,4);
 for(const p of ['plain','split','shelter']){const c=foundryConfig(p);validate(c);assert.equal(supplyBudget(c),30);assert.equal(Object.values(c.supplies).reduce((n,v)=>n+v,0),30);assert.ok(c.heroes.every(h=>Object.keys(h.training).length===0));assert.ok(roomsFor(c).every(r=>ROOM_IDS.includes(r.id)));}
 const a=foundryConfig(),b=foundryConfig();a.heroes[0].main=[];assert.notDeepEqual(a,b);assert.throws(()=>foundryConfig('unknown'),/未知铸库/);
});
test('可见抗性、分散阵位和支援技能构成压力，战斗确实发生治疗、补召和保护',()=>{
 const rooms=FOUNDRY_ROOMS;assert.equal(resistanceOf(rooms[0].enemies[0],'magic'),-20);assert.deepEqual(rooms[1].enemies.filter(h=>h.name==='风箱弩手').map(h=>h.pos),['left','right']);assert.ok(resistanceOf(rooms[1].enemies.find(h=>h.skills.heal),'magic')>=60);assert.equal(resistanceOf(rooms[2].enemies.find(h=>h.skills.sentinel),'ranged'),60);
 const c=foundryConfig('plain');c.seed=101;const r=simulate(c);assert.ok(r.events.some(e=>e.type==='heal'&&e.actor==='fbm'));assert.ok(r.events.filter(e=>e.type==='summon'&&e.actor==='fcs').length>=2);assert.ok(r.events.some(e=>e.type==='cast'&&e.actor==='fvp'&&e.detail.skill==='ward'));
});
test('四房间继承生命法力道具与补给，模拟不改变路线静态内容和输入',()=>{
 const c=foundryConfig(),before=clone({c,rooms:FOUNDRY_ROOMS}),r=simulate(c);assert.equal(r.rooms.length,4);
 for(let i=0;i<3;i++){const end=r.events.find(e=>e.type==='victory'&&e.roomIndex===i),start=r.events.find(e=>e.type==='room'&&e.roomIndex===i+1);assert.ok(end&&start);assert.deepEqual(start.supplies,end.supplies);for(const u of end.units.filter(u=>u.side==='party'&&!u.owner)){const next=start.units.find(n=>n.id===u.id);assert.equal(next.hp,u.hp);assert.equal(next.mp,u.mp);assert.deepEqual(next.itemInstance,u.itemInstance);}}
 assert.deepEqual({c,rooms:FOUNDRY_ROOMS},before);
});
test('公会通过正常资产出征并领取首通，掉落只进仓库，不能重复领奖',()=>{
 const g=clone(trained),c=foundryConfig(),before=clone(g),actual=guildConfig(g,c);assert.deepEqual(actual.heroes.find(h=>h.id==='c').training,g.members.find(m=>m.id==='c').training);
 const pending=depart(g,c),r=pendingReport(pending),reward=pendingReward(pending);assert.equal(r.won,true);assert.equal(r.rooms.length,4);assert.equal(reward.firstClear,true);assert.deepEqual(reward.loot,['bellowscoat']);assert.equal(reward.gold,220);assert.equal(reward.xp,90);
 const done=claim(pending);assert.equal(done.clears.foundry,1);assert.equal(done.warehouse.bellowscoat,1);assert.equal(done.members.some(m=>m.owned.includes('bellowscoat')),false);assert.throws(()=>claim(done),/没有待领取/);assert.deepEqual(g,before);
});
test('铸库专属装备有明确来源且不能凭金币购买，分配保留部位和属性代价',()=>{
 let g=clone(trained);assert.throws(()=>equip(g,'b','bellowscoat'),/战利品/);g=claim(depart(g,foundryConfig()));const before=guildConfig(g,foundryConfig()),equipped=assignLoot(g,'b','bellowscoat'),after=guildConfig(equipped,foundryConfig()),a=buildParty(before).find(h=>h.id==='b'),b=buildParty(after).find(h=>h.id==='b');
 assert.equal(current(b,'agi')-current(a,'agi'),2);assert.equal(current(b,'int')-current(a,'int'),-2);assert.equal(resistanceOf(b,'magic')-resistanceOf(a,'magic'),-10);assert.equal(resistanceOf(b,'ranged')-resistanceOf(a,'ranged'),10);assert.deepEqual(after.heroes.find(h=>h.id==='b').gear.weapon,before.heroes.find(h=>h.id==='b').gear.weapon);assert.equal(equipped.warehouse.bellowscoat,0);assert.match(equipmentSource('bellowscoat'),/首通必得/);assert.match(equipmentSource('kilngauge'),/锈潮铸库/);assert.equal(GEAR.kilngauge.bonus.con,-1);
});
test('失败不给通关或首通装备，重复通关按固定属性池产出且不串其他路线记录',()=>{
 const c=foundryConfig();for(const h of c.heroes){h.main=[];h.prep=[];h.item='none';h.healing.enabled=false;}const pending=depart(newGuild(),c),reward=pendingReward(pending);assert.equal(pendingReport(pending).won,false);assert.equal(reward.firstClear,false);assert.deepEqual(reward.loot,[]);const done=claim(pending);assert.equal(done.clears.foundry,undefined);
 const report=simulate(foundryConfig()),again=expeditionReward(report,{first:false,id:7});assert.equal(again.firstClear,false);assert.equal(again.loot.length,1);assert.ok(ROUTE_REWARDS.foundry.pool.includes(again.loot[0]));assert.equal(again.gold,150);assert.equal(again.xp,65);
});
test('新房间逐房指令有效，失败结尾不冒充通关，新场景标签跟随真实房间',()=>{
 const c=foundryConfig();c.heroes[3].overrides.foundry_crucible={pos:'right'};validate(c);const r=simulate(c),entry=r.events.find(e=>e.type==='room'&&e.roomIndex===2);assert.equal(entry.units.find(h=>h.id==='d').pos,'right');for(let i=0;i<4;i++){assert.equal(sceneFor(c,i).label,FOUNDRY_ROOMS[i].name);assert.equal(sceneFor(c,i).theme,'foundry');}assert.equal(chapterEnding(r).won,r.won);const failed=simulate(c,{maxRounds:1});assert.equal(chapterEnding(failed).won,false);assert.match(chapterEnding(failed).text,/0\/4/);
});
