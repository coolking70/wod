import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,defaultHero,clone,row,naturalDefenses,SKILLS,resolveHeroPlan} from '../dist/expedition-data.mjs';
import {simulate,buildParty,validate,mean} from '../dist/expedition-engine.mjs';
import {selectHealingTarget,healingDecision} from '../dist/expedition-healing.mjs';
import {groupAidCandidates,groupAidDecision,groupAidEvidenceView} from '../dist/expedition-group-aid.mjs';
import {commandCost} from '../dist/expedition-media.mjs';
import {personalReport} from '../dist/expedition-personal.mjs';
import {configurationChanges,storePlan,readPlans} from '../dist/expedition-review.mjs';
import {newGuild,train,validateGuild} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {companionPreview} from '../dist/expedition-command-preview.mjs';
import {resourceAssignments} from '../dist/expedition-resource-check.mjs';
function quiet(){const c=defaults();c.expedition='tutorial';for(const h of c.heroes){h.prep=[];h.main=[row('wait')];h.healing.enabled=false;h.item='none';h.overrides={};h.defenses=naturalDefenses();}const f=c.heroes.find(h=>h.id==='f');f.healing={enabled:true,threshold:.8,target:'all',priority:'lowest',groupAid:true};return c;}
const hold={id:'hold',side:'enemy',name:'hold',pos:'front',gear:'field',attrs:{str:1,con:1,int:1,dex:1,cha:1,agi:1,per:1,wil:1},skills:{strike:1},hp:10000,maxHp:10000,mp:0,maxMp:0,prep:[],main:[row('wait')],defenses:naturalDefenses(),healing:{enabled:false}};
function setup(ratios={c:.3,d:.4,f:.5}){const c=quiet(),party=buildParty(c);for(const u of party)if(ratios[u.id]!==undefined)u.hp=Math.floor(u.maxHp*ratios[u.id]);return {c,party,f:party.find(u=>u.id==='f')};}
const run=(x,rounds=1)=>simulate(x.c,{party:x.party,rooms:[{id:'gallery',name:'群救边界',enemies:[hold]}],maxRounds:rounds});
test('group aid is explicit, class-bound and cannot enter ordinary or preparation command rows',()=>{
 const c=quiet();validate(c);c.heroes[0].healing.groupAid=true;assert.throws(()=>validate(c),/药师/);delete c.heroes[0].healing.groupAid;c.heroes.find(h=>h.id==='f').healing.groupAid='yes';assert.throws(()=>validate(c),/布尔/);
 const d=quiet();d.heroes.find(h=>h.id==='f').main=[row('groupheal')];assert.throws(()=>validate(d));assert.equal(defaultHero('orin').healing.groupAid,undefined);assert.equal(defaults().heroes.find(h=>h.id==='f').healing.groupAid,undefined);
});
test('urgent patient chooses the group; cap is three, threshold/down/enemy filters apply without cross-position filling',()=>{
 const x=setup({a:.2,b:.3,c:.4,d:.5,e:.6,f:.7});for(const u of x.party)u.pos='center';const lead=selectHealingTarget(x.f,x.party,'all'),g=groupAidCandidates(x.f,x.party,'all',lead);
 assert.deepEqual(g.map(u=>u.id),['a','b','c']);x.party[0].pos='front';assert.deepEqual(groupAidCandidates(x.f,x.party,'all',lead).map(u=>u.id),['a']);
 assert.equal(groupAidDecision(x.f,x.party,x.c.supplies,lead).chosenSkill,'heal');x.party[0].hp=0;assert.ok(!groupAidCandidates(x.f,x.party,'all',selectHealingTarget(x.f,x.party,'all')).some(u=>u.id==='a'));
});
test('self-first priority preserves the urgent self and single-only scope cannot trigger group aid',()=>{
 const x=setup();x.f.healing.priority='self_first';x.f.pos='rear';const lead=selectHealingTarget(x.f,x.party,'all');assert.equal(lead.id,'f');assert.equal(groupAidDecision(x.f,x.party,x.c.supplies,lead).chosenSkill,'heal');
 x.f.pos='center';const selected=groupAidCandidates(x.f,x.party,'all',lead);assert.equal(selected[0].id,'f');assert.equal(selected.length,3);x.f.healing.target='self';assert.equal(groupAidDecision(x.f,x.party,x.c.supplies,lead).chosenSkill,'heal');
});
test('one real group cast pays ten mana and two herbs once, restores up to three, counts one interrupted action and preserves ordinary cursor',()=>{
 const x=setup(),before=x.f.mp,r=run(x),casts=r.events.filter(e=>e.actor==='f'&&e.type==='cast'),heals=r.events.filter(e=>e.actor==='f'&&e.type==='heal');
 assert.equal(casts.length,1);assert.equal(casts[0].detail.skill,'groupheal');assert.deepEqual(casts[0].targets,['c','d','f']);assert.equal(casts[0].detail.mpBefore-casts[0].detail.mpAfter,10);assert.equal(casts[0].detail.itemAmount,2);assert.equal(r.supplies.herb,x.c.supplies.herb-2);assert.equal(r.stats.f.interrupts,1);assert.equal(heals.length,3);assert.ok(heals.every(e=>e.detail.amount===Math.floor(mean(x.f,'groupheal')*.45)&&e.detail.ordinaryCursorUnchanged));
 assert.equal(r.stats.f.healing,heals.reduce((n,e)=>n+e.detail.actual,0));const p=personalReport(r,'f');assert.equal(p.total.healing,r.stats.f.healing);assert.equal(p.supplies.herb,2);assert.equal(p.total.casts,1);assert.equal(p.total.castMana,10);
});
test('only one qualifying patient falls back to unchanged single healing and does not add random draws',()=>{
 const x=setup({c:.3}),without=clone(x);delete without.f.healing.groupAid;delete without.c.heroes.find(h=>h.id==='f').healing.groupAid;without.party=without.party.map(u=>u.id==='f'?without.f:u);
 const a=run(x),b=run(without),strip=r=>r.events.map(e=>{const n=clone(e);if(n.detail.healingDecision)delete n.detail.healingDecision.groupAid;return n;});assert.deepEqual(strip(a),strip(b));assert.deepEqual(a.stats,b.stats);assert.deepEqual(a.supplies,b.supplies);
});
test('one herb or insufficient group mana uses affordable single aid; insufficient single resources spends nothing and keeps main action',()=>{
 for(const field of ['herb','mana']){const x=setup();if(field==='herb')x.c.supplies.herb=1;else x.f.mp=5;const r=run(x),cast=r.events.find(e=>e.actor==='f'&&e.type==='cast');assert.equal(cast.detail.skill,'heal');assert.equal(r.supplies.herb,x.c.supplies.herb-1);assert.equal(cast.detail.healingDecision.groupAid.fallback,true);}
 const x=setup();x.f.mp=3;const r=run(x);assert.equal(r.events.filter(e=>e.actor==='f'&&e.type==='heal').length,0);assert.equal(r.supplies.herb,x.c.supplies.herb);assert.ok(r.events.some(e=>e.actor==='f'&&e.type==='wait'));assert.equal(r.stats.f.interrupts,0);
});
test('disabled healing and a present healing-block effect do not cast group aid or pay materials',()=>{
 const x=setup();x.f.healing.enabled=false;assert.equal(healingDecision(x.f,x.party,x.c.supplies).status,'disabled');assert.equal(groupAidDecision(x.f,x.party,x.c.supplies,x.party[2]).chosenSkill,'heal');
 const y=setup();y.f.effects=[{id:'block',skill:'suppress',source:'hold',stat:'healingBlock',value:1,active:true,scope:'expedition'}];const r=run(y);assert.ok(r.events.some(e=>e.actor==='f'&&e.type==='skip'&&e.detail.healingBlock));assert.equal(r.supplies.herb,y.c.supplies.herb);assert.ok(r.events.some(e=>e.actor==='f'&&e.type==='wait'));
});
test('item priority consumes its action before group aid; no second action or payment is manufactured',()=>{
 const x=setup();x.f.itemInstance={id:'f:salve',kind:'salve',remaining:2};x.f.itemPolicy={enabled:true,threshold:.7};x.c.heroes.find(h=>h.id==='f').itemPolicy={enabled:true,threshold:.7};const r=run(x);assert.equal(r.events.filter(e=>e.actor==='f'&&e.type==='item').length,1);assert.equal(r.events.filter(e=>e.actor==='f'&&e.type==='cast').length,0);assert.equal(r.supplies.herb,x.c.supplies.herb);
});
test('summons follow the existing injury scope, and down units cannot be revived by a group cast',()=>{
 const x=setup({c:.2,d:0}),summon={...clone(x.party[0]),id:'summon:test',owner:'a',pos:'center',hp:10,maxHp:100};const units=[...x.party,summon],lead=selectHealingTarget(x.f,units,'all'),g=groupAidCandidates(x.f,units,'all',lead);assert.equal(g[0].id,'summon:test');assert.ok(g.some(u=>u.id==='c'));assert.ok(!g.some(u=>u.id==='d'));
});
test('separate group training changes only its own mean; emergency advancement discounts old single heal only',()=>{
 const x=setup(),base=mean(x.f,'groupheal');x.f.skills.groupheal+=1;assert.equal(mean(x.f,'groupheal'),base+2);x.f.advancement='emergency';assert.equal(commandCost(x.f,row('groupheal')).mana,10);assert.equal(commandCost(x.f,row('groupheal')).amount,2);assert.equal(commandCost(x.f,row('heal')).mana,4);
 const g=newGuild();g.members.find(h=>h.id==='f').xp=20;const trained=train(g,'f','skill:groupheal');assert.equal(trained.members.find(h=>h.id==='f').xp,0);assert.equal(trained.members.find(h=>h.id==='f').training['skill:groupheal'],1);validateGuild(trained);
});
test('per-room inheritance, named plans and human-readable differences preserve the optional strategy',()=>{
 const c=quiet(),f=c.heroes.find(h=>h.id==='f');f.overrides.gallery={healing:{...f.healing,groupAid:false}};assert.equal(resolveHeroPlan(f,'gallery').healing.groupAid,false);assert.equal(resolveHeroPlan(f,'cistern').healing.groupAid,true);
 const plain=clone(c);delete plain.heroes.find(h=>h.id==='f').healing.groupAid;assert.ok(configurationChanges(plain,c).some(d=>d.after.includes('同位合剂')));const plans=storePlan([],{id:'group',name:'合剂',config:c});assert.deepEqual(readPlans(JSON.stringify({version:1,plans})).plans,plans);
});
test('managed group-aid role previews exact payments without granting assets',()=>{
 const g=setCompanion(selectHero(newGuild(),'a'),'f','triage'),before=clone(g),p=companionPreview(g,defaults(),'f','triage');assert.equal(p.healing.groupAid,true);assert.deepEqual(g,before);
 const rows=resourceAssignments([{...defaults().heroes.find(h=>h.id==='f'),healing:p.healing}],{herb:8,rune:0,arrow:0}).find(r=>r.item==='herb').rows;assert.equal(rows.find(r=>r.skill==='groupheal').amount,2);assert.equal(rows.find(r=>r.skill==='groupheal').mana,10);assert.ok(rows.find(r=>r.skill==='groupheal').fallbacks.every(r=>r.skill!=='heal'));assert.ok(rows.some(r=>r.skill==='heal'));
 const x=setup(),d=healingDecision(x.f,x.party,x.c.supplies);assert.match(groupAidEvidenceView(d),/同位合剂/);assert.equal(d.cost.herb,2);assert.deepEqual(d.groupAid.selected,['c','d','f']);
});

test('normal earned progression includes a true group cast, paid training and a later case with no qualifying group',async()=>{
 const {groupAidLoop}=await import('../scripts/group-aid-cases.mjs');const x=groupAidLoop(),first=x.firstReport.events.filter(e=>e.type==='cast'&&e.actor==='f'&&e.detail.skill==='groupheal');assert.equal(first.length,1);assert.deepEqual(first[0].targets,['d','c']);assert.equal(first[0].detail.itemAmount,2);assert.equal(x.firstReport.won,true);assert.equal(x.secondReport.won,true);assert.deepEqual([x.desktop.gold,x.final.gold],[185,315]);assert.equal(x.desktop.members.find(h=>h.id==='f').training['skill:groupheal'],1);assert.equal(x.secondReport.events.filter(e=>e.type==='cast'&&e.actor==='f'&&e.detail.skill==='groupheal').length,0);validateGuild(x.final);
});
test('threat map matches actual magical armor, while mental damage alone ignores physical armor',async()=>{
 const {enemyThreatMap}=await import('../dist/expedition-threat-map.mjs');const c=defaults();c.heroes.find(h=>h.id==='c').gear.armor='field';c.heroes.find(h=>h.id==='f').prep=[];const mapped=enemyThreatMap(c,'cistern')[0].heroes.find(h=>h.id==='c').attacks.find(a=>a.type==='magic');assert.equal(mapped.armor,2);const r=simulate(c),actual=r.events.find(e=>e.type==='attack'&&e.actor==='c2'&&e.targets.includes('c'));assert.ok(actual);assert.equal(actual.detail.armorBefore,mapped.armor);
});
