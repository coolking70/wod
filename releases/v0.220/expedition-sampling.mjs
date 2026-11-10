import {archiveConfig,clone} from './expedition-data.mjs';
export const SAMPLE_SEEDS=Array.from({length:32},(_,i)=>i+1);
export function sampleConfig(profile,rescue,bell,seed){
 const c=archiveConfig();c.seed=seed;c.rescueApproach=rescue;c.bellApproach=bell;
 if(profile==='medic'){const f=c.heroes.find(u=>u.id==='f');f.training={'skill:heal':3};f.trained='heal';}
 else if(profile!=='balanced')throw Error('未知样本构筑');
 return c;
}
export function compactSample(report){
 const rescue=report.events.find(e=>e.type==='rescue'),bell=report.events.find(e=>e.type==='encounter');
 return {seed:report.config.seed,won:report.won,survivors:report.party.filter(u=>u.hp>0).length,hp:report.party.reduce((n,u)=>n+u.hp,0),mp:report.party.reduce((n,u)=>n+u.mp,0),supplies:clone(report.supplies),rescue:rescue?.detail.status||'unreached',bell:bell?.detail.status||'unreached',route:report.events.find(e=>e.type==='route')?.detail.route||'unreached'};
}
export function summarizeSamples(samples){
 const n=samples.length,attempted=key=>samples.filter(x=>['success','failure'].includes(x[key])).length,success=key=>samples.filter(x=>x[key]==='success').length;
 const avg=fn=>n?Math.round(samples.reduce((s,x)=>s+fn(x),0)/n*10)/10:null;
 return {count:n,wins:samples.filter(x=>x.won).length,rescueReached:samples.filter(x=>x.rescue!=='unreached').length,rescueAttempts:attempted('rescue'),rescueSuccess:success('rescue'),bellAttempts:attempted('bell'),bellSuccess:success('bell'),hp:avg(x=>x.hp),mp:avg(x=>x.mp),survivors:avg(x=>x.survivors),herb:avg(x=>x.supplies.herb),rune:avg(x=>x.supplies.rune),arrow:avg(x=>x.supplies.arrow)};
}
