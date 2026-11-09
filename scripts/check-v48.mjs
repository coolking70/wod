import './capture-bootstrap.cjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {defaults,row,SKILLS} from '../dist/expedition-data.mjs';
import {simulate} from '../dist/expedition-engine.mjs';
import {supportEvidence,supportEvidenceView} from '../dist/expedition-support-evidence.mjs';
import {scholarCase} from './scholar-cases.mjs';
const delayed=defaults();delayed.heroes.find(h=>h.id==='d').prep=[row('bulwark','center')];
const rows=[];
for(const [name,config] of [['founders',defaults()],['doubleScholar',scholarCase('baseline')],['delayed',delayed]]){
 const report=simulate(config),before=JSON.stringify(report),data=supportEvidence(report);supportEvidenceView(data);
 const casts=data.rooms.flatMap(r=>r.casts),uses=casts.flatMap(c=>c.uses),ids=new Set(config.heroes.map(h=>h.id));
 const rawCasts=report.events.filter(e=>e.type==='cast'&&ids.has(e.actor)&&SKILLS[e.detail.skill]?.kind==='buff');
 assert.equal(casts.length,rawCasts.length);
 assert.equal(casts.reduce((n,c)=>n+c.mana,0),rawCasts.reduce((n,e)=>n+e.detail.mpBefore-e.detail.mpAfter,0));
 for(const use of uses){const origin=report.events.find(e=>e.id===use.originEvent),event=report.events[use.index];assert.equal(origin.detail.effectId,use.effectId);assert.ok(origin.id<event.id);assert.ok(origin.targets.includes(use.recipient));}
 assert.equal(JSON.stringify(report),before);assert.deepEqual(simulate(config),report);
 const examples=['cast','attack','defense','armor'].map(kind=>uses.find(u=>u.kind===kind)).filter(Boolean).map(use=>{
  const cast=casts.find(c=>c.uses.includes(use));return {source:cast.name,skill:cast.skill,sourceCast:cast.eventId,recipient:use.name,kind:use.kind,check:use.checkName,originEvent:use.originEvent,eventId:use.eventId,stat:use.stat,value:use.value,coefficient:use.coefficient,term:use.term,recorded:use.recorded};
 });
 rows.push({name,seed:config.seed,won:report.won,rooms:report.rooms.length,totals:data.totals,byActor:data.actors.map(a=>({id:a.id,name:a.name,casts:casts.filter(c=>c.actor===a.id).length,links:casts.filter(c=>c.actor===a.id).reduce((n,c)=>n+c.uses.length,0)})),examples});
 console.log(name,JSON.stringify(data.totals));
}
writeFileSync('docs/V48_EVIDENCE.json',JSON.stringify({note:'Read-only recorded support evidence checks. These counts describe records, never damage prevented, win contribution or class strength. Configurations are fixed in scripts/check-v48.mjs; all simulations and snapshots remain unchanged.',rows},null,2)+'\n');
