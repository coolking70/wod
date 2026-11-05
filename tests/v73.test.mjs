import test from 'node:test';import assert from 'node:assert/strict';
import {FOUNDRY_CHANNEL,FOUNDRY_ROOMS,foundryApproach,resolveFoundryPass} from '../dist/expedition-foundry.mjs';
import {foundryConfig,roomsFor,clone,migrateConfig} from '../dist/expedition-data.mjs';import {simulate,validate,buildParty,resistanceOf} from '../dist/expedition-engine.mjs';
import {foundryPassageView,channelTactics,foundryEventView,foundryEvidenceCells} from '../dist/expedition-foundry-view.mjs';import {sceneFor} from '../dist/expedition-stage.mjs';
import {resourceLedger} from '../dist/expedition-resource-ledger.mjs';import {configurationChanges} from '../dist/expedition-review.mjs';
import {foundryProfiles} from '../scripts/foundry-cases.mjs';import {guildConfig,depart,pendingReport,pendingReward,claim,historyReport,equip} from '../dist/expedition-guild.mjs';
const route=()=>({...channelTactics(foundryConfig()),foundryApproach:'channel'}),base=foundryProfiles().trained;
test('可选通路字段兼容旧配置，严格拒绝未知、原型键和非字符串',()=>{
 const c=foundryConfig();assert.equal(Object.hasOwn(c,'foundryApproach'),false);assert.equal(foundryApproach(c),'bellows');assert.deepEqual(roomsFor(c),FOUNDRY_ROOMS);assert.deepEqual(migrateConfig(JSON.parse(JSON.stringify(c))),c);
 for(const value of [null,[],{},0,'','unknown','toString','__proto__']){const bad={...c,foundryApproach:value},before=clone(bad);assert.throws(()=>validate(bad),/铸库通路/);assert.deepEqual(bad,before);}assert.equal(roomsFor(route())[1].name,FOUNDRY_CHANNEL.name);
});
test('自动选路按抵达库存4份、三名活人及10%抗性边界，不计宠物或倒下队员',()=>{
 const c={...route(),foundryApproach:'adaptive'},party=buildParty(c);party.forEach((u,i)=>u.resistances={magic:i<3?10:9});const decide=(rune,units=party)=>resolveFoundryPass(c,units,{herb:8,rune,arrow:7},resistanceOf),before=clone({c,party});
 assert.equal(decide(4).decision.chosen,'channel');assert.equal(decide(3).decision.chosen,'bellows');assert.equal(decide(4).decision.qualified,3);
 const dead=clone(party);dead[0].hp=0;dead.push({...clone(party[0]),id:'pet',owner:'a',hp:999});assert.equal(decide(4,dead).decision.chosen,'bellows');assert.equal(decide(4,dead).decision.qualified,2);
 const low=clone(party);low[0].resistances.magic=9;assert.equal(decide(4,low).decision.chosen,'bellows');assert.deepEqual({c,party},before);
});
test('明确选潮渠只要求2符纸，费用恰为2，不足0或1则回廊且不扣费',()=>{
 const c=route(),party=buildParty(c);for(const rune of [0,1,2,3]){const supplies={herb:5,rune,arrow:7},before=clone(supplies),d=resolveFoundryPass(c,party,supplies,resistanceOf);assert.equal(d.decision.chosen,rune>=2?'channel':'bellows');assert.deepEqual(d.delta,rune>=2?{rune:-2}:{});assert.equal(d.decision.suppliesAfter.rune,rune>=2?rune-2:rune);assert.deepEqual(supplies,before);}
});
test('真实进场只结算一次通路费用，采用同一房间覆盖，账本守恒且重放纯读取',()=>{
 const c=guildConfig(base,route());c.seed=3;const before=clone(c),r=simulate(c),events=r.events.filter(e=>e.type==='branch');assert.equal(events.length,1);const e=events[0];assert.equal(e.roomIndex,1);assert.equal(e.round,0);assert.equal(e.actor,null);assert.deepEqual(e.detail.suppliesBefore,r.rooms[0].supplies);assert.equal(e.detail.suppliesAfter.rune,e.detail.suppliesBefore.rune-2);assert.deepEqual(e.supplies,e.detail.suppliesAfter);assert.equal(r.rooms[1].path,'channel');assert.equal(r.rooms[1].id,'foundry_bellows');assert.equal(e.units.filter(u=>u.side==='enemy').length,3);assert.ok(e.units.some(u=>u.id==='fcm1'&&u.pos==='center'));
 assert.deepEqual(r.party.find(u=>u.id==='b').overrides.foundry_bellows.main,c.heroes.find(h=>h.id==='b').overrides.foundry_bellows.main);const ledger=resourceLedger(r);assert.deepEqual(ledger[1].branches[0].delta,{herb:0,rune:-2,arrow:0});assert.equal(c.supplies.rune-r.supplies.rune,ledger.reduce((n,room)=>n+room.spent.rune,0)+2);assert.deepEqual(simulate(c),r);assert.deepEqual(c,before);assert.match(foundryEventView(e),/回放不会再次扣除/);assert.deepEqual(foundryEvidenceCells(e.detail)[0],['通路','冷却潮渠']);assert.equal(sceneFor(c,1,r.rooms[1]).label,FOUNDRY_CHANNEL.name);
});
test('首房失败不收未抵达费用，自定义遭遇不触发正式通路',()=>{
 const c=route(),party=buildParty(c);for(const u of party){u.hp=1;u.mp=0;}const r=simulate(c,{party});assert.equal(r.won,false);assert.equal(r.rooms.length,1);assert.equal(r.events.some(e=>e.type==='branch'),false);const custom=simulate(c,{rooms:[FOUNDRY_ROOMS[0],FOUNDRY_ROOMS[1]]});assert.equal(custom.events.some(e=>e.type==='branch'),false);assert.equal(custom.rooms[1].name,FOUNDRY_ROOMS[1].name);
});
test('入场资源不足实际回退，场景和战报显示实际回廊而非预览潮渠',()=>{
 const c=route();c.supplies={herb:15,rune:1,arrow:14};c.seed=3;const r=simulate(guildConfig(base,c)),e=r.events.find(e=>e.type==='branch');assert.ok(e,'必须实际抵达第二场');assert.equal(e.detail.chosen,'bellows');assert.ok(e.detail.suppliesBefore.rune<2);assert.deepEqual(e.detail.suppliesBefore,e.detail.suppliesAfter);assert.equal(r.rooms[1].path,'bellows');assert.equal(sceneFor(c,1,r.rooms[1]).label,FOUNDRY_ROOMS[1].name);assert.match(foundryEventView(e),/改走风箱回廊/);
});
test('通路可沿正常购装形成自动条件，待结算刷新和历史重演不重复付款或结算',()=>{
 let g=clone(base);for(const id of ['c','d','f'])g=equip(g,id,'saltseal');assert.equal(g.gold,base.gold-180);const c={...route(),foundryApproach:'adaptive'},before=clone(g),pending=depart(g,c),r=pendingReport(pending);assert.equal(r.events.find(e=>e.type==='branch').detail.chosen,'channel');assert.deepEqual(pendingReport(JSON.parse(JSON.stringify(pending))),r);const reward=pendingReward(pending),done=claim(pending);assert.equal(done.gold,g.gold+reward.gold);assert.deepEqual(historyReport(done,g.next),r);assert.deepEqual(g,before);assert.throws(()=>claim(done),/没有待领取/);assert.equal(done.history[0].config.foundryApproach,'adaptive');
});
test('潮渠草案仅改本房职业指令，保留资源、阵位、资产与其他房间；A/B解释通路差异',()=>{
 const c=foundryConfig('shelter');c.foundryApproach='adaptive';const before=clone(c),next=channelTactics(c);validate(next);assert.deepEqual(next.heroes.find(h=>h.id==='c').overrides.foundry_bellows.main,[{skill:'lance',target:'front',mode:'once'},{skill:'spark',target:'front',mode:'repeat'}]);assert.deepEqual(next.heroes.find(h=>h.id==='b').overrides.foundry_bellows.main,[{skill:'volley',target:'center',mode:'once'},{skill:'shot',target:'center',mode:'repeat'}]);assert.deepEqual(c,before);assert.deepEqual(next.supplies,c.supplies);assert.equal(next.foundryApproach,c.foundryApproach);for(const h of next.heroes){const old=c.heroes.find(u=>u.id===h.id),{overrides,...rest}=h,{overrides:prior,...original}=old;assert.deepEqual(rest,original);for(const key of Object.keys(prior).filter(id=>id!=='foundry_bellows'))assert.deepEqual(overrides[key],prior[key]);}const changes=configurationChanges(foundryConfig(),route());assert.ok(changes.some(x=>x.label==='铸库第二场通路'&&x.before==='风箱回廊'&&x.after==='冷却潮渠'));assert.match(foundryPassageView(c),/不保证更优/);assert.match(foundryPassageView(c),/同.*覆盖|共用/);
});
