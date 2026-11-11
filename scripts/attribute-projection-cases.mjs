import {newGuild,depart,pendingReport,claim,train,lowerTraining} from '../dist/expedition-guild.mjs';
import {selectHero} from '../dist/expedition-command.mjs';
import {adventureConfig} from '../dist/expedition-adventure.mjs';
import {clone} from '../dist/expedition-data.mjs';
export function attributeProjectionLoop(){
 let g=selectHero(newGuild(),'b');const initial=[];
 for(const route of ['tutorial','classic']){const pending=depart(g,adventureConfig(route)),report=pendingReport(pending);g=claim(pending);initial.push({route,pending,report,claimed:clone(g)});}
 const start=clone(g),constitution=train(g,'b','attr:con'),both=train(constitution,'b','attr:int'),intelligence=lowerTraining(both,'b','attr:con'),source=adventureConfig('classic'),pending=depart(intelligence,source),report=pendingReport(pending),final=claim(pending);
 return {initial,start,constitution,both,intelligence,source,pending,report,final};
}
