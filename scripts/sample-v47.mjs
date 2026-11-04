import {writeFileSync} from 'node:fs';
import {simulate,RULESET} from '../dist/expedition-engine.mjs';
import {resourceLedger} from '../dist/expedition-resource-ledger.mjs';
import {companionSample,companionSummary} from './sample-v46.mjs';
import {SCHOLAR_CASES,scholarCase} from './scholar-cases.mjs';
export function scholarSample(report){
 const sample=companionSample(report),ids=new Set(report.config.heroes.map(h=>h.id));
 sample.shields=resourceLedger(report).map(room=>({room:room.name,actors:room.actors.map(a=>({id:a.id,rune:a.spent.rune,mana:a.mana,skills:a.skills.filter(s=>['ward','bulwark'].includes(s.skill)).map(s=>({skill:s.skill,count:s.count,firstEvent:s.firstEvent,recipients:[...new Set(report.events.filter(e=>e.roomIndex===room.roomIndex&&e.actor===a.id&&e.type==='effect'&&e.detail.skill===s.skill).flatMap(e=>e.targets))]}))}))}));
 sample.partyDamage=Object.fromEntries(report.config.heroes.map(h=>[h.id,report.stats[h.id].actual]));
 sample.partyHealing=Object.fromEntries(report.config.heroes.map(h=>[h.id,report.stats[h.id].healing]));
 sample.firstRuneShortage=report.events.find(e=>e.type==='skip'&&ids.has(e.actor)&&e.detail.reason==='耗材耗尽'&&['ward','bulwark','wave','sentinel','lance'].includes(e.detail.skill))?.id??null;
 return sample;
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const rows=[];
 for(const [kind,name] of Object.entries(SCHOLAR_CASES))for(const trained of [false,true])for(const pass of ['upper','lower']){
  const samples=Array.from({length:24},(_,i)=>scholarSample(simulate(scholarCase(kind,trained,pass,i+1))));
  const summary=companionSummary(samples),holdout=companionSummary(samples.filter(s=>s.seed>=9&&s.seed<=16)),confirmation=companionSummary(samples.filter(s=>s.seed>=17));
  rows.push({kind,name,trained,pass,summary,holdout,confirmation,samples});console.log(kind,trained,pass,JSON.stringify({summary,holdout,confirmation}));
 }
 writeFileSync('docs/V47_SCHOLAR_SAMPLES.json',JSON.stringify({ruleset:RULESET,sampleCount:rows.reduce((n,r)=>n+r.samples.length,0),seeds:Array.from({length:24},(_,i)=>i+1),initialSelectionSeeds:[1,2,3,4],comparisonSeeds:[9,10,11,12,13,14,15,16],confirmationSeeds:[17,18,19,20,21,22,23,24],note:'Laboratory configurations only; no guild assets granted. Same roster/equipment/training/supplies within each comparison. Formation and target controls are separate; authored plans combine changes. Initial composite candidates were selected with seeds 1-4. After comparing seeds 1-16, candidates position and seal were frozen before measuring confirmation seeds 17-24. Confirmation did not establish a stable win advantage; all configurations remain report-only and no runtime loader is shipped. Efficiency and supplies average wins only. Shared seeds do not couple RNG draws after actions change. See V47_SCHOLARS.md.',rows},null,2)+'\n');
}
