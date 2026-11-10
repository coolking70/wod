import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,SKILLS,ROOMS,clone,row} from '../dist/expedition-data.mjs';
import {chooseTargets,simulate,buildParty,validate} from '../dist/expedition-engine.mjs';
import {supportsTargetPick,targetPickEnabled,validateTargetPick,withTargetPick,targetPickEvidenceView,targetPickEditor} from '../dist/expedition-target-pick.mjs';
import {FOCUS_STAT} from '../dist/expedition-focus-mark.mjs';
import {describeConfigValue,configurationChanges} from '../dist/expedition-review.mjs';
import {saveBookPlan,bindBookPlan,encodePlanBook,readPlanBook,routePreparation} from '../dist/expedition-plan-book.mjs';
import {newGuild} from '../dist/expedition-guild.mjs';
import {captureCampaign,restoreCampaign,validateCampaignBackup,CAMPAIGN_KEYS,campaignRaw} from '../dist/expedition-campaign-backup.mjs';
import {targetPickLoop} from '../scripts/target-pick-cases.mjs';
import {claim,historyReport} from '../dist/expedition-guild.mjs';
import {collectReport} from '../dist/expedition-report-archive-guild.mjs';
import {thawArchive,validateFrozenReport} from '../dist/expedition-report-archive.mjs';
const actor={id:'b',name:'射手',side:'party',pos:'front'};
const target=(id,hp=100,pos='rear',maxHp=100)=>({id,name:id,hp,maxHp,pos,side:'enemy',mp:50,skills:{shot:6},effects:[]});
const pick=withTargetPick(row('shot','rear'),true);
const ids=targets=>targets.map(t=>t.id);
function mechanical(){
 const config=defaults();for(const h of config.heroes){h.prep=[];h.main=[row('wait','self')];h.healing.enabled=false;}
 config.heroes.find(h=>h.id==='b').main=[withTargetPick(row('pierce','rear'),true)];config.heroes.find(h=>h.id==='c').main=[withTargetPick(row('lance','rear'),true)];
 const party=buildParty(config);for(const u of party){u.hp=u.maxHp=10000;u.attrs.agi=0;}
 party.find(u=>u.id==='b').attrs.agi=1000;party.find(u=>u.id==='c').attrs.agi=900;
 const foes=[clone(ROOMS[0].enemies[1]),clone(ROOMS[0].enemies[2])];foes.forEach((u,i)=>{u.id='pool-'+i;u.name='候选'+i;u.hp=i===0?900:400;u.maxHp=1000;u.main=[row('wait','self')];u.attrs.agi=0;});
 return {config,party,rooms:[{id:'gallery',name:'明确标注的机械边界',enemies:foes}]};
}
const run=x=>simulate(x.config,{party:x.party,rooms:x.rooms,maxRounds:1});
test('only explicit supported single HP attacks accept the option; disabling removes the field',()=>{
 for(const skill of ['shot','spark','strike','pierce','unravel'])assert.equal(supportsTargetPick(SKILLS[skill]),true,skill);
 for(const skill of ['volley','wave','heal','sentinel','wait','drain','focuscall']){assert.equal(supportsTargetPick(SKILLS[skill]),false,skill);assert.throws(()=>withTargetPick(row(skill),true));}
 for(const value of [false,true,null,0,'random','lowestRatio',{},[]])assert.throws(()=>validateTargetPick({...row('shot'),targetPick:value}));
 assert.deepEqual(withTargetPick(pick,false),row('shot','rear'));assert.throws(()=>withTargetPick(pick,1));assert.equal(targetPickEnabled(Object.assign(Object.create({targetPick:'lowestHp'}),row('shot'))),false);
 const c=defaults();c.heroes[1].main=[clone(pick)];assert.equal(validate(c),true);c.heroes[1].main[0].skill='volley';assert.throws(()=>validate(c),/低生命/);
});
test('lowest absolute current HP is chosen inside the original pool, not lowest ratio or max HP',()=>{
 const units=[target('ratio',80,'rear',1000),target('finish',40,'rear',50),target('elsewhere',1,'front')],before=clone(units);let trace;
 assert.deepEqual(ids(chooseTargets(actor,units,SKILLS.shot,'rear',()=>.9,pick,v=>{trace=v;})),['finish']);
 assert.deepEqual(trace.candidates.map(u=>u.id),['ratio','finish']);assert.equal(trace.selected[0].hp,40);assert.equal(trace.reason,'lowest_current_hp');assert.deepEqual(units,before);
 units[0].hp=10;assert.deepEqual(ids(chooseTargets(actor,units,SKILLS.shot,'rear',()=>.9,pick)),['ratio']);
});
test('ties preserve original shuffle output and consume exactly the original random draws',()=>{
 const units=[target('a'),target('b'),target('c')];for(const value of [0,.2,.7,.99]){let a=0,b=0;assert.deepEqual(ids(chooseTargets(actor,units,SKILLS.shot,'rear',()=>{a++;return value;})),ids(chooseTargets(actor,units,SKILLS.shot,'rear',()=>{b++;return value;},pick)));assert.equal(a,2);assert.equal(a,b);}
});
test('position order, melee blocking, exact-position fallback and healer roles remain boundaries',()=>{
 const front=target('wall',900,'front'),rear=target('rear',1),medic=target('medic',500,'left');medic.skills.heal=6;
 assert.deepEqual(ids(chooseTargets(actor,[front,rear],SKILLS.strike,'rear',()=>0,withTargetPick(row('strike','front'),true))),['wall']);
 assert.deepEqual(chooseTargets(actor,[rear],SKILLS.shot,'front',()=>0,{...pick,target:'front',onlyPosition:true}),[]);
 assert.deepEqual(ids(chooseTargets(actor,[front,rear,medic],SKILLS.spark,'healer',()=>0,withTargetPick(row('spark','healer'),true))),['medic']);
 const archer={...actor,attackOrder:['left','rear','front','center','right']};assert.deepEqual(ids(chooseTargets(archer,[front,rear,medic],SKILLS.shot,'priority',()=>0,{...pick,target:'priority'})),['medic']);
});
test('dead, immune and attack-ineligible mechanisms cannot become a low HP target',()=>{
 const dead=target('dead',0),immune=target('immune',1),mechanism=target('mechanism',1),legal=target('legal',100);immune.immuneTo=['ranged'];mechanism.mechanism=true;
 assert.deepEqual(ids(chooseTargets(actor,[dead,immune,mechanism,legal],SKILLS.shot,'rear',()=>0,pick)),['legal']);
});
test('an existing legal focus mark takes precedence without a shuffle; foreign marks do not',()=>{
 const low=target('low',1),marked=target('marked',100);marked.effects=[{id:'focus',stat:FOCUS_STAT,source:'caller',sourceSide:'party',harmful:true,active:true}];let draws=0,trace;
 assert.deepEqual(ids(chooseTargets(actor,[low,marked],SKILLS.shot,'rear',()=>{draws++;return .5;},pick,v=>{trace=v;})),['marked']);assert.equal(draws,0);assert.equal(trace.reason,'existing_mark');
 marked.effects[0].sourceSide='enemy';assert.deepEqual(ids(chooseTargets(actor,[low,marked],SKILLS.shot,'rear',()=>.5,pick)),['low']);
});
test('unsupported area/MP/control probes retain their original selection and RNG',()=>{
 const units=[target('a',1),target('b',200),target('c',100)];for(const id of ['volley','wave','drain']){let a=0,b=0;assert.deepEqual(ids(chooseTargets(actor,units,SKILLS[id],'rear',()=>{a++;return .8;})),ids(chooseTargets(actor,units,SKILLS[id],'rear',()=>{b++;return .8;},pick)));assert.equal(a,b);}
 assert.equal(chooseTargets(actor,units,{...SKILLS.shot,max:Number.MAX_SAFE_INTEGER},'rear',()=>0,pick).length,3);
});
test('two real allied actions re-evaluate current HP and preserve the original payment and action cost',()=>{
 const x=mechanical(),before=clone(x),r=run(x),shots=r.events.filter(e=>e.type==='cast'&&['b','c'].includes(e.actor));assert.equal(shots.length,2);assert.ok(shots.every(e=>e.targets[0]==='pool-1'));
 const first=shots[0],second=shots[1],hit=r.events.find(e=>e.type==='attack'&&e.actor===first.actor);assert.ok(hit.detail.actual>0);assert.equal(second.detail.targetPicking.selected[0].hp,hit.detail.hpAfter);assert.equal(second.detail.targetPicking.candidates.find(u=>u.id==='pool-1').hp,hit.detail.hpAfter);
 for(const e of shots)assert.equal(e.detail.mpBefore-e.detail.mpAfter,SKILLS[e.detail.skill].cost);
 assert.equal(r.supplies.arrow,x.config.supplies.arrow-1);assert.equal(r.supplies.rune,x.config.supplies.rune-1);assert.deepEqual(x,before);assert.deepEqual(run(x),r);
});
test('a target defeated by the preceding ally is excluded from the following action',()=>{
 const x=mechanical();x.rooms[0].enemies[1].hp=1;const r=run(x),casts=r.events.filter(e=>e.type==='cast'&&['b','c'].includes(e.actor));assert.deepEqual(casts.map(e=>e.targets[0]),['pool-1','pool-0']);assert.ok(r.events.some(e=>e.type==='down'&&e.targets[0]==='pool-1'));assert.deepEqual(casts[1].detail.targetPicking.candidates.map(u=>u.id),['pool-0']);
});
test('physical interception can still redirect the chosen low HP target; spell targeting stays in the original pool',()=>{
 const x=mechanical(),guard=clone(ROOMS[0].enemies[0]);Object.assign(guard,{id:'cover',name:'原有援护者',hp:1000,maxHp:1000,gear:'guardblade',skills:{strike:6,interpose:100},prep:[row('interpose','rear')],main:[row('wait','self')]});x.rooms[0].enemies.unshift(guard);
 const r=run(x),cast=r.events.find(e=>e.type==='cast'&&e.actor==='b'),reaction=r.events.find(e=>e.type==='intercept'),hit=r.events.find(e=>e.type==='attack'&&e.actor==='b');assert.equal(cast.detail.targetPicking.selected[0].id,'pool-1');assert.equal(cast.targets[0],'pool-1');assert.equal(reaction.detail.success,true);assert.equal(hit.targets[0],'cover');assert.equal(hit.detail.interception.protected,'pool-1');assert.ok(!cast.detail.targetPicking.candidates.some(u=>u.id==='cover'));assert.equal(r.events.find(e=>e.type==='cast'&&e.actor==='c').targets[0],'pool-1');
});
test('an empty exact-position pool is a free skip and does not leak the option into a fallback row',()=>{
 const x=mechanical();x.config.heroes.find(h=>h.id==='b').main=[{...withTargetPick(row('pierce','rear'),true),onlyPosition:true},row('shot','front')];x.config.heroes.find(h=>h.id==='c').main=[row('wait','self')];x.rooms[0].enemies=x.rooms[0].enemies.slice(0,1);x.rooms[0].enemies[0].pos='front';const r=run(x),skip=r.events.find(e=>e.type==='skip'&&e.actor==='b'&&e.detail.skill==='pierce'),cast=r.events.find(e=>e.type==='cast'&&e.actor==='b');assert.equal(skip.detail.cost,0);assert.equal(skip.detail.consumedAction,false);assert.equal(cast.detail.skill,'shot');assert.equal(cast.detail.targetPicking,undefined);assert.equal(r.supplies.arrow,x.config.supplies.arrow);
});
test('room overrides apply the option only to that room and retain default inheritance afterwards',()=>{
 const x=mechanical(),b=x.config.heroes.find(h=>h.id==='b');b.main=[row('shot','rear')];b.overrides.gallery={main:[withTargetPick(row('pierce','rear'),true)]};x.config.heroes.find(h=>h.id==='c').main=[row('wait','self')];const first=clone(x.rooms[0].enemies[0]);first.hp=1;const second=clone(x.rooms[0].enemies[1]);second.hp=1000;x.rooms=[{id:'gallery',name:'首房覆盖',enemies:[first]},{id:'cistern',name:'次房继承默认',enemies:[second]}];const r=run(x),casts=r.events.filter(e=>e.type==='cast'&&e.actor==='b');assert.equal(casts.length,2);assert.equal(casts[0].detail.targetPicking.mode,'lowestHp');assert.equal(casts[1].detail.targetPicking,undefined);assert.equal(b.main[0].targetPick,undefined);
});
test('default and explicitly disabled configurations keep the entire old-style report free of new fields',()=>{
 const c=defaults(),roundtrip=clone(c);roundtrip.heroes[1].main[1]=withTargetPick(withTargetPick(roundtrip.heroes[1].main[1],true),false);assert.deepEqual(roundtrip,c);const a=simulate(c),b=simulate(roundtrip);assert.deepEqual(a,b);assert.ok(a.events.every(e=>!Object.hasOwn(e.detail,'targetPicking')));
});
test('preview, diff and serialized plan text disclose the option without changing untouched commands',()=>{
 const a=defaults(),b=clone(a);b.heroes[1].main[1]=withTargetPick(b.heroes[1].main[1],true);assert.match(describeConfigValue('main',b.heroes[1].main),/同范围优先低生命/);assert.doesNotMatch(describeConfigValue('main',a.heroes[1].main),/同范围优先低生命/);assert.equal(configurationChanges(a,b).length,1);assert.deepEqual(JSON.parse(JSON.stringify(b)),b);assert.equal(targetPickEditor(row('wave'),'main',0),'');assert.match(targetPickEditor(pick,'main',0),/type=checkbox.*checked/);
});
test('named route plans, comparison and campaign backup restore the exact opt-in while leaving the original storage unchanged',async()=>{
 const c=defaults();c.heroes[1].main[1]=clone(pick);c.heroes[1].overrides.gallery={main:[clone(pick)]};let book=saveBookPlan(readPlanBook(null),{id:'low-hp',name:'同范围追击',config:c});book=bindBookPlan(book,'classic','low-hp');const encoded=encodePlanBook(book);assert.deepEqual(routePreparation(readPlanBook(encoded),'classic').config,c);
 const values=new Map([[CAMPAIGN_KEYS[0],JSON.stringify(c)],[CAMPAIGN_KEYS[1],encoded],[CAMPAIGN_KEYS[2],JSON.stringify(c)],[CAMPAIGN_KEYS[3],JSON.stringify(newGuild())]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},before=campaignRaw(storage);const backup=await captureCampaign(storage,'2026-11-10T00:00:00.000Z');assert.deepEqual((await validateCampaignBackup(backup)).preparation,c);assert.deepEqual(campaignRaw(storage),before);
 const restored=new Map(),destination={getItem:k=>restored.get(k)??null,setItem:(k,v)=>restored.set(k,v),removeItem:k=>restored.delete(k)};await restoreCampaign(destination,backup,campaignRaw(destination));assert.deepEqual(JSON.parse(destination.getItem(CAMPAIGN_KEYS[0])),c);assert.deepEqual(JSON.parse(destination.getItem(CAMPAIGN_KEYS[2])),c);assert.equal(readPlanBook(destination.getItem(CAMPAIGN_KEYS[1])).plans[0].config.heroes[1].main[1].targetPick,'lowestHp');
});
test('imported trace text is escaped and malformed trace arrays do not crash the view',()=>{
 const e={detail:{targetPicking:{mode:'lowestHp',reason:'lowest_current_hp',candidates:[{name:'<img src=x onerror=1>',hp:'<svg>',maxHp:100}],selected:[{name:'<script>'}],rule:'<iframe>'}}};const html=targetPickEvidenceView(e);assert.doesNotMatch(html,/<img|<script|<iframe|<svg>/);assert.match(html,/&lt;img/);assert.equal(targetPickEvidenceView({detail:{targetPicking:{mode:'lowestHp',candidates:'bad',selected:[]}}}),'');assert.equal(targetPickEvidenceView({events:[]}), '');
});
test('fixed natural departures use earned assets, exact complete reports and one explicit claim each',()=>{
 const x=targetPickLoop();assert.equal(x.start.next,2);assert.equal(x.final.next,4);assert.equal(x.start.command.heroId,'b');assert.deepEqual(x.final.command,x.start.command);const warehouse=clone(x.start.warehouse);for(const r of x.runs)for(const id of r.reward.loot||[])warehouse[id]=(warehouse[id]||0)+1;assert.deepEqual(x.final.warehouse,warehouse);
 for(const r of x.runs){assert.deepEqual(historyReport(r.claimed,r.before.next),r.report);assert.throws(()=>claim(r.claimed));assert.ok(r.report.events.some(e=>e.detail.targetPicking?.candidates.length>1));assert.ok(r.controlReport.events.every(e=>e.detail.targetPicking===undefined));assert.equal(r.claimed.gold,r.before.gold+r.reward.gold);for(const m of r.before.members){const after=clone(r.claimed.members.find(h=>h.id===m.id));after.xp-=r.reward.xp;assert.deepEqual(after,m);}}
});
test('a normal earned run report with target-selection evidence freezes and thaws without inventing rewards',async()=>{
 const x=targetPickLoop(),r=x.runs[0];validateFrozenReport(r.report);const saved=await collectReport(r.pending,{source:'pending',id:r.pending.pending.id,signature:JSON.stringify(r.pending.pending)},r.report,'同范围择敌完整原记录');assert.deepEqual(await thawArchive(saved.reportArchives[0]),r.report);const without=clone(saved);delete without.reportArchives;assert.deepEqual(without,r.pending);
});
