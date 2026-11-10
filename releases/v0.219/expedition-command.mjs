import {rosterConfig} from './expedition-roster.mjs';
import {HEROES,clone} from './expedition-data.mjs';
import {BUILDS} from './expedition-builds.mjs';
export function validateCommand(command){
 if(command===undefined)return;
 if(!command||!HEROES.some(h=>h.id===command.heroId)||!command.companions||Array.isArray(command.companions)||Object.entries(command.companions).some(([id,mode])=>id===command.heroId||!HEROES.some(h=>h.id===id)||(mode!=='custom'&&!BUILDS[id].some(b=>b.id===mode))))throw Error('英雄与伙伴职责无效');
}
export function selectHero(g,id){
 if(g.pending)throw Error('请先领取远征结算');
 if(!g.lineup.includes(id))throw Error('未知英雄');
 const n=clone(g);n.command={heroId:id,companions:Object.fromEntries(g.members.filter(h=>h.id!==id).map(h=>[h.id,g.command?.companions[h.id]||'custom']))};return n;
}
export function setCompanion(g,id,mode){
 if(g.pending)throw Error('请先领取远征结算');
 if(!g.command)throw Error('请先选择自己的英雄');
 if(!g.members.some(m=>m.id===id))throw Error('伙伴尚未招募');
 const n=clone(g);n.command.companions[id]=mode;validateCommand(n.command);return n;
}
export function commandConfig(g,tactics){
 validateCommand(g.command);const c=rosterConfig(g,tactics);
 if(!g.command)return c;
 for(const h of c.heroes){const mode=g.command.companions[h.id];if(h.id===g.command.heroId||!mode||mode==='custom')continue;
 const b=BUILDS[h.id].find(b=>b.id===mode);
 for(const key of ['trained','prep','main','healing'])if(Object.hasOwn(b,key))h[key]=clone(b[key]);
 for(const patch of Object.values(h.overrides))for(const key of ['prep','main','healing'])delete patch[key];
 }
 return c;
}
export function commandLabel(g,id){return g.command?.heroId===id?'我的英雄':BUILDS[id].find(b=>b.id===g.command?.companions[id])?.name||'自定义指令';}
