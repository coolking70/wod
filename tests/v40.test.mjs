import test from 'node:test';
import assert from 'node:assert/strict';
import {GEAR,SLOTS,equipmentKit,validEquipment,equipmentTotals,replaceEquipment,gearSupports} from '../dist/expedition-equipment.mjs';
import {defaults,clone,row,HEROES} from '../dist/expedition-data.mjs';
import {newGuild,equip,assignLoot,guildConfig,depart,claim,validateGuild,historyConfig,historyReport,pendingReport} from '../dist/expedition-guild.mjs';
import {buildParty,current,resistanceOf,damageResult,validate,simulate,defenseProfile} from '../dist/expedition-engine.mjs';
import {equipmentPanel,equipmentImpact,equipmentSource} from '../dist/expedition-equipment-view.mjs';
import {configurationChanges} from '../dist/expedition-review.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
import {ROUTE_REWARDS,gearDifference,expeditionReward} from '../dist/expedition-loot.mjs';
import {commandHome} from '../dist/expedition-command-view.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';

test('三个部位独立，换甲不换武器饰品，购买仅扣一次且个人资产不共享',()=>{
 let g=newGuild();g.gold=180;const before=clone(g);g=equip(g,'a','saltseal');g=equip(g,'a','lightplate');g=equip(g,'a','plate');g=equip(g,'a','lightplate');
 assert.equal(g.gold,60);assert.deepEqual(g.members[0].gear,{weapon:'guardblade',armor:'lightplate',accessory:'saltseal'});assert.deepEqual(before.members[1],g.members[1]);assert.ok(!g.members[1].owned.includes('saltseal'));assert.deepEqual(before.members[0].gear,equipmentKit('plate'));validateGuild(g);
});
test('配置拒绝整套字符串、错槽、缺槽、额外槽、未拥有装备及伪造待结算快照',()=>{
 for(const gear of ['plate',{weapon:'plate',armor:'cloth',accessory:'token'},{weapon:'bow',armor:'cloth'},{...equipmentKit('bow'),extra:'token'}]){const c=defaults();c.heroes[0].gear=gear;assert.throws(()=>validate(c));}
 const g=newGuild();g.members[0].gear.accessory='saltseal';assert.throws(()=>validateGuild(g));const n=depart(newGuild(),defaults());n.pending.config.heroes[0].gear.armor='lightplate';assert.throws(()=>validateGuild(n));
});
test('只有武器类别满足技能，重甲或护袍本身不授予盾牌或法器能力',()=>{
 let gear=equipmentKit('plate');assert.ok(gearSupports(gear,'plate'));gear=replaceEquipment(gear,'bow');assert.ok(!gearSupports(gear,'plate'));assert.ok(gearSupports(gear,'bow'));assert.equal(gear.armor,'plate');
 assert.ok(!gearSupports('wardfocus','focus'));const c=defaults();c.heroes[0].gear=gear;const u=buildParty(c)[0];assert.equal(defenseProfile(u,'melee').skill,'natural');
 c.heroes[0].main=[row('shieldbash'),row('strike')];const r=simulate(c);assert.ok(r.events.some(e=>e.actor==='a'&&e.type==='skip'&&e.detail.reason==='装备条件不满足'));assert.ok(r.events.some(e=>e.actor==='a'&&e.type==='cast'&&e.detail.skill==='strike'));
});
test('多部位属性与抗性只加一次，容量使用穿戴后属性，替换不会留下旧加成',()=>{
 const c=defaults();c.heroes[2].gear={weapon:'focus',armor:'saltcloak',accessory:'echocharm'};let u=buildParty(c)[2];assert.equal(current(u,'int'),u.attrs.int+2);assert.equal(u.maxMp,20+2*current(u,'int')+current(u,'wil'));assert.equal(u.maxHp,50+4*current(u,'con'));assert.equal(current(u,'armor'),4);assert.equal(resistanceOf(u,'magic'),10);
 c.heroes[2].gear.accessory='saltseal';u=buildParty(c)[2];assert.equal(resistanceOf(u,'magic'),20);assert.equal(resistanceOf(u,'ranged'),0);assert.equal(damageResult(100,1,current(u,'armor'),resistanceOf(u,'magic')).damage,76);assert.equal(u.maxHp,50+4*u.attrs.con);
});
test('战利品分配仅消耗一个库存并替换同部位，待结算期间全资产锁定',()=>{
 let g=newGuild();g.warehouse.anchorseal=2;const before=clone(g.members[0].gear);g=assignLoot(g,'a','anchorseal');assert.equal(g.warehouse.anchorseal,1);assert.equal(g.members[0].gear.weapon,before.weapon);assert.equal(g.members[0].gear.armor,before.armor);assert.ok(g.members[0].owned.includes('token'));assert.throws(()=>assignLoot(g,'a','anchorseal'));g=assignLoot(g,'b','anchorseal');assert.equal(g.warehouse.anchorseal,0);g=depart(g,defaults());assert.throws(()=>equip(g,'a','token'));assert.throws(()=>assignLoot(g,'c','anchorseal'));
});
test('换装后历史按旧三部位重演，逐部位对比；重载和投影不修改快照',()=>{
 let g=depart(newGuild(),defaults());const report=pendingReport(g);g=claim(g);const snapshot=historyConfig(g,1);g.gold+=60;g=equip(g,'a','saltseal');assert.deepEqual(historyReport(g,1),report);const after=guildConfig(g,snapshot),changes=configurationChanges(snapshot,after);assert.equal(changes.length,1);assert.match(changes[0].label,/饰品/);assert.equal(changes[0].before,'公会徽记');assert.equal(changes[0].after,'盐晶护符');const restored=validateGuild(JSON.parse(JSON.stringify(g)));assert.deepEqual(guildConfig(restored,snapshot),after);after.heroes[0].gear.armor='cloth';assert.equal(g.members[0].gear.armor,'plate');
});
test('所有装备有唯一有效部位，掉落物有可读路线，同名装备没有随机属性实例',()=>{
 for(const [id,item] of Object.entries(GEAR)){assert.ok(Object.hasOwn(SLOTS,item.slot));assert.ok(validEquipment(equipmentKit(id)));assert.ok(equipmentSource(id));if(item.dungeonOnly)assert.ok(Object.values(ROUTE_REWARDS).some(r=>r.pool.includes(id)));}
 const report={won:true,config:{expedition:'archive',seed:3},rooms:[{won:true}]};const a=expeditionReward(report,{first:true,id:1}),b=expeditionReward(report,{first:true,id:9});assert.deepEqual(a.loot,b.loot);assert.equal(typeof a.loot[0],'string');assert.match(gearDifference(equipmentKit('plate'),'saltseal'),/法术抗性.*\+20/);
});
test('换武器提示默认与房间中的技能失效，换甲不错误报告失去格挡',()=>{
 const h=defaults().heroes[0];h.overrides.gallery={main:[row('shieldbash')]};assert.deepEqual(equipmentImpact(h,h.gear,'bow'),['盾缘重击：失去装备条件','盾牌格挡：失去装备条件']);assert.deepEqual(equipmentImpact(h,h.gear,'lightplate'),[]);
});
test('实际公会装备覆盖草稿，职责预设不覆盖三部位；所有目录视图可渲染',()=>{
 let g=selectHero(newGuild(),'a');g.gold=60;g=equip(g,'b','saltseal');g=setCompanion(g,'b','hunter');const c=defaults(),before=clone({g,c}),r=readiness(g,c);assert.equal(r.heroes[1].gear.accessory,'saltseal');assert.equal(r.heroes[1].gear.weapon,'bow');assert.ok(r.heroes[1].gearChanged);assert.ok(!r.heroes[0].gearChanged);assert.ok(commandHome(g,c).includes('卫士剑盾'));
 for(const filter of ['all','owned','shop'])for(const slot of ['all',...Object.keys(SLOTS)])assert.match(equipmentPanel(g,'a',filter,slot,c.heroes[0]),/阿瑟的装备/);assert.deepEqual({g,c},before);
});
test('实际战报记录穿戴抗性后的减伤与快照，不仅修改面板数值',()=>{
 const c=defaults();c.heroes[2].gear.accessory='saltseal';const r=simulate(c);const hit=r.events.find(e=>e.type==='attack'&&e.targets.includes('c')&&e.detail.attackType==='magic'&&e.detail.damage>0);assert.ok(hit);assert.equal(hit.detail.resistance,20);assert.equal(hit.detail.damage,Math.floor(hit.detail.afterArmor*.8));assert.equal(hit.units.find(u=>u.id==='c').resistances.magic,20);assert.ok(hit.detail.resistanceDelta>0);
});
