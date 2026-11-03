import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,clone,HEROES,roomsFor} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {personalReport} from '../dist/expedition-personal.mjs';
import {companionPreview} from '../dist/expedition-command-preview.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {newGuild,depart,pendingReport,claim,historyReport} from '../dist/expedition-guild.mjs';
test('个人实伤、治疗、逐房合计与战报一致，统计不修改记录',()=>{
 const report=simulate(defaults()),before=JSON.stringify(report);
 for(const h of report.config.heroes){const p=personalReport(report,h.id);assert.equal(p.total.damage,report.stats[h.id].actual);assert.equal(p.total.healing,report.stats[h.id].healing);assert.equal(p.total.failed,report.stats[h.id].failed);for(const key of Object.keys(p.total))assert.equal(p.rooms.reduce((n,r)=>n+r[key],0),p.total[key]);for(const e of p.evidence)assert.ok(report.events[e.index]);}
 assert.equal(JSON.stringify(report),before);
});
test('多组件增益不重复计数，召唤物伤害不并入本人，支付与自然恢复分离',()=>{
 const units=[{id:'a',owner:null},{id:'b',owner:null},{id:'s',owner:'a'}],base={roomIndex:0,round:1,units};
 const data=[['cast','a',['b'],{mpBefore:20,mpAfter:15}],['effect','a',['b'],{cast:1,skill:'guard'}],['effect','a',['b'],{cast:1,skill:'guard'}],['attack','s',['enemy'],{actual:17}],['attack','a',['enemy'],{actual:9}],['heal','b',['a'],{actual:8}],['defend','a',['enemy'],{mpBefore:15,mpAfter:13}],['regen','a',[],{before:13,after:14}],['skip','a',[],{skill:'strike',reason:'法力不足'}]];
 const report={config:{supplies:{herb:2,rune:3,arrow:4}},rooms:[{name:'test'}],events:data.map(([type,actor,targets,detail],i)=>({...base,id:i+1,type,actor,targets,detail,text:type,supplies:{herb:2,rune:3,arrow:3}}))};
 const p=personalReport(report,'a');assert.equal(p.total.buffApplications,1);assert.equal(p.given[0].buffs,1);assert.equal(p.total.damage,9);assert.equal(p.total.summonDamage,17);assert.equal(p.total.castMana,5);assert.equal(p.total.defenseMana,2);assert.equal(p.received[0].healing,8);assert.equal(p.supplies.arrow,1);assert.equal(p.total.failed,0);assert.equal(p.issues[0].count,1);
});
test('支援预览使用真实站位，候选模式不保存职责或消耗资产',()=>{
 const g=selectHero(newGuild(),'c'),c=defaults(),before=JSON.stringify({g,c}),room=roomsFor(c)[0].id;
 const ward=companionPreview(g,c,'d','ward',room),seal=companionPreview(g,c,'d','seal',room);
 assert.deepEqual(ward.rows[0].candidates,['阿瑟']);assert.ok(seal.rows[0].candidates.includes('伊芙'));assert.equal(JSON.stringify({g,c}),before);
 assert.throws(()=>companionPreview(g,c,'c','surge',room));assert.throws(()=>companionPreview(g,c,'d','ward','missing'));
});
test('职责目标不存在时明确提示，候选不伪装成必定命中',()=>{
 const c=defaults(),g=selectHero(newGuild(),'c'),p=companionPreview(g,c,'b','hunter');
 assert.equal(p.rows[0].candidates.length,0);assert.ok(p.rows[0].warnings.some(w=>w.includes('无此目标')));assert.ok(p.rows[2].candidates.length>1);
});
test('出征保存主角身份，领取后切换主角不改变历史身份或战术',()=>{
 const g=setCompanion(selectHero(newGuild(),'c'),'b','hunter'),pending=depart(g,defaults()),r=pendingReport(pending);
 assert.equal(r.perspective.heroId,'c');assert.equal(r.perspective.companions.b,'hunter');
 const next=selectHero(claim(pending),'a'),history=historyReport(next,1);assert.equal(history.perspective.heroId,'c');assert.deepEqual(history.config,r.config);assert.equal(next.command.heroId,'a');
});

test('个人回放保留完整支援行动、召唤物行动与房间边界，排除无关攻击',async()=>{
 const {personalSteps}=await import('../dist/expedition-personal.mjs');
 const group=(type,actor,targets,units=[])=>({events:[{type,actor,targets,units}]});
 const all=[group('room',null,[]),group('attack','b',['enemy']),group('effect','e',['a','b']),group('attack','s',['enemy'],[{id:'s',owner:'a'}]),group('victory',null,[])];
 const before=clone(all);assert.deepEqual(personalSteps(all,'a'),[all[0],all[2],all[3],all[4]]);assert.deepEqual(all,before);
});
