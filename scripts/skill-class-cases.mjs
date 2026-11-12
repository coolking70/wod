import {clone} from '../dist/expedition-data.mjs';
import {adventureConfig} from '../dist/expedition-adventure.mjs';
import {equip,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
import {trainingRehearsalCheckLoop,trainingRehearsalCheckInitialKeys} from './training-rehearsal-check-cases.mjs';
let cache;
export function skillClassLoop(){if(cache)return clone(cache);const start=trainingRehearsalCheckLoop().final,source=adventureConfig('classic'),oldAccessory=start.members.find(m=>m.id==='a').gear.accessory,purchased=equip(start,'a','meleeprimer'),control=equip(purchased,'a',oldAccessory),controlReport=pendingReport(depart(control,source)),runs=[];let g=purchased;for(const id of[21,22]){if(id===22)g=equip(g,'a',oldAccessory);const before=clone(g),pending=depart(g,source),report=pendingReport(pending),reward=pendingReward(pending);g=claim(pending);runs.push({id,before,pending,report,reward,claimed:clone(g)});}return clone(cache={start,source,oldAccessory,purchased,control,controlReport,runs,final:g});}
export function skillClassInitialKeys(){const keys=trainingRehearsalCheckInitialKeys();keys['abbey-guild-v6']=JSON.stringify(skillClassLoop().start);return keys;}
