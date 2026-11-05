import test from 'node:test';import assert from 'node:assert/strict';
import {cooperationCheck,cooperationView} from '../dist/expedition-cooperation.mjs';import {resourceAssignments} from '../dist/expedition-resource-check.mjs';import {defaults,scarcityConfig,hospiceConfig,clone,row,resolveHeroPlan} from '../dist/expedition-data.mjs';
const configured=()=>{const c=hospiceConfig('front');c.heroes.find(h=>h.id==='d').main=[row('suppress','healer'),row('spark')];return c;};
test('共享材料逐项记录预备、普通和救护，不把多条配置当作总消耗',()=>{
 const c=configured(),before=clone(c),r=cooperationCheck(c,'cistern')[0],rune=r.resources.find(x=>x.item==='rune'),herb=r.resources.find(x=>x.item==='herb');assert.equal(rune.stock,c.supplies.rune);assert.ok(rune.rows.some(x=>x.actor==='d'&&x.phase==='main'&&x.skill==='suppress'));assert.ok(rune.rows.some(x=>x.actor==='d'&&x.phase==='prep'&&x.skill==='ward'));assert.ok(herb.rows.some(x=>x.actor==='f'&&x.phase==='healing'&&x.skill==='heal'));assert.equal(new Set(rune.actors).size,rune.actors.length);assert.equal('expectedConsumption' in rune,false);assert.deepEqual(c,before);
});
test('材料表读取真实配置中的进阶法力，不改共享技能费用',()=>{
 const c=configured();c.heroes.find(h=>h.id==='d').advancement='sigilcraft';c.heroes.find(h=>h.id==='f').advancement='emergency';const r=cooperationCheck(c,'cistern')[0];assert.equal(r.resources.find(x=>x.item==='rune').rows.find(x=>x.skill==='suppress').mana,4);assert.equal(r.resources.find(x=>x.item==='herb').rows.find(x=>x.phase==='healing').mana,4);
});
test('后续无材料指令只来自同阶段之后，保留准确普通行索引',()=>{
 const c=defaults(),h=c.heroes.find(h=>h.id==='c');h.main=[row('lance'),row('spark'),row('wave')];h.overrides={};const rows=resourceAssignments(c.heroes.map(x=>resolveHeroPlan(x,'')),c.supplies).find(x=>x.item==='rune').rows.filter(x=>x.actor==='c'&&x.phase==='main');assert.deepEqual(rows[0].fallbacks,[{skill:'spark',row:1,mode:'repeat'}]);assert.deepEqual(rows[1].fallbacks,[]);assert.equal(rows[1].row,2);
});
test('逐房覆盖按实际方案核对，不把其他房间的攻击算进本房',()=>{
 const c=defaults(),h=c.heroes.find(h=>h.id==='c');h.main=[row('lance')];h.overrides={cistern:{main:[row('spark')]}};assert.ok(cooperationCheck(c,'gallery')[0].resources.find(r=>r.item==='rune').rows.some(r=>r.actor==='c'&&r.phase==='main'));assert.equal(cooperationCheck(c,'cistern')[0].resources.find(r=>r.item==='rune').rows.some(r=>r.actor==='c'&&r.phase==='main'),false);
});
test('零库存也列出现有使用者，数量是唯一角色数而非施放次数',()=>{
 const c=configured();c.supplies.rune=0;const r=cooperationCheck(c,'gallery')[0].resources.find(r=>r.item==='rune');assert.equal(r.stock,0);assert.ok(r.rows.length>r.actors.length);assert.equal(r.actors.length,new Set(r.rows.map(x=>x.actor)).size);
});
test('限时提示遵从真实房间预算，包括搜集导致中场减少一回合',()=>{
 const c=scarcityConfig(true);assert.ok(cooperationCheck(c).every(r=>r.roundLimit===5));c.rescueApproach='gather';assert.equal(cooperationCheck(c,'cistern')[0].roundLimit,4);assert.equal(cooperationCheck(defaults(),'gallery')[0].roundLimit,null);
});
test('材料行能定位普通指令，预备旧入口保留，静态边界明确',()=>{
 const html=cooperationView(cooperationCheck(scarcityConfig(true),'gallery'),{actual:true});assert.match(html,/data-cooperation-phase="main"/);assert.match(html,/data-cooperation-row="0"/);assert.match(html,/限时5回合/);assert.match(html,/配置条数不是施放次数/);assert.match(html,/不保证实际执行/);assert.match(html,/全部辅助候选与单次用料/);
});
