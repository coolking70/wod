import {HEROES,CLASSES,STARTER_IDS,clone,defaultHero} from './expedition-data.mjs';
export const definition=id=>HEROES.find(h=>h.id===id);
export function newMember(id){const h=defaultHero(id);return {id,classId:definition(id).classId,unlocked:[],xp:0,gear:clone(h.gear),owned:Object.values(h.gear),training:{},tactics:h};}
export function rosterConfig(g,tactics){
 const c=clone(tactics),active=new Set(g.lineup),old=c.heroes.map(h=>h.id);
 c.heroes=g.lineup.map(id=>clone(c.heroes.find(h=>h.id===id)||g.members.find(m=>m.id===id)?.tactics||defaultHero(id)));
 const order=ids=>{const next=[];for(const id of ids){const use=active.has(id)?id:g.lineup[old.indexOf(id)];if(use&&!next.includes(use))next.push(use);}return [...next,...g.lineup.filter(id=>!next.includes(id))];};
 c.prepOrder=order(c.prepOrder);for(const key of Object.keys(c.roomOrders))c.roomOrders[key]=order(c.roomOrders[key]);return c;
}
export function recruitmentStatus(g,id){const d=definition(id),r=d?.recruit;return {available:Boolean(r&&!g.pending&&!g.members.some(m=>m.id===id)&&g.history.length>=r.completed&&g.gold>=r.cost),cost:r?.cost,completed:r?.completed};}
export function recruit(g,id){const status=recruitmentStatus(g,id);if(!status.available)throw Error('尚未满足招募条件，或角色已加入');const n=clone(g);n.gold-=status.cost;n.members.push(newMember(id));if(n.command)n.command.companions[id]='custom';return n;}
export function swapCompanion(g,tactics,outgoing,incoming){
 if(g.pending)throw Error('请先领取远征结算');
 if(!g.command)throw Error('请先选择自己的英雄');
 if(outgoing===g.command.heroId)throw Error('不能替换主角，请先更换主角身份');
 if(!g.lineup.includes(outgoing)||g.lineup.includes(incoming)||!g.members.some(h=>h.id===incoming))throw Error('请选择已招募且未出战的伙伴');
 const n=clone(g);for(const h of rosterConfig(g,tactics).heroes)n.members.find(m=>m.id===h.id).tactics=clone(h);
 n.lineup[n.lineup.indexOf(outgoing)]=incoming;return n;
}
export function validateRoster(g){
 if(!Array.isArray(g.lineup)||g.lineup.length!==6||new Set(g.lineup).size!==6||g.lineup.some(id=>!g.members.some(m=>m.id===id))||STARTER_IDS.some(id=>!g.members.some(m=>m.id===id)))throw Error('出战名册无效');
 if(g.command&&(!g.lineup.includes(g.command.heroId)||Object.keys(g.command.companions).some(id=>!g.members.some(m=>m.id===id))))throw Error('主角或伙伴不在名册中');
 for(const m of g.members)if(m.classId!==definition(m.id)?.classId)throw Error('角色职业归属无效');
}
