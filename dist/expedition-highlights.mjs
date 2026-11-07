import {groupActions} from './expedition-report.mjs';
// Curated navigation over complete recorded actions, not a new simulation.
export function highlightedSteps(events){
 const seen=new Set();
 return groupActions(events).filter(g=>{
 const keyEvents=['ward-link','ward-release','mana-damage','immune','wave-clear','reinforcement','withdraw','room','victory','defeat','scene','encounter','route','rescue','branch','deadline','summon','down','item','mana-transfer','harm','dispel','cleanse','activate'];
 if(g.events.some(e=>keyEvents.includes(e.type)||((e.type==='skip'&&(e.detail.attackImmunity||e.detail.mechanismSelection))||e.detail.manaFloor?.blocked||e.detail.positionOnly?.blocked||e.detail.reservation||e.detail.healingBlock||e.detail.actionLimits?.length||e.detail.offbeatSelection||e.detail.manaSelection)))return true;
 const cast=g.events.find(e=>e.type==='cast');
 if(g.events.some(e=>e.type==='effect')){const key=g.roomIndex+':'+g.events[0].actor+':'+(cast?.detail.skill||g.events[0].detail.skill);if(!seen.has(key)){seen.add(key);return true;}}
 if(g.events.some(e=>e.type==='heal'&&e.detail.actual>0&&e.units.some(u=>u.id===e.targets[0]&&u.hp-e.detail.actual<=u.maxHp*.35)))return true;
 return g.events.some(e=>e.type==='attack'&&(e.detail.grade==='致命'||e.detail.actual>=e.detail.hpBefore*.35&&e.detail.actual>0));
 });
}
