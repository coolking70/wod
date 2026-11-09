import{bardMotion}from'./expedition-bard-motion.mjs';
// Bind to this report's actual event and hero objects, not a coincident ID in
// an unrelated restored report. Navigation changes no report or game assets.
export function motionRecord(report,group,hero,eventId){
 if(!report?.events||!report.config?.heroes?.includes(hero)||!group?.events?.length||!Number.isSafeInteger(eventId)||!group.events.every(e=>report.events.includes(e)))return null;
 const plan=bardMotion(group,hero);if(!plan?.sourceEvents.includes(eventId)||!plan.beats.some(b=>b.eventId===eventId))return null;const matches=report.events.map((e,index)=>({e,index})).filter(({e})=>e.id===eventId);if(matches.length!==1)return null;const{e,index}=matches[0];if(e.actor!==hero.id&&!e.targets.includes(hero.id))return null;return{index,eventId,unitId:hero.id,text:e.text,type:e.type,roomIndex:e.roomIndex,round:e.round};
}
