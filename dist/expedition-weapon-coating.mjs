import {SKILLS,TYPES} from './expedition-data.mjs';
import {damageTypeOf} from './expedition-damage-channel.mjs';

export const COATING_RULE='项目暂定：淬潮药4法力/1共享药草，占预备，覆盖指定阵位最多3名存活正式持械队员，本房间有效，不叠加刷新。仅本来造成近战或远程伤害的生命攻击附加法术伤害段；潮印箭、法术、心理、拆解、断流和持续伤害不附加。一名目标只进行一次攻击/防御检定和防御支付，两段共享命中等级，分别按既有护甲（含该攻击穿甲）与各自抗性结算；淬药段采用施放时固定基值，不额外实掷。先主段后附加段截断剩余生命，合计只计入攻击者实伤一次，整次受击后才判断倒下和转态。未附药的攻击保持原记录。';
export function acceptsCoating(s){return s?.kind==='attack'&&['melee','ranged'].includes(s.type)&&damageTypeOf(s)===s.type&&!s.manaDamage&&!s.disarm;}
export function coatingRecipient(u){return !u.summoned&&!u.owner&&!u.mechanism&&Object.keys(u.skills||{}).some(k=>acceptsCoating(SKILLS[k]));}
export function activeCoating(u,s){return acceptsCoating(s)?(u.effects||[]).find(e=>e.stat==='weaponDamage'&&e.active!==false&&e.value>0):undefined;}
export function coatedHit(primary,effect,{multiplier,armorBefore,ignoreArmor=0,resistance,hp}){
 const armorIgnored=Math.min(Math.max(0,armorBefore),ignoreArmor),armor=armorBefore-armorIgnored,rolled=multiplier===0?0:effect.value,afterArmor=Math.max(0,rolled*multiplier-armor),damage=multiplier===0?0:Math.floor(afterArmor*(1-resistance/100));
 const parts=[{...primary,kind:'primary'}, {kind:'coating',damageType:'magic',base:effect.value,rolled,multiplier,armorBefore,armorIgnored,armor,resistance,afterArmor,unresisted:Math.floor(afterArmor),damage,effectId:effect.id,source:effect.source,skill:effect.skill}];
 let remaining=hp;for(const p of parts){p.actual=Math.min(remaining,p.damage);p.overkill=p.damage-p.actual;remaining-=p.actual;}
 return {damageParts:parts,damage:parts.reduce((n,p)=>n+p.damage,0),actual:hp-remaining,hpAfter:remaining};
}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function coatingEvidenceView(e){
 const d=e?.detail;if(!d?.damageParts)return '';
 const rows=d.damageParts.map(p=>`<tr data-damage-part="${esc(p.kind)}">${[`${p.kind==='coating'?'淬潮药附加':'原攻击'} / ${TYPES[p.damageType]||p.damageType}`,`${p.base} / ${p.rolled} × ${p.multiplier}`,`${p.armorBefore} − ${p.armorIgnored} = ${p.armor}`,`${p.resistance}%`,`${p.damage} / ${p.actual} / ${p.overkill}`].map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('');
 return `<section class="coating-proof"><h3>一次攻防 · 分段伤害</h3><p>${COATING_RULE}</p><p>攻击 ${esc(d.attack)} / 防御 ${esc(d.defense)}，${esc(d.grade)}；${esc(d.defenseProfile.name)}只支付${esc(d.defenseProfile.cost)}法力一次。生命 ${esc(d.hpBefore)} → ${esc(d.hpAfter)}。</p><div class="table-scroll"><table><thead><tr><th>段 / 通道</th><th>基值 / 本次点数 × 倍率</th><th>护甲原值 − 忽略 = 生效</th><th>抗性</th><th>结算 / 实扣 / 溢出</th></tr></thead><tbody>${rows}</tbody></table></div><p>合计 ${esc(d.damage)} / 实扣 ${esc(d.actual)} / 溢出 ${esc(d.overkill)}。附加段实际已计入攻击者本人实伤，不重复归算药师伤害，也不推算胜负贡献；药剂来源可从支援来源回看。</p></section>`;
}
