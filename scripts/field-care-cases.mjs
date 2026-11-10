import{courierProfiles}from'./courier-cases.mjs';
import{courierConfig}from'../dist/expedition-data.mjs';
import{depart,pendingReport}from'../dist/expedition-guild.mjs';
import{replaySteps}from'../dist/expedition-stage.mjs';
import{fieldmedicMotion}from'../dist/expedition-fieldmedic-motion.mjs';
// Existing earned route fixture and its unmodified next expedition, not a seed search.
export function fieldCareCases(){
 const initial=courierProfiles().grown,config=courierConfig(),pending=depart(initial,config),report=pendingReport(pending),steps=replaySteps(report.events),groups=steps.filter(g=>g.roomIndex===2),heal=groups.find(g=>g.events.some(e=>e.id===466)),assess=groups.find(g=>g.events.some(e=>e.id===402));
 const sample=g=>({group:g,index:groups.indexOf(g),plan:fieldmedicMotion(g,report.config)});
 return{initial,config,pending,report,groups,samples:{heal:sample(heal),assess:sample(assess)}};
}
