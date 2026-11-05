import test from 'node:test';import assert from 'node:assert/strict';
import {configurationUndo,restoreConfigurationUndo,commitPreparationChange} from '../dist/expedition-config-undo.mjs';
import {customizeForEditing} from '../dist/expedition-readiness.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {guildConfig,train,equip,depart,claim,validateGuild} from '../dist/expedition-guild.mjs';
import {swapCompanion} from '../dist/expedition-roster.mjs';
import {historyTacticPreview,reuseHistoryTactic} from '../dist/expedition-tactic-reuse.mjs';
import {installAdvanced} from '../dist/expedition-growth.mjs';
import {seerGuild} from '../scripts/seer-cases.mjs';
import {crossRouteProfiles} from '../scripts/cross-route-cases.mjs';
import {hospiceConfig,clone,row} from '../dist/expedition-data.mjs';
const setup=()=>({g:setCompanion(seerGuild(),'d','seer'),c:hospiceConfig('front')});

test('编辑实际队员后撤销恢复原托管职责和完整配置，资产与输入不回滚',()=>{
 const {g,c}=setup();c.heroes.find(h=>h.id==='d').overrides.cistern={pos:'left',main:[row('spark','rear')]};
 const original=clone({g,c}),edit=customizeForEditing(g,c,'d','cistern'),undo=configurationUndo(c,g,edit.guild);
 edit.config.heroes.find(h=>h.id==='d').overrides.cistern.main=[row('wait')];
 const restored=restoreConfigurationUndo(edit.guild,undo);
 assert.equal(restored.guild.command.companions.d,'seer');assert.deepEqual(restored.config,c);
 assert.deepEqual(guildConfig(restored.guild,restored.config),guildConfig(g,c));assert.deepEqual(restored.guild.members,g.members);assert.deepEqual({g,c},original);
 assert.deepEqual(Object.keys(undo),['config','roles']);assert.deepEqual(Object.keys(undo.roles),['heroId','lineup','next','changes']);
 restored.config.heroes[0].prep=[];restored.guild.members[0].xp=0;assert.deepEqual({g,c},original);assert.deepEqual(undo.config,c);
});
test('撤销只恢复涉及伙伴的职责，期间训练装备和其他伙伴选择仍采用当前资产',()=>{
 const {g,c}=setup(),edit=customizeForEditing(g,c,'d'),undo=configurationUndo(c,g,edit.guild);
 let current=train(edit.guild,'d','skill:ward');current=equip(current,'d','lightplate');current=setCompanion(current,'f','medic');
 const original=clone(current),restored=restoreConfigurationUndo(current,undo);
 assert.equal(restored.guild.command.companions.d,'seer');assert.equal(restored.guild.command.companions.f,'medic');
 assert.deepEqual(restored.guild.members,current.members);assert.equal(restored.guild.gold,current.gold);assert.deepEqual(restored.guild.history,current.history);assert.deepEqual(restored.guild.warehouse,current.warehouse);
 const actual=guildConfig(restored.guild,restored.config).heroes.find(h=>h.id==='d'),member=current.members.find(m=>m.id==='d');assert.deepEqual(actual.training,member.training);assert.deepEqual(actual.gear,member.gear);assert.deepEqual(current,original);
});
test('历史单人战术复用可恢复原实际职责且不改变历史与候补成长',()=>{
 const c=hospiceConfig('front'),g=swapCompanion(crossRouteProfiles().trained,c,'d','mira'),p=historyTacticPreview(g,c,{historyId:2,sourceId:'d',targetId:'mira'}),edit=reuseHistoryTactic(g,c,p),undo=configurationUndo(c,g,edit.guild),restored=restoreConfigurationUndo(edit.guild,undo);
 assert.equal(edit.guild.command.companions.mira,'custom');assert.equal(restored.guild.command.companions.mira,g.command.companions.mira);assert.deepEqual(restored.config,c);assert.deepEqual(guildConfig(restored.guild,restored.config),guildConfig(g,c));assert.deepEqual(restored.guild.history,g.history);assert.deepEqual(restored.guild.members,g.members);
});
test('高阶指令安装撤销恢复托管，永久课程仍已学习；本来是自定义时只恢复配置',()=>{
 const {g,c}=setup(),edit=customizeForEditing(g,c,'d'),installed=installAdvanced(edit.config,'d','foresight'),undo=configurationUndo(c,g,edit.guild);
 assert.equal(installed.heroes.find(h=>h.id==='d').prep[0].skill,'foresight');const restored=restoreConfigurationUndo(edit.guild,undo);assert.equal(restored.guild.command.companions.d,'seer');assert.deepEqual(restored.guild.members,g.members);assert.deepEqual(restored.config,c);
 const own=customizeForEditing(g,c,g.command.heroId),plain=configurationUndo(c,g,own.guild);assert.equal(plain.roles,null);assert.equal(restoreConfigurationUndo(depart(g,c),plain).guild,null);assert.deepEqual(restoreConfigurationUndo(null,configurationUndo(c)).config,c);
});
test('涉及职责已另行修改时整次撤销拒绝，不消费或改写快照与当前数据',()=>{
 const {g,c}=setup(),edit=customizeForEditing(g,c,'d'),undo=configurationUndo(c,g,edit.guild),current=setCompanion(edit.guild,'d','measured'),before=clone({current,undo});
 assert.throws(()=>restoreConfigurationUndo(current,undo),/职责已另行调整/);assert.deepEqual({current,undo},before);
 const retried=restoreConfigurationUndo(edit.guild,undo);assert.equal(retried.guild.command.companions.d,'seer');
});
test('待结算、新出征或主角变更拒绝恢复旧职责；普通配置撤销不动公会',()=>{
 const {g,c}=setup(),edit=customizeForEditing(g,c,'d'),undo=configurationUndo(c,g,edit.guild),pending=depart(edit.guild,edit.config),before=clone({pending,undo});
 assert.throws(()=>restoreConfigurationUndo(pending,undo),/领取/);assert.throws(()=>restoreConfigurationUndo(claim(pending),undo),/新的远征/);assert.throws(()=>restoreConfigurationUndo(selectHero(edit.guild,'a'),undo),/主角或出战队伍/);assert.deepEqual({pending,undo},before);
 const recruited=crossRouteProfiles().trained,swapped=swapCompanion(recruited,c,'d','mira'),edited=customizeForEditing(swapped,c,'mira'),record=configurationUndo(c,swapped,edited.guild),changed=swapCompanion(edited.guild,edited.config,'mira','d');assert.throws(()=>restoreConfigurationUndo(changed,record),/主角或出战队伍/);
});
test('原缺省职责精确恢复缺省，多伙伴变化可撤回且不附带公会资产快照',()=>{
 const {g,c}=setup();delete g.command.companions.f;validateGuild(g);const after=setCompanion(setCompanion(g,'d','custom'),'f','custom'),undo=configurationUndo(c,g,after),restored=restoreConfigurationUndo(after,undo);
 assert.equal(undo.roles.changes.length,2);assert.equal(Object.hasOwn(restored.guild.command.companions,'f'),false);assert.deepEqual(restored.guild,g);assert.equal(JSON.stringify(undo.roles).includes('members'),false);
});
test('撤销记录不能把消费或出征伪装成伙伴职责变化，无职责状态仍可记录普通配置',()=>{
 const {g,c}=setup();assert.throws(()=>configurationUndo(c,g,train(g,'d','skill:ward')),/只能附带/);assert.throws(()=>configurationUndo(c,g,depart(g,c)),/只能附带/);
 const plain=clone(g);delete plain.command;assert.equal(configurationUndo(c,plain,plain).roles,null);const record=configurationUndo(c);record.config.heroes[0].main=[];assert.notDeepEqual(record.config,c);
});

function storageCase(){const {g,c}=setup(),edit=customizeForEditing(g,c,'d'),data=new Map([['config',JSON.stringify(c)],['guild',JSON.stringify(g)]]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},request={configKey:'config',guildKey:'guild',expectedConfig:data.get('config'),expectedGuild:data.get('guild'),config:edit.config,guild:edit.guild};return {g,c,edit,data,storage,request};}
test('配置与职责共同保存成功后可成对撤销，存储中仍仅改变配置和伙伴职责',()=>{
 const {g,c,edit,data,storage,request}=storageCase(),undo=configurationUndo(c,g,edit.guild),saved=commitPreparationChange(storage,request);assert.deepEqual(JSON.parse(data.get('config')),edit.config);assert.deepEqual(JSON.parse(saved.guildRaw).members,g.members);
 const restored=restoreConfigurationUndo(edit.guild,undo);commitPreparationChange(storage,{...request,expectedConfig:data.get('config'),expectedGuild:data.get('guild'),...restored});assert.deepEqual(JSON.parse(data.get('config')),c);assert.deepEqual(JSON.parse(data.get('guild')),g);
});
test('配置先写失败不更改公会；公会后写失败回退已写配置，可重试而不留半完成职责',()=>{
 for(const failedKey of ['config','guild']){const x=storageCase(),before=[...x.data],normal=x.storage.setItem;let failed=false;x.storage.setItem=(key,value)=>{if(key===failedKey&&!failed){failed=true;throw Error('模拟存储空间不足');}normal(key,value);};assert.throws(()=>commitPreparationChange(x.storage,x.request),failedKey==='config'?/准备配置保存失败/:/准备配置已回退/);assert.deepEqual([...x.data],before);assert.deepEqual(commitPreparationChange(x.storage,x.request).guildRaw,JSON.stringify(x.edit.guild));}
});
test('任一存储已被另一页面更新时拒绝共同保存，保留另一页面和当前草稿',()=>{
 for(const key of ['config','guild']){const x=storageCase();x.data.set(key,'另一页面值');const before=[...x.data];assert.throws(()=>commitPreparationChange(x.storage,x.request),/另一页面已修改/);assert.deepEqual([...x.data],before);}
});
test('回退本身也失败时明确报告未恢复，不谎称共同保存成功',()=>{
 const x=storageCase();let writes=0;x.storage.setItem=(key,value)=>{if(++writes>1)throw Error('模拟所有后续写入失败');x.data.set(key,value);};assert.throws(()=>commitPreparationChange(x.storage,x.request),/准备配置回退也失败/);assert.equal(x.data.get('guild'),x.request.expectedGuild);assert.deepEqual(JSON.parse(x.data.get('config')),x.edit.config);
});
