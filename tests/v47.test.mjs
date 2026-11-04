import {harborPlanView} from '../dist/expedition-harbor-view.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,defaultHero,defaults,roomsFor,row,SKILLS} from '../dist/expedition-data.mjs';
import {simulate,validate} from '../dist/expedition-engine.mjs';
import {applyScholarPlan,scholarAssignment} from '../scripts/scholar-plans.mjs';
import {cooperationCheck,cooperationView} from '../dist/expedition-cooperation.mjs';
import {newGuild,depart,claim} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {recruit,swapCompanion,rosterConfig} from '../dist/expedition-roster.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
import {scholarCase,SCHOLAR_CASES} from '../scripts/scholar-cases.mjs';
import {scholarSample} from '../scripts/sample-v47.mjs';
const assignment={primary:'d',secondary:'mira'};

test('学者方案拒绝错误路线、缺少学者/吟游者、重复或未出战分工，保持输入不变',()=>{
 const base=scholarCase('baseline'),before=clone(base);
 for(const a of [{primary:'d',secondary:'d'},{primary:'d',secondary:'b'},{primary:'orin',secondary:'mira'}])assert.throws(()=>applyScholarPlan(base,'seal',a));
 assert.throws(()=>applyScholarPlan(base,'unknown',assignment));assert.throws(()=>applyScholarPlan(defaults(),'seal'));
 const c=scholarCase('founders');assert.throws(()=>applyScholarPlan(c,'seal'));
 const noBard=clone(base);noBard.heroes=noBard.heroes.map(h=>h.id==='e'?defaultHero('orin'):h);noBard.prepOrder=noBard.prepOrder.map(id=>id==='e'?'orin':id);assert.throws(()=>applyScholarPlan(noBard,'seal'));
 assert.deepEqual(base,before);
});

test('两方案只覆盖明确的港口预备、分担者站位及吟游普通指令，保留资产与其他房间',()=>{
 const c=scholarCase('baseline');c.heroes.find(h=>h.id==='mira').overrides.gallery={pos:'left',prep:[row('ward','left')],healing:{enabled:false,threshold:.65,target:'self'}};
 c.heroes.find(h=>h.id==='d').overrides.harbor_gate={pos:'left',main:[row('spark','rear')],defenses:{melee:'natural',ranged:'natural',magic:'natural'}};
 c.roomOrders.harbor_cache=[...c.prepOrder].reverse();const before=clone(c);
 for(const kind of ['seal','position']){
  const result=applyScholarPlan(c,kind,assignment);validate(result);
  for(const h of result.heroes){const old=c.heroes.find(t=>t.id===h.id);
   assert.deepEqual(h.gear,old.gear);assert.deepEqual(h.training,old.training);assert.equal(h.trained,old.trained);assert.equal(h.item,old.item);
   for(const room of roomsFor(c)){
    const p=h.overrides[room.id],was=old.overrides[room.id];
    if(h.id==='d')p.prep=was.prep;else if(h.id==='mira'){p.prep=was.prep;p.pos=was.pos;}else if(h.id==='e')p.main=was.main;
    for(const key of ['prep','pos','main'])if(!Object.hasOwn(was,key))delete p[key];
   }
  }
  assert.deepEqual(result,c);
 }
 assert.deepEqual(c,before);
});

test('分散入口仅修改选定分担者的四房站位，不接管预备或目标',()=>{
 const base=scholarCase('baseline'),next=applyScholarPlan(base,'position',assignment);
 for(const room of roomsFor(base)){assert.equal(next.heroes.find(h=>h.id==='mira').overrides[room.id].pos,'right');delete next.heroes.find(h=>h.id==='mira').overrides[room.id].pos;}
 assert.deepEqual(next,base);
});

test('角色分工可反选且不依赖队伍数组位置，默认识别护印专修者',()=>{
 const c=scholarCase('baseline');assert.deepEqual(scholarAssignment(c),{scholars:['mira','d'],primary:'d',secondary:'mira',available:true});
 c.heroes.reverse();const a=scholarAssignment(c);assert.equal(a.primary,'d');assert.equal(a.secondary,'mira');
 const result=applyScholarPlan(c,'seal',{primary:'mira',secondary:'d'});
 assert.equal(result.heroes.find(h=>h.id==='d').overrides.harbor_gate.pos,'right');
 assert.equal(result.heroes.find(h=>h.id==='mira').overrides.harbor_gate.prep[0].skill,'ward');
 assert.deepEqual(result.prepOrder,c.prepOrder);validate(result);
});

test('一次护印与持续屏障的目标、频率和主屏障房间分工准确，均无需进阶技能',()=>{
 for(const kind of ['seal','ward']){
  const c=scholarCase(kind);
  for(const room of roomsFor(c)){
   const lead=c.heroes.find(h=>h.id==='d').overrides[room.id],partner=c.heroes.find(h=>h.id==='mira').overrides[room.id];
   assert.deepEqual(lead.prep,[row('ward',room.id==='harbor_pass'?'rear':'front')]);
   assert.deepEqual(partner.prep,[row(kind==='seal'?'bulwark':'ward','center',kind==='seal'?'once':'repeat')]);
   assert.equal(partner.pos,'right');assert.deepEqual(c.heroes.find(h=>h.id==='e').overrides[room.id].main,[row('shot','healer'),row('shot','rear')]);
  }
 }
});

test('实际战报遵守每房一次护印，持续检查不能冒充每回合必定施放',()=>{
 const c=scholarCase('seal'),r=simulate(c);
 for(const [i] of r.rooms.entries())assert.ok(r.events.filter(e=>e.roomIndex===i&&e.actor==='mira'&&e.type==='cast'&&e.detail.skill==='bulwark').length<=1);
 assert.ok(r.events.some(e=>e.actor==='mira'&&e.type==='cast'&&e.detail.skill==='bulwark'));
 const ward=simulate(scholarCase('ward'));
 assert.ok(ward.events.some(e=>e.actor==='mira'&&e.type==='skip'&&e.detail.reservation));
 assert.ok(ward.events.some(e=>e.actor==='mira'&&e.type==='cast'&&e.detail.skill==='ward'));
 assert.deepEqual(simulate(c),r);
});

test('辅助表按实际顺序、技能材料和指令频率显示，保留正式队员覆盖上限',()=>{
 const c=scholarCase('seal');c.roomOrders.harbor_cache=[...c.prepOrder].reverse();const before=clone(c),room=cooperationCheck(c,'harbor_cache')[0];
 const seal=room.coverage.find(r=>r.actor==='mira'&&r.skill==='bulwark');
 assert.equal(seal.order,c.roomOrders.harbor_cache.indexOf('mira')+1);assert.equal(seal.mode,'once');assert.equal(seal.mana,5);assert.equal(seal.resource,'rune');
 assert.deepEqual(seal.recipients,['c','d','f']);assert.equal(room.coverage.find(r=>r.skill==='insight').resource,null);
 const html=cooperationView([room]);assert.match(html,/data-cooperation-skill="bulwark"/);assert.match(html,/5法力 \/ 1符纸/);assert.match(html,/本房一次/);assert.match(html,/不保证同时或全部执行/);assert.deepEqual(c,before);
});

test('公会实际核对尊重托管覆盖且不消费资产，草稿方案不会暗中切换伙伴职责',()=>{
 let g=selectHero(newGuild(),'c');g=claim(depart(g,defaults()));g=recruit(g,'mira');g=swapCompanion(g,defaults(),'b','mira');g=setCompanion(g,'mira','seal');
 const c=applyScholarPlan(rosterConfig(g,scholarCase('baseline')),'seal',assignment),before=clone({g,c}),ready=readiness(g,c,'harbor_gate');
 assert.equal(cooperationCheck(c,'harbor_gate')[0].coverage.find(r=>r.actor==='mira').mode,'once');
 assert.equal(ready.cooperation[0].coverage.find(r=>r.actor==='mira').mode,'repeat');assert.equal(ready.canDepart,true);
 assert.deepEqual({g,c},before);assert.match(cooperationView(ready.cooperation,{actual:true}),/持续检查/);
});

test('单因素实验仅改分担者站位或吟游者目标，所有方案保留同档装备训练补给',()=>{
 const base=scholarCase('baseline',true,'lower',9),position=scholarCase('position',true,'lower',9),target=scholarCase('target',true,'lower',9);
 for(const room of roomsFor(base)){
  delete position.heroes.find(h=>h.id==='mira').overrides[room.id].pos;
  delete target.heroes.find(h=>h.id==='e').overrides[room.id].main;
 }
 assert.deepEqual(position,base);assert.deepEqual(target,base);
 for(const kind of Object.keys(SCHOLAR_CASES)){
  const c=scholarCase(kind,true,'lower',9);validate(c);assert.deepEqual(c.supplies,base.supplies);
  for(const h of c.heroes.filter(h=>h.id!=='b')){const old=base.heroes.find(t=>t.id===h.id);assert.deepEqual(h.gear,old.gear);assert.deepEqual(h.training,old.training);}
 }
});

test('学者实验按实际施放计符纸和法力，群体护印组件不重复计费或受益者',()=>{
 const r=simulate(scholarCase('seal')),before=clone(r),sample=scholarSample(r);
 for(const [i,room] of sample.shields.entries())for(const actor of room.actors){
  const casts=r.events.filter(e=>e.roomIndex===i&&e.actor===actor.id&&e.type==='cast');
  assert.equal(actor.rune,casts.filter(e=>e.detail.item==='rune').length);
  assert.equal(actor.mana,casts.reduce((n,e)=>n+e.detail.mpBefore-e.detail.mpAfter,0));
  for(const skill of actor.skills){assert.equal(skill.count,casts.filter(e=>e.detail.skill===skill.skill).length);assert.equal(new Set(skill.recipients).size,skill.recipients.length);assert.equal(r.events.find(e=>e.id===skill.firstEvent).actor,actor.id);}
 }
 assert.equal(sample.partyDamage.mira,r.stats.mira.actual);assert.equal(sample.partyHealing.f,r.stats.f.healing);assert.deepEqual(r,before);
});

test('未证明有稳定收益的学者配置不提供运行版载入，辅助表仍能定位准确预备条目',()=>{
 const c=scholarCase('seal'),html=harborPlanView(c),check=cooperationView(cooperationCheck(c,'harbor_cache'));
 assert.doesNotMatch(html,/data-scholar-plan/);assert.match(check,/data-cooperation-edit="mira" data-cooperation-room="harbor_cache" data-cooperation-row="0"/);
 assert.match(check,/调整米菈第1条预备/);assert.match(check,/护印含延迟效果/);
});
