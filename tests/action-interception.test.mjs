import test from 'node:test';
import assert from 'node:assert/strict';
import {actionFocusFrame,actionFocusView,actionInterceptionRecord} from '../dist/expedition-action-focus.mjs';
const units=[{id:'x',name:'弩手',side:'enemy',hp:60,maxHp:110,mp:75,maxMp:80,pos:'rear'},{id:'g',name:'伙伴',side:'party',hp:82,maxHp:100,mp:36,maxMp:42,pos:'rear'},{id:'npc',name:'引航员',side:'party',hp:90,maxHp:90,mp:0,maxMp:0,pos:'rear'}];
function fixture(success=true){const e=(id,type,actor,targets,detail,text)=>({id,type,actor,targets,detail,text,units:structuredClone(units),supplies:{herb:5,rune:5,arrow:5},roomIndex:0,phase:'main',round:1}),events=[e(48,'cast','x',['npc'],{cast:11},'弩手使用齐射'),e(51,'intercept','g',['npc'],{success,guardianName:'伙伴',protectedName:'引航员',cost:2},success?'伙伴接下原本指向引航员的攻击':'伙伴未及接招'),e(52,'attack','x',[success?'g':'npc'],{actual:18,grade:'命中'},'实际命中')];return {report:{events},group:{start:0,end:2,events}};}
test('successful interception exposes the actual protected NPC, partner and separately recorded attempt cost without inventing NPC damage',()=>{
 const {report,group}=fixture(),before=structuredClone(report),frame=actionFocusFrame(group),html=actionFocusView(frame);
 assert.equal(frame.interceptions.length,1);assert.deepEqual(frame.recipients.map(c=>c.id),['g']);assert.equal(frame.recipients[0].outcome.hpLoss,18);assert.match(html,/伙伴 替 引航员 接招/);assert.match(html,/援护已付 2 MP/);assert.match(html,/data-action-interception="51"/);assert.ok(!html.includes('data-action-unit="npc"'));assert.deepEqual(report,before);
});
test('failed paid attempt is labelled as not in time and preserves the actual original recipient',()=>{
 const {group}=fixture(false),frame=actionFocusFrame(group),html=actionFocusView(frame);assert.match(html,/伙伴 未及援护 引航员/);assert.match(html,/援护已付 2 MP/);assert.deepEqual(frame.recipients.filter(c=>c.outcome).map(c=>c.id),['npc']);assert.ok(!html.includes('替 引航员 接招'));
});
test('a record link binds to the exact source event and current action even when the UI recomputes an equivalent group',()=>{
 const {report,group}=fixture();assert.deepEqual(actionInterceptionRecord(report,{...group,events:[...group.events]},51,group),{eventId:51,index:1,guardian:'g',text:report.events[1].text});assert.equal(actionInterceptionRecord(report,group,48),null);assert.equal(actionInterceptionRecord(report,group,'51'),null);assert.equal(actionInterceptionRecord(report,group,999),null);
});
test('foreign report clones, reused IDs, stale steps, altered bounds and missing records cannot navigate by coincident ID',()=>{
 const {report,group}=fixture(),other=structuredClone(report);assert.equal(actionInterceptionRecord(other,group,51),null);assert.equal(actionInterceptionRecord(report,group,51,structuredClone(group)),null);assert.equal(actionInterceptionRecord({events:[...report.events,report.events[1]]},group,51),null);assert.equal(actionInterceptionRecord(report,{...group,start:1},51,{...group,start:1}),null);assert.equal(actionInterceptionRecord(report,{...group,events:[group.events[1]]},51),null);assert.equal(actionInterceptionRecord(null,group,51),null);
});
test('diagnostic cast-only and skip records do not borrow a later interception or invent a paid attempt',()=>{
 const {group}=fixture(),cast={start:0,end:0,events:[group.events[0]]};assert.equal(actionFocusFrame(cast).interceptions.length,0);assert.ok(!actionFocusView(actionFocusFrame(cast)).includes('data-action-interception'));group.events[1].type='intercept-skip';assert.equal(actionFocusFrame(group).interceptions.length,0);
});
test('missing legacy detail keeps its recorded text without invented names, success or mana cost',()=>{
 const {group}=fixture();group.events[1].detail={};const frame=actionFocusFrame(group),html=actionFocusView(frame);assert.equal(frame.interceptions[0].success,null);assert.equal(frame.interceptions[0].cost,null);assert.match(html,/伙伴接下原本指向引航员的攻击/);assert.ok(!html.includes('援护已付'));assert.ok(!html.includes('undefined'));
});
test('imported-looking names, event text and mana fields are escaped or omitted without adding markup or numeric claims',()=>{
 const {group}=fixture();group.events[1].text='<img onerror="bad">';group.events[1].detail.guardianName='<svg onload="bad">';group.events[1].detail.protectedName='x" autofocus="bad';group.events[1].detail.cost='<img>';const html=actionFocusView(actionFocusFrame(group));assert.ok(!html.includes('<svg onload'));assert.ok(!html.includes('<img onerror'));assert.ok(html.includes('&lt;svg onload=&quot;bad&quot;&gt;'));assert.ok(html.includes('&lt;img onerror=&quot;bad&quot;&gt;'));assert.ok(!html.includes('援护已付'));
});
