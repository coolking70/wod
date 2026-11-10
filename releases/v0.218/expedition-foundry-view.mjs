import {FOUNDRY_ROOMS,FOUNDRY_CHANNEL,FOUNDRY_APPROACHES,FOUNDRY_PASSAGE_RULE,foundryApproach,validFoundryFlow} from './expedition-foundry.mjs';
import {HEROES,POS,SKILLS,clone,row} from './expedition-data.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function foundryPassageView(c){
 const selected=foundryApproach(c);
 const consequence=validFoundryFlow(c)?'<p>若第二场实际走潮渠，末房改为引流封库：护炉师把屏障从前排监工转到左翼自己。监工失去保护，但拆护炉师更难；无额外扣费或生命削减。实际回退回廊则保留原封库。</p>':'<p>当前保留原出口遭遇；载入新的铸库战术起点可使用通路引流出口。</p>';
 return `<section class="foundry-passage"><h3>第二场通路 · 出征前决定</h3>${consequence}<label>通路策略<select id="foundry-approach">${Object.entries(FOUNDRY_APPROACHES).map(([id,name])=>`<option value="${id}" ${selected===id?'selected':''}>${name}</option>`).join('')}</select></label><p>风箱回廊不收通路费用。冷却潮渠抵达时支付2符纸，不足则改走回廊；不会借用初始库存，也不占个人行动。</p><p>${esc(FOUNDRY_PASSAGE_RULE)}自动选路只执行这条规则，不保证更优。</p>${[FOUNDRY_ROOMS[1],FOUNDRY_CHANNEL].map(r=>`<details data-foundry-enemies="${r===FOUNDRY_CHANNEL?'channel':'bellows'}"><summary>${esc(r.name)} · ${r.enemies.length}名敌人</summary><p>${esc(r.note)}</p>${r.enemies.map(u=>`<p><b>${esc(u.name)}</b> · ${POS[u.pos]} · ${u.maxHp}生命 · ${Object.entries(u.resistances||{}).map(([type,n])=>({melee:'近战',ranged:'远程',magic:'法术'}[type])+(n>=0?'抗性':'弱点')+Math.abs(n)+'%').join(' / ')}<br><small>预备：${u.prep.map(r=>SKILLS[r.skill].name+' → '+(POS[r.target]||r.target)).join('；')||'无'}；普通：${u.main.map(r=>SKILLS[r.skill].name+' → '+(POS[r.target]||r.target)).join('；')}${u.healing.enabled?'；不高于65%时救护全队最低生命者':''}</small></p>`).join('')}</details>`).join('')}<button data-foundry-channel-plan>把本房草案改为群射中央、法术破前排</button><p class="muted">此按钮只修改本房射手/潮术师普通指令和学者屏障，不改站位、补给、资产或伙伴职责。两条通路共用“第二场”覆盖；自动选路时要兼顾回廊，托管伙伴请另行应用职责。潮渠费用也计入委托剩余材料条件。</p></section>`;
}
export function channelTactics(c){
 const next=clone(c);
 for(const h of next.heroes){const kind=HEROES.find(t=>t.id===h.id)?.classId,patch=kind==='ranger'?{main:[row('volley','center','once'),row('shot','center')]}:kind==='tidecaller'?{main:[row('lance','front','once'),row('spark','front')]}:kind==='scholar'?{prep:[row('ward','center','once')]}:null;if(patch)h.overrides.foundry_bellows={...h.overrides.foundry_bellows,...patch};}
 return next;
}
export function foundryEventView(e){
 const d=e.detail;
 if(d.kind==='vault')return `<img src="assets/foundry-v71.png" alt="锈潮铸库共用场景示意"><div><p class="eyebrow">锈潮铸库 / 探索结果</p><h2>引流封库</h2><p>${esc(d.reason)}</p><p>${esc(d.rule)}</p><p>屏障：前排监工 → 左翼护炉师自己；护炉师仍消耗自己的预备行动和符纸。共享补给没有净变化。</p><button data-foundry-source="${d.sourceEventId}">追溯第二场实际通路 →</button><small>这是进场时的敌方指令变化，实际施放及是否生效继续按普通技能规则执行。回放不再次改变战斗。</small></div>`;
 return `<img src="assets/foundry-v71.png" alt="锈潮铸库共用场景示意"><div><p class="eyebrow">锈潮铸库 / 已执行的通路</p><h2>${FOUNDRY_APPROACHES[d.chosen]}</h2><p>${esc(d.reason)}</p><p>预设：${FOUNDRY_APPROACHES[d.preference]}。${esc(d.rule)}</p><p>抵达时存活正式队员：${d.members.map(u=>esc(u.name)+' '+u.magic+'%').join('；')||'无'}（法术抗性）。</p><p>药草 ${d.suppliesBefore.herb} → ${d.suppliesAfter.herb}；符纸 ${d.suppliesBefore.rune} → ${d.suppliesAfter.rune}；箭矢 ${d.suppliesBefore.arrow} → ${d.suppliesAfter.arrow}。</p><small>整队通路费用单列，不消耗个人法力或行动；回放不会再次扣除物资。插画复用铸库场景，不表示独立潮渠插图。</small></div>`;
}
export function foundryEvidenceCells(d){if(d.kind==='vault')return [['探索结果','引流封库'],['前置事件',d.sourceEventId],['屏障位置','前排 → 左翼'],['变化规则',d.rule]];return [['通路',FOUNDRY_APPROACHES[d.chosen]],['预设',FOUNDRY_APPROACHES[d.preference]],['合格抗法队员',d.qualified],['抵达符纸 / 执行后',d.suppliesBefore.rune+' / '+d.suppliesAfter.rune],['原因',d.reason]];}
