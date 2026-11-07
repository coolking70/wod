import {SKILLS} from './expedition-data.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const MANA_FLOOR_MAX=200;
export const MANA_FLOOR_RULE='只检查本条指令实际付款后的个人法力；不足免费查后备，不增加行动。独立防御、先攻、自动救护、道具及事件仍按原规则执行，也可能使法力低于此值；不是锁定或保证留给某技能的资源。数值条件为项目改编。';
export const supportsManaFloor=skill=>Boolean(skill?.cost>0&&skill.kind!=='heal');
export function validateManaFloor(command){
 if(!Object.hasOwn(command,'keepMana'))return;
 if(!supportsManaFloor(SKILLS[command.skill])||!Number.isInteger(command.keepMana)||command.keepMana<1||command.keepMana>MANA_FLOOR_MAX)throw Error('保留法力须为1–200的整数，且仅用于有法力费用的预备或普通指令');
}
export function withManaFloor(command,value){const next=structuredClone(command);if(value===0)delete next.keepMana;else next.keepMana=value;validateManaFloor(next);return next;}
export function manaFloorCheck(command,payment,available){
 if(!Object.hasOwn(command,'keepMana'))return null;
 const afterPayment=available-payment.mana;return {available,cost:payment.mana,afterPayment,floor:command.keepMana,blocked:afterPayment<command.keepMana,rule:MANA_FLOOR_RULE};
}
export const manaFloorLabel=command=>command.keepMana?` · 用后至少留${command.keepMana}法力`:'';
export function manaFloorEvidenceView(event){
 const f=event.detail.manaFloor;if(!f)return '';const next=event.detail.manaFloorOutcome;
 return `<p class="mana-floor-proof">保留法力检查：当时${esc(f.available)} − 实际费用${esc(f.cost)} = ${esc(f.afterPayment)}；底线${esc(f.floor)}。${f.blocked?'本条未付款、不占行动，继续检查后备。':event.type==='cast'?'满足条件，已按本次费用付款。':'满足法力条件，但本条因其他条件未施放，本次未付款。'}${next?next.eventId?` 后续记录${Number(next.eventId)}：${esc(SKILLS[next.skill]?.name||{wait:'等待',failed:'普通行动空过',item:'自用道具'}[next.type]||next.type)}。<button data-mana-floor-outcome="${Number(next.eventId)}">查看实际后备</button>`:' 本次没有可执行预备指令。':''} ${MANA_FLOOR_RULE}</p>`;
}
