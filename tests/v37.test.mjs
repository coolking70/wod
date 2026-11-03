import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,clone,roomsFor} from '../dist/expedition-data.mjs';
import {newGuild,guildConfig,depart,validateGuild} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion,commandConfig} from '../dist/expedition-command.mjs';
import {readiness} from '../dist/expedition-readiness.mjs';
test('主角选择保留个人资产，职责控制不越权修改主角',()=>{
 const g=newGuild(),before=clone(g),n=selectHero(g,'c');assert.deepEqual(g,before);assert.deepEqual(n.members,g.members);
 assert.throws(()=>setCompanion(n,'c','surge'));assert.throws(()=>setCompanion(n,'b','invalid'));
 const c=defaults(),out=commandConfig(setCompanion(n,'b','hunter'),c);assert.deepEqual(out.heroes[2],c.heroes[2]);assert.deepEqual(c,defaults());
});
test('伙伴职责保持实际装备训练，核对与出征指令一致，切回自定义恢复草稿',()=>{
 const draft=defaults(),roomId=roomsFor(draft)[0].id;draft.heroes[1].overrides[roomId]={main:[{skill:'shot',target:'front',mode:'repeat'}],pos:'left'};
 const g=setCompanion(selectHero(newGuild(),'c'),'b','hunter');const actual=guildConfig(g,draft),h=actual.heroes[1];
 assert.deepEqual(h.gear,g.members[1].gear);assert.deepEqual(h.training,g.members[1].training);assert.equal(h.trained,'pierce');assert.equal(h.overrides[roomId].main,undefined);assert.equal(h.overrides[roomId].pos,'left');
 assert.deepEqual(readiness(g,draft).heroes[1].plan.main,h.main);assert.deepEqual(depart(g,draft).pending.config.heroes,actual.heroes);
 assert.deepEqual(commandConfig(setCompanion(g,'b','custom'),draft),draft);
});
test('主角切换与待结算保护，非法职责备份被拒绝',()=>{
 const g=setCompanion(selectHero(newGuild(),'c'),'b','hunter'),switched=selectHero(g,'b');assert.equal(switched.command.companions.b,undefined);assert.equal(switched.command.companions.c,'custom');validateGuild(switched);
 const pending=depart(g,defaults());assert.throws(()=>selectHero(pending,'a'));assert.throws(()=>setCompanion(pending,'b','custom'));
 const broken=clone(g);broken.command.companions.z='custom';assert.throws(()=>validateGuild(broken));
});
