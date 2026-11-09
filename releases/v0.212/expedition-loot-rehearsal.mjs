import{clone,HEROES,GEAR,roomsFor}from'./expedition-data.mjs';
import{validateGuild,guildConfig,assignLoot}from'./expedition-guild.mjs';
import{validate,simulate}from'./expedition-engine.mjs';
import{objectiveAssessment}from'./expedition-book.mjs';
export const lootRehearsalSignature=(g,tactics,id,gear)=>JSON.stringify([g,tactics,id,gear]);
const roomResult=r=>r?{name:r.name,won:r.won,rounds:r.rounds,survivors:r.survivors,hp:r.hp,mp:r.mp,supplies:clone(r.supplies),stopReason:r.stopReason||(!r.won?'队伍止步':'')}:null;
// Ordinary assignment on a clone defines the alternative. Neither simulation
// departs, spends a real warehouse item, grants rewards or changes a saved plan.
export function rehearseLootAssignment(g,tactics,id,gearId){
 validateGuild(g);validate(tactics);if(!g.lineup.includes(id))throw Error('该队员当前未出战，请先安排出战再试演分配');
 const next=assignLoot(g,id,gearId),member=g.members.find(m=>m.id===id),item=GEAR[gearId],seed=(g.next-1)%999999+1;
 const configs={before:guildConfig(g,tactics),after:guildConfig(next,tactics)},reports={},summary={};
 for(const key of['before','after']){configs[key].seed=seed;const report=simulate(configs[key]);if(g.command)report.perspective=clone(g.command);reports[key]=report;summary[key]={won:report.won,cleared:report.rooms.filter(r=>r.won).length,planned:roomsFor(configs[key]).length,alive:report.party.filter(u=>u.hp>0&&configs[key].heroes.some(h=>h.id===u.id)).length,rounds:report.rooms.reduce((n,r)=>n+r.rounds,0),supplies:clone(report.supplies),objective:objectiveAssessment(report),stopReason:report.won?'':roomResult(report.rooms.at(-1))?.stopReason||'队伍止步'};}
 return{heroId:id,heroName:HEROES.find(h=>h.id===id).name,gearId,gearName:item.name,slot:item.slot,replacedId:member.gear[item.slot],replacedName:GEAR[member.gear[item.slot]].name,warehouseBefore:g.warehouse[gearId],warehouseAfter:next.warehouse[gearId],seed,signature:lootRehearsalSignature(g,tactics,id,gearId),reports,summary,rooms:roomsFor(configs.before).map((room,i)=>({id:room.id,name:room.name,before:roomResult(reports.before.rooms[i]),after:roomResult(reports.after.rooms[i])}))};
}
