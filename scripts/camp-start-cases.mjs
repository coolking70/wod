import{clone}from'../dist/expedition-data.mjs';
import{supplyTraceLoop}from'./supply-timeline-cases.mjs';
import{depart,pendingReport,pendingReward,claim}from'../dist/expedition-guild.mjs';
let cache;export function campStartLoop(){if(cache)return clone(cache);const previous=supplyTraceLoop(),start=previous.final,source=previous.source,keys=clone(previous.keys);keys['abbey-guild-v6']=JSON.stringify(start);const pending=depart(start,source),report=pendingReport(pending),reward=pendingReward(pending),final=claim(pending);return clone(cache={keys,start,source,pending,report,reward,final});}
