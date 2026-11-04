import {harborConfig,defaultHero} from '../dist/expedition-data.mjs';
import {applyHarborTactics} from '../dist/expedition-harbor-tactics.mjs';
import {applyScholarPlan} from './scholar-plans.mjs';
export const SCHOLAR_CASES={founders:'原阵容',baseline:'双学者默认',position:'双学者仅移分担者',target:'双学者仅改吟游目标',seal:'一次护印分担',ward:'持续屏障分担'};
export function scholarCase(kind,trained=false,pass='upper',seed=1){
 if(!Object.hasOwn(SCHOLAR_CASES,kind))throw Error('未知学者实验');
 let c=harborConfig();c.seed=seed;c.harbor={pass,task:'seal',difficulty:'storm',reserve:'seal'};
 if(kind!=='founders'){
  c.heroes=c.heroes.map(h=>h.id==='b'?defaultHero('mira'):h);
  c.prepOrder=c.prepOrder.map(id=>id==='b'?'mira':id);
 }
 for(const h of c.heroes)h.training=trained?{['skill:'+h.trained]:2,['defense:'+h.defenseFocus]:2}:{};
 c=applyHarborTactics(c,'roles');
 if(['seal','position'].includes(kind))return applyScholarPlan(c,kind,{primary:'d',secondary:'mira'});
 if(kind==='ward'){const result=applyScholarPlan(c,'seal',{primary:'d',secondary:'mira'});for(const patch of Object.values(result.heroes.find(h=>h.id==='mira').overrides))patch.prep=[{skill:'ward',target:'center',mode:'repeat'}];return result;}
 if(kind==='target'){
  const full=applyScholarPlan(c,'seal',{primary:'d',secondary:'mira'});
  c.heroes.find(h=>h.id==='e').overrides=full.heroes.find(h=>h.id==='e').overrides;
 }
 return c;
}
