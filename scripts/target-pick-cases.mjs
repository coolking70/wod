import {clone,row} from '../dist/expedition-data.mjs';
import {adventureConfig} from '../dist/expedition-adventure.mjs';
import {newGuild,depart,pendingReport,pendingReward,claim} from '../dist/expedition-guild.mjs';
import {selectHero} from '../dist/expedition-command.mjs';
import {withTargetPick} from '../dist/expedition-target-pick.mjs';

// Fixed natural departures, earned assets only. Control arms are read-only
// counterfactuals from the same pre-run guild; only the actual arm is claimed.
export function targetPickLoop(){
 const firstConfig=adventureConfig('tutorial'),first=depart(selectHero(newGuild(),'b'),firstConfig),firstReport=pendingReport(first),start=claim(first);
 const baseConfig=adventureConfig('classic'),b=baseConfig.heroes.find(h=>h.id==='b');b.trained='shot';b.main=[row('shot','rear')];
 const config=clone(baseConfig);config.heroes.find(h=>h.id==='b').main[0]=withTargetPick(config.heroes.find(h=>h.id==='b').main[0],true);
 let guild=start;const runs=[];
 for(let i=0;i<2;i++){
  const before=guild,pending=depart(before,config),report=pendingReport(pending),control=depart(before,baseConfig),controlReport=pendingReport(control),claimed=claim(pending);
  runs.push({before,pending,report,controlReport,claimed,reward:pendingReward(pending)});guild=claimed;
 }
 return {firstConfig,first,firstReport,start,baseConfig,config,runs,final:guild,seedSearch:false,onlyExplicitActualArmsClaimed:true,limits:'Two fixed natural departures and matched controls; not independent balance samples, a win-rate estimate, or a guarantee that low-HP selection is better.'};
}
