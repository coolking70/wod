import {manaFloorLoop} from './mana-floor-cases.mjs';
import {lootTransferPreparation} from './loot-transfer-cases.mjs';
import {clone,row} from '../dist/expedition-data.mjs';
import {depart,pendingReport,pendingReward,claim,guildConfig,historyReport} from '../dist/expedition-guild.mjs';
let native;const base=()=>native??=manaFloorLoop();
export const manaRegenerationStart=()=>clone(base().final);
export function manaRegenerationSource(){const c=clone(base().runs[1].config);c.seed=731;return c;}
export function manaRegenerationPreparation(g,source,route){const c=lootTransferPreparation(g,source,route),e=c.heroes.find(h=>h.id==='e');e.prep=[row('chorus','rear','once'),...e.prep];return c;}
export function manaRegenerationLoop(){const start=manaRegenerationStart(),source=manaRegenerationSource(),runs=[];let g=start,current=source;for(const route of ['chapter','courier']){const preparation=manaRegenerationPreparation(g,current,route),config=clone(preparation);config.seed=g.next;const before=g,pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);current=config;runs.push({preparation,config,before,pending,report,reward,claimed:g});}const control=clone(runs[0].config);control.heroes.find(h=>h.id==='e').prep[0].skill='rhythm';const pending=depart(start,control);return {start,source,runs,desktop:runs[0].claimed,final:g,comparison:{beforeConfig:guildConfig(start,control),beforeReport:pendingReport(pending),afterConfig:guildConfig(start,runs[0].config),afterReport:runs[0].report},history55:historyReport(start,55),history65:historyReport(start,65)};}
