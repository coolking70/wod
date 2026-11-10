import {scarcityConfig,row} from './expedition-data.mjs';
export const LOADOUTS={balanced:{name:'均分补给',supplies:{herb:8,rune:8,arrow:8}},stock:{name:'偏重弹药',supplies:{herb:4,rune:10,arrow:10}}};
export const POLICIES={sustain:'持续主力',opening:'每房一轮主力',frugal:'全程低耗'};
export function reserveConfig(loadout,policy,rescue,seed=1){
 if(!LOADOUTS[loadout]||!POLICIES[policy]||!['pass','aid'].includes(rescue))throw Error('未知储备实验方案');
 const c=scarcityConfig(true);c.seed=seed;c.rescueApproach=rescue;c.bellApproach='bypass';c.supplies={...LOADOUTS[loadout].supplies};
 for(const id of ['b','c']){const h=c.heroes.find(x=>x.id===id),fallback=id==='b'?'shot':'spark';for(const plan of [h,...Object.values(h.overrides)]){if(!plan.main)continue;const target=plan.main[0].target;if(policy==='frugal')plan.main=[row(fallback,target)];else if(policy==='opening')plan.main=plan.main.map(x=>({...x,mode:x.skill===fallback?'repeat':'once'}));}}
 return c;
}
export function reserveSummary(samples){
 const won=samples.filter(x=>x.won),reserve=won.filter(x=>x.supplies.rune>=2&&x.supplies.arrow>=2),all=reserve.filter(x=>x.survivors===6);
 const mean=(key)=>won.length?Math.round(won.reduce((n,x)=>n+x.supplies[key],0)/won.length*10)/10:null;
 return {count:samples.length,wins:won.length,survive:won.filter(x=>x.survivors===6).length,reserve:reserve.length,all:all.length,winSupplies:{herb:mean('herb'),rune:mean('rune'),arrow:mean('arrow')}};
}
