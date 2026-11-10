// Read recorded current snapshots and their visible prefix only. Life is not action eligibility.
const unknown=()=>({kind:'unverified',label:'退出状态未核实；原始记录保留，可导出核对'});
export function archiveUnitParticipation(report,index,unit){
 if(!Array.isArray(report?.events)||!Number.isInteger(index)||index<0||index>=report.events.length||!unit||!Number.isSafeInteger(unit.hp)||unit.hp<0||!['party','enemy'].includes(unit.side))return unknown();
 const now=report.events[index];if(!now||!Number.isSafeInteger(now.roomIndex)||now.roomIndex<0||!Array.isArray(now.units)||!now.units.some(u=>u?.id===unit.id))return unknown();
 for(const key of['surrendered','bypassed','escort'])if(unit[key]!==undefined&&typeof unit[key]!=='boolean')return unknown();
 if(unit.surrendered&&unit.bypassed||unit.escort&&unit.side!=='party'||unit.hp===0&&(unit.surrendered||unit.bypassed))return unknown();
 if(unit.hp===0)return {kind:unit.mechanism===true?'dismantled':unit.owner||unit.summoned===true?'dismissed':'down',label:unit.mechanism===true?'已拆除':unit.owner||unit.summoned===true?'已消散':'已倒下'};
 let terminal=null,source=null;
 for(let i=index;i>=0;i--){const e=report.events[i];if(!e||e.roomIndex!==now.roomIndex)break;
  if(!terminal&&['victory','defeat','withdraw'].includes(e.type))terminal=e.type;
  if(source===null&&unit.surrendered&&e.type==='surrender'&&e.actor===unit.id&&Array.isArray(e.targets)&&e.targets.includes(unit.id))source=i;
  if(source===null&&unit.bypassed&&e.type==='passage-pass'&&e.detail?.status==='success'&&Array.isArray(e.targets)&&e.targets.includes(unit.id)&&Array.isArray(e.detail.avoided)&&e.detail.avoided.some(u=>u?.id===unit.id))source=i;
 }
 if(unit.surrendered)return source===null?unknown():{kind:'surrendered',label:'已投降，退出交战',sourceIndex:source,sourceLabel:'查看投降依据'};
 if(unit.bypassed){if(source===null)return unknown();const origin=report.events[source],id=origin.detail.sourceEventId;let check=null;for(let i=source;i>=0;i--){const e=report.events[i];if(!e||e.roomIndex!==now.roomIndex)break;if(e.id===id&&e.type==='passage-check'&&e.detail?.status==='success'){check=i;break;}}return {kind:'bypassed',label:'已绕过，未交战',sourceIndex:check??source,sourceLabel:check===null?'查看通行依据':'查看专业检定'};}
 const end=terminal==='victory'?'，本房已结束':terminal==='defeat'?'，远征已止步':terminal==='withdraw'?'，队伍已撤退':'';
 if(unit.escort)return {kind:'escort',label:'护送对象存活，不参与行动'+end};
 return {kind:terminal?'ended':'alive',label:'仍存活'+end};
}
export function archiveParticipationSource(report,index,source){return Number.isInteger(source)&&source>=0&&source<=index&&Boolean(report?.events?.[index]?.units?.some(u=>archiveUnitParticipation(report,index,u).sourceIndex===source));}
