import {SKILLS} from './expedition-data.mjs';
import {commandCost} from './expedition-media.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STOCK_NAMES={herb:'药草',rune:'符纸',arrow:'箭矢'};
export const STOCK_FLOOR_RULE='只约束本条指令付款后的共享余量；不足免费尝试后备，不锁定给任何角色。其他指令、自动救护和事件仍按各自规则用料；跨房继续按实际库存检查。';
export function validateStockFloor(command){
 if(!Object.hasOwn(command,'keepStock'))return;
 if(!SKILLS[command.skill]?.item||!Number.isInteger(command.keepStock)||command.keepStock<1||command.keepStock>60)throw Error('用后留存须为1–60的整数，且仅用于有共享材料的技能');
}
export function stockFloorCheck(command,payment,stock){
 if(!command.keepStock||!payment.resource||!payment.amount)return null;
 const available=stock[payment.resource],afterPayment=available-payment.amount;
 return {resource:payment.resource,floor:command.keepStock,available,amount:payment.amount,afterPayment,blocked:afterPayment<command.keepStock,rule:STOCK_FLOOR_RULE};
}
export function stockFloorLabel(command){
 if(!command.keepStock)return '';
 const payment=commandCost({},command),name=STOCK_NAMES[SKILLS[command.skill].item];
 return payment.resource?` · 用后至少留${command.keepStock}${name}`:` · ${name}底线${command.keepStock}（当前媒介不用材料，底线不参与）`;
}
export function stockFloorWarnings(command,payment,stock){
 const check=stockFloorCheck(command,payment,stock);
 return check?.blocked?[`出发库存即不满足用后留存${check.floor}${STOCK_NAMES[check.resource]}，本条将尝试后备；后续实际库存可能变化`]:[];
}
export function stockFloorEvidenceView(event){
 const f=event.detail.stockFloor;if(!f)return '';
 const outcome=event.detail.stockOutcome;
 return `<p class="stock-floor-proof">用后留存检查：当时${esc(f.available)}${STOCK_NAMES[f.resource]} − 本次所需${esc(f.amount)} = ${esc(f.afterPayment)}；底线${esc(f.floor)}。${f.blocked?'本条未施放、未付款、不占行动；继续检查后备。':event.type==='cast'?'满足底线，按实际施法支付。':'满足底线，但本条因后续条件未施放；本次未付款。'}${outcome?` 后续：${outcome.eventId?`记录${Number(outcome.eventId)} · ${{cast:'施法',wait:'等待',failed:'普通行动空过',item:'自用道具'}[outcome.type]||outcome.type}${outcome.skill?'「'+esc(SKILLS[outcome.skill]?.name||outcome.skill)+'」':''}<button data-stock-outcome="${Number(outcome.eventId)}">查看实际后备</button>`:'本次没有可执行预备指令。'}`:''} ${STOCK_FLOOR_RULE}</p>`;
}
