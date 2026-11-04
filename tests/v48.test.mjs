import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,defaults,row,SKILLS} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {supportEvidence,supportEvidenceView} from '../dist/expedition-support-evidence.mjs';
import {scholarCase} from '../scripts/scholar-cases.mjs';

const allCasts=data=>data.rooms.flatMap(r=>r.casts);
const allUses=data=>allCasts(data).flatMap(c=>c.uses);
const actual=simulate(defaults());
const effect=(id,stat='int',value=4,source='e',active=true)=>({id,source,stat,value,active});
const unit=(id,effects=[])=>({id,name:id,effects});
function fixture({stat='int',value=4,source='e',recipient='c',skill='insight',waiting=false,scope='battle'}={}){
 const sourceEffect=effect('fx',stat,value,source,!waiting),d={effectId:'fx',cast:1,skill,stat,value,scope,component:'组件',active:!waiting};
 const c=defaults();
 const event=(id,type,actor,targets,detail,units=[])=>({id,type,actor,targets,detail,units,roomIndex:0,round:1,text:type});
 const events=[event(1,'cast',source,[recipient],{cast:1,skill,mpBefore:20,mpAfter:16,item:null}),event(2,'effect',source,[recipient],d,[unit(recipient,[sourceEffect])])];
 return {report:{config:c,rooms:[{name:'首房'}],events},event,sourceEffect};
}

test('协作证据只读并保持原始战果，修改投影不会修改原事件',()=>{
 const before=clone(actual),data=supportEvidence(actual);assert.ok(data.totals.links>0);supportEvidenceView(data);
 allCasts(data)[0].targets.push('unknown');allUses(data)[0].value=-999;
 assert.deepEqual(actual,before);assert.deepEqual(simulate(actual.config),actual);
});

test('启蒙采用主属性系数2，战技只进入攻击技能等级，不把在场效果全算作采用',()=>{
 const f=fixture();f.report.events.push(f.event(3,'attack','c',['enemy'],{skill:'spark',attackMean:60,sources:[{effectId:'fx',source:'e',stat:'int',value:4}]},[unit('c',[f.sourceEffect])]));
 let uses=allUses(supportEvidence(f.report));assert.equal(uses.length,1);assert.equal(uses[0].kind,'attack');assert.equal(uses[0].coefficient,2);assert.equal(uses[0].term,8);assert.equal(uses[0].recorded,60);
 const mastery=fixture({stat:'skill',skill:'mastery',recipient:'b'});
 mastery.report.events.push(mastery.event(3,'cast','b',['b'],{skill:'guard',mean:40,sources:[{effectId:'fx',source:'e',stat:'skill',value:4}]},[unit('b',[mastery.sourceEffect])]));
 assert.equal(allUses(supportEvidence(mastery.report)).length,0);
});

test('辅助施放自身可受启蒙，实际攻击施放与逐目标检定不会被重复计数',()=>{
 const f=fixture({recipient:'d'}),sources=[{effectId:'fx',source:'e',stat:'int',value:4}];
 f.report.events.push(f.event(3,'cast','d',['a'],{skill:'ward',mean:64,cast:2,mpBefore:20,mpAfter:15,item:'rune',sources},[unit('d',[f.sourceEffect])]));
 let uses=allUses(supportEvidence(f.report));assert.equal(uses.length,1);assert.equal(uses[0].kind,'cast');assert.equal(uses[0].term,8);
 const g=fixture();g.report.events.push(g.event(3,'cast','c',['enemy'],{skill:'spark',mean:60,sources},[unit('c',[g.sourceEffect])]),g.event(4,'attack','c',['enemy'],{skill:'spark',attackMean:60,sources},[unit('c',[g.sourceEffect])]));
 uses=allUses(supportEvidence(g.report));assert.equal(uses.length,1);assert.equal(uses[0].eventId,4);
});

test('防御属性、全防御与技能等级采用各自字段，自然防御不采用防御技能增益',()=>{
 for(const [stat,coefficient] of [['dex',2],['agi',1],['defense',1],['defenseSkill',2]]){
  const f=fixture({source:'d',recipient:'a',skill:'ward',stat}),sources=[{effectId:'fx',source:'d',stat,value:4}];
  f.report.events.push(f.event(3,'attack','enemy',['a'],{skill:'strike',defenseMean:70,defenseProfile:{primary:'dex',secondary:'agi',skill:'sidestep',name:'闪身卸力'},targetSources:sources},[unit('a',[f.sourceEffect])]));
  assert.equal(allUses(supportEvidence(f.report))[0].coefficient,coefficient);assert.equal(allUses(supportEvidence(f.report))[0].checkName,'闪身卸力');
  f.report.events[2].detail.defenseProfile.skill='natural';
  assert.equal(allUses(supportEvidence(f.report)).length,stat==='defenseSkill'?0:1);
 }
});

test('护甲只索引原始护甲字段，破甲与闪避不被解释成实际减伤',()=>{
 const f=fixture({source:'f',recipient:'a',skill:'provisions',stat:'armor',value:2});
 f.report.events.push(f.event(3,'attack','enemy',['a'],{skill:'strike',armorBefore:5,armorIgnored:4,armor:1,grade:'闪避',actual:0,targetSources:[{effectId:'fx',source:'f',stat:'armor',value:2}]},[unit('a',[f.sourceEffect])]));
 const data=supportEvidence(f.report),uses=allUses(data);assert.equal(uses.length,1);assert.equal(uses[0].kind,'armor');assert.equal(uses[0].recorded,5);assert.equal(uses[0].term,2);
 const html=supportEvidenceView(data);assert.match(html,/原始护甲/);assert.match(html,/不能当作实际减伤/);assert.doesNotMatch(html,/避免了2/);
});

test('延迟组件必须在检定快照中已生效；缺少来源或同名猜测不产生关联',()=>{
 const f=fixture({source:'d',recipient:'a',skill:'bulwark',stat:'defenseSkill',waiting:true});
 f.report.events.push(f.event(3,'attack','enemy',['a'],{skill:'strike',defenseMean:70,defenseProfile:{primary:'dex',secondary:'str',skill:'parry'},targetSources:[{effectId:'fx',source:'d',stat:'defenseSkill',value:4}]},[unit('a',[f.sourceEffect])]));
 assert.equal(allUses(supportEvidence(f.report)).length,0);
 f.report.events[2].units[0].effects[0].active=true;assert.equal(allUses(supportEvidence(f.report)).length,1);
 f.report.events[2].detail.targetSources[0].effectId='same-name-but-unknown';assert.equal(allUses(supportEvidence(f.report)).length,0);
});

test('来源身份、受益者、数值、生效快照与时间必须一致，不猜未来或含歧义的标识',()=>{
 const make=()=>{const f=fixture();f.report.events.push(f.event(3,'attack','c',['enemy'],{skill:'spark',attackMean:60,sources:[{effectId:'fx',source:'e',stat:'int',value:4}]},[unit('c',[f.sourceEffect])]));return f.report;};
 for(const change of [r=>r.events[2].detail.sources[0].source='d',r=>r.events[2].actor='d',r=>r.events[2].detail.sources[0].value=5,r=>r.events[2].units=[],r=>r.events[2].detail.attackMean=undefined,r=>r.events.reverse(),r=>r.events.splice(2,0,clone(r.events[1]))]){
  const r=make();change(r);assert.equal(allUses(supportEvidence(r)).length,0);
 }
});

test('远征药膳可关联后续房间，房间效果不能被跨房来源快照误用',()=>{
 const f=fixture({source:'f',recipient:'a',skill:'provisions',stat:'armor',value:2,scope:'expedition'});f.report.rooms.push({name:'次房'});
 f.report.events.push({...f.event(3,'attack','enemy',['a'],{skill:'strike',armorBefore:5,targetSources:[{effectId:'fx',source:'f',stat:'armor',value:2}]},[unit('a',[f.sourceEffect])]),roomIndex:1});
 const data=supportEvidence(f.report);assert.equal(data.rooms[0].casts[0].uses[0].roomIndex,1);assert.equal(data.rooms[1].casts.length,0);
 f.report.events[1].detail.scope='battle';assert.equal(allUses(supportEvidence(f.report)).length,0);
});

test('多组件多目标护印按成功施放计一次费用，攻击同一来源字段重复引用去重',()=>{
 const c=defaults();c.heroes.find(h=>h.id==='d').prep=[row('bulwark','center')];const r=simulate(c),data=supportEvidence(r),cast=allCasts(data).find(x=>x.skill==='bulwark');
 assert.equal(cast.item,'rune');assert.equal(cast.mana,5);assert.equal(cast.targets.length,3);assert.equal(cast.effects.length,6);
 const f=fixture(),source={effectId:'fx',source:'e',stat:'int',value:4};f.report.events.push(f.event(3,'attack','c',['enemy'],{skill:'spark',attackMean:60,sources:[source,source]},[unit('c',[f.sourceEffect])]));
 assert.equal(allUses(supportEvidence(f.report)).length,1);
});

test('辅助跳过记录按原因分组，预留和缺料不算成功施放或行动空过',()=>{
 const f=fixture();f.report.events=f.report.events.slice(0,0);
 for(const [id,reason] of [[1,'为第三场事件预留2符纸，尝试下一条指令'],[2,'耗材耗尽'],[3,'耗材耗尽']])f.report.events.push(f.event(id,'skip','d',[],{skill:'ward',reason}));
 const data=supportEvidence(f.report);assert.equal(data.totals.casts,0);assert.equal(data.totals.skips,3);assert.equal(data.rooms[0].skips.length,2);assert.equal(data.rooms[0].skips[1].count,2);
 assert.match(supportEvidenceView(data),/不等于行动空过/);assert.match(supportEvidenceView(data),/data-support-evidence-event="2"/);
});

test('真实战报的所有关联回指准确效果与字段，涵盖同职业候补和延迟护印',()=>{
 const r=simulate(scholarCase('baseline')),data=supportEvidence(r),before=clone(r);
 assert.ok(allCasts(data).some(c=>c.actor==='mira'));assert.ok(allCasts(data).some(c=>c.actor==='d'));assert.ok(allUses(data).some(u=>u.kind==='defense'));assert.ok(allUses(data).some(u=>u.kind==='cast'));
 for(const use of allUses(data)){
  const origin=r.events.find(e=>e.id===use.originEvent),record=r.events[use.index];assert.equal(origin.type,'effect');assert.equal(origin.detail.effectId,use.effectId);assert.equal(record.id,use.eventId);assert.ok(origin.id<record.id);assert.ok(origin.targets.includes(use.recipient));assert.equal(use.term,use.value*use.coefficient);
 }
 supportEvidenceView(data,'mira');assert.deepEqual(r,before);
});

test('筛选与证据按钮保留实际身份，只列已抵达房间，不给无索引行动增益判定无效',()=>{
 const c=defaults();c.heroes.find(h=>h.id==='e').prep=[row('rhythm','rear')];const r=simulate(c,{maxRounds:1}),data=supportEvidence(r),html=supportEvidenceView(data,'e');
 assert.equal(data.rooms.length,r.rooms.length);assert.ok(!html.includes('data-support-actor="d"'));assert.match(html,/不等于辅助无效/);assert.match(html,/行动次数、先攻/);assert.match(html,/data-support-evidence-event/);assert.match(html,/data-support-evidence-edit="gallery:e"/);
 assert.doesNotMatch(supportEvidenceView(data,'b'),/class="support-cast"/);
 assert.ok(SKILLS.rhythm);assert.match(supportEvidenceView(data,'unknown'),/全部出战队员/);
});
