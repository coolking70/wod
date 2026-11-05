import {crossRouteProfiles} from './cross-route-cases.mjs';import {setCompanion} from '../dist/expedition-command.mjs';import {swapCompanion,rosterConfig} from '../dist/expedition-roster.mjs';
import {depart,claim} from '../dist/expedition-guild.mjs';import {hospiceConfig,row} from '../dist/expedition-data.mjs';
// Ordinary draft edits plus normal departures/swaps; no currency or training is injected.
export function dormantRoomHistory(){
 let g=setCompanion(crossRouteProfiles().trained,'d','custom');const c=hospiceConfig('front');c.heroes.find(h=>h.id==='d').overrides.harbor_cache={main:[row('spark','rear')]};g=claim(depart(g,c));const historyId=g.history[0].id;
 g=swapCompanion(g,c,'d','mira');g=setCompanion(g,'mira','custom');const current=rosterConfig(g,c),m=current.heroes.find(h=>h.id==='mira');m.overrides={gallery:{main:[row('wait')]},harbor_cache:{main:[row('wait')]}};
 g=swapCompanion(g,current,'mira','d');g=swapCompanion(g,c,'d','mira');return {guild:g,historyId,config:rosterConfig(g,c)};
}
