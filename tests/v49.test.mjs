import test from 'node:test';
import assert from 'node:assert/strict';
import {clone,defaults,SKILLS,HEROES} from '../dist/expedition-data.mjs';
import {simulate,validate,RULESET} from '../dist/expedition-engine.mjs';
import {HEALING_BLOCK_STAT,HEALING_BLOCK_REASON,activeHealingBlock} from '../dist/expedition-disruption.mjs';
import {healingDecision} from '../dist/expedition-healing.mjs';
import {BUILDS,applyBuild} from '../dist/expedition-builds.mjs';
import {personalReport} from '../dist/expedition-personal.mjs';
import {supportFrame} from '../dist/expedition-support.mjs';
import {stageFrame,replaySteps} from '../dist/expedition-stage.mjs';
import {groupActions} from '../dist/expedition-report.mjs';
import {highlightedSteps} from '../dist/expedition-highlights.mjs';
import {disruptionFixture} from '../scripts/disruption-cases.mjs';
import {hospiceConfig} from '../dist/expedition-data.mjs';
import {newGuild} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
import {companionPreview} from '../dist/expedition-command-preview.mjs';
const run=kind=>{const f=disruptionFixture(kind);return simulate(f.config,f.options);};
const effects=r=>r.events.filter(e=>e.type==='effect'&&e.detail.stat===HEALING_BLOCK_STAT);
const blocked=r=>r.events.filter(e=>e.type==='skip'&&e.detail.healingBlock);

test('截疗符为两名学者的可选基础攻击，默认配置不启用，规则标记升级',()=>{
 assert.equal(RULESET,'original-wod-inspired-0.56.0');assert.equal(SKILLS.suppress.cost,6);assert.equal(SKILLS.suppress.item,'rune');
 assert.ok(HEROES.filter(h=>h.classId==='scholar').every(h=>h.skills.includes('suppress')));
 assert.ok(defaults().heroes.every(h=>!h.main.some(r=>r.skill==='suppress')));
 for(const id of ['d','mira'])assert.ok(BUILDS[id].some(b=>b.id==='suppress'));
 validate(applyBuild(defaults(),'d','suppress'));
});

test('先命中时禁疗只阻止自动救护，保留普通行动，不支付救护费用',()=>{
 const r=run('early'),effect=effects(r)[0],skip=blocked(r)[0],cast=r.events.find(e=>e.type==='cast'&&e.detail.skill==='suppress');
 assert.ok(effect&&skip);assert.equal(skip.detail.reason,HEALING_BLOCK_REASON);assert.equal(skip.detail.cost,0);assert.equal(skip.detail.consumedAction,false);
 assert.equal(skip.detail.healingBlock.effectId,effect.detail.effectId);assert.equal(skip.detail.healingBlock.source,'d');assert.ok(effect.id<skip.id);
 assert.equal(cast.detail.mpBefore-cast.detail.mpAfter,6);assert.equal(r.supplies.rune,9);
 assert.equal(r.events.filter(e=>e.type==='heal').length,0);
 const fallback=r.events.find(e=>e.actor==='medic'&&e.type==='wait');assert.ok(fallback);assert.equal(fallback.detail.healingDecision.status,'blocked');
 assert.ok(!r.events.some(e=>e.actor==='medic'&&e.type==='failed'));
});

test('晚于药师行动的命中不会撤销已经完成的救护，也不伪造受阻次数',()=>{
 const r=run('late'),heal=r.events.find(e=>e.type==='heal'),effect=effects(r)[0];assert.ok(heal.id<effect.id);assert.ok(heal.detail.actual>0);assert.equal(blocked(r).length,0);
 const p=personalReport(r,'d');assert.equal(p.total.controlApplications,1);assert.equal(p.total.healingBlocks,0);
});

test('闪避不附着禁疗；实际伤害被护甲吸收仍可附着',()=>{
 const miss=run('miss');assert.ok(miss.events.some(e=>e.type==='attack'&&e.actor==='d'&&e.detail.grade==='闪避'));assert.equal(effects(miss).length,0);assert.equal(blocked(miss).length,0);assert.ok(miss.events.some(e=>e.type==='heal'));
 const absorbed=run('absorbed');assert.ok(absorbed.events.some(e=>e.type==='attack'&&e.actor==='d'&&e.detail.grade!=='闪避'&&e.detail.actual===0));assert.equal(effects(absorbed).length,1);assert.equal(blocked(absorbed).length,1);
});

test('目标倒下或没有救护能力时不附着，不把死亡造成的无治疗算成禁疗收益',()=>{
 for(const kind of ['dead','nonHealer']){const r=run(kind);assert.equal(effects(r).length,0);assert.equal(blocked(r).length,0);assert.equal(personalReport(r,'d').total.controlApplications,0);}
});

test('禁疗在本回合结束时消失，下一回合可以正常救护',()=>{
 const r=run('expiry');assert.equal(effects(r).length,1);assert.ok(blocked(r).some(e=>e.round===1));assert.ok(!blocked(r).some(e=>e.round===2));assert.ok(r.events.some(e=>e.type==='heal'&&e.round===2));
 assert.ok(r.events.some(e=>e.type==='expire'&&e.detail.stat===HEALING_BLOCK_STAT&&e.round===1));assert.ok(r.party.every(u=>!activeHealingBlock(u)));
});

test('同回合两学者命中不叠加或刷新，仍各自付攻击费用，受阻来源保持第一次命中',()=>{
 const r=run('double'),all=effects(r);assert.equal(all.length,1);assert.equal(r.events.filter(e=>e.type==='cast'&&e.detail.skill==='suppress').length,2);assert.equal(r.supplies.rune,8);
 assert.equal(blocked(r)[0].detail.healingBlock.source,all[0].actor);assert.equal(blocked(r)[0].detail.healingBlock.effectId,all[0].detail.effectId);
});

test('缺法力、缺符纸或装备不符时不附着，继续低耗后备而非额外赠送控制',()=>{
 for(const kind of ['mana','rune','gear']){
  const f=disruptionFixture('early'),caster=f.options.party.find(u=>u.id==='d');
  if(kind==='mana')caster.mp=caster.maxMp=4;if(kind==='rune')f.config.supplies.rune=0;if(kind==='gear')caster.gear={weapon:'starterblade',armor:'field',accessory:'guildseal'};
  const r=simulate(f.config,f.options);assert.equal(effects(r).length,0);assert.equal(blocked(r).length,0);assert.ok(r.events.some(e=>e.type==='cast'&&e.actor==='d'&&e.detail.skill==='spark'));
  assert.ok(r.events.some(e=>e.type==='skip'&&e.actor==='d'&&e.detail.skill==='suppress'));
 }
});

test('截疗符遵守港口符纸预留，受限时使用微光后备',()=>{
 const f=disruptionFixture('early');f.config.expedition='harbor';f.config.harbor={pass:'upper',task:'seal',difficulty:'normal',reserve:'seal'};f.config.supplies.rune=2;
 const r=simulate(f.config,f.options),skip=r.events.find(e=>e.actor==='d'&&e.type==='skip'&&e.detail.skill==='suppress');
 assert.equal(skip.detail.reservation.floor,2);assert.equal(r.supplies.rune,2);assert.ok(r.events.some(e=>e.type==='cast'&&e.actor==='d'&&e.detail.skill==='spark'));assert.equal(effects(r).length,0);
});

test('新职责预览不购买装备或训练，公会实际配置只应用已有资产与技能专修',()=>{
 const original=selectHero(newGuild(),'c'),config=hospiceConfig('front'),before=clone({original,config}),preview=companionPreview(original,config,'d','suppress','cistern');
 const command=preview.rows.find(r=>r.skill==='suppress');assert.equal(command.cost,6);assert.equal(command.item,'rune');assert.ok(command.candidates.length);assert.equal(companionPreview(original,config,'d','suppress','gallery').rows.find(r=>r.skill==='suppress').candidates.length,0);
 const g=setCompanion(original,'d','suppress'),r=readiness(g,config);assert.equal(r.canDepart,true);assert.equal(r.config.heroes.find(h=>h.id==='d').trained,'suppress');assert.deepEqual(r.config.heroes.find(h=>h.id==='d').training,{});
 assert.equal(g.gold,original.gold);assert.deepEqual(g.members,original.members);assert.deepEqual({original,config},before);
});

test('敌我使用相同截疗与救护限制，玩家药师仍执行普通攻击',()=>{
 const r=run('enemy');assert.equal(effects(r)[0].actor,'medic');assert.deepEqual(effects(r)[0].targets,['f']);assert.equal(blocked(r)[0].actor,'f');
 const fallback=r.events.find(e=>e.type==='cast'&&e.actor==='f');assert.equal(fallback.detail.skill,'shot');assert.equal(fallback.detail.healingDecision.status,'blocked');assert.ok(personalReport(r,'f').evidence.some(e=>e.kind==='本人救护受阻'));
});

test('道具优先级保留，使用药瓶的行动不伪装成尝试救护受阻',()=>{
 const r=run('item');assert.equal(effects(r).length,1);assert.equal(blocked(r).length,0);const item=r.events.find(e=>e.actor==='f'&&e.type==='item');assert.ok(item);assert.equal(item.detail.healingDecision.status,'item_priority');
 assert.ok(!r.events.some(e=>e.actor==='f'&&e.type==='heal'));
});

test('禁疗只限制草药救护，不阻止自用救急药匣，敌方施法不扣玩家符纸',()=>{
 const f=disruptionFixture('enemy'),hero=f.config.heroes.find(h=>h.id==='f'),unit=f.options.party.find(u=>u.id==='f');
 hero.item='salve';hero.itemPolicy={enabled:true,threshold:.7};unit.item='salve';unit.itemInstance={id:'f:salve',kind:'salve',remaining:2};
 const r=simulate(f.config,f.options),item=r.events.find(e=>e.actor==='f'&&e.type==='item');
 assert.ok(item);assert.equal(item.detail.resource,'hp');assert.equal(item.detail.actual,40);assert.equal(item.detail.healingDecision.status,'item_priority');assert.equal(blocked(r).length,0);assert.equal(r.supplies.rune,10);
});

test('未启用治疗或未达到阈值时不伪造受阻尝试，诊断与实际门槛一致',()=>{
 const f=disruptionFixture('enemy'),r=simulate(f.config,f.options),effect=effects(r)[0],u=clone(r.events.find(e=>e.id===effect.id).units.find(u=>u.id==='f'));
 const actor={...f.options.party.find(u=>u.id==='f'),effects:clone(u.effects)};
 actor.healing.enabled=false;assert.equal(healingDecision(actor,[actor],{herb:0}).status,'disabled');
 actor.healing.enabled=true;actor.hp=actor.maxHp;assert.equal(healingDecision(actor,[actor],{herb:0}).status,'no_target');
 actor.hp=850;assert.equal(healingDecision(actor,[actor],{herb:0}).status,'threshold');
 actor.hp=500;actor.mp=0;assert.equal(healingDecision(actor,[actor],{herb:0}).status,'blocked');
});

test('有害效果与增益统计分离，实际受阻次数来自skip记录，不从附着推算',()=>{
 const r=run('early'),p=personalReport(r,'d');assert.equal(p.total.buffApplications,0);assert.equal(p.total.controlApplications,1);assert.equal(p.total.healingBlocks,1);assert.deepEqual(p.given,[]);
 const group=groupActions(r.events).find(g=>g.events.some(e=>e.detail.harmful)),frame=stageFrame(group),support=supportFrame(group);
 assert.ok(frame.cues.some(c=>c.kind==='control'&&c.text==='禁疗'));assert.ok(frame.links.some(l=>l.kind==='control'));assert.ok(support.harmfulRecipients.includes('medic'));assert.equal(support.counts.medic.harmful,1);assert.equal(support.counts.medic.active,0);
 assert.equal(support.changes.find(c=>c.harmful).state,'禁疗已附着');
});

test('救护受阻事件保留精选/完整导航，状态来源ID可精确定位且回放不改战果',()=>{
 const r=run('early'),before=clone(r),skip=blocked(r)[0],effect=effects(r)[0];
 assert.ok(replaySteps(r.events).some(g=>g.events.some(e=>e.id===skip.id)));assert.ok(highlightedSteps(r.events).some(g=>g.events.some(e=>e.id===skip.id)));
 assert.equal(skip.detail.healingBlock.effectId,effect.detail.effectId);for(const g of groupActions(r.events)){stageFrame(g);supportFrame(g);}assert.deepEqual(r,before);
 const f=disruptionFixture('early');assert.deepEqual(simulate(f.config,f.options),r);
});
