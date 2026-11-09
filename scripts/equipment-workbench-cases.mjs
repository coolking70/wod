import{journeyFollowthrough}from'./journey-followthrough-cases.mjs';
import{assignLoot,depart,pendingReport,claim}from'../dist/expedition-guild.mjs';
// A fixed ordinary continuation of139, never a seed search or an item gift.
let cached;
export function equipmentWorkbenchCases(){
 if(cached)return structuredClone(cached);
 const x=journeyFollowthrough(),receiver='c',gear='beaconrod',assigned=assignLoot(x.start,receiver,gear),pending=depart(assigned,x.source),report=pendingReport(pending),final=claim(pending);
 return structuredClone(cached={keys:x.keys,start:x.start,source:x.source,receiver,gear,assigned,pending,report,final,limits:'One fixed ordinary140after explicit assignment of genuinely earned139beaconrod; three browser widths are independent copies, not three formal departures. No training, role, tactic, story ending, supply economy or balance adjustment.'});
}
