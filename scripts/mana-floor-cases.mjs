import {lootTransferLoop} from './loot-transfer-cases.mjs';
import {lootTransferPreparation} from './loot-transfer-cases.mjs';
import {clone} from '../dist/expedition-data.mjs';
import {withManaFloor,supportsManaFloor} from '../dist/expedition-mana-floor.mjs';
import {SKILLS} from '../dist/expedition-data.mjs';
import {depart,pendingReport,pendingReward,claim,guildConfig,historyReport} from '../dist/expedition-guild.mjs';
let native;const base=()=>native??=lootTransferLoop();
export const manaFloorStart=()=>clone(base().final);
export function manaFloorSource(){const c=clone(base().runs[1].config);c.seed=731;return c;}
export function manaFloorPreparation(g,source,route){const c=lootTransferPreparation(g,source,route),a=c.heroes.find(h=>h.id==='a');for(const phase of ['prep','main'])a[phase]=a[phase].map(r=>supportsManaFloor(SKILLS[r.skill])?withManaFloor(r,6):r);return c;}
export function manaFloorLoop(){const start=manaFloorStart(),source=manaFloorSource(),runs=[];let g=start,current=source;for(const route of ['lockworks','ossuary']){const config=manaFloorPreparation(g,current,route);config.seed=g.next;const before=g,pending=depart(g,config),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);current=config;runs.push({config,before,pending,report,reward,claimed:g});}const control=clone(runs[0].config);for(const phase of ['prep','main'])for(const r of control.heroes.find(h=>h.id==='a')[phase])delete r.keepMana;const pending=depart(start,control);return {start,source,runs,desktop:runs[0].claimed,final:g,comparison:{beforeConfig:guildConfig(start,control),beforeReport:pendingReport(pending),afterConfig:guildConfig(start,runs[0].config),afterReport:runs[0].report},history55:historyReport(start,55),history63:historyReport(start,63)};}
