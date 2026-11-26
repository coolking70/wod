import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {returningTideLoop} from '../scripts/returning-tide-cases.mjs';
import {highlightedSteps} from '../dist/expedition-highlights.mjs';
import {shouldPauseReplayStep} from '../dist/expedition-replay-motion.mjs';
import {groupActions} from '../dist/expedition-report.mjs';
import {phaseReplay,phaseReplayView,phaseSourceView} from '../dist/expedition-phase-replay.mjs';

const report=returningTideLoop().runs[0].report,events=report.events,groups=groupActions(events);
const phaseGroup=groups.find(g=>g.events.some(e=>e.type==='health-phase'));
const digest=()=>createHash('sha256').update(JSON.stringify(report)).digest('hex');
test('returning tide phase compares real immunity, orders, and original damage citation without modifying the report',()=>{
 const model=phaseReplay(events,phaseGroup);
 assert.deepEqual([model.event.id,model.source.id,model.source.detail.actual],[503,502,16]);
 assert.equal(model.sourceIndex,501);
 const html=phaseReplayView(model);
 assert.match(html,/175\/360/);
 assert.match(html,/免疫：法术、心理/);assert.match(html,/剑术 → 前排/);
 assert.match(html,/免疫：近战、远程/);assert.match(html,/潮汐冲击 → 中央；微光 → 后排/);
 assert.match(html,/阿瑟 → 归潮守钟者：重击，16 伤害 · 生命 191 → 175/);
 assert.match(html,/data-phase-source="501">查看触发记录 #502/);
 assert.match(phaseSourceView(model.source),/返回阶段变化/);
 assert.equal(digest(),'762d2bb354c90c08f0b6504a408383dcd417c0f7f521da84259b0528344d8112');
});
test('unrelated or rewound steps show no phase panel; missing or invalid causal links cannot navigate',()=>{
 const at=groups.indexOf(phaseGroup);
 for(const g of [groups[at-1],groups[at+1]])assert.equal(phaseReplayView(phaseReplay(events,g)),'');
 const event={...phaseGroup.events[0],detail:{healthPhase:{...phaseGroup.events[0].detail.healthPhase,sourceEventId:99999}}};
 const model=phaseReplay([event],{events:[event]});
 assert.equal(model.source,null);assert.match(phaseReplayView(model),/转变后/);assert.doesNotMatch(phaseReplayView(model),/data-phase-source/);
});

test('missing legacy phase details are ignored and untrusted text is escaped',()=>{
 const e=phaseGroup.events[0];
 for(const phase of [{...e.detail.healthPhase,before:{main:[]}}, {...e.detail.healthPhase,hp:'<img>'},{...e.detail.healthPhase,after:{immuneTo:[],main:[null]}}]){
  const event={...e,detail:{healthPhase:phase}};
  assert.equal(phaseReplay([event],{events:[event]}),null);
 }
 const model=phaseReplay(events,phaseGroup),source={...model.source,text:'<img src=x onerror=1>'};
 assert.doesNotMatch(phaseReplayView({...model,event:{...model.event,text:'<svg>'},source}),/<(?:svg|img)/);
 assert.match(phaseSourceView(source),/&lt;img/);
});

test('the fixed phase is first-class in highlights without pulling in its ordinary hit',()=>{
 const steps=highlightedSteps(events),phase=phaseGroup.events[0];
 assert.equal(phase.id,503);
 assert.equal(phase.actionId,null);
 const match=steps.filter(step=>step.events.includes(phase));
 assert.equal(match.length,1);
 assert.deepEqual(match[0],phaseGroup);
 const model=phaseReplay(events,match[0]);
 assert.equal(model.source.id,502);
 assert.ok(!steps.some(step=>step.events.includes(model.source)));
 assert.equal(digest(),'762d2bb354c90c08f0b6504a408383dcd417c0f7f521da84259b0528344d8112');
});


test('the real phase stops autoplay only with key-event pause on, never adds a manual stop',()=>{
 const phaseSteps=highlightedSteps(events),at=phaseSteps.findIndex(step=>step.events.includes(phaseGroup.events[0]));
 assert.ok(at>0&&at<phaseSteps.length-1);
 const phase=phaseSteps[at];
 assert.equal(phase.events[0].id,503);
 for(const [autoplay,pauseOnKeyEvents,expected] of [[true,true,true],[true,false,false],[false,true,false],[false,false,false]]){
  assert.equal(shouldPauseReplayStep(report,phase,{autoplay,pauseOnKeyEvents}),expected);
 }
 const legacy={...phase.events[0],detail:{}};
 assert.equal(shouldPauseReplayStep({...report,events:[legacy]},{events:[legacy]},{autoplay:true,pauseOnKeyEvents:true}),false);
 const source=phaseReplay(events,phase).source;
 assert.equal(shouldPauseReplayStep(report,{events:[source]},{autoplay:true,pauseOnKeyEvents:true}),false);
 for(const type of ['scene','encounter','route','rescue','branch','defeat']){
  for(const autoplay of [true,false])for(const pauseOnKeyEvents of [true,false]){
   assert.equal(shouldPauseReplayStep(report,{events:[{type}]},{autoplay,pauseOnKeyEvents}),type==='defeat'||pauseOnKeyEvents);
  }
 }
 assert.equal(digest(),'762d2bb354c90c08f0b6504a408383dcd417c0f7f521da84259b0528344d8112');
});
