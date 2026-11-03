import {harborConfig,defaultHero,row} from '../dist/expedition-data.mjs';
import {applyHarborTactics} from '../dist/expedition-harbor-tactics.mjs';

export const COMPANION_CASES={
 founders:'原阵容',noInsight:'原阵容仅移除启蒙',noMastery:'原阵容仅移除战技',noBoth:'原阵容移除两项辅助',
 doubleHealer:'双药师默认',enemyTargets:'双药师仅改敌方目标',selfFirst:'双药师仅改自保优先',zones:'双药师仅改分区',combined:'双药师目标＋分区'
};
export function companionCase(kind,trained=false,pass='upper',seed=1){
 if(!Object.hasOwn(COMPANION_CASES,kind))throw Error('未知协作实验');
 let c=harborConfig();c.seed=seed;c.harbor={pass,task:'seal',difficulty:'storm',reserve:'seal'};
 if(!['founders','noInsight','noMastery','noBoth'].includes(kind)){
  c.heroes=c.heroes.map(h=>h.id==='e'?defaultHero('orin'):h);
  c.prepOrder=c.prepOrder.map(id=>id==='e'?'orin':id);
 }
 for(const h of c.heroes)h.training=trained?{['skill:'+h.trained]:2,['defense:'+h.defenseFocus]:2}:{};
 c=applyHarborTactics(c,'roles');
 const bard=c.heroes.find(h=>h.id==='e');
 if(bard)bard.prep=bard.prep.filter(r=>!(kind==='noInsight'&&r.skill==='insight')&&!(kind==='noMastery'&&r.skill==='mastery')&&kind!=='noBoth');
 if(['enemyTargets','combined'].includes(kind))for(const h of c.heroes.filter(h=>['f','orin'].includes(h.id)))for(const patch of Object.values(h.overrides))patch.main=[row('shot','healer'),row('shot','rear')];
 if(kind==='selfFirst')for(const h of c.heroes.filter(h=>['f','orin'].includes(h.id)))h.healing.priority='self_first';
 if(['zones','combined'].includes(kind)){
  c.heroes.find(h=>h.id==='f').healing.target='center';
  c.heroes.find(h=>h.id==='orin').healing.target='rear';
 }
 return c;
}
