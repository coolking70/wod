// Experimental configurations only. No runtime recommendation or guild write.
import {clone,HEROES,row} from '../dist/expedition-data.mjs';
import {validate} from '../dist/expedition-engine.mjs';

export const SCHOLAR_PLANS={
 seal:{name:'一次护印分担',desc:'主屏障手保护前排，第二场转后排；分担者到右翼，每房仅施放一次中央护印。吟游者普通攻击优先治疗者，保留后排备用。护印到期后不会自动重施。'},
 position:{name:'仅向右翼分散',desc:'仅把分担者在港口四房的站位移到右翼；保留原有护印、屏障、吟游者目标和其他指令。可能减少中央群攻覆盖，也会失去中央启蒙覆盖。'}
};
const role=h=>HEROES.find(t=>t.id===h.id)?.classId;
export function scholarAssignment(c){
 const scholars=c.heroes.filter(h=>role(h)==='scholar');
 const secondary=scholars.find(h=>h.trained==='bulwark')||scholars.find(h=>h.prep.some(r=>r.skill==='bulwark'))||scholars.at(-1);
 return {scholars:scholars.map(h=>h.id),primary:scholars.find(h=>h!==secondary)?.id,secondary:secondary?.id,available:c.expedition==='harbor'&&scholars.length===2&&c.heroes.some(h=>role(h)==='bard')};
}
export function applyScholarPlan(input,kind,assignment=scholarAssignment(input)){
 validate(input);
 const roles=scholarAssignment(input),{primary,secondary}=assignment;
 if(!roles.available||!Object.hasOwn(SCHOLAR_PLANS,kind)||primary===secondary||![primary,secondary].every(id=>roles.scholars.includes(id)))throw Error('请选择两名不同的出战学者，并保留一名吟游者；本方案仅用于港口');
 const c=clone(input),lead=c.heroes.find(h=>h.id===primary),partner=c.heroes.find(h=>h.id===secondary);
 for(const id of ['harbor_gate','harbor_pass','harbor_cache','harbor_beacon']){
  if(kind==='position'){(partner.overrides[id]??={}).pos='right';continue;}
  (lead.overrides[id]??={}).prep=[row('ward',id==='harbor_pass'?'rear':'front')];
  const patch=partner.overrides[id]??={};patch.pos='right';patch.prep=[row('bulwark','center','once')];
  for(const bard of c.heroes.filter(h=>role(h)==='bard'))(bard.overrides[id]??={}).main=[row('shot','healer'),row('shot','rear')];
 }
 return c;
}
