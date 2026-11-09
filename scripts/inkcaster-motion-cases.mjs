import{clone}from'../dist/expedition-data.mjs';
import{guardianCueLoop,guardianCueSourceKeys}from'./guardian-cue-cases.mjs';
import{groupActions}from'../dist/expedition-report.mjs';
import{simulate}from'../dist/expedition-engine.mjs';
import{inkcasterMotion}from'../dist/expedition-inkcaster-motion.mjs';
let cached;
export function inkcasterMotionCases(){
 if(cached)return clone(cached);
 const x=guardianCueLoop(),report=x.runs[0].report,groups=groupActions(report.events),sample=(r,g)=>({group:g,plan:inkcasterMotion(g,r.config)}),fatal=groups.find(g=>g.events.some(e=>e.id===256)),hit=groups.find(g=>g.events.some(e=>e.type==='attack'&&e.targets.includes('csm')&&e.detail.actual>0)),fall=groups.find(g=>g.events.some(e=>e.type==='down'&&e.targets.includes('csm'))),old124=groupActions(x.history124.events).find(g=>g.events.some(e=>e.id===344));
 // One predeclared legal geometry variant at the same128. Coverage of multi-target casting, not a balance comparison or seed search.
 const areaConfig=clone(report.config);for(const id of['c','f']){const h=areaConfig.heroes.find(h=>h.id===id);h.pos='center';h.overrides.courier_sails={...(h.overrides.courier_sails||{}),pos:'center'};}
 const areaReport=simulate(areaConfig),area=groupActions(areaReport.events).find(g=>g.events.filter(e=>e.type==='attack'&&e.actor==='csm').length>1);
 if(!area)throw Error('Predeclared multi-target coverage must actually occur');
 return clone(cached={keys:guardianCueSourceKeys(),start:x.start,normal:x.runs[0],report,history124:x.history124,areaConfig,areaReport,samples:{fatal:sample(report,fatal),hit:sample(report,hit),fall:sample(report,fall),old124:sample(x.history124,old124),area:sample(areaReport,area)}});
}
