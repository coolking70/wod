import {adventureConfig} from '../dist/expedition-adventure.mjs';
import {newGuild,depart,pendingReport,claim,assignLoot,train} from '../dist/expedition-guild.mjs';
import {selectHero,setCompanion} from '../dist/expedition-command.mjs';
import {customizeForEditing,readiness} from '../dist/expedition-readiness.mjs';
import {enemyThreatMap} from '../dist/expedition-threat-map.mjs';

export function threatMapLoop(){
 let g=setCompanion(selectHero(newGuild(),'a'),'d','ward');
 const draft=adventureConfig('classic'),initial=readiness(g,draft),before=enemyThreatMap(initial.config,'cistern');
 const edit=customizeForEditing(g,draft,'d','cistern');g=edit.guild;
 edit.config.heroes.find(h=>h.id==='d').overrides.cistern={...(edit.config.heroes.find(h=>h.id==='d').overrides.cistern||{}),pos:'left',defenses:{melee:'natural',ranged:'natural',magic:'resist'}};
 const firstConfig=edit.config,prepared=g,after=enemyThreatMap(readiness(g,firstConfig).config,'cistern'),first=depart(g,firstConfig),firstReport=pendingReport(first);
 g=claim(first);if(g.warehouse.reliquaryshield)g=assignLoot(g,'a','reliquaryshield');if(g.members.find(h=>h.id==='d').xp>=20)g=train(g,'d','defense:resist');
 const desktop=g,secondConfig=adventureConfig('hospice');secondConfig.heroes.find(h=>h.id==='d').overrides=structuredClone(firstConfig.heroes.find(h=>h.id==='d').overrides);const second=depart(g,secondConfig),secondReport=pendingReport(second);g=claim(second);
 return {initialGuild:setCompanion(selectHero(newGuild(),'a'),'d','ward'),draft,before,prepared,firstConfig,after,firstReport,desktop,secondConfig,secondReport,final:g};
}
