import {chapterJourneyLoop} from './chapter-journey-cases.mjs';
import {clone} from '../dist/expedition-data.mjs';
import {equip,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
export function gradeArmorLoop(){
 const prior=chapterJourneyLoop(),start=prior.final,oldA=start.members.find(m=>m.id==='a').gear.armor,oldD=start.members.find(m=>m.id==='d').gear.armor;
 const purchasedA=equip(start,'a','lamellarcoat'),purchased=equip(purchasedA,'d','deepweave'),runs=[];let g=purchased;
 const control=equip(equip(purchased,'a',oldA),'d',oldD),controlPending=depart(control,prior.config),controlReport=pendingReport(controlPending);
 for(let i=0;i<2;i++){if(i)g=equip(g,'a',oldA);const before=clone(g),pending=depart(g,prior.config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({before,pending,report,reward,claimed:clone(g)});}
 return {start,purchasedA,purchased,config:clone(prior.config),oldA,oldD,control,controlReport,runs,final:g,limits:'Normal7/8 and two explicitly purchased fixed60gold pieces from genuine earned progress. Control uses the same already-paid assets and seed7 but no reward claim. Initiative/defense differences may change RNG flow; these are not a win-rate estimate or isolated avoided-damage attribution.'};
}
