import test from 'node:test';import assert from 'node:assert/strict';
import {enemyThreatMap,enemyThreatMapView,threatCandidates} from '../dist/expedition-threat-map.mjs';
import {adventureConfig,ADVENTURES} from '../dist/expedition-adventure.mjs';
import {clone,defaults,SKILLS,row,roomsFor} from '../dist/expedition-data.mjs';
import {simulate,buildParty,chooseTargets} from '../dist/expedition-engine.mjs';
import {newGuild,validateGuild} from '../dist/expedition-guild.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
import {threatMapLoop} from '../scripts/threat-map-cases.mjs';

test('initial map includes every candidate in a single-target group without promising both will be attacked',()=>{
 const c=adventureConfig('classic'),m=enemyThreatMap(c,'gallery'),shot=m[0].attacks.find(a=>a.source==='g2');
 assert.deepEqual(shot.candidates,['b','e']);assert.equal(shot.limit,1);assert.match(enemyThreatMapView(m),/不会同时攻击全部候选/);
 assert.deepEqual(m[0].attacks.find(a=>a.source==='g1').candidates,['a']);
});
test('same-position group over the skill cap remains a possible range, never an invented cross-position total',()=>{
 const c=defaults();for(const h of c.heroes)h.pos='center';const enemy={id:'foe',side:'enemy',pos:'front'},party=buildParty(c),group=threatCandidates(enemy,party,row('volley','center'));
 assert.deepEqual(group.map(u=>u.id),c.heroes.map(h=>h.id));
 for(const n of [.1,.4,.9]){const actual=chooseTargets(enemy,party,SKILLS.volley,'center',()=>n);assert.equal(actual.length,3);assert.ok(actual.every(u=>group.includes(u)));}
 party.find(h=>h.id==='f').pos='rear';assert.equal(threatCandidates(enemy,party,row('volley','center')).length,5);
});
test('melee fixed routes ignore the written target and empty ranged positions fall back through actual engine rules',()=>{
 const p=buildParty(defaults());p[0].pos='left';const enemy={side:'enemy',pos:'front'};
 assert.deepEqual(threatCandidates(enemy,p,row('strike','rear')).map(h=>h.id),['a']);
 assert.deepEqual(threatCandidates(enemy,p,row('shot','right')).map(h=>h.id),['a']);
 assert.deepEqual(threatCandidates(enemy,p,row('spark','healer')).map(h=>h.id),['f']);
 assert.deepEqual(threatCandidates(enemy,p,row('spark','summoner')).map(h=>h.id),['c']);
 assert.deepEqual(threatCandidates(enemy,p,row('ward','front')),[]);
});
test('per-room movement changes just that room attack range and defense choices',()=>{
 const c=adventureConfig('classic'),before=enemyThreatMap(c);const d=c.heroes.find(h=>h.id==='d');d.overrides.cistern={pos:'left',defenses:{melee:'natural',ranged:'natural',magic:'resist'}};
 const after=enemyThreatMap(c);assert.deepEqual(after[0],before[0]);assert.deepEqual(after[2],before[2]);
 assert.deepEqual(after[1].attacks.find(a=>a.source==='c2').candidates,['c','f']);assert.equal(after[1].heroes.find(h=>h.id==='d').pos,'left');assert.equal(after[1].heroes.find(h=>h.id==='d').attacks.length,0);
 assert.throws(()=>enemyThreatMap(c,'not-a-room'),/不属于/);
});
test('guild map reads owned equipment rather than an unowned draft and reports a missing-shield fallback',()=>{
 const g=newGuild(),c=adventureConfig('classic'),before=clone(g);c.heroes[0].gear=clone(c.heroes.find(h=>h.id==='f').gear);
 const draft=enemyThreatMap(c,'gallery')[0].heroes[0].attacks[0],actual=enemyThreatMap(readiness(g,c).config,'gallery')[0].heroes[0].attacks[0];
 assert.equal(draft.defense,'自然防御');assert.match(draft.defenseReason,/缺少盾牌/);assert.equal(actual.defense,'盾牌格挡');assert.equal(actual.defenseCost,1);assert.deepEqual(g,before);
});
test('mental damage uses the configured magic/mental defense and never presents armor as protection',()=>{
 const c=adventureConfig('inquest'),a=c.heroes.find(h=>h.id==='a');a.defenses.magic='resist';const m=enemyThreatMap(c,'inquest_gate'),hero=m[0].heroes.find(h=>h.id==='a'),mental=hero.attacks.find(a=>a.type==='mental');
 assert.equal(mental.defense,'心智抵抗');assert.equal(mental.armor,null);assert.match(enemyThreatMapView(m),/护甲不参与此类伤害/);
});
test('dispel is conditional on real positive effects; an initially empty range is explicitly not a safety claim',()=>{
 const c=adventureConfig('scriptorium'),m=enemyThreatMap(c,'scriptorium_entry'),a=m[0].attacks.find(a=>a.skill==='unravel');assert.deepEqual(a.candidates,[]);
 assert.match(enemyThreatMapView(m),/空候选不表示安全/);
 const party=buildParty(c),foe={side:'enemy',pos:'rear'};party[0].effects=[{id:'test',skill:'ward',source:'d',stat:'defense',value:3,scope:'room',active:true}];
 assert.deepEqual(threatCandidates(foe,party,row('unravel','front')).map(h=>h.id),['a']);
});
test('round windows and alternative rows remain separate facts while branches retain an explicit boundary',()=>{
 const c=adventureConfig('clocktower'),m=enemyThreatMap(c,'clocktower_gate'),rows=m[0].attacks.filter(a=>a.source==='ctgb');assert.equal(rows.length,2);assert.deepEqual(rows[0].window,{from:3,to:24});assert.equal(rows[1].window,null);
 const view=enemyThreatMapView(m);assert.match(view,/第3–24回合/);assert.match(view,/不能相加为攻击次数/);m[0].attacks[2].window.from=9;assert.equal(roomsFor(c)[0].enemies[2].main[0].roundWindow.from,3);
 for(const route of ['chapter','harbor','foundry','courier'])assert.match(enemyThreatMapView(enemyThreatMap(adventureConfig(route))),/不预先决定实际分支/);
});
test('all routes map without random draws or mutations and leave complete deterministic battle reports unchanged',()=>{
 for(const a of ADVENTURES){const c=adventureConfig(a.id),before=clone(c),original=Math.random;try{Math.random=()=>{throw Error('unexpected random draw');};const maps=enemyThreatMap(c);assert.equal(maps.length,roomsFor(c).length);assert.ok(maps.every(m=>m.heroes.length===6));}finally{Math.random=original;}assert.deepEqual(c,before);}
 const c=adventureConfig('classic'),report=simulate(c);enemyThreatMapView(enemyThreatMap(c));assert.deepEqual(simulate(c),report);
 const m=enemyThreatMap(c,'gallery');m[0].heroes[0].name='<img src=x onerror=alert(1)>';assert.doesNotMatch(enemyThreatMapView(m),/<img/);
});
test('real guild edit preserves managed instructions and costs, then earns gear and paid training through two normal expeditions',()=>{
 const x=threatMapLoop();assert.equal(x.prepared.command.companions.d,'custom');assert.deepEqual(x.firstConfig.heroes.find(h=>h.id==='d').prep,[row('ward','front')]);assert.equal(x.initialGuild.command.companions.d,'ward');
 assert.deepEqual(x.before[0].attacks.find(a=>a.source==='c2').candidates,['c','d','f']);assert.deepEqual(x.after[0].attacks.find(a=>a.source==='c2').candidates,['c','f']);
 assert.equal(x.firstReport.won,true);assert.equal(x.secondReport.won,true);assert.deepEqual([x.desktop.gold,x.final.gold],[120,260]);assert.equal(x.desktop.members.find(h=>h.id==='d').training['defense:resist'],1);
 const attacks=x.firstReport.events.filter(e=>e.type==='attack'&&['c2','c3'].includes(e.actor));assert.ok(attacks.length);assert.ok(attacks.every(e=>!e.targets.includes('d')));validateGuild(x.final);
});
