import assert from 'node:assert/strict';
import {advancementReadyGuild} from './advancement-cases.mjs';
import {recruit,swapCompanion} from '../dist/expedition-roster.mjs';
import {depart,claim,pendingReport,learnAdvanced,train,chooseAdvancement,validateGuild} from '../dist/expedition-guild.mjs';
import {setCompanion} from '../dist/expedition-command.mjs';
import {hospiceConfig,harborConfig,clone} from '../dist/expedition-data.mjs';
import {careerXp} from '../dist/expedition-growth.mjs';
let cached;
export function trainedReserveGuild(){
 if(cached)return clone(cached);
 let g=recruit(recruit(advancementReadyGuild(),'mira'),'orin');const trainingRuns=[];
 g=swapCompanion(g,hospiceConfig('front'),'b','mira');g=swapCompanion(g,hospiceConfig('front'),'e','orin');
 while(Math.min(...['mira','orin'].map(id=>careerXp(g.members.find(m=>m.id===id))))<445){
  assert.ok(trainingRuns.length<30,'Training must terminate through normal rewards.');
  const p=depart(g,hospiceConfig('front')),r=pendingReport(p),before=g.members.find(m=>m.id==='mira').xp;g=claim(p);trainingRuns.push({id:p.pending.id,won:r.won,rooms:r.rooms.length,earned:g.members.find(m=>m.id==='mira').xp-before});
 }
 for(const id of ['mira','orin']){g=learnAdvanced(g,id);for(const key of ['skill:'+(id==='mira'?'suppress':'heal'),'defense:resist'])for(let i=0;i<3;i++)g=train(g,id,key);}
 const paths={a:'shieldcraft',b:'huntercraft',c:'evoker',d:'wardcraft',e:'mentor',f:'emergency',mira:'sigilcraft',orin:'apothecary'};
 for(const [id,path] of Object.entries(paths))g=chooseAdvancement(g,id,path);
 g=swapCompanion(g,hospiceConfig('front'),'mira','b');g=swapCompanion(g,hospiceConfig('front'),'orin','e');
 g=setCompanion(g,'d','measured');g=setCompanion(g,'f','medic');validateGuild(g);const earned=trainingRuns.reduce((n,r)=>n+r.earned,0);for(const id of ['mira','orin'])assert.equal(careerXp(g.members.find(m=>m.id===id)),earned);assert.equal(careerXp(g.members.find(m=>m.id==='b')),445);assert.equal(careerXp(g.members.find(m=>m.id==='e')),445);cached={guild:g,trainingRuns};return clone(cached);
}
export const RESERVE_CASES={
 original:{name:'原阵容',swap:null},
 scholarSplit:{name:'米菈替射手：屏障与节制截疗',swap:['b','mira'],roles:{d:'ward',mira:'measured'}},
 scholarSeal:{name:'米菈替射手：护印与节制截疗',swap:['b','mira'],roles:{d:'measured',mira:'seal'}},
 healerBard:{name:'奥林替吟游：普通救护与缓释',swap:['e','orin'],roles:{f:'medic',orin:'slowcare'}},
 healerRanger:{name:'奥林替射手：普通救护与缓释',swap:['b','orin'],roles:{f:'medic',orin:'slowcare'}},
 healerImmediate:{name:'奥林替吟游：双普通救护',swap:['e','orin'],roles:{f:'medic',orin:'medic'}}
};
export function reserveCase(g,tactics,key){const entry=RESERVE_CASES[key];if(!entry)throw Error('Unknown reserve case');let next=clone(g);if(entry.swap)next=swapCompanion(next,tactics,...entry.swap);for(const [id,role] of Object.entries(entry.roles||{}))next=setCompanion(next,id,role);return next;}
export function reserveRoute(route){const c=route==='hospice'?hospiceConfig('front'):harborConfig();if(route==='storm')c.harbor={pass:'upper',task:'seal',difficulty:'storm',reserve:'seal'};return c;}
