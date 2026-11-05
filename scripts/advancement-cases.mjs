import assert from 'node:assert/strict';
import {newGuild,depart,claim,learnAdvanced,train,equip,pendingReport} from '../dist/expedition-guild.mjs';import {hospiceConfig,trialConfig,clone} from '../dist/expedition-data.mjs';import {selectHero} from '../dist/expedition-command.mjs';
let cached;
// All progression is earned through normal expedition/settlement transactions.
export function advancementReadyGuild(){
 if(cached)return clone(cached);
 let g=selectHero(newGuild(),'c');for(let i=0;i<8;i++)g=claim(depart(g,hospiceConfig('front')));
 const c=trialConfig('veteran','adapted');for(const h of c.heroes){g=learnAdvanced(g,h.id);for(const key of ['skill:'+h.main[0].skill,'defense:'+h.defenseFocus])for(let i=0;i<3;i++)g=train(g,h.id,key);for(const part of Object.values(h.gear))if(!g.members.find(m=>m.id===h.id).owned.includes(part))g=equip(g,h.id,part);}
 const p=depart(g,c);assert.equal(pendingReport(p).won,true,'Normal veteran prerequisite run must succeed');cached=claim(p);return clone(cached);
}
