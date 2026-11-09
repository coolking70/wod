import {clone,HEROES,roomsFor} from './expedition-data.mjs';import {guildConfig,validateGuild} from './expedition-guild.mjs';
import {swapCompanion,rosterConfig} from './expedition-roster.mjs';import {simulate,validate} from './expedition-engine.mjs';
import {commandLabel} from './expedition-command.mjs';
export const replacementSignature=(g,tactics,outgoing,incoming)=>JSON.stringify([g,tactics,outgoing,incoming]);
const roomSummary=r=>r?{won:r.won,rounds:r.rounds,roundLimit:r.roundLimit??null,survivors:r.survivors,hp:r.hp,mp:r.mp,supplies:clone(r.supplies),stopReason:r.stopReason||(!r.won?'队伍止步':'')}:null;
// The ordinary swap and departure paths define both candidates. These two
// simulations do not save a guild, pay a reward or grant a recruit any assets.
export function rehearseReplacement(g,tactics,outgoing,incoming){
 validateGuild(g);validate(tactics);const swapped=swapCompanion(g,tactics,outgoing,incoming),seed=(g.next-1)%999999+1;
 const configs={before:guildConfig(g,tactics),after:guildConfig(swapped,rosterConfig(swapped,tactics))},reports={},summary={};
 for(const key of ['before','after']){
  configs[key].seed=seed;const report=simulate(configs[key]);if(g.command)report.perspective=clone(g.command);reports[key]=report;
  summary[key]={won:report.won,cleared:report.rooms.filter(r=>r.won).length,planned:roomsFor(configs[key]).length,rounds:report.rooms.reduce((n,r)=>n+r.rounds,0),alive:report.party.filter(u=>u.hp>0).length,supplies:clone(report.supplies),stopReason:report.won?'':roomSummary(report.rooms.at(-1))?.stopReason||'队伍止步'};
 }
 return {outgoing,incoming,outgoingName:HEROES.find(h=>h.id===outgoing).name,incomingName:HEROES.find(h=>h.id===incoming).name,outgoingRole:commandLabel(g,outgoing),incomingRole:commandLabel(g,incoming),seed,reports,summary,rooms:roomsFor(configs.before).map((room,i)=>({id:room.id,name:room.name,before:roomSummary(reports.before.rooms[i]),after:roomSummary(reports.after.rooms[i])})),signature:replacementSignature(g,tactics,outgoing,incoming)};
}
