import {applyAdvancementAsset} from './expedition-advancement-data.mjs';
import {commandConfig} from './expedition-command.mjs';
import {HEROES,clone} from './expedition-data.mjs';
import {historyConfig,validateGuild} from './expedition-guild.mjs';
import {validate} from './expedition-engine.mjs';
import {configurationChanges} from './expedition-review.mjs';
export function historyComparison(g,id,tactics,mode='draft'){
 validateGuild(g);validate(tactics);
 if(!['draft','guild'].includes(mode))throw Error('比较方式无效');
 const before=historyConfig(g,id),after=mode==='guild'?commandConfig(g,tactics):clone(tactics);
 if(mode==='guild')for(const h of after.heroes){const m=g.members.find(m=>m.id===h.id);h.gear=clone(m.gear);h.training=clone(m.training);applyAdvancementAsset(h,m);}
 const changes=configurationChanges(before,after);
 const heroes=HEROES.map(h=>({id:h.id,name:h.name,changes:changes.filter(c=>c.label.startsWith(h.name+' / '))}));
 return {id,mode,routeChanged:before.expedition!==after.expedition,total:changes.length,global:changes.filter(c=>!heroes.some(h=>c.label.startsWith(h.name+' / '))),heroes};
}
