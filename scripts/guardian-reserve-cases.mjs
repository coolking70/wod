import{manaRegenerationLoop}from'./mana-regeneration-cases.mjs';
import{clone}from'../dist/expedition-data.mjs';
import{recruit,swapCompanion,rosterConfig}from'../dist/expedition-roster.mjs';
import{lootTransferPreparation}from'./loot-transfer-cases.mjs';
import{depart,pendingReport,pendingReward,claim,historyReport}from'../dist/expedition-guild.mjs';
let cached;
export function guardianReserveLoop(){if(cached)return clone(cached);const previous=manaRegenerationLoop(),start=previous.final,source=clone(previous.runs[1].config);source.seed=731;const recruited=recruit(start,'beryl'),swapped=swapCompanion(recruited,source,'a','beryl'),swappedConfig=rosterConfig(swapped,source),runs=[];let g=swapped,current=swappedConfig;for(const route of['classic','courier']){const preparation=lootTransferPreparation(g,current,route),config=clone(preparation);config.seed=g.next;const before=g,pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);current=config;runs.push({preparation,config,before,pending,report,reward,claimed:g});}return clone(cached={start,source,recruited,swapped,swappedConfig,runs,desktop:runs[0].claimed,final:g,history55:historyReport(start,55),history67:historyReport(start,67)});}
