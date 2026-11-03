// Presentation only: never inserts events, rolls dice, or changes outcomes.
import {roomsFor} from './expedition-data.mjs';
export function hospiceMoment(report,events){
 if(!['hospice','chapter'].includes(report.config.expedition))return null;
 const room=events[0]?.roomIndex;if(room===undefined)return null;
 const supports=roomsFor(report.config)[room].enemies.filter(u=>u.skills.heal!==undefined||u.skills.sentinel!==undefined);
 for(const e of events){
  const source=supports.find(u=>u.id===e.actor),down=supports.find(u=>e.type==='down'&&e.targets.includes(u.id));
  if(down)return {eventId:e.id,title:down.name+'倒下，支援中断。',text:down.skills.sentinel!==undefined?'其存活召唤物按规则消散；其他敌人仍会行动。':'从这次倒下起不再执行治疗；此前已恢复的生命不会被撤销。'};
  if(source&&['summon','heal'].includes(e.type)&&!report.events.some(p=>p.id<e.id&&p.roomIndex===room&&p.actor===e.actor&&p.type===e.type))return {eventId:e.id,title:e.type==='summon'?'水面升起了新的守卫。':'熄灭的伤口，再次亮起。',text:e.type==='summon'?'这是本房司祭的首次召唤。潮卫倒下后，存活且有资源的司祭可以再次召唤。':e.text+'。这次治疗占用了药师的行动；支援者存活越久，越有机会继续救护。'};
 }
 return null;
}
