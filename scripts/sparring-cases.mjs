import {ossuaryLoop} from './ossuary-cases.mjs';
import {ossuaryConfig} from '../dist/expedition-data.mjs';
import {withObjective} from '../dist/expedition-goal-data.mjs';
import {personalSparring} from '../dist/expedition-sparring.mjs';
import {train,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
export function sparringLoop(){
 const start=ossuaryLoop().final,beforeConfig=ossuaryConfig('voices'),before=personalSparring(start,beforeConfig,'shield'),adjustedConfig=structuredClone(beforeConfig);
 adjustedConfig.heroes.find(h=>h.id==='e').main=[{skill:'mindcall',target:'front',mode:'repeat'},{skill:'shot',target:'right',mode:'repeat'}];
 const adjusted=personalSparring(start,adjustedConfig,'shield'),trained=train(start,'e','skill:mindcall'),after=personalSparring(trained,adjustedConfig,'shield'),config=withObjective(adjustedConfig,'reserve'),pending=depart(trained,config),report=pendingReport(pending),reward=pendingReward(pending),final=claim(pending);
 return {start,beforeConfig,before,adjustedConfig,adjusted,trained,after,config,pending,report,reward,final};
}
