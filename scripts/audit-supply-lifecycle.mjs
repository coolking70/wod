// Read-only project audit: simulates normal departures on cloned in-memory guilds.
// No proposed prices, persistent stock, storage migration, balance or rules changes.
import {writeFileSync} from 'node:fs';
import {routePlanLoop} from './route-plan-cases.mjs';
import {newGuild,depart,claim,pendingReport,pendingReward,validateGuild} from '../dist/expedition-guild.mjs';
import {selectHero} from '../dist/expedition-command.mjs';
import {supplyBudget} from '../dist/expedition-data.mjs';
const x=routePlanLoop(),trials=[];
for(const scenario of[{name:'classic-fresh',guild:selectHero(newGuild(),'c'),config:x.classic},{name:'hospice-after-earned-shield-and-wave',guild:x.desktop,config:x.hospice}]){let g=structuredClone(scenario.guild);const rounds=[];for(let n=0;n<6;n++){const before=structuredClone(g),pending=depart(g,scenario.config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);validateGuild(g);rounds.push({id:pending.pending.id,seed:report.config.seed,won:report.won,survivors:report.party.filter(h=>h.hp>0).length,startSupplies:report.config.supplies,endSupplies:report.supplies,preDepartureGold:before.gold,departureGold:pending.gold,afterClaimGold:g.gold,rewardGold:reward.gold,carryingBudget:supplyBudget(report.config),permanentTrainingUnchanged:JSON.stringify(before.members.map(m=>m.training))===JSON.stringify(g.members.map(m=>m.training))});}trials.push({name:scenario.name,initialGold:scenario.guild.gold,finalGold:g.gold,guildTopLevelFields:Object.keys(g).sort(),rounds});}
const result={scope:'12 normal runs, fixed current prototype configs; no global balance claim',designStatus:'audit only; current per-expedition budget, no persistent supplies model implemented',trials};
writeFileSync(process.argv[2]||'docs/SUPPLY_LIFECYCLE_AUDIT.json',JSON.stringify(result,null,2));console.log(JSON.stringify(trials.map(t=>({name:t.name,runs:t.rounds.length,wins:t.rounds.filter(r=>r.won).length,initialGold:t.initialGold,finalGold:t.finalGold,departureGoldDeduction:t.rounds.reduce((n,r)=>n+r.preDepartureGold-r.departureGold,0),sameStartSupplies:t.rounds.every(r=>JSON.stringify(r.startSupplies)===JSON.stringify(t.rounds[0].startSupplies))}))));
