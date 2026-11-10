import{GEAR}from'./expedition-data.mjs';
import{validateGuild}from'./expedition-guild.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A landing receipt reads an already claimed record. It never claims, equips,
// trains or invents an inventory delta from the current warehouse balance.
export function claimedRewardReceipt(g,id){
 validateGuild(g);if(!Number.isSafeInteger(id)||id<1)return null;const r=g.history.find(r=>r.id===id);if(!r)return null;
 const counts=new Map();for(const id of r.loot||[])counts.set(id,(counts.get(id)||0)+1);
 return{id:r.id,won:r.won,cleared:r.cleared,gold:r.gold,xp:r.xp,items:[...counts].map(([id,received])=>({id,name:GEAR[id].name,received,current:g.warehouse[id]||0}))};
}
export function claimedRewardView(receipt,{stale=false}={}){
 if(!receipt&&!stale)return'';
 if(stale)return'<section class="claimed-reward"><h2 id="claimed-reward-heading" tabindex="-1">收益回执来源已变化</h2><p>另一页面或整档恢复更新了公会，请重新进入查看当前库存；旧回执不用于分配。</p><button data-reward-dismiss=true>收起旧回执</button></section>';
 const r=receipt;return `<section class="claimed-reward" aria-labelledby="claimed-reward-heading"><h2 id="claimed-reward-heading" tabindex="-1">第${esc(r.id)}次收益已领取</h2><p>${r.won?'通关':'止步'} · 通过${esc(r.cleared)}场 · +${esc(r.gold)}金币 / 每位出战者 +${esc(r.xp)}经验</p>${r.items.length?`<p>以下遗物已进入共享仓库，尚未自动分配。定位只查看当前库存，接收者和配装仍由你决定。</p><ul>${r.items.map(i=>`<li><span>${esc(i.name)} · 本次入仓${esc(i.received)}件 · 当前仓库${esc(i.current)}件</span><button data-reward-find="${esc(i.id)}" ${i.current?'':'disabled'}>${i.current?'查看'+esc(i.name)+'库存':'当前仓库已用尽'}</button></li>`).join('')}</ul>`:'<p>本次没有遗物掉落。已到账的部分收益不代表通关；可从原报告复盘，再决定培养或改配。</p>'}<div class="bar"><button data-growth-history="${esc(r.id)}">复盘第${esc(r.id)}次报告</button><button data-reward-dismiss=true>收起回执</button></div></section>`;
}
