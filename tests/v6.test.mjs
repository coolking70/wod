import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,challengeConfig,clone,row,VERSION} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {reviewReport,configurationChanges,readPlans,storePlan} from '../dist/expedition-review.mjs';

test('复盘完全只读，观察项均能定位到所属房间的真实事件',()=>{const r=simulate(challengeConfig()),before=clone(r),review=reviewReport(r);assert.deepEqual(r,before);assert.equal(review.length,3);for(const room of review)for(const f of room.findings){const e=r.events[f.eventIndex];assert.equal(e.roomIndex,room.roomIndex);assert.ok(f.fact.length);assert.ok(f.suggestion.length);}assert.ok(review[0].findings.some(f=>f.kind==='summon'));});

test('资源跳过与空过行动分开统计，加入备用指令后可消除空过',()=>{const c=challengeConfig();c.supplies.arrow=0;c.heroes[1].main=[row('volley','rear')];const r=simulate(c),a=reviewReport(r);assert.ok(a[0].findings.some(f=>f.kind==='resource'&&f.hero==='b'));assert.ok(a[0].findings.some(f=>f.kind==='failed'&&f.hero==='b'));assert.ok(a[0].metrics.failed>0);c.heroes[1].main.push(row('shot','rear'));const b=reviewReport(simulate(c));assert.ok(b[0].findings.some(f=>f.kind==='resource'&&f.hero==='b'));assert.ok(!b[0].findings.some(f=>f.kind==='failed'&&f.hero==='b'));});

test('房间承伤只算正式队员实扣生命，排除溢出及召唤物承伤',()=>{const r=simulate(challengeConfig()),review=reviewReport(r),ids=new Set(r.party.map(u=>u.id));assert.ok(r.events.some(e=>e.type==='attack'&&e.targets[0].startsWith('summon:')&&e.detail.actual>0));for(const room of review){const expected=r.events.filter(e=>e.roomIndex===room.roomIndex&&e.type==='attack'&&ids.has(e.targets[0])).reduce((n,e)=>n+e.detail.actual,0);assert.equal(room.metrics.damageTaken,expected);}});

test('失败后未到达房间不会被补成零值结果',()=>{const c=defaults();c.heroes.forEach(h=>{h.prep=[];h.main=[row('wait')];h.healing.enabled=false;});const r=simulate(c,{maxRounds:1}),review=reviewReport(r);assert.equal(review.length,1);assert.equal(review[0].won,false);assert.equal(review[1],undefined);});

test('配置差异精确区分全局设置、默认指令与显式房间继承',()=>{const a=defaults(),b=clone(a);b.heroes[1].main.push(row('shot'));b.heroes[2].overrides.cistern={itemPolicy:{enabled:false,threshold:.5}};b.supplies.rune=21;const d=configurationChanges(a,b);assert.equal(d.length,3);assert.ok(d.some(x=>x.label==='符纸'&&x.before==='22'&&x.after==='21'));assert.ok(d.some(x=>x.label.includes('伊芙')&&x.before==='继承默认'&&x.after.includes('关闭')));assert.ok(d.some(x=>x.label.includes('莱恩')&&x.after.includes('穿石箭')));assert.deepEqual(configurationChanges(a,clone(a)),[]);});

test('键顺序不会造成伪差异，显式覆盖默认值仍有继承语义差异',()=>{const a=defaults(),b=clone(a);b.heroes[0].defenses={magic:'natural',ranged:'natural',melee:'parry'};assert.deepEqual(configurationChanges(a,b),[]);b.heroes[0].overrides.altar={defenses:clone(b.heroes[0].defenses)};assert.equal(configurationChanges(a,b).length,1);});

test('保存方案与更新均隔离输入，明确容量和名称边界',()=>{const c=challengeConfig(),plans=storePlan([],{id:'one',name:'  挑战  ',config:c});assert.equal(plans[0].name,'挑战');c.seed=22;assert.equal(plans[0].config.seed,731);const next=storePlan(plans,{id:'one',name:'新版',config:c},true);assert.equal(next.length,1);assert.equal(plans[0].name,'挑战');assert.equal(next[0].config.seed,22);assert.throws(()=>storePlan(plans,{id:'missing',name:'a',config:c},true));assert.throws(()=>storePlan(plans,{id:'two',name:' ',config:c}));let full=[];for(let i=0;i<12;i++)full=storePlan(full,{id:String(i),name:'方案'+i,config:c});assert.throws(()=>storePlan(full,{id:'13',name:'超限',config:c}));});

test('方案读取迁移旧版并隔离损坏记录，不执行非法配置',()=>{const old=defaults();old.version='0.5.0';const loaded=readPlans(JSON.stringify({version:1,plans:[{id:'ok',name:'旧版',config:old},{id:'bad',name:'损坏',config:{}},{id:'ok',name:'重复ID',config:old}]}));assert.equal(loaded.plans.length,1);assert.equal(loaded.plans[0].config.version,VERSION);assert.equal(loaded.rejected,2);assert.throws(()=>readPlans('{'));assert.throws(()=>readPlans(JSON.stringify({version:2,plans:[]})));assert.deepEqual(readPlans(null),{plans:[],rejected:0});});
