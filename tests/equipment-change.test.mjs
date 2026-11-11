import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeArmorLoop} from '../scripts/grade-armor-cases.mjs';
import {equip,guildConfig} from '../dist/expedition-guild.mjs';
import {equipmentChangeReceipt,equipmentChangeView} from '../dist/expedition-equipment-change.mjs';
import {equipmentPanel} from '../dist/expedition-equipment-view.mjs';
const x=gradeArmorLoop();
test('earned purchase receipt identifies the genuine recipient, paid delta and retained old coat',()=>{
 const r=equipmentChangeReceipt(x.start,x.purchasedA,'a','lamellarcoat');
 assert.deepEqual(r,{heroId:'a',heroName:'阿瑟',gearId:'lamellarcoat',gearName:'层潮叠甲',previousGearName:'铁壁重甲',purchased:true,cost:60,goldBefore:x.start.gold,goldAfter:x.start.gold-60});
 assert.match(equipmentChangeView(r),/已购买并装备 · 层潮叠甲/);
 assert.match(equipmentChangeView(r),/本次消耗 60 金币/);
});
test('free return to a retained owned item reports zero and keeps the new purchase owned',()=>{
 const next=equip(x.purchasedA,'a','plate'),r=equipmentChangeReceipt(x.purchasedA,next,'a','plate');
 assert.equal(r.purchased,false);assert.equal(r.cost,0);assert.equal(r.goldBefore,r.goldAfter);
 assert.match(equipmentChangeView(r),/已换装 · 铁壁重甲/);assert.match(equipmentChangeView(r),/本次消耗 0 金币/);
 assert.ok(next.members.find(m=>m.id==='a').owned.includes('lamellarcoat'));
});
test('receipt for another paid hero comes from that hero rather than the selected player identity',()=>{
 const r=equipmentChangeReceipt(x.purchasedA,x.purchased,'d','deepweave');
 assert.equal(r.heroName,'维斯');assert.equal(r.gearName,'深潮织袍');assert.equal(r.cost,60);
 assert.equal(x.purchased.command.heroId,x.start.command.heroId);
});
test('a receipt cannot certify an unchanged, other-member or unknown equipment result',()=>{
 for(const [before,after,id,item]of[[x.start,x.start,'a','lamellarcoat'],[x.start,x.purchasedA,'d','lamellarcoat'],[x.start,x.purchasedA,'a','__proto__'],[x.start,x.purchasedA,'unknown','lamellarcoat']])assert.throws(()=>equipmentChangeReceipt(before,after,id,item));
 const forged=structuredClone(x.purchasedA);forged.gold=x.start.gold+1;assert.throws(()=>equipmentChangeReceipt(x.start,forged,'a','lamellarcoat'),/金币/);
});
test('reading a receipt does not mutate either exact guild snapshot or simulate another expedition',()=>{
 const before=JSON.stringify(x.start),after=JSON.stringify(x.purchasedA);
 equipmentChangeView(equipmentChangeReceipt(x.start,x.purchasedA,'a','lamellarcoat'));
 assert.equal(JSON.stringify(x.start),before);assert.equal(JSON.stringify(x.purchasedA),after);
});
test('an absent receipt adds no false success status, and supplied strings are escaped including numeric-looking fields',()=>{
 assert.equal(equipmentChangeView(null),'');
 const h=equipmentChangeView({purchased:true,gearName:'<img src=x onerror=bad>',heroName:'<svg onload=bad>',previousGearName:'<button data-equip=x>',cost:'<b>60</b>',goldBefore:'"&',goldAfter:'<iframe>'});
 assert.doesNotMatch(h,/<img|<svg|<iframe|<b>|<button data-equip=/);assert.match(h,/&lt;b&gt;60&lt;\/b&gt;/);assert.match(h,/&quot;&amp;/);
});
test('shop filtering can remove the bought card while retaining its receipt before the remaining catalogue',()=>{
 const plan=guildConfig(x.purchasedA,x.config).heroes.find(h=>h.id==='a'),r=equipmentChangeReceipt(x.start,x.purchasedA,'a','lamellarcoat');
 const h=equipmentPanel(x.purchasedA,'a','shop','armor',plan,null,null,'','all',r);
 assert.doesNotMatch(h,/data-catalog-gear="lamellarcoat"/);assert.match(h,/id="equipment-change-heading"/);
 assert.ok(h.indexOf('equipment-change-heading')<h.indexOf('id="gear-filter"'));
 assert.match(h,/抗性按伤害通道结算/);
});
