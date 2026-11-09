// Original encounter dependency. This does not turn ordinary skill buffs into auras.
export const WARD_RULE='项目原创护壁：公开的存活机关持续为指定同波守军提供固定护甲，不是可驱散技能增益，也不占行动、法力或材料。只能按原规则拆解机关；机关耐久归零后立即解除该来源的护壁，其他机关和普通增益保持。解除只改变之后的受击，不回滚旧伤害，不换算避免或额外伤害，不打断既定队列；心理伤害仍按既有规则不采用护甲。全部机关和生物都须清除才算过房，没有额外拆解奖励。数值、关联和遭遇均为本项目设计。';
export function validateWardLinks(units){
 if(!units.some(u=>Object.hasOwn(u,'wardLinks')))return;
 const ids=new Set(units.map(u=>u.id));if(ids.size!==units.length)throw Error('护壁遭遇标识不得重复');
 for(const u of units){if(!Object.hasOwn(u,'wardLinks'))continue;
  if(u.mechanism!==true||!Array.isArray(u.wardLinks)||!u.wardLinks.length||u.wardLinks.length>5)throw Error('护壁须由机关提供1–5项同波守军关联');
  const seen=new Set();for(const link of u.wardLinks){const target=units.find(t=>t.id===link?.target);if(!link||Array.isArray(link)||Object.keys(link).some(k=>!['target','armor'].includes(k))||!target||target===u||target.mechanism||seen.has(link.target)||!Number.isSafeInteger(link.armor)||link.armor<1||link.armor>50)throw Error('护壁关联目标或护甲无效');seen.add(link.target);}
 }
}
export function wardEffects(units,roomIndex,waveIndex=0){
 validateWardLinks(units);return units.filter(u=>u.hp>0).flatMap(source=>(source.wardLinks||[]).flatMap(link=>{const target=units.find(u=>u.id===link.target);if(target.hp<=0)return [];return [{source,target,effect:{id:`${roomIndex}:ward:${waveIndex}:${source.id}:${target.id}`,skill:null,name:'机关护壁',component:'机关护壁',source:source.id,sourceName:source.name,stat:'armor',value:link.armor,scope:'battle',active:true,expires:null,environmental:true}}];}));
}
export function wardRecipients(units,sourceId){return units.flatMap(unit=>{const effects=(unit.effects||[]).filter(e=>e.environmental===true&&e.stat==='armor'&&e.source===sourceId);return effects.length?[{unit,effects}]:[];});}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wardPreparationView(rooms){const rows=rooms.flatMap(room=>[room,...(room.reinforcements||[])].flatMap(wave=>wave.enemies.flatMap(u=>(u.wardLinks||[]).map(l=>({room:room.name,source:u.name,target:wave.enemies.find(t=>t.id===l.target)?.name||l.target,armor:l.armor})))));return rows.length?`<section class=ward-preparation><h3>公开护壁关联</h3><p>敌情卡的护甲是基础值；下列机关仍在时另外叠加。心理攻击沿既有规则绕甲，破印不能切断机关供能。</p>${rows.map(r=>`<p>${esc(r.room)}：${esc(r.source)} → ${esc(r.target)} · 护甲 +${esc(r.armor)}</p>`).join('')}<small>${WARD_RULE}</small></section>`:'';}
export function wardEvidenceView(e){const d=e?.detail;if(!['ward-link','ward-release'].includes(e?.type))return '';return `<section class=ward-proof><h3>${e.type==='ward-link'?'机关护壁建立':'机关已拆，来源护壁解除'}</h3><p>${esc(d.sourceName)} → ${esc(d.targetName)}；${e.type==='ward-link'?'护甲 +'+esc(d.armor):'当前总护甲 '+esc(d.armorBefore)+' → '+esc(d.armorAfter)+'，只移除本来源 +'+esc(d.released)}。</p><p>${WARD_RULE}</p>${e.type==='ward-release'?`<button data-ward-cause="${esc(d.sourceDamageEventId)}">追溯实际拆除攻击</button>`:''}</section>`;}
