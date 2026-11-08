import fs from'node:fs';import{clone,survivalConfig}from'../dist/expedition-data.mjs';import{simulate}from'../dist/expedition-engine.mjs';import{guildConfig,historyReport,depart,pendingReport,pendingReward,claim,assignLoot}from'../dist/expedition-guild.mjs';import{rehearseLootAssignment}from'../dist/expedition-loot-rehearsal.mjs';
export const lootRehearsalSourceKeys=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/v178-preparation-state.json',import.meta.url),'utf8'));let cache;
export function lootRehearsalLoop(){
 if(cache)return clone(cache);const keys=lootRehearsalSourceKeys(),start=JSON.parse(keys['abbey-guild-v6']),source=JSON.parse(keys['abbey-expedition-v40']),history124=historyReport(start,124),trial=rehearseLootAssignment(start,source,'e','filterveil'),shield=rehearseLootAssignment(start,source,'beryl','reliquaryshield');
 // All candidates and next129 were chosen before observing outcomes. Real
 // canonical129 keeps current gear; explicit assignment is a separate copy.
 const fallbackSource=clone(source);fallbackSource.courierPass='keel';fallbackSource.supplies.arrow=2;const fallback=rehearseLootAssignment(start,fallbackSource,'e','filterveil');
 const preparation=guildConfig(start,source);preparation.seed=source.seed;const pending=depart(start,preparation),report=pendingReport(pending),reward=pendingReward(pending),final=claim(pending),assigned=assignLoot(start,'e','filterveil'),assignedPending=depart(assigned,source),assignedReport=pendingReport(assignedPending),assignedReward=pendingReward(assignedPending),assignedFinal=claim(assignedPending),survivalSource=survivalConfig('baseline');survivalSource.seed=731;const survival=simulate(survivalSource);
 return clone(cache={start,source,history124,loaded:history124.config,desktop:final,final,finalSource:source,survivalSource,survival,runs:[{preparation,pending,report,reward,claimed:final}],trial,shield,fallbackSource,fallback,assigned,assignedPending,assignedReport,assignedReward,assignedFinal});
}
