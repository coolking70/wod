import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,defaults,defaultHero,resolveHeroPlan,row,roomsFor} from '../dist/expedition-data.mjs';
import {simulate,validate} from '../dist/expedition-engine.mjs';
import {cooperationCheck,cooperationView} from '../dist/expedition-cooperation.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
import {newGuild} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {COMPANION_CASES,companionCase} from '../scripts/companion-cases.mjs';
import {companionSample,companionSummary} from '../scripts/sample-v46.mjs';

test('协作核对只读且不改变确定性战报，范围限制为当前路线',()=>{
 const c=companionCase('doubleHealer'),before=clone(c),report=simulate(c);
 const rooms=cooperationCheck(c);assert.equal(rooms.length,4);cooperationView(rooms);
 assert.deepEqual(c,before);assert.deepEqual(simulate(c),report);
 assert.equal(cooperationCheck(c,'harbor_pass').length,1);
 assert.throws(()=>cooperationCheck(c,'gallery'),/房间不属于/);
});

test('辅助候选使用逐房站位、技能上限与实际身份，第四名同位置者不会被误报覆盖',()=>{
 const c=companionCase('founders');c.heroes.find(h=>h.id==='b').overrides.harbor_pass.pos='center';
 const room=cooperationCheck(c,'harbor_pass')[0],insight=room.coverage.find(r=>r.skill==='insight');
 assert.deepEqual(insight.recipients,['b','c','d']);assert.ok(!insight.recipients.includes('f'));
 assert.ok(cooperationCheck(c,'harbor_gate')[0].coverage.find(r=>r.skill==='insight').recipients.includes('f'));
 assert.match(cooperationView([room]),/预备第1条/);
});

test('双药师分别列出身份、阈值、重叠和分区遗漏，关闭的救护不算覆盖',()=>{
 const c=companionCase('doubleHealer'),room=cooperationCheck(c,'harbor_gate')[0];
 assert.deepEqual(room.healers.map(h=>h.id),['orin','f']);
 assert.equal(room.healers.find(h=>h.id==='orin').threshold,.8);
 assert.ok(room.healing.every(h=>h.healers.length===2));
 const zones=cooperationCheck(companionCase('zones'),'harbor_gate')[0];
 assert.deepEqual(zones.healing.filter(h=>!h.healers.length).map(h=>h.id),['a']);
 assert.ok(zones.healing.every(h=>h.healers.length<=1));
 c.heroes.find(h=>h.id==='orin').healing={enabled:true,threshold:.8,target:'self'};
 c.heroes.find(h=>h.id==='f').healing.enabled=false;
 const self=cooperationCheck(c,'harbor_gate')[0];assert.deepEqual(self.healers[0].recipients,['orin']);
 assert.equal(self.healing.filter(h=>!h.healers.length).length,5);
});

test('同名药膳重叠提示与共享药草配置不预扣物资，不把两名药师当作两倍实际消费',()=>{
 const c=companionCase('doubleHealer'),before=clone(c),room=cooperationCheck(c,'harbor_gate')[0];
 assert.deepEqual(room.herbUsers.map(h=>h.id),['orin','f']);
 assert.deepEqual(room.herbUsers[0].skills,['provisions','heal']);
 assert.equal(room.duplicates[0].skill,'provisions');assert.equal(room.duplicates[0].recipients.length,6);
 const html=cooperationView([room]);assert.match(html,/同名效果互斥/);assert.match(html,/未配置此辅助/);assert.match(html,/静态条件提示/);
 assert.deepEqual(c,before);assert.equal(room.herb,12);
});

test('公会核对基于托管后实际指令，读取与渲染不修改公会资产或准备配置',()=>{
 let g=selectHero(newGuild(),'a');g=setCompanion(g,'e','inspire');
 const c=defaults(),bard=c.heroes.find(h=>h.id==='e');bard.prep=[];bard.overrides.gallery={prep:[]};
 const before=clone({g,c}),ready=readiness(g,c,'gallery');
 assert.equal(cooperationCheck(c,'gallery')[0].coverage.some(r=>r.skill==='insight'),false);
 assert.equal(ready.cooperation[0].coverage.some(r=>r.skill==='insight'),true);
 assert.deepEqual(ready.cooperation,cooperationCheck(ready.config,'gallery'));
 assert.match(cooperationView(ready.cooperation,{actual:true}),/按公会资产及已应用伙伴职责/);
 assert.match(cooperationView(ready.cooperation),/按准备页草稿/);
 assert.equal(ready.canDepart,true);cooperationView(ready.cooperation);assert.deepEqual({g,c},before);
 assert.match(cooperationView(ready.cooperation),/data-cooperation-room="gallery"/);
});

test('移除辅助实验只改变吟游者预备，身份装备训练补给与路线保持相同',()=>{
 for(const trained of [false,true])for(const kind of ['noInsight','noMastery','noBoth']){
  const base=companionCase('founders',trained,'lower',8),c=companionCase(kind,trained,'lower',8);validate(c);
  const removed=kind==='noBoth'?['insight','mastery']:[kind==='noInsight'?'insight':'mastery'];
  assert.deepEqual(c.heroes.find(h=>h.id==='e').prep,base.heroes.find(h=>h.id==='e').prep.filter(r=>!removed.includes(r.skill)));
  c.heroes.find(h=>h.id==='e').prep=base.heroes.find(h=>h.id==='e').prep;assert.deepEqual(c,base);
 }
});

test('候补实验分别只改变目标、自保优先、分区；组合等于目标加分区',()=>{
 const base=companionCase('doubleHealer'),targets=companionCase('enemyTargets'),priority=companionCase('selfFirst'),zones=companionCase('zones'),combined=companionCase('combined');
 for(const h of base.heroes){
  const t=targets.heroes.find(a=>a.id===h.id),p=priority.heroes.find(a=>a.id===h.id),z=zones.heroes.find(a=>a.id===h.id),both=combined.heroes.find(a=>a.id===h.id);
  if(['f','orin'].includes(h.id)){
   for(const r of roomsFor(base)){assert.deepEqual(t.overrides[r.id].main,[row('shot','healer'),row('shot','rear')]);t.overrides[r.id]=clone(h.overrides[r.id]);both.overrides[r.id]=clone(h.overrides[r.id]);}
   assert.equal(p.healing.priority,'self_first');p.healing.priority=h.healing.priority;
   assert.equal(z.healing.target,h.id==='f'?'center':'rear');z.healing.target=h.healing.target;both.healing.target=h.healing.target;
  }
 }
 assert.deepEqual(targets,base);assert.deepEqual(priority,base);assert.deepEqual(zones,base);assert.deepEqual(combined,base);
 for(const kind of Object.keys(COMPANION_CASES))validate(companionCase(kind));
 assert.throws(()=>companionCase('unknown'));
});

test('实验统计仅以成功样本计算效率与余料，无成功时为null，失败位置不丢失',()=>{
 const rows=[{won:false,alive:0,rounds:1,supplies:{herb:12,rune:14,arrow:10},failureRoom:'首战',shortages:2,failed:1,enemyHealing:5,sealed:false,sealAttempted:false},{won:true,alive:6,rounds:30,supplies:{herb:3,rune:1,arrow:0},failureRoom:null,shortages:4,failed:0,enemyHealing:9,sealed:true,sealAttempted:true}];
 const summary=companionSummary(rows);assert.equal(summary.winRounds,30);assert.equal(summary.allRounds,15.5);assert.equal(summary.winSupplies.herb,3);assert.deepEqual(summary.failureRooms,{'首战':1});assert.equal(summary.full,1);assert.equal(summary.tempo,0);assert.equal(summary.seals,1);
 const failures=companionSummary(rows.slice(0,1));assert.equal(failures.winRounds,null);assert.deepEqual(failures.winSupplies,{herb:null,rune:null,arrow:null});
});

test('实验逐房救护量与药草只来自实际事件，支援覆盖与资源跳过分开记录',()=>{
 const r=simulate(companionCase('founders')),s=companionSample(r),before=clone(r);
 for(const [roomIndex,room] of s.support.entries())for(const actor of room.actors){
  const own=r.events.filter(e=>e.roomIndex===roomIndex&&e.actor===actor.id);
  assert.equal(actor.healing,own.filter(e=>e.type==='heal').reduce((n,e)=>n+e.detail.actual,0));
  assert.equal(actor.herb,own.filter(e=>e.type==='cast'&&e.detail.item==='herb').length);
 }
 assert.equal(s.failed,r.events.filter(e=>e.type==='failed'&&r.config.heroes.some(h=>h.id===e.actor)).length);
 assert.ok(s.support[0].coverage.find(c=>c.skill==='insight').recipients.includes('c'));
 assert.ok(s.shortages>0);assert.equal(s.failed,0);assert.deepEqual(r,before);
});

test('房间救护覆盖替换默认配置，第二学者的重复增益只按实际出战者提示',()=>{
 const c=defaults();c.heroes=c.heroes.map(h=>h.id==='b'?defaultHero('mira'):h);c.prepOrder=c.prepOrder.map(id=>id==='b'?'mira':id);
 c.heroes.find(h=>h.id==='mira').prep=[row('ward','front')];
 c.heroes.find(h=>h.id==='f').overrides.gallery={healing:{enabled:true,threshold:.5,target:'front',priority:'lowest'}};
 const room=cooperationCheck(c,'gallery')[0];assert.equal(room.healers[0].threshold,.5);assert.deepEqual(room.healers[0].recipients,['a']);
 assert.deepEqual(room.duplicates.find(d=>d.skill==='ward').actors,['d','mira']);assert.ok(room.units.every(h=>h.id!=='b'));
 assert.equal(resolveHeroPlan(c.heroes.find(h=>h.id==='f'),'cistern').healing.target,'all');
});
