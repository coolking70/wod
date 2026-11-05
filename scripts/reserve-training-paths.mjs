import assert from 'node:assert/strict';
import {advancementReadyGuild} from './advancement-cases.mjs';import {recruit,swapCompanion} from '../dist/expedition-roster.mjs';
import {newGuild,claim,depart,pendingReport,train,learnAdvanced,chooseAdvancement,applyTrainingPlan,validateGuild} from '../dist/expedition-guild.mjs';
import {trainingQuote} from '../dist/expedition-training.mjs';import {quoteTrainingPlan} from '../dist/expedition-training-plan.mjs';import {careerXp} from '../dist/expedition-growth.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';import {hospiceConfig,clone} from '../dist/expedition-data.mjs';
import {PROGRESSION_RULES} from '../dist/expedition-progression-rules.mjs';
const cached=new Map(),member=(g,id)=>g.members.find(m=>m.id===id);
function investPractice(g,id,record){for(const key of ['skill:'+(id==='mira'?'spark':'heal'),'defense:resist']){let q=trainingQuote(member(g,id),key);while(q.allowed){g=train(g,id,key);record.push({afterDeparture:g.next-1,id,key,rank:q.nextRank,cost:q.cost});q=trainingQuote(member(g,id),key);}}return g;}
export function reserveTrainingPath(strategy){
 if(!['hoard','timely'].includes(strategy))throw Error('Unknown training strategy');if(cached.has(strategy))return clone(cached.get(strategy));
 let g=recruit(recruit(advancementReadyGuild(),'mira'),'orin');g=setCompanion(g,'d','measured');g=setCompanion(g,'f','medic');const runs=[],investments=[],transfers=[];
 const invest=id=>{g=investPractice(g,id,investments);};
 for(const id of ['mira','orin']){
  g=swapCompanion(g,hospiceConfig('front'),'b',id);g=setCompanion(g,id,id==='mira'?'ward':'medic');let count=0;
  while(careerXp(member(g,id))<445){
   assert.ok(count++<40,'Normal training must terminate');const p=depart(g,hospiceConfig('front')),r=pendingReport(p),old=member(g,id).xp;g=claim(p);runs.push({id,departure:p.pending.id,won:r.won,rooms:r.rooms.filter(x=>x.won).length,earned:member(g,id).xp-old});if(strategy==='timely')invest(id);
  }
  invest(id);g=learnAdvanced(g,id);g=chooseAdvancement(g,id,id==='mira'?'sigilcraft':'apothecary');
  if(id==='mira'){const target={...member(g,id).training,'skill:suppress':3};delete target['skill:spark'];const quote=quoteTrainingPlan(member(g,id),target);assert.equal(quote.cost,120);assert.equal(quote.refund,120);const before=careerXp(member(g,id));g=applyTrainingPlan(g,id,quote);assert.equal(careerXp(member(g,id)),before);transfers.push({id,cost:quote.cost,refund:quote.refund,available:member(g,id).xp});}
  g=swapCompanion(g,hospiceConfig('front'),id,'b');
 }
 const paths={a:'shieldcraft',b:'huntercraft',c:'evoker',d:'wardcraft',e:'mentor',f:'emergency'};for(const [id,path] of Object.entries(paths))g=chooseAdvancement(g,id,path);
 g=setCompanion(g,'mira','measured');g=setCompanion(g,'orin','slowcare');validateGuild(g);
 for(const id of ['mira','orin'])assert.equal(careerXp(member(g,id)),runs.filter(r=>r.id===id).reduce((n,r)=>n+r.earned,0));
 assert.equal(careerXp(member(g,'b')),445);const result={strategy,guild:g,runs,investments,transfers};cached.set(strategy,result);return clone(result);
}

// A separate early-guild case; no veteran clear, unlocked course or advancement is granted.
export function earlyReserveTrainingGuild(){
 let g=selectHero(newGuild(),'c');const opening=[],runs=[],investments=[],transfers=[];
 for(let i=0;i<2;i++){const p=depart(g,hospiceConfig('front')),r=pendingReport(p);g=claim(p);opening.push({departure:p.pending.id,won:r.won});}
 g=recruit(recruit(g,'mira'),'orin');g=setCompanion(g,'d','measured');g=setCompanion(g,'f','medic');
 for(const id of ['mira','orin']){
  g=swapCompanion(g,hospiceConfig('front'),'b',id);g=setCompanion(g,id,id==='mira'?'ward':'medic');let count=0;
  while(careerXp(member(g,id))<PROGRESSION_RULES.stages.at(-1).earned){
   assert.ok(count++<16,'Early practice must terminate');const p=depart(g,hospiceConfig('front')),r=pendingReport(p),old=member(g,id).xp;g=claim(p);runs.push({id,departure:p.pending.id,won:r.won,alive:r.party.filter(u=>u.hp>0).length,rounds:r.rooms.reduce((n,r)=>n+r.rounds,0),earned:member(g,id).xp-old});g=investPractice(g,id,investments);
  }
  if(id==='mira'){const m=member(g,id),rank=m.training['skill:spark'],target={...m.training,'skill:suppress':rank};delete target['skill:spark'];const quote=quoteTrainingPlan(m,target);assert.equal(quote.cost,quote.refund);g=applyTrainingPlan(g,id,quote);g=setCompanion(g,id,'measured');transfers.push({id,rank,cost:quote.cost,refund:quote.refund});}
  g=swapCompanion(g,hospiceConfig('front'),id,'b');
 }
 validateGuild(g);for(const id of ['mira','orin']){const m=member(g,id);assert.equal(careerXp(m),runs.filter(r=>r.id===id).reduce((n,r)=>n+r.earned,0));assert.deepEqual(m.unlocked,[]);assert.equal(m.advancement,null);}assert.equal(g.clears.veteran,undefined);
 return {guild:g,opening,runs,investments,transfers};
}
