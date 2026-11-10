import {SKILLS} from './expedition-data.mjs';
export const TARGET_COUNT_RULE='按原目标顺序找到的第一组存活候选，封顶技能人数上限；不跨阵位凑数、不自动换目标。数量不足免费查后备，不抽取战斗随机数；后备照常付费/占行动。含此条件的阶段每个新回合从首条重查，回合内沿原轮转，本房一次不重置。候选数不是命中或伤害保证。';
export const supportsTargetCount=s=>s?.kind==='attack'&&['position','all'].includes(s.mode)&&Number.isInteger(s.max)&&s.max>=2;
export function validateTargetCount(r){if(!Object.hasOwn(r,'minTargets'))return;const s=SKILLS[r.skill];if(!supportsTargetCount(s)||!Number.isInteger(r.minTargets)||r.minTargets<2||r.minTargets>s.max)throw Error('群攻数量条件须为2至技能人数上限的整数，只用于群体攻击');}
export function withTargetCount(r,n){const copy=structuredClone(r);if(n===0)delete copy.minTargets;else copy.minTargets=n;validateTargetCount(copy);return copy;}
export function targetCountCheck(r,available){if(!r.minTargets)return null;return {required:r.minTargets,available,limit:SKILLS[r.skill].max,blocked:available<r.minTargets,rule:TARGET_COUNT_RULE};}
export const targetCountLabel=r=>r.minTargets?` · 至少${r.minTargets}名可攻击单位`:'';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function targetCountEvidenceView(event){const c=event?.detail?.targetCount;if(!c)return '';const o=event.detail.targetCountOutcome,id=o?.eventId;return `<section class=target-count-proof><h3>群攻候选数量</h3><p>本条可攻击${esc(c.available)}名，条件至少${esc(c.required)}名，上限${esc(c.limit)}名。${c.blocked?'本条免费跳过、不占行动，继续检查后备。':'数量满足，后续仍按实际施法支付和攻防逐个结算。'}</p>${o?`<p>实际后续：${{cast:'施法',failed:'普通行动空过',wait:'等待',item:'自用道具','no-preparation':'没有预备动作'}[o.type]||'未定位'}${o.skill?'「'+esc(SKILLS[o.skill]?.name||o.skill)+'」':''}${Number.isSafeInteger(id)&&id>0?`<button data-count-outcome="${id}">查看实际后备行动</button>`:''}</p>`:''}<small>${TARGET_COUNT_RULE}</small></section>`;}
