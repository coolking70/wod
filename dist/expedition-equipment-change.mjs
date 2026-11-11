import {GEAR,HEROES} from './expedition-data.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A local receipt for a completed equip call, never a transaction or saved asset.
export function equipmentChangeReceipt(before,after,heroId,gearId){
 const old=before.members.find(m=>m.id===heroId),next=after.members.find(m=>m.id===heroId),item=GEAR[gearId],hero=HEROES.find(h=>h.id===heroId);
 if(!old||!next||!hero||!Object.hasOwn(GEAR,gearId)||next.gear[item.slot]!==gearId||!next.owned.includes(gearId))throw Error('换装回执需要同一队员的实际装备结果');
 const cost=before.gold-after.gold;
 if(!Number.isSafeInteger(cost)||cost<0||!next.owned.includes(old.gear[item.slot]))throw Error('换装回执的金币或原装备结果无效');
 return {heroId,heroName:hero.name,gearId,gearName:item.name,previousGearName:GEAR[old.gear[item.slot]].name,purchased:!old.owned.includes(gearId),cost,goldBefore:before.gold,goldAfter:after.gold};
}
export function equipmentChangeView(receipt){
 if(!receipt)return '';
 return `<section class="equipment-change-receipt" role="status"><h3 id="equipment-change-heading" tabindex="-1">${receipt.purchased?'已购买并装备':'已换装'} · ${esc(receipt.gearName)}</h3><p>队员：${esc(receipt.heroName)}。本次消耗 ${esc(receipt.cost)} 金币；操作后金币 ${esc(receipt.goldBefore)} → ${esc(receipt.goldAfter)}。</p><p>原装备 ${esc(receipt.previousGearName)} 保留在此人的个人库；已持有装备之后可免费换回，不需再次购买。</p><button type="button" data-equipment-jump="overview">核对实际穿戴</button><small>这是刚才明确操作的回执；查看与筛选不会再购买、换装或分配。</small></section>`;
}
