import {GOALS} from './expedition-goal-data.mjs';
import {settlementGoals} from './expedition-settlement.mjs';
import {clone,EXPEDITIONS,roomsFor} from './expedition-data.mjs';
import {validate,simulate,RULESET} from './expedition-engine.mjs';
import {validateCommand} from './expedition-command.mjs';
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
const keys=(o,allowed)=>plain(o)&&Object.keys(o).every(k=>allowed.includes(k));
export const goalValues=m=>({clear:m.won&&m.cleared===m.rooms,survive:m.won&&m.cleared===m.rooms&&m.alive===6,reserve:m.won&&m.cleared===m.rooms&&m.rune>=2&&m.arrow>=2});
export function objectiveAssessment(report){
 const id=report.config.objective;if(!id)return null;
 const goal=GOALS.find(g=>g.id===id);if(!goal)throw Error('远征目标无效');
 const members=report.party.filter(u=>!u.owner&&report.config.heroes.some(h=>h.id===u.id)),metrics={won:report.won,cleared:report.rooms.filter(r=>r.won).length,rooms:roomsFor(report.config).length,rounds:report.rooms.reduce((n,r)=>n+r.rounds,0),alive:members.filter(u=>u.hp>0).length,herb:report.supplies.herb,rune:report.supplies.rune,arrow:report.supplies.arrow};
 const met=Boolean(settlementGoals(report).find(g=>g.id===id)?.done);if(met!==goalValues(metrics)[id])throw Error('目标核对与结算条件不一致');return {id,met,metrics};
}
function validateMetrics(m,c){
 if(Object.keys(m||{}).length!==8||!keys(m,['won','cleared','rooms','rounds','alive','herb','rune','arrow'])||typeof m.won!=='boolean'||Object.entries(m).some(([k,v])=>k!=='won'&&!integer(v))||m.rooms!==roomsFor(c).length||m.cleared>m.rooms||m.alive>6||m.won&&m.cleared!==m.rooms)throw Error('攻略目标指标无效');
}
export function validateObjectiveRecord(record){
 if(record.objective===undefined){if(record.config?.objective)throw Error('履历缺少已选目标结果');return;}
 const o=record.objective;if(!keys(o,['id','met','metrics'])||!GOALS.some(g=>g.id===o.id)||typeof o.met!=='boolean'||record.config?.objective!==o.id)throw Error('履历目标记录无效');validateMetrics(o.metrics,record.config);if(o.met!==goalValues(o.metrics)[o.id]||o.metrics.won!==record.won||o.metrics.cleared!==record.cleared)throw Error('履历目标结果无效');
}
export function validateExpeditionBook(book,next){
 if(book===undefined)return;
 if(!plain(book)||Object.keys(book).some(route=>!Object.hasOwn(EXPEDITIONS,route)))throw Error('攻略册路线无效');const ids=new Set();
 for(const [route,entry]of Object.entries(book)){
  if(!plain(entry)||!Object.keys(entry).length||Object.keys(entry).some(goal=>!GOALS.some(g=>g.id===goal)))throw Error('攻略册目标无效');
  for(const [goal,p]of Object.entries(entry)){
   if(!keys(p,['id','ruleset','config','command','metrics'])||!Number.isSafeInteger(p.id)||p.id<1||p.id>=next||ids.has(p.id)||p.ruleset!==RULESET)throw Error('攻略册来源无效');ids.add(p.id);validate(p.config);validateCommand(p.command);if(p.config.expedition!==route||p.config.objective!==goal||p.command&&!p.config.heroes.some(h=>h.id===p.command.heroId))throw Error('攻略册方案归属无效');validateMetrics(p.metrics,p.config);if(!goalValues(p.metrics)[goal])throw Error('攻略册不能记录未达成目标');
  }
 }
}
// Called only on the guild clone inside ordinary claim; never on simulation or replay.
export function recordExpeditionObjective(g,report,id,command){const check=objectiveAssessment(report);if(!check?.met||g.expeditionBook?.[report.config.expedition]?.[check.id])return false;g.expeditionBook??={};g.expeditionBook[report.config.expedition]??={};g.expeditionBook[report.config.expedition][check.id]={id,ruleset:RULESET,config:clone(report.config),...(command?{command:clone(command)}:{}),metrics:clone(check.metrics)};return true;}
export function bookProof(g,route,goal){if(!Object.hasOwn(EXPEDITIONS,route)||!GOALS.some(g=>g.id===goal))throw Error('攻略目标不存在');const proof=g.expeditionBook?.[route]?.[goal];if(!proof)throw Error('尚无此项目标的首次达成记录');return proof;}
export function bookReport(g,route,goal){const p=bookProof(g,route,goal);return {...simulate(clone(p.config)),...(p.command?{perspective:clone(p.command)}:{})};}
export function bookOrigin(g,route,goal){const p=bookProof(g,route,goal);return {source:'record',route,goal,id:p.id,signature:JSON.stringify(p)};}
export function bookProgress(g){return {done:Object.values(g.expeditionBook||{}).reduce((n,entry)=>n+Object.keys(entry).length,0),total:Object.keys(EXPEDITIONS).length*GOALS.length};}
