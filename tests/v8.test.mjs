import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,archiveConfig,roomsFor,clone,row,migrateConfig,VERSION,trainingCost} from '../dist/expedition-data.mjs';
import {simulate,damageResult,resistanceOf,validate} from '../dist/expedition-engine.mjs';
import {configurationChanges,reviewReport,readPlans,storePlan} from '../dist/expedition-review.mjs';
function isolated(skill='pierce',resistances={ranged:35}){
 const c=defaults();for(const h of c.heroes){h.prep=[];h.main=[row('wait')];h.healing.enabled=false;}
 c.heroes[1].main=[row(skill)];
 const e=clone(roomsFor(c)[0].enemies[0]);Object.assign(e,{hp:10000,maxHp:10000,gear:'plate',attrs:{str:0,con:0,int:0,dex:0,cha:0,agi:0,per:0,wil:0},main:[row('wait')],resistances});
 return {c,room:{id:'gallery',name:'抗性测试',enemies:[e]}};
}
test('抗性在固定护甲之后计算，只在最后向下取整，负抗性放大伤害',()=>{
 assert.deepEqual(damageResult(21,1.25,6,35),{afterArmor:20.25,unresisted:20,damage:13});
 assert.equal(damageResult(21,1.25,6,-25).damage,25);
 assert.equal(damageResult(10,1,50,-25).damage,0);
 for(const r of [0,35,-25,60])assert.equal(damageResult(0,0,6,r).damage,0);
});
test('抗性按攻击类型独立取值，缺省0且限制范围',()=>{
 const u={resistances:{magic:60,ranged:-20}};assert.equal(resistanceOf(u,'melee'),0);assert.equal(resistanceOf(u,'magic'),60);assert.equal(resistanceOf(u,'ranged'),-20);assert.equal(resistanceOf({},'magic'),0);assert.equal(resistanceOf({resistances:{magic:100}},'magic'),75);assert.equal(resistanceOf({resistances:{magic:-90}},'magic'),-50);
});
test('实际命中先破甲再抗性；战报与生命扣除一致且抗性不被破甲修改',()=>{
 const {c,room}=isolated();const r=simulate(c,{rooms:[room],maxRounds:2}),hits=r.events.filter(e=>e.type==='attack'&&e.actor==='b');assert.equal(hits.length,2);
 for(const e of hits){const d=e.detail;assert.equal(d.armorBefore,6);assert.equal(d.armor,2);assert.equal(d.resistance,35);assert.equal(d.damage,Math.floor(Math.max(0,d.rolled*d.multiplier-2)*.65));assert.equal(d.actual,d.damage);assert.equal(d.hpBefore-d.hpAfter,d.actual);assert.equal(e.units.find(u=>u.id===e.targets[0]).resistances.ranged,35);assert.equal(d.resistanceDelta,d.unresisted-d.damage);}
 assert.equal(room.enemies[0].resistances.ranged,35);
});
test('法术抗性不抵抗远程，弱点增加实际结算；零抗性保留旧公式',()=>{
 const {c,room}=isolated('shot',{magic:60});const first=r=>r.events.find(e=>e.type==='attack'&&e.actor==='b').detail;
 const base=first(simulate(c,{rooms:[room],maxRounds:1}));assert.equal(base.resistance,0);assert.equal(base.damage,Math.max(0,Math.floor(base.rolled*base.multiplier-base.armor)));
 room.enemies[0].resistances.ranged=-20;const weak=first(simulate(c,{rooms:[room],maxRounds:1}));assert.equal(weak.attack,base.attack);assert.equal(weak.rolled,base.rolled);assert.ok(weak.damage>base.damage);assert.ok(weak.resistanceDelta<0);
});
test('封库各房间具有不同覆盖结构：群体法术最多2、齐射最多3、分散目标1',()=>{
 const c=archiveConfig(),rooms=roomsFor(c);validate(c);assert.equal(rooms.length,3);assert.equal(rooms[0].enemies.filter(e=>e.pos==='front').length,2);assert.equal(rooms[1].enemies.filter(e=>e.pos==='center').length,3);assert.equal(new Set(rooms[2].enemies.map(e=>e.pos)).size,4);
 const r=simulate(c);const casts=r.events.filter(e=>e.type==='cast'&&e.actor==='c'&&e.detail.skill==='wave');assert.ok(casts.some(e=>e.roomIndex===0&&e.targets.length===2));assert.ok(casts.filter(e=>e.roomIndex===2).every(e=>e.targets.length===1));
});
test('应对方案保持同预算，只改4组房间普通指令，首房完全一致',()=>{
 const a=archiveConfig(),b=archiveConfig(true);assert.ok(a.heroes.every(h=>trainingCost(h.training)===6));assert.deepEqual(a.heroes.map(h=>h.training),b.heroes.map(h=>h.training));const diff=configurationChanges(a,b);assert.equal(diff.length,4);assert.ok(diff.every(x=>x.label.endsWith('普通指令')));assert.ok(diff.some(x=>x.label.includes('镜潮回廊')));const ra=simulate(a),rb=simulate(b);assert.deepEqual(ra.events.filter(e=>e.roomIndex===0),rb.events.filter(e=>e.roomIndex===0));assert.ok(rb.events.some(e=>e.roomIndex===2&&e.detail.skill==='lance'));
});
test('抗性复盘统计结算伤害而非生命差，并链接正确房间原始事件',()=>{
 const r=simulate(archiveConfig()),before=clone(r),reviews=reviewReport(r);for(const review of reviews){for(const f of review.findings.filter(f=>f.kind==='resistance')){const e=r.events[f.eventIndex];assert.equal(e.type,'attack');assert.equal(e.roomIndex,review.roomIndex);assert.equal(e.actor,f.hero);assert.ok(e.detail.resistanceDelta>0);assert.equal(f.roomId,roomsFor(r.config)[review.roomIndex].id);}}assert.ok(reviews.some(x=>x.findings.some(f=>f.kind==='resistance')));assert.deepEqual(r,before);
});
test('v0.7迁移不清空训练与覆盖，封库方案可保存和恢复',()=>{
 const c=archiveConfig(true);c.version='0.7.0';const old=clone(c),m=migrateConfig(c);assert.equal(m.version,VERSION);assert.deepEqual(m.heroes,old.heroes);assert.deepEqual(c,old);validate(m);const plans=storePlan([],{id:'archive',name:'封库',config:m});assert.deepEqual(readPlans(JSON.stringify({version:1,plans})).plans[0].config,m);
});
test('新路线多种子可重放且不修改配置或敌人模板，伤害资源范围合法',()=>{
 for(const seed of [42,731,99173]){const c=archiveConfig(true);c.seed=seed;const before=clone(c),template=clone(roomsFor(c)),r=simulate(c);assert.deepEqual(r.events,simulate(c).events);assert.deepEqual(c,before);assert.deepEqual(roomsFor(c),template);assert.ok(r.events.every(e=>e.units.every(u=>u.hp>=0&&u.mp>=0)));assert.ok(Object.values(r.supplies).every(n=>n>=0));for(const e of r.events.filter(e=>e.type==='attack')){const d=e.detail;assert.equal(d.damage,d.actual+d.overkill);assert.equal(d.hpBefore-d.hpAfter,d.actual);assert.ok(d.damage>=0);}}
});
