import {supportOrderLabel} from './expedition-support-priority.mjs';
import {clone,POS,SKILLS,resolveHeroPlan,roomsFor} from './expedition-data.mjs';
import {buildParty,chooseTargets} from './expedition-engine.mjs';
export function placeHero(config,heroId,pos,roomId=''){
 if(!Object.hasOwn(POS,pos)||!config.heroes.some(h=>h.id===heroId)||(roomId&&!roomsFor(config).some(r=>r.id===roomId)))throw Error('无效阵位部署');
 const next=clone(config),h=next.heroes.find(h=>h.id===heroId);
 if(roomId){h.overrides[roomId]??={};h.overrides[roomId].pos=pos;}else h.pos=pos;
 return next;
}
export function deploymentPreview(config,roomId=''){
 const units=buildParty(config).map(u=>({...u,...resolveHeroPlan(config.heroes.find(h=>h.id===u.id),roomId),skills:u.skills}));
 const order=config.roomOrders[roomId]||config.prepOrder,coverage=[];
 for(const id of order){const u=units.find(u=>u.id===id);for(const [row,r]of u.prep.entries()){const s=SKILLS[r.skill];if(s.kind!=='buff'||s.recall)continue;coverage.push({id:id+':'+row,actor:id,name:u.name,skill:r.skill,row,target:r.target,...(r.target==='supportPriority'?{dynamicSupportOrder:supportOrderLabel(u)}:{}),recipients:chooseTargets(u,s.cover?units.filter(t=>t.id!==u.id):units,s,r.target).map(x=>x.id)});}}
 return {units:units.map(u=>({id:u.id,name:u.name,pos:u.pos,overridden:Boolean(roomId&&Object.hasOwn(config.heroes.find(h=>h.id===u.id).overrides[roomId]||{},'pos'))})),order:clone(order),coverage};
}
