import {focusTravelLoop} from './route-focus-cases.mjs';
import {returnLoot} from '../dist/expedition-loot-transfer.mjs';
import {assignLoot,depart,pendingReport,pendingReward,claim,guildConfig,historyReport} from '../dist/expedition-guild.mjs';
import {routeFocusPreparation} from '../dist/expedition-route-focus.mjs';
import {withObjective} from '../dist/expedition-goal-data.mjs';
import {clone} from '../dist/expedition-data.mjs';
let native;
function base(){return native??=focusTravelLoop();}
export function lootTransferStart(){return clone(base().final);}
export function lootTransferSource(){const c=clone(base().runs[1].config);c.seed=731;return c;}
export function lootTransferSetup(){const start=lootTransferStart(),source=lootTransferSource(),returned=returnLoot(start,'e','clockpin'),assigned=assignLoot(returned,'d','clockpin');return {start,source,returned,assigned};}
export const ownedCopies=(g,id)=>(g.warehouse[id]||0)+g.members.filter(m=>m.owned.includes(id)).length;
export function lootTransferPreparation(g,source,route){return withObjective(routeFocusPreparation({getItem:()=>null},route,source,g).config,'survive');}
export function lootTransferLoop(){const setup=lootTransferSetup(),runs=[];let g=setup.assigned,current=setup.source;for(const route of ['inquest','lockworks']){const config=lootTransferPreparation(g,current,route);config.seed=g.next;const before=g,pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);current=config;runs.push({config,before,pending,report,reward,claimed:g});}const comparisonPending=depart(setup.start,runs[0].config);return {...setup,runs,desktop:runs[0].claimed,final:g,comparison:{beforeReport:pendingReport(comparisonPending),beforeConfig:guildConfig(setup.start,runs[0].config),afterReport:runs[0].report,afterConfig:guildConfig(setup.assigned,runs[0].config)},history61:historyReport(setup.start,61),history55:historyReport(setup.start,55)};}
