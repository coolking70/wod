export const SCHEDULE_RULE='窗口包含起止回合，每房从1重新计时；此阶段有窗口时每个新回合从首条重新检查，回合内仍沿原指令轮转。本房一次不会重新解锁，窗口外免费查后备，不额外获得行动；自动救护和道具另按原规则。';
export function validateSchedule(r){if(!Object.hasOwn(r,'roundWindow'))return;const w=r.roundWindow;if(!w||typeof w!=='object'||Array.isArray(w)||Object.keys(w).sort().join(',')!=='from,to'||!Number.isInteger(w.from)||!Number.isInteger(w.to)||w.from<1||w.to>24||w.from>w.to)throw Error('指令回合窗口须为1–24的有效起止整数');}
export function scheduleCheck(r,round){if(!r.roundWindow)return null;return {from:r.roundWindow.from,to:r.roundWindow.to,round,blocked:round<r.roundWindow.from||round>r.roundWindow.to,rule:SCHEDULE_RULE};}
export const scheduleLabel=r=>r.roundWindow?` · 第${r.roundWindow.from}–${r.roundWindow.to}回合`:'';
export function withSchedule(r,from,to){const n=structuredClone(r);if(from===1&&to===24)delete n.roundWindow;else n.roundWindow={from,to};validateSchedule(n);return n;}
